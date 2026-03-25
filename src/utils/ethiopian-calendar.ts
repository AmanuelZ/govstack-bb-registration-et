/**
 * Ethiopian Calendar (ዓ.ም.) Conversion Utilities
 *
 * The Ethiopian calendar (Ge'ez calendar) differs from the Gregorian calendar:
 * - 13 months: 12 months of 30 days each + Pagume (5 or 6 days)
 * - ~7-8 years behind Gregorian (offset varies by month)
 * - New Year (Enkutatash/እንቁጣጣሽ) falls on September 11 (or 12 in leap years)
 * - Ethiopian leap year: every 4 years without exception (year % 4 === 3)
 *
 * Ethiopian fiscal year: Meskerem 1 – Pagume 5/6 (aligned with Ethiopian calendar year)
 *
 * References:
 * - Ethiopian Calendar Wikipedia: https://en.wikipedia.org/wiki/Ethiopian_calendar
 * - Proclamation No. 1162/2019 (fiscal year alignment)
 */

export interface EthiopianDate {
  year: number;
  month: number; // 1-13
  day: number; // 1-30 (1-5 or 1-6 for Pagume)
}

export interface GregorianDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/** Ethiopian month names in Amharic and English */
export const ETHIOPIAN_MONTHS: ReadonlyArray<{
  number: number;
  nameAm: string;
  nameEn: string;
  days: number;
}> = [
  { number: 1, nameAm: 'መስከረም', nameEn: 'Meskerem', days: 30 },
  { number: 2, nameAm: 'ጥቅምት', nameEn: 'Tikimt', days: 30 },
  { number: 3, nameAm: 'ኅዳር', nameEn: 'Hidar', days: 30 },
  { number: 4, nameAm: 'ታኅሣሥ', nameEn: 'Tahsas', days: 30 },
  { number: 5, nameAm: 'ጥር', nameEn: 'Tir', days: 30 },
  { number: 6, nameAm: 'የካቲት', nameEn: 'Yekatit', days: 30 },
  { number: 7, nameAm: 'መጋቢት', nameEn: 'Megabit', days: 30 },
  { number: 8, nameAm: 'ሚያዝያ', nameEn: 'Miazia', days: 30 },
  { number: 9, nameAm: 'ግንቦት', nameEn: 'Ginbot', days: 30 },
  { number: 10, nameAm: 'ሰኔ', nameEn: 'Sene', days: 30 },
  { number: 11, nameAm: 'ሐምሌ', nameEn: 'Hamle', days: 30 },
  { number: 12, nameAm: 'ነሐሴ', nameEn: 'Nehase', days: 30 },
  { number: 13, nameAm: 'ጳጉሜ', nameEn: 'Pagume', days: 5 }, // 6 in leap years
];

// Julian Day Number of Ethiopian epoch (August 29, 8 AD Gregorian / Meskerem 1, 1 E.C.)
const ET_EPOCH_JDN = 1724221;

/**
 * Check if an Ethiopian year is a leap year.
 * Ethiopian leap year occurs when (year % 4 === 3).
 */
export function isEthiopianLeapYear(ethYear: number): boolean {
  return ethYear % 4 === 3;
}

/**
 * Check if a Gregorian year is a leap year.
 */
