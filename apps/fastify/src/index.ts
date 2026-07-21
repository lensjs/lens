import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Sequelize, DataTypes, Model } from "sequelize";
import nodemailer from "nodemailer";
import { createSequelizeHandler, attachSequelizeLens } from "@lensjs/watchers";
import MemoryCache from "./concrete/cache/memory_cache.js";
import { sendEmail } from "./concrete/mail/nodemailer.js";

const fastify = Fastify();
const port = Number(process.env.PORT) || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsPath = path.join(__dirname, "..", "assets");
const cache = new MemoryCache();

// Database (Sequelize + SQLite) — captured by the query watcher.
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./random.db",
  benchmark: true,
  logQueryParameters: true,
});
// Captures the request id in-context (Sequelize's `logging` callback fires from
// the driver's detached context, which loses correlation for real databases).
attachSequelizeLens(sequelize);

class User extends Model {
  declare id: number;
  declare name: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false,
  },
);

// Mail (Nodemailer + Ethereal test account) — captured by the mail watcher.
const testEmailAccount = await nodemailer.createTestAccount();
const mailTransporter = nodemailer.createTransport({
  host: testEmailAccount.smtp.host,
  port: testEmailAccount.smtp.port,
  secure: testEmailAccount.smtp.secure,
  auth: {
    user: testEmailAccount.user,
    pass: testEmailAccount.pass,
  },
});

await lens({
  app: fastify,
  cacheWatcherEnabled: true,
  mailWatcherEnabled: true,
  queryWatcher: {
    enabled: true,
    handler: createSequelizeHandler({ provider: "sqlite" }),
  },
});

await sequelize.sync();

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

// Query Routes
fastify.get("/add-user", async () => {
  await User.create({ name: "John Doe" });
  return { message: "User added successfully" };
});

fastify.get("/get-users", async () => {
  return await User.findAll();
});

// Cache Routes

fastify.get("/get-cache", async () => {
  return {
    value: await cache.get("key"),
    message: "Successfully fetched cache",
  };
});

fastify.get("/set-cache", async () => {
  await cache.set("key", "value");

  return {
    message: "Cache set successfully",
  };
});

fastify.get("/delete-cache", async () => {
  await cache.delete("key");

  return {
    message: "Cache deleted successfully",
  };
});

fastify.get("/has-cache", async () => {
  return {
    value: await cache.has("key"),
    message: "Cache has successfully",
  };
});

fastify.get("/clear-cache", async () => {
  await cache.clear();

  return {
    message: "Cache cleared successfully",
  };
});

// Mail Route
fastify.get("/send-email", async () => {
  const info = await sendEmail(mailTransporter, {
    from: '"Lens Demo" <demo@lensjs.dev>',
    to: "inbox@example.com",
    subject: "Fastify mail demo",
    text: "This email was captured by Lens.",
  });

  return info;
});

// Demo: a single request that exercises EVERY Lens watcher — request, query,
// cache, mail and exception — all correlated to the same request in the UI.
fastify.get("/all-watchers", async () => {
  // Query watcher
  await User.create({ name: "Lens Demo" });
  const users = await User.findAll();

  // Cache watcher
  await cache.set("demo:all-watchers", { users: users.length });
  await cache.get("demo:all-watchers");

  // Mail watcher
  await sendEmail(mailTransporter, {
    from: '"Lens Demo" <demo@lensjs.dev>',
    to: "inbox@example.com",
    subject: "All watchers demo",
    text: `This request touched every Lens watcher. Users so far: ${users.length}.`,
  });

  // Exception watcher — intentional; recorded and correlated to this request.
  throw new Error("Intentional demo exception from /all-watchers");
});

await fastify.listen({ port });

console.log(`Server listening on http://localhost:${port}`);
