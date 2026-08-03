# Alerts & Notifications

Lens can post an alert to **Slack**, **Discord**, or any **webhook** whenever a new exception issue is captured. Alerts are deduped by the exception's fingerprint (so a flapping error does not spam you) and delivered off the request path — they never block or break your app.

## 1. Enable alerts

Pass an `alerts` config with a webhook URL. The provider is inferred from the URL (Slack / Discord), or set it explicitly for a generic webhook.

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

- **Slack** — an incoming webhook URL (`https://hooks.slack.com/...`); posts a formatted message.
- **Discord** — a webhook URL (`https://discord.com/api/webhooks/...`); posts a message.
- **Generic webhook** — any other URL; posts `{ "type": "exception", "entry": { … }, "link": "…" }` as JSON so you can route it anywhere.

By default Lens alerts once per **new issue** and then stays quiet for `cooldownMs`. Set `everyOccurrence: true` to alert on every occurrence instead.

## 3. Exception grouping

Every exception gets a stable **fingerprint** (from its type and origin), so repeat errors collapse into a single issue. On the **Exceptions** page, switch to **Grouped** to see issues with occurrence counts and last-seen; click an issue to drill into all of its occurrences.
