# Watchers

<p class="lens-lead">
Watchers are what Lens captures. Each one records a type of signal — requests, database queries,
cache operations, exceptions, mail, jobs, and more — and correlates it to the request that produced
it. Enable the ones you need; ignore the rest.
</p>

Most watchers live in your framework adapter and are toggled from your `lens()` config. The
ORM, cache, and mailer integrations ship in the watchers package:

<CommandCopy pkg="@lensjs/watchers" />

## Available watchers

<CardGrid :cols="2">
  <Card icon="activity" title="Requests" href="/watchers/requests">
    Incoming HTTP requests with headers, body, response, status, duration, and user.
  </Card>
  <Card icon="database" title="Database Queries" href="/watchers/database">
    Prisma, Kysely, Sequelize, MikroORM, Drizzle, Mongoose, and Lucid.
  </Card>
  <Card icon="hard-drive" title="Cache" href="/watchers/cache">
    Hits, misses, writes, and evictions across your caching layer.
  </Card>
  <Card icon="bug" title="Exceptions" href="/watchers/exceptions">
    Automatic capture with stack traces and fingerprint grouping.
  </Card>
  <Card icon="mail" title="Mail" href="/watchers/mail">
    Outgoing email with MIME previews, iCalendar, and attachments.
  </Card>
  <Card icon="network" title="HTTP Client" href="/watchers/http">
    Outbound fetch calls, with W3C trace propagation.
  </Card>
  <Card icon="git-branch" title="Events" href="/watchers/events">
    Application events emitted during a request.
  </Card>
  <Card icon="hard-drive" title="Redis" href="/watchers/redis">
    Redis commands issued by your app.
  </Card>
  <Card icon="bell" title="FCM (Push)" href="/watchers/fcm">
    Firebase Cloud Messaging push notifications.
  </Card>
  <Card icon="terminal" title="Logs" href="/watchers/logs">
    Console, pino, and winston log lines.
  </Card>
  <Card icon="boxes" title="Jobs & Queues" href="/watchers/jobs">
    BullMQ and Agenda jobs as they run.
  </Card>
</CardGrid>

<Callout type="tip" title="How enabling works">
Request and exception watchers are on by default. The rest are opt-in via flags like
<code>cacheWatcherEnabled</code>, <code>mailWatcherEnabled</code>, or a <code>queryWatcher</code>
handler — see each watcher's page and the <a href="/configuration">Configuration reference</a>.
</Callout>
