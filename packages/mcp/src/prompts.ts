import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import {
  WatcherTypeEnum,
  type LensEntry,
  type LensOverview,
  type LensReader,
  type RequestTimeline,
} from "@lensjs/core";
import { z } from "zod";
import { parseDurationMs } from "./format";

const SLOW_QUERY_MS = 100;

function userMessage(text: string): GetPromptResult {
  return {
    messages: [{ role: "user", content: { type: "text", text } }],
  };
}

function renderCodeFrame(codeFrame: unknown): string {
  const frame = codeFrame as {
    file?: string;
    line?: number;
    context?: { pre?: string[]; error?: string; post?: string[] };
  } | null;

  if (!frame || !frame.context) return "(no code frame captured)";

  const { line = 0, context } = frame;
  const pre = context.pre ?? [];
  const post = context.post ?? [];
  const startLine = line - pre.length;

  const lines: string[] = [];
  pre.forEach((source, index) => lines.push(`${startLine + index}   ${source}`));
  lines.push(`${line} > ${context.error ?? ""}`);
  post.forEach((source, index) => lines.push(`${line + 1 + index}   ${source}`));

  return `${frame.file ?? "unknown"}:${line}\n${lines.join("\n")}`;
}

function buildExceptionPrompt(
  data: Record<string, any>,
  request: LensEntry | null,
): string {
  const parts: string[] = [
    "You are debugging a Node.js application monitored by Lens. Analyze the captured exception below and help fix it.",
    `\n## Exception\n${data.name ?? "Error"}: ${data.message ?? "(no message)"}`,
  ];

  if (data.fileInfo?.file) {
    const fn = data.fileInfo.function ? ` (in ${data.fileInfo.function})` : "";
    parts.push(`\n## Location\n${data.fileInfo.file}${fn}`);
  }

  parts.push(`\n## Code frame\n\`\`\`\n${renderCodeFrame(data.codeFrame)}\n\`\`\``);

  if (Array.isArray(data.trace) && data.trace.length) {
    parts.push(`\n## Stack trace\n\`\`\`\n${data.trace.join("\n")}\n\`\`\``);
  } else if (data.originalStack) {
    parts.push(`\n## Stack trace\n\`\`\`\n${data.originalStack}\n\`\`\``);
  }

  if (data.cause) {
    const cause =
      typeof data.cause === "string"
        ? data.cause
        : JSON.stringify(data.cause, null, 2);
    parts.push(`\n## Cause\n\`\`\`\n${cause}\n\`\`\``);
  }

  if (request) {
    const req = request.data as Record<string, any>;
    parts.push(
      `\n## Triggering request\n${req.method ?? ""} ${req.path ?? ""} -> ${req.status ?? ""}\nBody: ${JSON.stringify(req.body ?? {}, null, 2)}`,
    );
  }

  parts.push(
    "\n## Task\n1. Explain the most likely root cause.\n2. Propose a concrete fix, referencing the exact file and line shown above.\n3. Note how to prevent this class of error in the future.",
  );

  return parts.join("\n");
}

function buildRequestPrompt(timeline: RequestTimeline): string {
  const req = timeline.request.data as Record<string, any>;
  const parts: string[] = [
    "You are debugging a Node.js application monitored by Lens. Analyze this captured request and its correlated signals, then diagnose any errors, slow queries (including N+1 patterns), or other problems.",
    `\n## Request\n${req.method ?? ""} ${req.path ?? ""} -> ${req.status ?? ""} in ${req.duration ?? "?"}`,
  ];

  if (timeline.queries.length) {
    const rendered = timeline.queries
      .map((entry) => {
        const data = entry.data as Record<string, any>;
        const ms = parseDurationMs(data?.duration);
        const flag = ms >= SLOW_QUERY_MS ? "  <-- SLOW" : "";
        return `- (${data?.duration ?? "?"}) ${data?.query ?? ""}${flag}`;
      })
      .join("\n");
    parts.push(`\n## Queries (${timeline.queries.length})\n${rendered}`);
  }

  if (timeline.exceptions.length) {
    const rendered = timeline.exceptions
      .map((entry) => {
        const data = entry.data as Record<string, any>;
        return `- ${data?.name ?? "Error"}: ${data?.message ?? ""}`;
      })
      .join("\n");
    parts.push(`\n## Exceptions (${timeline.exceptions.length})\n${rendered}`);
  }

  if (timeline.httpEntries.length) {
    const rendered = timeline.httpEntries
      .map((entry) => {
        const data = entry.data as Record<string, any>;
        return `- ${data?.method ?? ""} ${data?.url ?? ""} -> ${data?.status ?? ""} (${data?.duration ?? "?"})`;
      })
      .join("\n");
    parts.push(`\n## Outbound HTTP (${timeline.httpEntries.length})\n${rendered}`);
  }

  parts.push(
    "\n## Task\nIdentify what is wrong or slow about this request, explain why, and propose concrete fixes.",
  );

  return parts.join("\n");
}

