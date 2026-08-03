import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { Sequelize, DataTypes, Model } from "sequelize";
import {
  createSequelizeHandler,
  attachSequelizeLens,
  patchConsole,
  emitLensLog,
  emitLensJob,
} from "@lensjs/watchers";
import { lens } from "@lensjs/hono";

const app = new Hono();
const port = Number(process.env.PORT) || 3000;

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./hono.db",
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

await lens({
  app,
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
  isAuthenticated: async () => true,
  getUser: async () => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
  }),
});

// Capture console output for the Logs watcher, correlated to the active request.
// (Called after `lens()` so the watcher is already subscribed to the emitter.)
patchConsole();

await sequelize.sync();

app.get("/add-user", async (c) => {
  await User.create({ name: "John Doe" });
  return c.json({ message: "User added successfully" });
});

app.get("/get-users", async (c) => {
  const users = await User.findAll();
  return c.json(users);
});

// Emits application logs captured by the Logs watcher, correlated to this
// request. The sensitive `apiKey` in the context is redacted before storage.
app.get("/log-demo", async (c) => {
  console.info("Processing log demo for user %d", 42);
  console.warn("Cache is warming up", { region: "eu-west-1" });
  emitLensLog({
    level: "error",
    message: "Payment gateway timed out",
    context: { orderId: "ORD-2001", attempt: 3, apiKey: "sk_live_secret" },
    source: "payments",
  });

  return c.json({ message: "Emitted demo logs" });
});

// Enqueues a background job captured by the Jobs watcher. The same row updates
// in place from "active" to "completed" (one row per job) via emitLensJob.
app.get("/job-demo", async (c) => {
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

  return c.json({ message: "Job enqueued", id });
});

// Intentional exception; recorded and correlated to this request by the
// auto-registered `onError` handler.
app.get("/throw-error", () => {
  throw new Error("Intentional demo exception from /throw-error");
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running at http://localhost:${info.port}`);
});
