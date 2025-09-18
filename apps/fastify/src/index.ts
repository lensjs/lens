import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import fastifyStatic from "@fastify/static";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { lensContext } from "@lensjs/core";

const fastify = Fastify({ logger: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsPath = path.join(__dirname, "..", "assets");

// pass false so lens doesn't double-register
const { logException } = await lens({
  app: fastify,
  registerFastifyStatic: true,
});

// EITHER: handle static yourself
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "..", "assets"),
  prefix: "/assets/",
  wildcard: false,
  decorateReply: false,
});

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "..", "assets"),
  prefix: "/file/",
  serve: false,
  wildcard: false,
  decorateReply: false,
});

fastify.get("/", async (_, reply) => {
  return { hello: "world" };
});

fastify.get("/file", (_, reply) => {
  reply.sendFile("example.pdf", assetsPath);
});

fastify.get("/error", async (_, reply) => {
  console.log("store", lensContext.getStore());
  throw new Error("Something went wrong");
});

fastify.setErrorHandler((err, req, reply) => {
  logException(err, req);

  throw err;
});

fastify.setErrorHandler((err, req, reply) => {
  logException(err, req);

  throw err;
});
await fastify.listen({ port: 3000 });

console.log("Server listening on http://localhost:3000");
