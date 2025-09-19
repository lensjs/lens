import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import MemoryCache from "./concrete/cache/memory_cache.js";

const fastify = Fastify({
  logger: true,
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsPath = path.join(__dirname, "..", "assets");
const cache = new MemoryCache();

const { logException } = await lens({
  app: fastify,
  cacheWatcherEnabled: true,
});

// Routes
fastify.get("/", async () => {
  return Promise.resolve({ hello: "world" });
});

fastify.get("/file", (_, reply) => {
  reply.sendFile("example.pdf", assetsPath);
});

fastify.get("/error", async () => {
  throw new Error("Something went wrong");
});

// Cache Routes

fastify.get("/get-cache", () => {
  return {
    value: cache.get("key"),
    message: "Successfully fetched cache",
  };
});

fastify.get("/set-cache", () => {
  cache.set("key", "value");

  return {
    message: "Cache set successfully",
  };
});

fastify.get("/delete-cache", () => {
  cache.delete("key");

  return {
    message: "Cache deleted successfully",
  };
});

fastify.get("/has-cache", () => {
  return {
    value: cache.has("key"),
    message: "Cache has successfully",
  };
});

fastify.get("/clear-cache", () => {
  cache.clear();

  return {
    message: "Cache cleared successfully",
  };
});

// Error Handler
fastify.setErrorHandler((err, req) => {
  logException(err, req);

  throw err;
});

await fastify.listen({ port: 3000 });

console.log("Server listening on http://localhost:3000");
