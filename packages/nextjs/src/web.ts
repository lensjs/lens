import * as path from "node:path";

/** Flatten a Web `Headers` object into a plain record. */
export function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/** Parse a JSON string, passing the value through unchanged when it is not JSON. */
export function parseBody(body: unknown): any {
  if (!body) {
    return null;
  }

  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/**
 * Read the request body for logging without consuming the handler's copy (the
 * caller must pass a clone). Only JSON / urlencoded / multipart are parsed.
 */
export async function readRequestBody(
  request: Request,
): Promise<Record<string, any>> {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return ((await request.json()) ?? {}) as Record<string, any>;
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      const obj: Record<string, any> = {};
      form.forEach((value, key) => {
        obj[key] = typeof value === "string" ? value : "Purged By Lens";
      });
      return obj;
    }
  } catch {
    // body unavailable or already consumed
  }

  return {};
}

/**
 * Read the captured response body, keeping JSON/text and purging binary or
 * file/stream bodies to the literal `"Purged By Lens"` (mirrors the express /
 * fastify adapters). The caller must pass a clone.
 */
export async function readResponseBody(response: Response): Promise<any> {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType) {
      return null;
    }

    if (contentType.includes("application/json")) {
      return parseBody(await response.text());
    }

    if (contentType.startsWith("text/")) {
      const text = await response.text();
      return text.length ? text : null;
    }

    return "Purged By Lens";
  } catch {
    return "Purged By Lens";
  }
}

function normalizeIp(ip: string): string {
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip;
}

/** Resolve the client IP from proxy headers (route handlers have no socket). */
export function getIpFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const [ip] = xff.split(",");
    return normalizeIp(ip?.trim() ?? "");
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return normalizeIp(xRealIp.trim());
  }

  return "";
}

/** Serialize a value as a JSON HTTP response (mirrors `res.json(result)`). */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain; charset=utf-8",
  };
  return map[ext] ?? "application/octet-stream";
}