function buildPerformancePrompt(overview: LensOverview): string {
  const { range, summary } = overview;
  const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

  const parts: string[] = [
    "You are analyzing the performance of a Node.js application monitored by Lens. Below is its aggregated behavior over a time window.",
    `\n## Window\n${range.from} -> ${range.to} (bucketed by ${range.granularity})`,
    [
      "\n## Summary",
      `- Requests: ${summary.totalRequests} (${summary.requestsPerMinute.toFixed(2)}/min)`,
      `- Server errors: ${percent(summary.errorRate)} · client errors: ${percent(summary.clientErrorRate)}`,
      `- Latency: p50 ${summary.p50.toFixed(1)} ms · p95 ${summary.p95.toFixed(1)} ms · p99 ${summary.p99.toFixed(1)} ms`,
      `- Queries: ${summary.totalQueries} (avg ${summary.avgQueryTime.toFixed(1)} ms) · exceptions: ${summary.totalExceptions}`,
    ].join("\n"),
  ];

  if (overview.slowestEndpoints.length) {
    const rendered = overview.slowestEndpoints
      .map(
        (endpoint) =>
          `- ${endpoint.method} ${endpoint.path}: p95 ${endpoint.p95.toFixed(1)} ms, avg ${endpoint.avg.toFixed(1)} ms over ${endpoint.count} requests`,
      )
      .join("\n");
    parts.push(`\n## Slowest endpoints\n${rendered}`);
  }

  if (overview.slowestQueries.length) {
    const rendered = overview.slowestQueries
      .map((query) => `- (${query.duration.toFixed(1)} ms) ${query.query}`)
      .join("\n");
    parts.push(`\n## Slowest queries\n${rendered}`);
  }

  if (overview.topExceptions.length) {
    const rendered = overview.topExceptions
      .map((issue) => `- ${issue.count}x ${issue.name}: ${issue.message}`)
      .join("\n");
    parts.push(`\n## Top exceptions\n${rendered}`);
  }

  parts.push(
    "\n## Task\n1. Call out the endpoints and queries most worth optimizing, and why the data points at them.\n2. For each, propose a concrete change (index, caching, batching an N+1, pagination, ...).\n3. Say which numbers should move if the fix works. Use lens_get_request or lens_list_slow_queries if you need the underlying detail.",
  );

  return parts.join("\n");
}

function buildIssuePrompt(
  issue: { name: string; message: string; count: number; firstSeen: string; lastSeen: string },
  occurrences: number,
  sample: LensEntry | null,
  request: LensEntry | null,
): string {
  const parts: string[] = [
    "You are investigating a recurring error in a Node.js application monitored by Lens.",
    `\n## Issue\n${issue.name}: ${issue.message}`,
    `\n## Frequency\n${issue.count} occurrences, first seen ${issue.firstSeen}, last seen ${issue.lastSeen}${
      occurrences !== issue.count ? ` (${occurrences} sampled)` : ""
    }`,
  ];

  if (sample) {
    const data = sample.data as Record<string, any>;
    parts.push(`\n## Latest occurrence\n${buildExceptionPrompt(data, request)}`);
  }

  parts.push(
    "\n## Task\n1. Explain the root cause behind every occurrence, not just the sample.\n2. Say whether the frequency and time span suggest a systemic bug, a bad input, or a dependency failure.\n3. Propose a concrete fix and how to verify the issue stops recurring.",
  );

  return parts.join("\n");
}

