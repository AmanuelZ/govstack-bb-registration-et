import { describe, it, expect } from 'vitest';
import {
  tradeLicenseRenewalDeterminants,
  calculateRenewalFee,
  shouldCancelLicense,
} from './trade-license-renewal.js';
import { WorkflowEngine } from './engine.js';

describe('tradeLicenseRenewalDeterminants', () => {
  it('exports a non-empty determinants array', () => {
    expect(tradeLicenseRenewalDeterminants.length).toBeGreaterThan(0);
  });

  it('triggers updated lease requirement when business address changed', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      business_address_changed: true,
      new_address: '123 Main St',
    });
    expect(result.additionalDocuments).toContain('UPDATED_LEASE');
  });

  it('does not trigger lease requirement when address unchanged', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      business_address_changed: false,
    });
    expect(result.additionalDocuments).not.toContain('UPDATED_LEASE');
  });

  it('requires new_address field when address changed and field missing', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      business_address_changed: true,
      // new_address intentionally omitted
    });
    const hasViolation = result.violations.some((v) => v.determinantId === 'address-change-requires-field');
    expect(hasViolation).toBe(true);
  });

  it('does not violate new_address requirement when address is provided', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      business_address_changed: true,
      new_address: 'Bole Road, Addis Ababa',
    });
    const hasViolation = result.violations.some((v) => v.determinantId === 'address-change-requires-field');
    expect(hasViolation).toBe(false);
  });

  it('triggers labor clearance for large employer (>50 employees)', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      employee_count: 51,
    });
    expect(result.additionalDocuments).toContain('LABOR_CLEARANCE');
  });

  it('triggers labor clearance at exactly 51 employees', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      employee_count: 51,
    });
    expect(result.additionalDocuments).toContain('LABOR_CLEARANCE');
  });

  it('does not trigger labor clearance for 50 employees (boundary)', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      employee_count: 50,
    });
    expect(result.additionalDocuments).not.toContain('LABOR_CLEARANCE');
  });

  it('does not trigger labor clearance for small employer', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      employee_count: 10,
    });
    expect(result.additionalDocuments).not.toContain('LABOR_CLEARANCE');
  });

  it('adds Grade 1 renewal fee for revenue > 5,000,000', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      annual_revenue: 6000000,
    });
    expect(result.additionalFees['grade1-renewal-fee']).toBe(5000);
  });

  it('adds Grade 2 renewal fee for revenue <= 5,000,000', () => {
    const result = WorkflowEngine.evaluate(tradeLicenseRenewalDeterminants, {
      annual_revenue: 2000000,
    });
    expect(result.additionalFees['grade2-renewal-fee']).toBe(2000);
  });
});

describe('calculateRenewalFee', () => {
  const fiscalYearEnd = new Date('2024-09-10');

  it('returns Grade 3 base fee (500) for revenue <= 500K', () => {
    const result = calculateRenewalFee(50000, new Date('2024-08-01'), fiscalYearEnd);
    expect(result.baseFee).toBe(500);
  });

  it('returns Grade 2 base fee (2000) for revenue between 500K and 5M', () => {
    const result = calculateRenewalFee(1000000, new Date('2024-08-01'), fiscalYearEnd);
    expect(result.baseFee).toBe(2000);
  });

  it('returns Grade 1 base fee (5000) for revenue > 5M', () => {
    const result = calculateRenewalFee(6000000, new Date('2024-08-01'), fiscalYearEnd);
    expect(result.baseFee).toBe(5000);
  });

  it('has zero late penalty and isLate=false when renewing before fiscal year end', () => {
    const result = calculateRenewalFee(50000, new Date('2024-07-01'), fiscalYearEnd);
    expect(result.latePenalty).toBe(0);
    expect(result.isLate).toBe(false);
    expect(result.monthsLate).toBe(0);
  });

  it('has zero late penalty within 30-day grace period', () => {
    // Grace period: fiscalYearEnd + 30 days = 2024-10-10
    const result = calculateRenewalFee(50000, new Date('2024-10-05'), fiscalYearEnd);
    expect(result.latePenalty).toBe(0);
    expect(result.isLate).toBe(false);
  });

  it('adds late penalty when renewing after grace period', () => {
    // Grace period ends 2024-10-10; renewal 2024-11-05 = 1 month late
    const result = calculateRenewalFee(50000, new Date('2024-11-05'), fiscalYearEnd);
    expect(result.latePenalty).toBe(2500);
    expect(result.isLate).toBe(true);
    expect(result.monthsLate).toBe(1);
  });

  it('adds incremental late penalty for 2 months late', () => {
    // Grace period ends 2024-10-10; renewal 2024-11-20 = 41 days late = ceil(41/30) = 2 months
    const result = calculateRenewalFee(50000, new Date('2024-11-20'), fiscalYearEnd);
    expect(result.latePenalty).toBe(4000); // 2500 + 1500
    expect(result.monthsLate).toBe(2);
  });

  it('total is baseFee + latePenalty', () => {
    const result = calculateRenewalFee(50000, new Date('2024-11-05'), fiscalYearEnd);
    expect(result.total).toBe(result.baseFee + result.latePenalty);
  });

  it('Grade 3 on-time renewal total equals baseFee only', () => {
    const result = calculateRenewalFee(200000, new Date('2024-08-01'), fiscalYearEnd);
    expect(result.total).toBe(500);
    expect(result.latePenalty).toBe(0);
  });
});

describe('shouldCancelLicense', () => {
  const fiscalYearEnd = new Date('2024-09-10');

  it('returns false when renewing before fiscal year end', () => {
    const renewalDate = new Date('2024-08-01');
    expect(shouldCancelLicense(fiscalYearEnd, renewalDate)).toBe(false);
  });

  it('returns false when renewing within 6 months of fiscal year end', () => {
    // 5 months after fiscalYearEnd
    const renewalDate = new Date('2025-02-10');
    expect(shouldCancelLicense(fiscalYearEnd, renewalDate)).toBe(false);
  });

  it('returns true when renewing more than 6 months after fiscal year end', () => {
    // 7 months after fiscalYearEnd = April 10, 2025 → use April 15
    const renewalDate = new Date('2025-04-15');
    expect(shouldCancelLicense(fiscalYearEnd, renewalDate)).toBe(true);
  });

  it('cancellation threshold is exactly 6 months after fiscal year end', () => {
    // 6 months after 2024-09-10 = 2025-03-10; anything > that triggers cancellation
    const onThreshold = new Date('2025-03-10');
    const afterThreshold = new Date('2025-03-11');
    expect(shouldCancelLicense(fiscalYearEnd, onThreshold)).toBe(false);
    expect(shouldCancelLicense(fiscalYearEnd, afterThreshold)).toBe(true);
  });
});
