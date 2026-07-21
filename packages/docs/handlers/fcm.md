# FCM Watcher

The FCM watcher captures **Firebase Cloud Messaging** push sends made through a
[`firebase-admin`](https://firebase.google.com/docs/admin/setup) Messaging
instance and correlates them to the request that issued them. It records the
send method, target, notification title/body, data payload, message id, and —
for multicast sends — the success/failure counts.

Device tokens are truncated by default.

::: info Optional dependency
`firebase-admin` is an optional peer dependency of `@lensjs/watchers`. Install
it in your app if you use this watcher: `npm install firebase-admin`.
:::

## Enable the watcher

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  fcmWatcherEnabled: true,
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  watchers: {
    fcm: true,
  },
})
```

:::

## Instrument Messaging

Wrap the result of `admin.messaging()` with `withLensFcm()`. It patches the
instance in place and returns it, so use the wrapped instance everywhere you
send messages. The following methods are captured: `send`, `sendEach`,
`sendEachForMulticast`, `sendMulticast`, and `sendAll`.

```ts
import admin from "firebase-admin";
import { withLensFcm } from "@lensjs/watchers";

const fcm = withLensFcm(admin.messaging());

// Captured and correlated to the active request.
await fcm.send({
  token: deviceToken,
  notification: { title: "Welcome", body: "Thanks for signing up!" },
});

await fcm.sendEachForMulticast({
  tokens: [tokenA, tokenB],
  notification: { title: "Broadcast" },
});
```

### Options

```ts
withLensFcm(admin.messaging(), {
  fullTokens: false, // set true to store full device tokens (default: false)
});
```
