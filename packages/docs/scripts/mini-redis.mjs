#!/usr/bin/env node
/**
 * Minimal in-memory RESP (Redis) server — just enough for the example app's
 * ioredis client (PING / INFO / CLIENT / SELECT / SET / GET / INCR / DEL) so
 * the Lens Redis watcher captures real commands during screenshot generation.
 *
 * This exists only because the sandbox can't pull the `redis` Docker image;
 * it is NOT a real Redis and is only used by scripts/screenshots.mjs.
 */
import net from "node:net";

const PORT = Number(process.env.REDIS_PORT || 6379);
const store = new Map();

function bulk(s) {
  if (s === null || s === undefined) return "$-1\r\n";
  const buf = Buffer.from(String(s));
  return `$${buf.length}\r\n${buf.toString()}\r\n`;
}

function handle(parts) {
  const cmd = String(parts[0] || "").toUpperCase();
  switch (cmd) {
    case "PING":
      return parts[1] != null ? bulk(parts[1]) : "+PONG\r\n";
    case "INFO":
      return bulk(
        "# Server\r\nredis_version:7.4.0\r\nredis_mode:standalone\r\nrole:master\r\nloading:0\r\nconnected_clients:1\r\n",
      );
    case "HELLO":
      // Force RESP2: ioredis falls back gracefully on error.
      return "-ERR unknown command 'HELLO'\r\n";
    case "CLIENT":
    case "SELECT":
    case "AUTH":
    case "READONLY":
      return "+OK\r\n";
    case "COMMAND":
      return "*0\r\n";
    case "SET":
      store.set(parts[1], parts[2]);
      return "+OK\r\n";
    case "GET":
      return bulk(store.has(parts[1]) ? store.get(parts[1]) : null);
    case "INCR": {
      const n = (Number(store.get(parts[1])) || 0) + 1;
      store.set(parts[1], String(n));
      return `:${n}\r\n`;
    }
    case "DEL": {
      let count = 0;
      for (let i = 1; i < parts.length; i++) {
        if (store.delete(parts[i])) count++;
      }
      return `:${count}\r\n`;
    }
    case "EXISTS":
      return `:${store.has(parts[1]) ? 1 : 0}\r\n`;
    case "EXPIRE":
    case "TTL":
      return cmd === "TTL" ? ":-1\r\n" : ":1\r\n";
    default:
      return "+OK\r\n";
  }
}

/** Parse one RESP array command from `buf`; returns { parts, rest } or null. */
function parseCommand(buf) {
  if (buf.length === 0 || buf[0] !== 0x2a /* * */) return null;
  let idx = buf.indexOf("\r\n");
  if (idx === -1) return null;
  const argc = Number(buf.toString("utf8", 1, idx));
  let pos = idx + 2;
  const parts = [];
  for (let i = 0; i < argc; i++) {
    if (buf[pos] !== 0x24 /* $ */) return null;
    const lenEnd = buf.indexOf("\r\n", pos);
    if (lenEnd === -1) return null;
    const len = Number(buf.toString("utf8", pos + 1, lenEnd));
    const dataStart = lenEnd + 2;
    const dataEnd = dataStart + len;
    if (buf.length < dataEnd + 2) return null;
    parts.push(buf.toString("utf8", dataStart, dataEnd));
    pos = dataEnd + 2;
  }
  return { parts, rest: buf.subarray(pos) };
}

const server = net.createServer((socket) => {
  let buf = Buffer.alloc(0);
  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    let parsed;
    while ((parsed = parseCommand(buf))) {
      buf = parsed.rest;
      socket.write(handle(parsed.parts));
    }
  });
  socket.on("error", () => {});
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[mini-redis] port ${PORT} in use; assuming a real Redis.`);
    process.exit(0);
  }
  console.error("[mini-redis]", err.message);
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mini-redis] listening on 127.0.0.1:${PORT}`);
});
