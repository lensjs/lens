# Next.js Adapter

<p class="lens-lead">
The Next.js adapter integrates Lens into a Next.js <strong>App Router</strong> application.
Because Next.js has no central <code>app</code> object, Lens is wired up through a catch-all Route
Handler and a <code>withLens()</code> wrapper for your own handlers.
</p>

<Callout type="info" title="How it's wired">
Lens runs on the <strong>Node.js runtime</strong> (the default SQLite store needs Node) via two pieces:
a <strong>catch-all Route Handler</strong> that serves the dashboard, the Lens API, and the SSE live
tail; and a <strong><code>withLens()</code> wrapper</strong> that captures a request/response and
correlates any queries, logs, and exceptions to it.
</Callout>

## Installation

<Steps>
  <Step title="Install the packages">

<CommandCopy pkg="@lensjs/nextjs" />

For pre-built watcher handlers (e.g. Prisma), also install the watchers package:

<CommandCopy pkg="@lensjs/watchers" />

  </Step>
  <Step title="Initialize Lens once">

Create a single Lens instance and reuse it everywhere. `createLens` returns the `handlers` you
mount and the `withLens` wrapper.

```ts
// app/lens.ts
import { createLens } from "@lensjs/nextjs";

export const lens = await createLens({
  appName: "My Next.js App",
  logWatcherEnabled: true,
});
```

  </Step>
  <Step title="Mount the dashboard + API">

Re-export the handlers from a **catch-all** Route Handler and from a separate
**`/lens-config`** Route Handler (the dashboard fetches its config from the origin root):

```ts
// app/lens/[[...lensjs]]/route.ts
import { lens } from "../../lens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, DELETE } = lens.handlers;
```

```ts
// app/lens-config/route.ts
import { lens } from "../lens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET } = lens.handlers;
```

<Callout type="warning" title="Required exports">
The <code>runtime = "nodejs"</code> and <code>dynamic = "force-dynamic"</code> exports are required
so the engine runs on Node and the SSE stream is not cached.
</Callout>

  </Step>
  <Step title="Capture your own route handlers">

Wrap any Route Handler with `withLens` to record its request/response and correlate everything
emitted during it:

```ts
// app/api/users/route.ts
import { lens } from "../../lens";

export const runtime = "nodejs";

export const GET = lens.withLens(async () => {
  return Response.json({ users: [{ id: 1, name: "Alice" }] });
});
```

  </Step>
  <Step title="Keep the engine out of the bundler">

Tell Next.js to treat the Lens packages (and the native SQLite driver) as external server
packages:

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@lensjs/core",
    "@lensjs/nextjs",
    "@lensjs/watchers",
    "libsql",
    "better-sqlite3",
  ],
};

export default nextConfig;
```

  </Step>
</Steps>

## Try it out

<TerminalWindow title="try it out">
<p><span class="c-dim"># 1.</span> Start your Next.js app</p>
<p><span class="c-violet">npm run dev</span></p>
<p><span class="c-dim"># 2.</span> Trigger a captured request</p>
<p><span class="c-blue">http://localhost:3000/api/users</span></p>
<p><span class="c-dim"># 3.</span> Open the dashboard</p>
<p><span class="c-green">http://localhost:3000/lens</span> <span class="c-dim"><Icon name="check" :size="12" /> activity captured</span></p>
</TerminalWindow>

<BrowserMockup url="localhost:3000/lens">
  <img src="/screenshots/requests.png" alt="The Lens dashboard showing captured HTTP requests with method, path, status, and duration" />
</BrowserMockup>

## Next steps

<CardGrid :cols="2">
  <Card icon="settings" title="Configuration" href="/adapters/nextjs/configuration">
    All options, request correlation, and the optional middleware.
  </Card>
  <Card icon="database" title="Watchers" href="/watchers/">
    Capture queries, logs, jobs, and more.
  </Card>
</CardGrid>
