# @lensjs/date

A utility package for Lens, providing a collection of date and time manipulation functions built on top of the Luxon library. It simplifies common date operations, formatting, and timezone conversions within the Lens ecosystem.

## Features

*   **`now()`**: Returns the current UTC `DateTime` object.
*   **`nowISO()`**: Returns the current UTC `DateTime` in ISO format (e.g., `2025-09-05T10:00:00Z`).
*   **`sqlDateTime(dateTime?: DateTime | null)`**: Formats a `DateTime` object (or the current UTC time) into a SQL-compatible datetime string (e.g., `YYYY-MM-DD HH:mm:ss`).
*   **`convertToUTC(dateTime: string | Date | number)`**: Converts various date inputs (string, Date object, timestamp) into a UTC ISO string.
*   **`getCurrentTimezone()`**: Returns the current system's timezone string.
*   **`humanDifferentDate(date: string | Date)`**: Calculates and returns a human-readable relative time difference (e.g., "1 hour ago", "in 2 days") along with the exact formatted date.
*   **`formatTimeAgo(dateInput: string | number | Date)`**: Returns a human-readable relative time string for a given date input.
*   **`formatDateWithTimeAgo(dateInput: string | number | Date | null | undefined, locale: string = "en")`**: Formats a date with a full date and time string, followed by a human-readable "time ago" string in parentheses, supporting different locales.

## Dependencies

*   [Luxon](https://moment.github.io/luxon/)

## Installation

```bash
pnpm add @lensjs/date
```

## Usage Example

```typescript
import {
  nowISO,
  sqlDateTime,
  convertToUTC,
  humanDifferentDate,
  formatDateWithTimeAgo,
} from '@lensjs/date';
import { DateTime } from 'luxon';

// Get current UTC ISO string
console.log(nowISO()); // e.g., "2025-09-05T10:00:00Z"

// Format a custom date to SQL datetime
const customDate = DateTime.fromISO('2024-01-15T14:30:00Z', { zone: 'utc' });
console.log(sqlDateTime(customDate)); // "2024-01-15 14:30:00"

// Convert a local date string to UTC ISO
console.log(convertToUTC('2025-09-05T12:30:00+02:00')); // "2025-09-05T10:30:00Z"

// Get human-readable difference and exact date
const diff = humanDifferentDate('2025-09-05T09:00:00Z');
console.log(diff.label); // "1 hour ago" (assuming current time is 10:00:00Z)
console.log(diff.exact); // "2025-09-05 09:00:00"

// Format date with time ago in Spanish
console.log(formatDateWithTimeAgo('2025-09-05T09:00:00Z', 'es')); // "septiembre 5, 2025 9:00 a. m. (hace 1 hora)"
```
