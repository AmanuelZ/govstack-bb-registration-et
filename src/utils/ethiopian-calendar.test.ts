import { describe, it, expect } from 'vitest';
import {
  toEthiopian,
  toGregorian,
  dateToEthiopian,
  ethiopianToDate,
  formatEthiopianDate,
  isEthiopianLeapYear,
  getEthiopianFiscalYear,
  getFiscalYearBounds,
  daysRemainingInFiscalYear,
  ethiopianFiscalYearEndGregorian,
  ETHIOPIAN_MONTHS,
} from './ethiopian-calendar.js';

describe('Ethiopian Calendar Conversion', () => {
  // ── Gregorian → Ethiopian ─────────────────────────────────────────────

  describe('toEthiopian', () => {
    it('converts Enkutatash 2017 (Sept 11, 2024)', () => {
      const eth = toEthiopian(2024, 9, 11);
      expect(eth).toEqual({ year: 2017, month: 1, day: 1 });
    });

    it('converts January 1, 2024 (Tahsas 22, 2016)', () => {
      const eth = toEthiopian(2024, 1, 1);
      expect(eth).toEqual({ year: 2016, month: 4, day: 22 });
    });

    it('converts March 23, 2026 (Megabit 14, 2018)', () => {
      const eth = toEthiopian(2026, 3, 23);
      expect(eth).toEqual({ year: 2018, month: 7, day: 14 });
    });

    it('converts September 12, 2023 (Meskerem 1, 2016 — day after Ethiopian leap Pagume 6)', () => {
      const eth = toEthiopian(2023, 9, 12);
      expect(eth).toEqual({ year: 2016, month: 1, day: 1 });
    });

    it('converts Pagume dates correctly (Sept 6, 2024 = Pagume 1, 2016)', () => {
      const eth = toEthiopian(2024, 9, 6);
      expect(eth).toEqual({ year: 2016, month: 13, day: 1 });
    });

    it('handles Ethiopian leap year Pagume 6 (Sept 11, 2023 = Pagume 6, 2015)', () => {
      // 2015 E.C. is a leap year (2015 % 4 === 3)
      const eth = toEthiopian(2023, 9, 11);
      expect(eth).toEqual({ year: 2015, month: 13, day: 6 });
    });
  });

  // ── Ethiopian → Gregorian ─────────────────────────────────────────────

  describe('toGregorian', () => {
    it('converts Meskerem 1, 2017 to September 11, 2024', () => {
      const g = toGregorian(2017, 1, 1);
      expect(g).toEqual({ year: 2024, month: 9, day: 11 });
    });

    it('converts Tahsas 22, 2016 to January 1, 2024', () => {
      const g = toGregorian(2016, 4, 22);
      expect(g).toEqual({ year: 2024, month: 1, day: 1 });
    });

    it('round-trips correctly for multiple dates', () => {
      const testDates = [
        [2024, 1, 1],
        [2024, 9, 11],
        [2025, 6, 15],
        [2023, 9, 11],
        [2026, 3, 23],
      ] as const;
      for (const [y, m, d] of testDates) {
        const eth = toEthiopian(y, m, d);
        const back = toGregorian(eth.year, eth.month, eth.day);
        expect(back).toEqual({ year: y, month: m, day: d });
      }
    });
  });

  // ── Date object helpers ───────────────────────────────────────────────

  describe('dateToEthiopian', () => {
    it('converts a JavaScript Date to Ethiopian', () => {
      const date = new Date(2024, 8, 11); // Sept 11, 2024
      const eth = dateToEthiopian(date);
      expect(eth).toEqual({ year: 2017, month: 1, day: 1 });
    });
  });

  describe('ethiopianToDate', () => {
    it('converts Ethiopian date to JavaScript Date', () => {
      const date = ethiopianToDate(2017, 1, 1);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(8); // September (0-indexed)
      expect(date.getDate()).toBe(11);
    });
  });

  // ── Leap Year ─────────────────────────────────────────────────────────

  describe('isEthiopianLeapYear', () => {
    it('2015 is a leap year (2015 % 4 === 3)', () => {
      expect(isEthiopianLeapYear(2015)).toBe(true);
    });

    it('2016 is not a leap year', () => {
      expect(isEthiopianLeapYear(2016)).toBe(false);
    });

    it('2017 is not a leap year', () => {
      expect(isEthiopianLeapYear(2017)).toBe(false);
    });

    it('2019 is a leap year (2019 % 4 === 3)', () => {
      expect(isEthiopianLeapYear(2019)).toBe(true);
    });
  });

  // ── Formatting ────────────────────────────────────────────────────────

  describe('formatEthiopianDate', () => {
    it('formats in English by default', () => {
      const result = formatEthiopianDate({ year: 2017, month: 1, day: 1 });
      expect(result).toBe('Meskerem 1, 2017 E.C.');
    });

    it('formats in Amharic with ዓ.ም.', () => {
      const result = formatEthiopianDate({ year: 2017, month: 1, day: 1 }, 'am');
      expect(result).toBe('1 መስከረም 2017 ዓ.ም.');
    });

    it('formats Pagume month correctly', () => {
      const result = formatEthiopianDate({ year: 2016, month: 13, day: 5 }, 'en');
      expect(result).toBe('Pagume 5, 2016 E.C.');
    });

    it('formats Pagume in Amharic', () => {
      const result = formatEthiopianDate({ year: 2015, month: 13, day: 6 }, 'am');
      expect(result).toBe('6 ጳጉሜ 2015 ዓ.ም.');
    });
  });

  // ── Fiscal Year ───────────────────────────────────────────────────────

  describe('getEthiopianFiscalYear', () => {
    it('returns 2017 for dates after Enkutatash 2024', () => {
      const fy = getEthiopianFiscalYear(new Date(2024, 8, 15)); // Sept 15
      expect(fy).toBe(2017);
    });

    it('returns 2016 for dates before Enkutatash 2024', () => {
      const fy = getEthiopianFiscalYear(new Date(2024, 7, 15)); // Aug 15
      expect(fy).toBe(2016);
    });
  });

  describe('getFiscalYearBounds', () => {
    it('returns correct bounds for non-leap Ethiopian year 2017', () => {
      const { start, end } = getFiscalYearBounds(2017);
      // Meskerem 1, 2017 = Sept 11, 2024
      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(8); // September
      expect(start.getDate()).toBe(11);
      // Pagume 5, 2017 (non-leap) = Sept 10, 2025
      expect(end.getMonth()).toBe(8); // September
    });

    it('returns 6-day Pagume for leap year 2015', () => {
      const { end } = getFiscalYearBounds(2015);
      // Pagume 6, 2015 = Sept 11, 2023
      expect(end.getFullYear()).toBe(2023);
      expect(end.getMonth()).toBe(8); // September
      expect(end.getDate()).toBe(11);
    });
  });

  describe('daysRemainingInFiscalYear', () => {
    it('returns positive number for mid-year date', () => {
      const remaining = daysRemainingInFiscalYear(new Date(2025, 0, 15)); // Jan 15
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThan(366);
    });

    it('returns 0 or small number near fiscal year end', () => {
      // Sept 10, 2025 is near Pagume 5, 2017
      const remaining = daysRemainingInFiscalYear(new Date(2025, 8, 10));
      expect(remaining).toBeLessThanOrEqual(1);
    });
  });

  describe('ethiopianFiscalYearEndGregorian', () => {
    it('returns correct Gregorian date for non-leap year', () => {
      const end = ethiopianFiscalYearEndGregorian(2017);
      // Pagume 5, 2017 → September 10, 2025
      expect(end.getFullYear()).toBe(2025);
      expect(end.getMonth()).toBe(8); // September
    });

    it('returns correct Gregorian date for leap year', () => {
      const end = ethiopianFiscalYearEndGregorian(2015);
      // Pagume 6, 2015 → September 11, 2023
      expect(end.getFullYear()).toBe(2023);
      expect(end.getMonth()).toBe(8);
      expect(end.getDate()).toBe(11);
    });
  });

  // ── Month Data ────────────────────────────────────────────────────────

  describe('ETHIOPIAN_MONTHS', () => {
    it('has 13 months', () => {
      expect(ETHIOPIAN_MONTHS).toHaveLength(13);
    });

    it('first month is Meskerem/መስከረም', () => {
      expect(ETHIOPIAN_MONTHS[0]?.nameEn).toBe('Meskerem');
      expect(ETHIOPIAN_MONTHS[0]?.nameAm).toBe('መስከረም');
    });

    it('13th month is Pagume/ጳጉሜ with 5 base days', () => {
      expect(ETHIOPIAN_MONTHS[12]?.nameEn).toBe('Pagume');
      expect(ETHIOPIAN_MONTHS[12]?.days).toBe(5);
    });

    it('all regular months have 30 days', () => {
      for (let i = 0; i < 12; i++) {
        expect(ETHIOPIAN_MONTHS[i]?.days).toBe(30);
      }
    });
  });
});
