import express from "express";
import cors from "cors";
import { Sequelize, DataTypes, Model } from "sequelize";
import { createSequelizeHandler, watcherEmitter } from "@lensjs/watchers";
import { lens } from "@lensjs/express";
import MemoryCache from "./concrete/cache/memory_cache";
import * as nodemailer from "nodemailer";
import dotenv from "dotenv";

const app = express();
const port = 3000;
const cache = new MemoryCache();

// Load .env file
dotenv.config();

// Sequelize
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./random.db",
  benchmark: true,
  logQueryParameters: true,
  logging: (sql, timing) => {
    watcherEmitter.emit("sequelizeQuery", { sql, timing });
  },
});

app.use(
  cors({
    origin: "*",
  }),
);

const { handleExceptions } = await lens({
  app,
  cacheWatcherEnabled: true,
  queryWatcher: {
    enabled: true,
    handler: createSequelizeHandler({ provider: "sqlite" }),
  },
  isAuthenticated: async (_req) => {
    return false;
  },
  getUser: async (_req) => {
    return {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    };
  },
});

// Qyery Testing
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

app.get("/get-users", async (_req, res) => {
  const users = await User.findAll();
  res.json(users);
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

// Mail Testing
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST as string,
  port: +(process.env.MAIL_PORT as string),
  from: process.env.MAIL_FROM_ADDRESS,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME as string,
    pass: process.env.MAIL_PASSWORD as string,
  },
  debug: false,
  logger: false,
});

await mailer.verify();

app.get("/send-mail", async (_, res) => {
  const response = await mailer.sendMail({
    to: process.env.MAIL_TO_ADDRESS,
    subject: "Test Email",
    text: "This is a test email",
  });

    console.log('messageId', response.messageId)

  return res.json({ message: "Email sent successfully" });
});

handleExceptions();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
