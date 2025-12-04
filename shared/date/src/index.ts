import { DateTime } from "luxon";

export function now() {
  return DateTime.utc();
}

export function nowISO() {
  return now().toISO({ suppressMilliseconds: true }) as string;
}

export function sqlDateTime(dateTime?: DateTime | null) {
  const time = dateTime ?? now();
  return time.toFormat("yyyy-LL-dd HH:mm:ss");
}

export function convertToUTC(dateTime: string | Date | number) {
  let dt: DateTime;
  if (typeof dateTime === 'string') {
    dt = DateTime.fromISO(dateTime);
  } else if (typeof dateTime === 'number') {
    dt = DateTime.fromMillis(dateTime, { zone: 'utc' });
  } else {
    dt = DateTime.fromJSDate(dateTime);
  }
  return dt.toUTC().toISO({ suppressMilliseconds: true }) as string;
}

export function getCurrentTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function parseBackendUTC(date: string | Date | number) {
  return DateTime.fromJSDate(new Date(date), { zone: "utc" });
}

export const humanDifferentDate = (date: string | Date) => {
  const d = parseBackendUTC(date);

  return {
    label: d.toRelative() ?? "Unknown",
    exact: d.toFormat("yyyy-LL-dd HH:mm:ss"),
  };
};

export function formatTimeAgo(dateInput: string | number | Date): string {
  const d = parseBackendUTC(dateInput);
  return d.isValid ? d.toRelative() ?? "Unknown" : "Unknown";
}

export function formatDateWithTimeAgo(
  dateInput: string | number | Date | null | undefined,
  locale: string = "en"
): string {
  if (!dateInput) return "N/A";

  const d = parseBackendUTC(dateInput).setLocale(locale);

  if (!d.isValid) return "N/A";

  const formatted = d.toFormat("MMMM d, yyyy h:mm a");
  return `${formatted} (${d.toRelative() ?? "Unknown"})`;
}
