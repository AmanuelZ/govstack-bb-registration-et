import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from './engine.js';
import { businessRegistrationDeterminants, validateShareholderCount, validateSharePercentages } from './business-registration.js';
import { calculateRenewalFee, shouldCancelLicense } from './trade-license-renewal.js';
import { calculateManufacturingPermitFee } from './manufacturing-permit.js';

describe('WorkflowEngine.evaluate', () => {
  it('passes validation for valid PLC with sufficient capital', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 50000,
      shareholders_count: 2,
    });
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('rejects PLC with capital below minimum', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 10000,
      shareholders_count: 2,
    });
    expect(result.valid).toBe(false);
    expect(result.violations[0]?.determinantId).toBe('plc-min-capital');
  });

  it('adds high-capital surcharge fee when capital > 1M', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 2000000,
      shareholders_count: 2,
    });
    expect(result.additionalFees['high-capital-surcharge']).toBe(2000);
  });

  it('requires PROSPECTUS document for Share Companies', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'SC',
      registered_capital: 100000,
      shareholders_count: 5,
    });
    expect(result.additionalDocuments).toContain('PROSPECTUS');
  });

  it('requires NBE license for financial sector businesses', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 50000,
      business_sector: 'K64',
    });
    expect(result.additionalDocuments).toContain('NBE_LICENSE');
  });

  it('resolves dot-notation field paths', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 50000,
      registered_address: { region: 'Addis Ababa' },
    });
    expect(result.additionalDocuments).toContain('AACBE_CLEARANCE');
  });
});

describe('validateShareholderCount', () => {
  it('rejects PLC with 1 shareholder', () => {
    const r = validateShareholderCount('PLC', 1);
    expect(r.valid).toBe(false);
  });

  it('accepts PLC with 2 shareholders', () => {
    const r = validateShareholderCount('PLC', 2);
    expect(r.valid).toBe(true);
  });

  it('rejects OPPLC with 2 shareholders', () => {
    const r = validateShareholderCount('OPPLC', 2);
    expect(r.valid).toBe(false);
  });

  it('rejects SC with less than 5 shareholders', () => {
    const r = validateShareholderCount('SC', 4);
    expect(r.valid).toBe(false);
  });
});

describe('validateSharePercentages', () => {
  it('accepts shareholders summing to 100%', () => {
    const r = validateSharePercentages([
      { share_percentage: 60 },
      { share_percentage: 40 },
    ]);
    expect(r.valid).toBe(true);
  });

  it('rejects shareholders summing to less than 100%', () => {
    const r = validateSharePercentages([
      { share_percentage: 60 },
      { share_percentage: 30 },
    ]);
    expect(r.valid).toBe(false);
  });
});

describe('calculateRenewalFee', () => {
  const fiscalYearEnd = new Date('2025-09-10'); // Ethiopian FY end

  it('returns no late penalty for on-time renewal', () => {
    const renewalDate = new Date('2025-09-20'); // within 30-day grace
    const result = calculateRenewalFee(6000000, renewalDate, fiscalYearEnd);
    expect(result.latePenalty).toBe(0);
    expect(result.isLate).toBe(false);
  });

  it('applies late penalty for renewal 1 month after grace period', () => {
    // gracePeriodEnd = 2025-10-10; renewalDate = 2025-11-05 = 26 days late = ceil(26/30) = 1 month
    const renewalDate = new Date('2025-11-05');
    const result = calculateRenewalFee(6000000, renewalDate, fiscalYearEnd);
    expect(result.latePenalty).toBe(2500);
    expect(result.isLate).toBe(true);
  });

  it('applies Grade 1 base fee for revenue > 5M', () => {
    const renewalDate = new Date('2025-09-20');
    const result = calculateRenewalFee(10000000, renewalDate, fiscalYearEnd);
    expect(result.baseFee).toBe(5000);
  });

  it('applies Grade 3 base fee for revenue <= 500K', () => {
    const renewalDate = new Date('2025-09-20');
    const result = calculateRenewalFee(200000, renewalDate, fiscalYearEnd);
    expect(result.baseFee).toBe(500);
  });
});

describe('shouldCancelLicense', () => {
  it('cancels license when more than 6 months overdue', () => {
    const fiscalYearEnd = new Date('2025-09-10');
    const renewalDate = new Date('2026-04-01'); // > 6 months after FY end
    expect(shouldCancelLicense(fiscalYearEnd, renewalDate)).toBe(true);
  });

  it('does not cancel within 6 months', () => {
    const fiscalYearEnd = new Date('2025-09-10');
    const renewalDate = new Date('2025-12-01');
    expect(shouldCancelLicense(fiscalYearEnd, renewalDate)).toBe(false);
  });
});

describe('calculateManufacturingPermitFee', () => {
  it('Category A has highest ESIA fee', () => {
    const r = calculateManufacturingPermitFee('A');
    expect(r.esiaReviewFee).toBe(50000);
    expect(r.total).toBe(54000); // 1000 + 3000 + 50000
  });

  it('Category C has lowest total fee', () => {
    const r = calculateManufacturingPermitFee('C');
    expect(r.total).toBe(9000); // 1000 + 3000 + 5000
  });
});
