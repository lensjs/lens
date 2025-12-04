import StackUtils from "stack-utils";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { ExceptionEntry } from "../types";
import { nowISO } from "@lensjs/date";

// Create a single reusable StackUtils instance
const stackUtils = new StackUtils({
  cwd: process.cwd(),
  internals: StackUtils.nodeInternals(),
});

/**
 * Clean a raw stack trace string, removing internal Node.js frames.
 */
export function cleanStack(stack?: string): string {
  if (!stack) return "";
  return stackUtils.clean(stack);
}

/**
 * Extract file information from the top frame of a stack trace.
 */
export function getFileInfo(stack?: string) {
  if (!stack) {
    return { file: "", line: 0, column: 0, function: "" };
  }

  const firstLine = stack.split("\n")[1] ?? "";
  const fileInfo = stackUtils.parseLine(firstLine) ?? {
    file: "",
    line: 0,
    column: 0,
    function: "",
  };

  return {
    file: fileInfo.file ? path.resolve(process.cwd(), fileInfo.file) : "",
    line: fileInfo.line ?? 0,
    column: fileInfo.column ?? 0,
    function: fileInfo.function ?? "",
  };
}

/**
 * Parse a stack trace into an array of structured frames.
 */
export function getStackTrace(stack?: string) {
  if (!stack) return [];

  return cleanStack(stack)
    .split("\n")
    .filter((frame): frame is NonNullable<typeof frame> => Boolean(frame));
}

/**
 * Extract surrounding code lines (context) from a file where the error occurred.
 */
export function extractCodeFrame({
  file,
  line,
  column,
  contextLines = 6,
}: {
  file: string;
  line: number;
  column: number;
  contextLines?: number;
}) {
  if (!file) return null;

  const fullPath = path.isAbsolute(file)
    ? file
    : path.resolve(process.cwd(), file);
  if (!existsSync(fullPath)) return null;

  const fileContent = readFileSync(fullPath, "utf-8");
  const lines = fileContent.split(/\r?\n/);

  if (line < 1 || line > lines.length) return null;

  const start = Math.max(0, line - 1 - contextLines);
  const end = Math.min(lines.length, line - 1 + contextLines + 1);
  const snippet = lines.slice(start, end);

  const relativeLine = line - 1 - start;
  const errorLine = lines[line - 1] ?? "";

  return {
    file: fullPath,
    line,
    column,
    context: {
      pre: snippet.slice(0, relativeLine),
      error: errorLine,
      post: snippet.slice(relativeLine + 1),
    },
  };
}

/**
 * Construct a normalized error object with metadata, stack trace, and code frame.
 */
export function constructErrorObject(err: Error): ExceptionEntry {
  const fileInfo = getFileInfo(err.stack);
  const codeFrame = extractCodeFrame({
    file: fileInfo.file,
    line: fileInfo.line,
    column: fileInfo.column,
  });

  return {
    name: err.name,
    message: err.message,
    createdAt: nowISO(),
    fileInfo: {
      file: fileInfo.file,
      function: fileInfo.function,
    },
    cause: (err as Error).cause ?? null,
    trace: getStackTrace(err.stack),
    codeFrame,
    originalStack: codeFrame === null ? cleanStack(err.stack) : null,
  };
}
