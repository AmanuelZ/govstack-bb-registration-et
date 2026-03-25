import type { Determinant } from './engine.js';
import { WorkflowEngine } from './engine.js';
import {
  dateToEthiopian,
  getFiscalYearBounds,
  formatEthiopianDate,
} from '../utils/ethiopian-calendar.js';

/**
 * Determinants for Ethiopian Trade License Renewal.
 * Implements Ministry of Trade and Industry renewal requirements
 * with Ethiopian fiscal calendar awareness.
 *
 * Ethiopian fiscal year: Meskerem 1 – Pagume 5 (approx. Sept 11 – Sept 10 Gregorian)
 */
export const tradeLicenseRenewalDeterminants: Determinant[] = [
  // ── Address Change ────────────────────────────────────────────────────────
  {
    id: 'address-change-lease',
    name: 'Address change requires updated lease agreement',
    field: 'business_address_changed',
    operator: 'eq',
    value: true,
    effect: {
      type: 'add_document',
      target: 'UPDATED_LEASE',
      message: 'Business address change requires an updated lease agreement or title deed',
    },
  },
  {
    id: 'address-change-requires-field',
    name: 'Address change requires new address details',
    field: 'business_address_changed',
    operator: 'eq',
    value: true,
    effect: {
      type: 'require_field',
      target: 'new_address',
      message: 'New address details are required when business address has changed',
    },
  },

  // ── Business Grade Fees (based on annual revenue) ─────────────────────────
  {
    id: 'grade1-high-revenue',
    name: 'Grade 1 business (revenue > ETB 5,000,000)',
    field: 'annual_revenue',
    operator: 'gt',
    value: 5000000,
    effect: {
      type: 'add_fee',
      target: 'grade1-renewal-fee',
      params: { amount: 5000 },
      message: 'Grade 1 trade license renewal fee: ETB 5,000 (annual revenue > ETB 5,000,000)',
    },
  },
  {
    id: 'grade2-medium-revenue',
    name: 'Grade 2 business (revenue ETB 500,000 – 5,000,000)',
    field: 'annual_revenue',
    operator: 'lte',
    value: 5000000,
    effect: {
      type: 'add_fee',
      target: 'grade2-renewal-fee',
      params: { amount: 2000 },
      message: 'Grade 2 trade license renewal fee: ETB 2,000',
    },
  },

  // ── Employee Threshold Documentation ──────────────────────────────────────
  {
    id: 'large-employer-labor-clearance',
    name: 'Large employer (>50 employees) requires labor clearance',
    field: 'employee_count',
    operator: 'gt',
    value: 50,
    effect: {
      type: 'add_document',
      target: 'LABOR_CLEARANCE',
      message:
        'Businesses with more than 50 employees require clearance from the Ministry of Labor and Social Affairs',
    },
  },
];

/**
 * Calculate complete trade license renewal fee including late penalty.
 * Returns itemized fee breakdown.
 */
export function calculateRenewalFee(
  annualRevenue: number,
  renewalDate: Date,
  fiscalYearEnd: Date,
): {
  baseFee: number;
  latePenalty: number;
  total: number;
  isLate: boolean;
  monthsLate: number;
} {
  // Determine grade-based base fee
  let baseFee: number;
  if (annualRevenue > 5000000) {
    baseFee = 5000; // Grade 1
  } else if (annualRevenue > 500000) {
    baseFee = 2000; // Grade 2
  } else {
    baseFee = 500; // Grade 3
  }

  const latePenalty = WorkflowEngine.calculateLatePenalty(fiscalYearEnd, renewalDate);
  const gracePeriodEnd = new Date(fiscalYearEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);
  const isLate = renewalDate > gracePeriodEnd;

  const msPerMonth = 30 * 24 * 60 * 60 * 1000;
  const monthsLate = isLate
    ? Math.ceil((renewalDate.getTime() - gracePeriodEnd.getTime()) / msPerMonth)
    : 0;

  return {
    baseFee,
    latePenalty,
    total: baseFee + latePenalty,
    isLate,
    monthsLate,
  };
}

/**
 * Check if a license should be cancelled due to excessive late renewal.
 * Per regulations: license is cancelled if renewal is more than 6 months overdue.
 */
export function shouldCancelLicense(fiscalYearEnd: Date, renewalDate: Date): boolean {
  const cancellationThreshold = new Date(fiscalYearEnd);
  cancellationThreshold.setMonth(cancellationThreshold.getMonth() + 6);
  return renewalDate > cancellationThreshold;
}

/**
 * Get the Ethiopian fiscal year end date for a renewal using the proper Ethiopian calendar.
 * Uses actual calendar conversion instead of hardcoded Gregorian approximation.
 *
 * @param gregorianDate - The date to determine fiscal year for
 * @returns Object with Ethiopian year info and Gregorian fiscal year end date
 */
export function getRenewalFiscalContext(gregorianDate: Date): {
  ethYear: number;
  fiscalYearEnd: Date;
  fiscalYearEndFormatted: string;
  fiscalYearEndFormattedAm: string;
} {
  const eth = dateToEthiopian(gregorianDate);
  const { end } = getFiscalYearBounds(eth.year);
  return {
    ethYear: eth.year,
    fiscalYearEnd: end,
    fiscalYearEndFormatted: formatEthiopianDate({ year: eth.year, month: 13, day: end.getDate() === 11 ? 6 : 5 }, 'en'),
    fiscalYearEndFormattedAm: formatEthiopianDate({ year: eth.year, month: 13, day: end.getDate() === 11 ? 6 : 5 }, 'am'),
  };
}
