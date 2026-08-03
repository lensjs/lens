import { durationToMs } from "./format";

/** Trigger a client-side file download from an in-memory string. */
export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** A filesystem-safe timestamp slug for export filenames. */
export function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/** Reduce table rows to their `data` payloads (the meaningful export content). */
export function rowsToRecords(rows: unknown[]): Record<string, any>[] {
  return rows.map((row) => {
    if (row && typeof row === "object") {
      const r = row as Record<string, any>;
      return "data" in r && r.data && typeof r.data === "object"
        ? (r.data as Record<string, any>)
        : r;
    }
    return { value: row };
  });
}

/** Serialize records to CSV, JSON-stringifying nested values and escaping cells. */
export function recordsToCsv(records: Record<string, any>[]): string {
  if (!records.length) return "";

  const headers = Array.from(
    new Set(records.flatMap((r) => Object.keys(r))),
  );

  const escape = (value: any): string => {
    const s =
      value == null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(headers.map((h) => escape(record[h])).join(","));
  }
  return lines.join("\n");
}

type HarRequestData = {
  method?: string;
  path?: string;
  duration?: string;
  status?: number;
  ip?: string;
  createdAt?: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  response?: { json?: any; headers?: Record<string, any> };
};

const toHarHeaders = (headers?: Record<string, any>) =>
  Object.entries(headers ?? {}).map(([name, value]) => ({
    name,
    value: String(value),
  }));

/**
 * Build an HTTP Archive (HAR 1.2) document for a single captured request, so it
 * can be replayed/inspected in browser devtools or other HAR viewers.
 */
export function buildHar(data: HarRequestData): object {
  const timeMs = durationToMs(data.duration);
  const hasBody = !!data.body && Object.keys(data.body).length > 0;

  return {
    log: {
      version: "1.2",
      creator: { name: "LensJS", version: "1.0" },
      entries: [
        {
          startedDateTime: data.createdAt ?? new Date().toISOString(),
          time: timeMs,
          request: {
            method: data.method ?? "GET",
            url: data.path ?? "",
            httpVersion: "HTTP/1.1",
            headers: toHarHeaders(data.headers),
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: -1,
            ...(hasBody
              ? {
                  postData: {
                    mimeType: "application/json",
                    text: JSON.stringify(data.body),
                  },
                }
              : {}),
          },
          response: {
            status: data.status ?? 0,
            statusText: "",
            httpVersion: "HTTP/1.1",
            headers: toHarHeaders(data.response?.headers),
            cookies: [],
            content: {
              size: -1,
              mimeType: "application/json",
              text: JSON.stringify(data.response?.json ?? null),
            },
            redirectURL: "",
            headersSize: -1,
            bodySize: -1,
          },
          cache: {},
          timings: { send: 0, wait: timeMs, receive: 0 },
          serverIPAddress: data.ip ?? "",
        },
      ],
    },
  };
}
