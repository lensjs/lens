import express from "express";
import cors from "cors";
import { EventEmitter } from "node:events";
import Redis from "ioredis";
import { Sequelize, DataTypes, Model } from "sequelize";
import {
  createSequelizeHandler,
  attachSequelizeLens,
  instrumentFetch,
  emitLensEvent,
  instrumentEmitter,
  withLensRedis,
  withLensFcm,
  patchConsole,
  emitLensLog,
  emitLensJob,
} from "@lensjs/watchers";
import { lens } from "@lensjs/express";
import { createLensOtel } from "@lensjs/otel";
import MemoryCache from "./concrete/cache/memory_cache";
import nodemailer from "nodemailer";
import { sendEmail } from "./concrete/mail/nodemailer";

const app = express();
const port = Number(process.env.PORT) || 3000;
const cache = new MemoryCache();

// Capture outgoing HTTP calls (global fetch) for the HTTP watcher. Also
// propagates the W3C `traceparent` header when tracing is enabled below.
instrumentFetch();

// Export every captured request (and its queries, HTTP calls, cache ops and
// exceptions) as OpenTelemetry spans when LENS_OTEL_ENDPOINT points at an OTLP
// collector, e.g. `LENS_OTEL_ENDPOINT=http://localhost:4318 pnpm dev`.
if (process.env.LENS_OTEL_ENDPOINT) {
  createLensOtel({
    endpoint: process.env.LENS_OTEL_ENDPOINT,
    serviceName: "lens-express-example",
  });
}

// Any emit() on this emitter is captured by the event watcher, correlated to
// the active request.
const appEvents = new EventEmitter();
instrumentEmitter(appEvents);

// Every ioredis command is captured by the Redis watcher, correlated to the
// active request. Point REDIS_URL at your server (defaults to localhost:6379).
const redis = withLensRedis(
  new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  }),
);
redis.on("error", () => {
  // Swallow connection errors so the example keeps running without Redis.
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const fakeToken = (seed: string) =>
  `${seed}:APA91b${Buffer.from(`${seed}-${Math.random()}`)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 60)}`;

// A stand-in for firebase-admin's messaging() so the FCM watcher can be
// demonstrated without Firebase credentials (no real device delivery). It adds
// realistic latency and rejects unregistered/expired tokens the way FCM does.
// In a real app, wrap the real instance: `const fcm = withLensFcm(admin.messaging());`.
const fcm = withLensFcm({
  async send(message: any) {
    await sleep(rand(8, 55));
    const token = String(message?.token ?? "");
    if (/invalid|expired/i.test(token)) {
      const err: any = new Error("Requested entity was not found.");
      err.code = "messaging/registration-token-not-registered";
      throw err;
    }
    return `projects/lens-demo/messages/${rand(1_000_000, 9_999_999)}`;
  },
  async sendEachForMulticast(message: any) {
    await sleep(rand(15, 90));
    const tokens: string[] = Array.isArray(message?.tokens)
      ? message.tokens
      : [];
    // Per-token responses (aligned with `tokens`), mirroring FCM's BatchResponse.
    const responses = tokens.map((t) =>
      /invalid|expired/i.test(String(t))
        ? {
            success: false,
            error: {
              code: "messaging/registration-token-not-registered",
              message: "Requested entity was not found.",
            },
          }
        : {
            success: true,
            messageId: `projects/lens-demo/messages/${rand(1_000_000, 9_999_999)}`,
          },
    );
    return {
      successCount: responses.filter((r) => r.success).length,
      failureCount: responses.filter((r) => !r.success).length,
      responses,
    };
  },
});
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./random.db",
  benchmark: true,
  logQueryParameters: true,
});
// Captures the request id in-context (Sequelize's `logging` callback fires from
// the driver's detached context, which loses correlation for real databases).
attachSequelizeLens(sequelize);

// Use Ethereal for real preview URLs when online; fall back to an offline JSON
// transport so the example (and the mail watcher) still work without network.
let mailTransporter: nodemailer.Transporter;
try {
  const testEmailAccount = await nodemailer.createTestAccount();
  mailTransporter = nodemailer.createTransport({
    host: testEmailAccount.smtp.host,
    port: testEmailAccount.smtp.port,
    secure: testEmailAccount.smtp.secure,
    auth: {
      user: testEmailAccount.user,
      pass: testEmailAccount.pass,
    },
  });
} catch {
  mailTransporter = nodemailer.createTransport({ jsonTransport: true });
}

app.use(
  cors({
    origin: "*",
  }),
);

const { handleExceptions } = await lens({
  app,
  cacheWatcherEnabled: true,
  mailWatcherEnabled: true,
  httpWatcherEnabled: true,
  eventWatcherEnabled: true,
  redisWatcherEnabled: true,
  fcmWatcherEnabled: true,
  logWatcherEnabled: true,
  jobWatcherEnabled: true,
  queryWatcher: {
    enabled: true,
    handler: createSequelizeHandler({ provider: "sqlite" }),
  },
  // Password-lock the dashboard when LENS_PASSWORD is set (e.g. on staging).
  auth: process.env.LENS_PASSWORD
    ? { password: process.env.LENS_PASSWORD }
    : undefined,
  // Post an alert to Slack/Discord/webhook on a new exception issue when
  // LENS_ALERT_WEBHOOK is set (provider inferred from the URL).
  alerts: process.env.LENS_ALERT_WEBHOOK
    ? { webhookUrl: process.env.LENS_ALERT_WEBHOOK }
    : undefined,
  isAuthenticated: async (_req) => {
    return true;
  },
  getUser: async (_req) => {
    return {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    };
  },
});