/**
 * Register the diagnosis prompts. These pull the captured context an agent needs
 * (stack trace, code frame, correlated request/timeline) into a ready-to-run
 * prompt so a user can go from a captured error to a proposed fix in one step.
 */
export function registerLensPrompts(server: McpServer, reader: LensReader): void {
  server.registerPrompt(
    "diagnose_exception",
    {
      title: "Diagnose an exception",
      description:
        "Analyze a captured exception (stack trace + code frame + triggering request) and propose a root cause and a concrete fix.",
      argsSchema: {
        id: z.string().min(1).describe("The exception id (from lens_list_exceptions)."),
      },
    },
    async ({ id }) => {
      const exception = await reader.find(WatcherTypeEnum.EXCEPTION, id);
      if (!exception) {
        return userMessage(
          `I wanted to diagnose Lens exception "${id}", but it was not found. Call the lens_list_exceptions tool to find a valid exception id.`,
        );
      }

      const data = exception.data as Record<string, any>;
      const request = exception.lens_entry_id
        ? await reader.find(WatcherTypeEnum.REQUEST, exception.lens_entry_id)
        : null;

      return userMessage(buildExceptionPrompt(data, request));
    },
  );

  server.registerPrompt(
    "debug_request",
    {
      title: "Debug a request",
      description:
        "Analyze a captured request and its correlated queries, exceptions, and outbound HTTP calls to find errors or performance problems.",
      argsSchema: {
        id: z.string().min(1).describe("The request id (from lens_list_requests)."),
      },
    },
    async ({ id }) => {
      const timeline = await reader.getRequestTimeline(id);
      if (!timeline) {
        return userMessage(
          `I wanted to debug Lens request "${id}", but it was not found. Call the lens_list_requests tool to find a valid request id.`,
        );
      }

      return userMessage(buildRequestPrompt(timeline));
    },
  );

  // No arguments: the SDK rejects a prompt call that omits `arguments` when a
  // schema is declared, and this one is meant to work as a bare "how are we
  // doing?". Use the lens_overview tool for a custom window.
  server.registerPrompt(
    "analyze_performance",
    {
      title: "Analyze performance",
      description:
        "Summarize the last 24 hours — throughput, error rate, latency percentiles, slowest endpoints and queries — and ask for concrete optimizations.",
    },
    async () => userMessage(buildPerformancePrompt(await reader.getOverview())),
  );

  server.registerPrompt(
    "investigate_issue",
    {
      title: "Investigate a recurring issue",
      description:
        "Analyze one exception issue (all occurrences sharing a fingerprint) with its frequency, time span, and latest stack trace and code frame.",
      argsSchema: {
        fingerprint: z
          .string()
          .min(1)
          .describe("The issue fingerprint (from lens_list_issues)."),
      },
    },
    async ({ fingerprint }) => {
      const issues = await reader.getExceptionGroups();
      const issue = issues.find((group) => group.fingerprint === fingerprint);

      if (!issue) {
        return userMessage(
          `I wanted to investigate Lens issue "${fingerprint}", but no exception in the current window carries that fingerprint. Call the lens_list_issues tool to find a valid fingerprint.`,
        );
      }

      const sample = await reader.find(WatcherTypeEnum.EXCEPTION, issue.sampleId);
      const request = sample?.lens_entry_id
        ? await reader.find(WatcherTypeEnum.REQUEST, sample.lens_entry_id)
        : null;

      const occurrences = await reader.list(WatcherTypeEnum.EXCEPTION, {
        perPage: 100,
        filters: [{ field: "fingerprint", op: "eq", value: fingerprint }],
      });

      return userMessage(
        buildIssuePrompt(issue, occurrences.data?.length ?? 0, sample, request),
      );
    },
  );
}
