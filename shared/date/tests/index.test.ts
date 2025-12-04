import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DateTime } from 'luxon';
import {
  now,
  nowISO,
  sqlDateTime,
  convertToUTC,
  getCurrentTimezone,
  humanDifferentDate,
  formatTimeAgo,
  formatDateWithTimeAgo,
} from '../src';

vi.mock('../src', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getCurrentTimezone: vi.fn(() => 'UTC'),
  };
});

describe('Date Utilities', () => {
  // Mock DateTime.utc() to ensure consistent test results
  const MOCKED_DATE = '2025-09-05T10:00:00.000Z';
  const MOCKED_DATE_LUXON = DateTime.fromISO(MOCKED_DATE, { zone: 'utc' });

  beforeEach(() => {
    vi.spyOn(DateTime, 'utc').mockReturnValue(MOCKED_DATE_LUXON);
    DateTime.defaultZone = 'utc';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    DateTime.defaultZone = null;
  });

  it('now should return current UTC DateTime', () => {
    const result = now();
    expect(result.toISO()).toBe(MOCKED_DATE_LUXON.toISO());
    expect(result.zoneName).toBe('UTC');
  });

  it('nowISO should return current UTC DateTime in ISO format', () => {
    const result = nowISO();
    expect(result).toBe('2025-09-05T10:00:00Z');
  });

  it('sqlDateTime should format DateTime to SQL datetime string', () => {
    const result = sqlDateTime();
    expect(result).toBe('2025-09-05 10:00:00');

    const customDate = DateTime.fromISO('2024-01-15T14:30:00Z', { zone: 'utc' });
    const customResult = sqlDateTime(customDate);
    expect(customResult).toBe('2024-01-15 14:30:00');
  });

  it('convertToUTC should convert various date inputs to UTC ISO string', () => {
    const dateString = '2025-09-05T12:30:00+02:00'; // Local time
    const result = convertToUTC(dateString);
    expect(result).toBe('2025-09-05T10:30:00Z');

    const dateObject = new Date('2025-09-05T12:30:00+02:00');
    const resultObject = convertToUTC(dateObject);
    expect(resultObject).toBe('2025-09-05T10:30:00Z');
  });

  it('getCurrentTimezone should return the current timezone', () => {
    const result = getCurrentTimezone();
    // This will vary based on the environment where tests are run
    // We can't assert a specific timezone, but we can assert it's a string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  describe('humanDifferentDate', () => {
    it('should return relative and exact date for a given date', () => {
      // Mocking Date.now() to control relative time calculations
      vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-09-05T10:00:00Z').getTime());

      const pastDate = '2025-09-05T09:00:00Z'; // 1 hour ago
      const result = humanDifferentDate(pastDate);
      expect(result.label).toBe('1 hour ago');
      expect(result.exact).toBe('2025-09-05 09:00:00');

      const futureDate = '2025-09-05T11:00:00Z'; // 1 hour from now
      const futureResult = humanDifferentDate(futureDate);
      expect(futureResult.label).toBe('in 1 hour');
      expect(futureResult.exact).toBe('2025-09-05 11:00:00');
    });

    it('should handle invalid dates', () => {
      const invalidDate = 'not a date';
      const result = humanDifferentDate(invalidDate);
      expect(result.label).toBe('Unknown');
      expect(result.exact).toBe('Invalid DateTime');
    });
  });

  describe('formatTimeAgo', () => {
    it('should return relative time for a given date', () => {
      vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-09-05T10:00:00Z').getTime());

      const pastDate = '2025-09-05T09:00:00Z';
      const result = formatTimeAgo(pastDate);
      expect(result).toBe('1 hour ago');
    });

    it('should return "Unknown" for invalid dates', () => {
      const invalidDate = 'not a date';
      const result = formatTimeAgo(invalidDate);
      expect(result).toBe('Unknown');
    });
  });

  describe('formatDateWithTimeAgo', () => {
    it('should format date with time ago for a valid date', () => {
      vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-09-05T10:00:00Z').getTime());

      const pastDate = '2025-09-05T09:00:00Z';
      const result = formatDateWithTimeAgo(pastDate);
      expect(result).toBe('September 5, 2025 9:00 AM (1 hour ago)');
    });

    it('should return "N/A" for null or undefined input', () => {
      expect(formatDateWithTimeAgo(null)).toBe('N/A');
      expect(formatDateWithTimeAgo(undefined)).toBe('N/A');
    });

    it('should return "N/A" for invalid dates', () => {
      const invalidDate = 'not a date';
      const result = formatDateWithTimeAgo(invalidDate);
      expect(result).toBe('N/A');
    });

    it('should use the provided locale', () => {
      vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-09-05T10:00:00Z').getTime());

      const pastDate = '2025-09-05T09:00:00Z';
      const result = formatDateWithTimeAgo(pastDate, 'es');
      // The exact output depends on the environment's locale data, but we expect Spanish formatting
      expect(result).toMatch(/septiembre 5, 2025 9:00\s*a\.\s*m\.\s*\(hace 1 hora\)/i);
    });
  });
});
