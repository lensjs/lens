# FCM (Push) Watcher

<p class="lens-lead">
The FCM watcher captures <strong>Firebase Cloud Messaging</strong> push sends made through a
<a href="https://firebase.google.com/docs/admin/setup" target="_blank" rel="noreferrer"><code>firebase-admin</code></a>
Messaging instance and correlates them to the request that issued them. It records the send
method, target, notification title/body, data payload, message id, and — for multicast sends —
the success/failure counts.
</p>

<Callout type="security" title="Tokens are truncated">
Device tokens are truncated by default.
</Callout>

<Callout type="info" title="Optional dependency">
<code>firebase-admin</code> is an optional peer dependency of <code>@lensjs/watchers</code>.
Install it in your app if you use this watcher:
</Callout>

<CommandCopy pkg="firebase-admin" />

## Setup

<Steps>
<Step title="Enable the watcher">

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

</Step>
<Step title="Instrument Messaging">

Wrap the result of `admin.messaging()` with `withLensFcm()`. It patches the instance in place and
returns it, so use the wrapped instance everywhere you send messages. The following methods are
captured: `send`, `sendEach`, `sendEachForMulticast`, `sendMulticast`, and `sendAll`.

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

</Step>
</Steps>

## Options

```ts
withLensFcm(admin.messaging(), {
  fullTokens: false, // set true to store full device tokens (default: false)
});
```

## Next steps

<CardGrid :cols="2">
  <Card icon="mail" title="Mail watcher" href="/watchers/mail">
    Capture outgoing email with subject, recipients, and rendered content.
  </Card>
  <Card icon="git-branch" title="Event watcher" href="/watchers/events">
    Record application and domain events, correlated to each request.
  </Card>
</CardGrid>
