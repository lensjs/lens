import type {
  AlertProvider,
  ExceptionEntry,
  LensAlertsConfig,
} from "../types/index";

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

export interface LensNotifier {
  /**
   * Deliver an alert for a captured exception. Fire-and-forget: it dedupes,
   * formats, and posts without ever throwing into the caller.
   */
  notifyException(entry: ExceptionEntry & { id?: string }): void;
}

function inferProvider(url: string): AlertProvider {
  if (/hooks\.slack\.com/i.test(url)) return "slack";
  if (/discord(app)?\.com\/api\/webhooks/i.test(url)) return "discord";
  return "webhook";
}

function buildPayload(
  provider: AlertProvider,
  entry: ExceptionEntry & { id?: string },
  dashboardUrl?: string,
): unknown {
  const title = `${entry.name}: ${entry.message}`;
  const link =
    dashboardUrl && entry.id
      ? `${dashboardUrl.replace(/\/$/, "")}/exceptions/${entry.id}`
      : undefined;

  switch (provider) {
    case "slack":
      return {
        text: `:rotating_light: *New exception in Lens*\n${title}${
          link ? `\n<${link}|View in Lens>` : ""
        }`,
      };
    case "discord":
      return {
        content: `**New exception in Lens**\n${title}${link ? `\n${link}` : ""}`,
      };
    default:
      // Generic webhooks receive a minimal, redaction-safe summary — never the
      // full entry, whose stack trace / code frame / cause can carry PII or
      // secrets. Receivers follow `link` (behind dashboard auth) for detail.
      return {
        type: "exception",
        exception: {
          id: entry.id,
          name: entry.name,
          message: entry.message,
          fingerprint: entry.fingerprint,
          createdAt: entry.createdAt,
        },
        link,
      };
  }
}

/**
 * Build a notifier that posts to a Slack/Discord/generic webhook when a new
 * exception issue is captured. Delivery is non-blocking and deduped per
 * fingerprint within a cooldown window, so a flapping error does not spam.
 */
export function createLensNotifier(config: LensAlertsConfig): LensNotifier {
  const provider = config.provider ?? inferProvider(config.webhookUrl);
  const cooldownMs = config.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const everyOccurrence = config.everyOccurrence ?? false;
  const lastSent = new Map<string, number>();

  return {
    notifyException(entry) {
      try {
        const key = entry.fingerprint ?? `${entry.name}:${entry.message}`;

        if (!everyOccurrence) {
          const now = Date.now();
          const previous = lastSent.get(key);
          if (previous !== undefined && now - previous < cooldownMs) return;
          lastSent.set(key, now);
        }

        const payload = buildPayload(provider, entry, config.dashboardUrl);

        void fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => {
          console.error("Lens: failed to deliver alert", err);
        });
      } catch (err) {
        console.error("Lens: alert notifier error", err);
      }
    },
  };
}