export function isGregorianLeapYear(gYear: number): boolean {
  return (gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0;
}

/**
 * Convert Gregorian date to Julian Day Number.
 */
function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Convert Julian Day Number to Gregorian date.
 */
function jdnToGregorian(jdn: number): GregorianDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * Convert Ethiopian date to Julian Day Number.
 *
 * Leap years in the Ethiopian calendar: year % 4 === 3.
 * In each 4-year cycle (years N+1, N+2, N+3, N+4), the 3rd year (N+3) is leap.
 * Total leap days before year Y = floor(Y / 4).
 */
function ethiopianToJdn(year: number, month: number, day: number): number {
  return ET_EPOCH_JDN + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

/**
 * Convert Julian Day Number to Ethiopian date.
 *
 * Each 4-year cycle has 1461 days (365 + 365 + 366 + 365).
 * The leap year is at position 2 (0-indexed) within the cycle,
 * i.e., the 3rd year where (year % 4 === 3).
 */
function jdnToEthiopian(jdn: number): EthiopianDate {
  const diff = jdn - ET_EPOCH_JDN;
  const cycle = Math.floor(diff / 1461);
  const rem = diff - cycle * 1461;

  let yearInCycle: number;
  let dayOfYear: number;

  if (rem < 365) {
    yearInCycle = 0;
    dayOfYear = rem;
  } else if (rem < 730) {
    yearInCycle = 1;
    dayOfYear = rem - 365;
  } else if (rem < 1096) {
    // Leap year: 366 days (730..1095)
    yearInCycle = 2;
    dayOfYear = rem - 730;
  } else {
    yearInCycle = 3;
    dayOfYear = rem - 1096;
  }

  const year = cycle * 4 + yearInCycle + 1;
  const month = Math.floor(dayOfYear / 30) + 1;
  const day = (dayOfYear % 30) + 1;

  return { year, month, day };
}

/**
 * Convert a Gregorian date to Ethiopian date.
 *
 * @example
 * toEthiopian(2024, 9, 11) // { year: 2017, month: 1, day: 1 } — Enkutatash
 * toEthiopian(2026, 3, 23) // { year: 2018, month: 7, day: 14 }
 */
export function toEthiopian(gYear: number, gMonth: number, gDay: number): EthiopianDate {
  const jdn = gregorianToJdn(gYear, gMonth, gDay);
  return jdnToEthiopian(jdn);
}

/**
 * Convert an Ethiopian date to Gregorian date.
 *
 * @example
 * toGregorian(2017, 1, 1) // { year: 2024, month: 9, day: 11 } — Enkutatash
 */
export function toGregorian(ethYear: number, ethMonth: number, ethDay: number): GregorianDate {
  const jdn = ethiopianToJdn(ethYear, ethMonth, ethDay);
  return jdnToGregorian(jdn);
}

/**
 * Convert a JavaScript Date to Ethiopian date.
 */
export function dateToEthiopian(date: Date): EthiopianDate {
  return toEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Convert an Ethiopian date to JavaScript Date (midnight UTC).
 */
export function ethiopianToDate(ethYear: number, ethMonth: number, ethDay: number): Date {
  const g = toGregorian(ethYear, ethMonth, ethDay);
  return new Date(g.year, g.month - 1, g.day);
}

/**
 * Get the current Ethiopian date.
 */
export function todayEthiopian(): EthiopianDate {
  return dateToEthiopian(new Date());
}

/**
 * Format an Ethiopian date as a human-readable string.
 *
 * @param locale - 'am' for Amharic, 'en' for English
 * @example
 * formatEthiopianDate({ year: 2017, month: 1, day: 1 }, 'am') // "1 መስከረም 2017 ዓ.ም."
 * formatEthiopianDate({ year: 2017, month: 1, day: 1 }, 'en') // "Meskerem 1, 2017 E.C."
 */
export function formatEthiopianDate(
  date: EthiopianDate,
  locale: 'am' | 'en' = 'en',
): string {
  const monthInfo = ETHIOPIAN_MONTHS[date.month - 1];
  if (!monthInfo) return `${String(date.day)}/${String(date.month)}/${String(date.year)}`;

  if (locale === 'am') {
    return `${String(date.day)} ${monthInfo.nameAm} ${String(date.year)} ዓ.ም.`;
  }
  return `${monthInfo.nameEn} ${String(date.day)}, ${String(date.year)} E.C.`;
}

/**
 * Get the Ethiopian fiscal year for a given Gregorian date.
 * Ethiopian fiscal year starts on Meskerem 1 (Sept 11/12 Gregorian).
 * Returns the Ethiopian year number for the fiscal year.
 */
export function getEthiopianFiscalYear(date: Date): number {
  const eth = dateToEthiopian(date);
  return eth.year;
}

/**
 * Get the start and end dates of an Ethiopian fiscal year in Gregorian.
 * Fiscal year runs from Meskerem 1 to Pagume 5/6.
 */
export function getFiscalYearBounds(ethYear: number): {
  start: Date;
  end: Date;
} {
  const start = ethiopianToDate(ethYear, 1, 1); // Meskerem 1
  const pagumeDays = isEthiopianLeapYear(ethYear) ? 6 : 5;
  const end = ethiopianToDate(ethYear, 13, pagumeDays); // Pagume 5 or 6
  return { start, end };
}

/**
 * Calculate the number of days remaining in the current Ethiopian fiscal year.
 */
export function daysRemainingInFiscalYear(date: Date): number {
  const eth = dateToEthiopian(date);
  const { end } = getFiscalYearBounds(eth.year);
  const diffMs = end.getTime() - date.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

/**
 * Check if a given date falls within the trade license renewal grace period.
 * Grace period: 30 days after Ethiopian fiscal year end (Pagume 5/6).
 */
export function isWithinRenewalGracePeriod(date: Date): boolean {
  const eth = dateToEthiopian(date);
  // Check against the fiscal year that just ended
  const prevFiscalYear = eth.month <= 1 && eth.day <= 30 ? eth.year - 1 : eth.year - 1;
  const { end: prevEnd } = getFiscalYearBounds(prevFiscalYear);
  const gracePeriodEnd = new Date(prevEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

  return date > prevEnd && date <= gracePeriodEnd;
}

/**
 * Get the Ethiopian fiscal year end date in Gregorian calendar.
 * More accurate replacement for WorkflowEngine.ethiopianFiscalYearEnd().
 * Uses actual Ethiopian calendar conversion instead of hardcoded approximation.
 */
export function ethiopianFiscalYearEndGregorian(ethYear: number): Date {
  const pagumeDays = isEthiopianLeapYear(ethYear) ? 6 : 5;
  return ethiopianToDate(ethYear, 13, pagumeDays);
}