// Capture console output for the Logs watcher, correlated to the active request.
// (Called after `lens()` so the watcher is already subscribed to the emitter.)
patchConsole();

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

await sequelize.sync();
cache.setup();

app.get("/add-user", async (_req, res) => {
  await User.create({ name: "John Doe" });
  res.json({ message: "User added successfully" });
});

app.get("/normal-send", async (_req, res) => {
  res.send("Hello World!");
});

app.get("/http-call", async (_req, res) => {
  // Outgoing HTTP call captured by the HTTP watcher (targets this server so it
  // works offline).
  const response = await fetch(`http://127.0.0.1:${port}/normal-send`);
  const body = await response.text();
  res.json({ message: "External call made", status: response.status, body });
});

// A local echo endpoint that accepts every method, used as the target below.
app.all("/echo", express.json(), (req, res) => {
  res.json({ ok: true, method: req.method });
});

// Returns whatever status code is asked for, with a JSON error body.
app.get("/status/:code", (req, res) => {
  const code = Number(req.params.code) || 500;
  res
    .status(code)
    .json({ error: true, code, message: `Simulated ${code} response` });
});

// Fires several FAILING outgoing calls: non-2xx responses (fetch resolves) and
// a hard network failure (fetch rejects) — all captured by the HTTP watcher.
app.get("/http-errors", async (_req, res) => {
  const target = `http://127.0.0.1:${port}`;
  const results: Array<Record<string, unknown>> = [];

  for (const code of [400, 401, 403, 404, 429, 500, 503]) {
    const response = await fetch(`${target}/status/${code}`);
    results.push({ target: `/status/${code}`, status: response.status });
  }

  // Connection refused (nothing listening) — fetch throws; watcher records the error.
  try {
    await fetch("http://127.0.0.1:59999/nope");
  } catch (err) {
    results.push({
      target: "unreachable-host",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  res.json({ message: "Sent failing HTTP calls", results });
});

// Fires one outgoing request per HTTP method — all captured by the HTTP watcher
// and correlated to THIS request. The Authorization header is redacted.
app.get("/http-methods", async (_req, res) => {
  const target = `http://127.0.0.1:${port}/echo`;
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
  const results: Array<{ method: string; status: number }> = [];

  for (const method of methods) {
    const response = await fetch(target, {
      method,
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer demo-token",
      },
      body: method === "GET" ? undefined : JSON.stringify({ hello: method }),
    });
    results.push({ method, status: response.status });
  }

  res.json({ message: "Sent all HTTP methods", results });
});

app.get("/get-users", async (_req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Records application/domain events for the event watcher, correlated to this
// request — both manual (emitLensEvent) and via an instrumented EventEmitter.
app.get("/emit-event", async (_req, res) => {
  emitLensEvent("user.registered", { id: 1, email: "john@example.com" });
  emitLensEvent("order.placed", { orderId: "ORD-1001", total: 42.5 });
  appEvents.emit("cache.warmed", { keys: 12 });

  res.json({ message: "Emitted demo events" });
});

// Sends FCM push messages captured by the FCM watcher and correlated to this
// request (single send + multicast).
app.get("/fcm-demo", async (_req, res) => {
  const results: Record<string, unknown> = {};

  // Welcome push to a single device.
  results.welcome = await fcm.send({
    token: fakeToken("ios-user-42"),
    notification: { title: "Welcome to Lens 👋", body: "Thanks for signing up!" },
    data: { type: "welcome", userId: "42" },
  });

  // Order update with a rich data payload.
  results.order = await fcm.send({
    token: fakeToken("android-user-7"),
    notification: {
      title: "Your order shipped 📦",
      body: "Order #ORD-1042 is on its way",
    },
    data: { type: "order_update", orderId: "ORD-1042", status: "shipped" },
  });

  // Topic broadcast.
  results.promo = await fcm.send({
    topic: "promotions",
    notification: { title: "Flash sale ⚡", body: "24 hours only — 30% off" },
  });

  // Condition-based send.
  results.condition = await fcm.send({
    condition: "'premium' in topics && 'news' in topics",
    notification: { title: "Premium digest", body: "Your weekly digest is ready" },
  });

  // Multicast to many devices, a couple of which are invalid (partial failure).
  results.multicast = await fcm.sendEachForMulticast({
    tokens: [
      fakeToken("d1"),
      fakeToken("d2"),
      "invalid-token-1",
      fakeToken("d3"),
      "expired-token-2",
    ],
    notification: { title: "New feature 🚀", body: "Check out the new dashboard" },
  });

  // A send to an unregistered token — captured as a FAILED entry.
  try {
    await fcm.send({
      token: "invalid-device-token",
      notification: { title: "Undeliverable", body: "Unregistered token" },
    });
  } catch (err) {
    results.failed = err instanceof Error ? err.message : String(err);
  }

  res.json({ message: "FCM notifications sent", results });
});

// Emits application logs captured by the Logs watcher, correlated to this
// request — via the patched console and the structured emitLensLog API. The
// sensitive `apiKey` in the context is redacted before storage.
app.get("/log-demo", async (_req, res) => {
  console.info("Processing log demo for user %d", 42);
  console.warn("Cache is warming up", { region: "eu-west-1" });
  emitLensLog({
    level: "error",
    message: "Payment gateway timed out",
    context: { orderId: "ORD-2001", attempt: 3, apiKey: "sk_live_secret" },
    source: "payments",
  });

  res.json({ message: "Emitted demo logs" });
});

// Enqueues a background job captured by the Jobs watcher. The same row updates
// in place from "active" to "completed" (one row per job) via emitLensJob.
app.get("/job-demo", async (_req, res) => {
  const id = `emails:${rand(1000, 9999)}`;
  const createdAt = new Date().toISOString();
  const shared = {
    id,
    name: "sendWelcomeEmail",
    queue: "emails",
    data: { to: "user@example.com" },
    createdAt,
  };

  emitLensJob({ ...shared, status: "active" });
  setTimeout(() => {
    emitLensJob({
      ...shared,
      status: "completed",
      attempts: 1,
      duration: `${rand(50, 900)} ms`,
      result: { messageId: `msg_${rand(100000, 999999)}` },
    });
  }, 1500);

  res.json({ message: "Job enqueued", id });
});

// Runs a few Redis commands captured by the Redis watcher and correlated to
// this request.
app.get("/redis-demo", async (_req, res) => {
  try {
    await redis.set("lens:demo", JSON.stringify({ hello: "world" }));
    const value = await redis.get("lens:demo");
    const hits = await redis.incr("lens:demo:hits");
    await redis.del("lens:demo");
    res.json({ message: "Redis demo done", value, hits });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Cache Routes
app.get("/set-cache", async (_, res) => {
  res.json({
    result: await cache.set("randomKey", {
      hello: "world",
    }),
  });
});

app.get("/has-cache", async (_, res) => {
  res.json({
    result: await cache.has("randomKey"),
  });
});

app.get("/get-cache", async (_, res) => {
  res.json({
    result: await cache.get("randomKey"),
  });
});

app.get("/delete-cache", async (_, res) => {
  res.json({
    result: await cache.delete("randomKey"),
  });
});

app.get("/clear-cache", async (_, res) => {
  res.json({
    result: await cache.clear(),
  });
});

// Exception Routes
class MyRandomClass {
  public throwsErrors() {
    [1, 2].forEach((i) => {
      if (i === 1) {
        throw new Error("Something went wrong");
      }
    });
  }
}

app.get("/throw-error", async (_, res) => {
  new MyRandomClass().throwsErrors();
});

app.get("/send-email", async (_, res) => {
  const info = await sendEmail(mailTransporter, {
    from: '"Mohamed Attar" <mohamedattar@gmail.com>',
    to: "random@gmail.com",
    subject: "Template Email",
    raw: {
      path: "/home/elattar/workspace/lens/len/sample5.eml",
    },
  });

  res.json(info);
});

// Demo: a single request that exercises EVERY Lens watcher — request, query,
// cache, mail and exception — all correlated to the same request in the UI.
app.get("/all-watchers", async (_req, _res) => {
  // Query watcher
  await User.create({ name: "Lens Demo" });
  const users = await User.findAll();

  // Cache watcher
  await cache.set("demo:all-watchers", {
    users: users.length,
    at: new Date().toISOString(),
  });
  await cache.get("demo:all-watchers");

  // Mail watcher
  await sendEmail(mailTransporter, {
    from: '"Lens Demo" <demo@lensjs.dev>',
    to: "inbox@example.com",
    subject: "All watchers demo",
    text: `This request touched every Lens watcher. Users so far: ${users.length}.`,
  });

  // Event watcher
  emitLensEvent("demo.all_watchers", {
    users: users.length,
    at: new Date().toISOString(),
  });
  appEvents.emit("demo.instrumented", { source: "all-watchers" });

  // Redis watcher
  try {
    await redis.set("demo:all-watchers", String(users.length));
    await redis.get("demo:all-watchers");
  } catch {
    // Redis optional for the demo.
  }

  // FCM watcher
  await fcm.send({
    token: "demo-device-token",
    notification: { title: "All watchers", body: "Every signal in one request" },
  });

  // Logs watcher
  console.info("all-watchers demo ran with %d users", users.length);
  emitLensLog({
    level: "warn",
    message: "All watchers demo about to throw",
    source: "demo",
  });

  // Exception watcher — intentional; recorded and correlated to this request.
  throw new Error("Intentional demo exception from /all-watchers");
});

handleExceptions();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
