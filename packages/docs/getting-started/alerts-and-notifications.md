# Alerts & Notifications

<p class="lens-lead">
Lens can post an alert to <strong>Slack</strong>, <strong>Discord</strong>, or any
<strong>webhook</strong> whenever a new exception issue is captured. Alerts are deduped by the
exception's fingerprint (so a flapping error never spams you) and delivered off the request path
— they never block or break your app.
</p>

## 1. Enable alerts

Pass an `alerts` config with a webhook URL. The provider is inferred from the URL (Slack /
Discord), or set it explicitly for a generic webhook.

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  alerts: {
    webhookUrl: process.env.LENS_ALERT_WEBHOOK!,
    // provider: "slack" | "discord" | "webhook"  // inferred from the URL when omitted
    // cooldownMs: 300000,      // suppress repeats of the same issue (default: 5 min)
    // everyOccurrence: false,  // alert on every occurrence instead of only new issues
    // dashboardUrl: "https://myapp.com/lens", // adds a "View in Lens" link
  },
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  alerts: {
    webhookUrl: env.get('LENS_ALERT_WEBHOOK'),
  },
})
```

:::

## 2. Providers

<CardGrid :cols="3">
  <Card icon="message-circle" title="Slack">
    An incoming webhook URL (<code>https://hooks.slack.com/...</code>); posts a formatted message.
  </Card>
  <Card icon="message-circle" title="Discord">
    A webhook URL (<code>https://discord.com/api/webhooks/...</code>); posts a message.
  </Card>
  <Card icon="webhook" title="Generic webhook">
    Any other URL; posts <code>{ type, entry, link }</code> as JSON so you can route it anywhere.
  </Card>
</CardGrid>

By default Lens alerts once per **new issue** and then stays quiet for `cooldownMs`. Set
`everyOccurrence: true` to alert on every occurrence instead.

<Callout type="best-practice" title="Add a dashboard link">
Set <code>dashboardUrl</code> so every alert includes a one-click "View in Lens" link straight to
the offending issue.
</Callout>

## 3. Exception grouping

Every exception gets a stable **fingerprint** (from its type and origin), so repeat errors
collapse into a single issue.

<Timeline :items="[
  { icon: 'bug', title: 'An exception is captured', description: 'Lens computes a fingerprint from the error type and origin.' },
  { icon: 'boxes', title: 'Occurrences collapse into an issue', description: 'On the Exceptions page, switch to Grouped to see issues with occurrence counts and last-seen.' },
  { icon: 'bell-ring', title: 'A new issue triggers an alert', description: 'You are notified once per new issue, then muted for the cooldown window.' },
]" />

On the **Exceptions** page, switch to **Grouped** to see issues with occurrence counts and
last-seen; click an issue to drill into all of its occurrences.
