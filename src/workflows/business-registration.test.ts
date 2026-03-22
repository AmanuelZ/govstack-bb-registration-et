import { describe, it, expect } from 'vitest';
import {
  businessRegistrationDeterminants,
  validateShareholderCount,
  validateSharePercentages,
} from './business-registration.js';
import { WorkflowEngine } from './engine.js';

describe('businessRegistrationDeterminants', () => {
  it('exports a non-empty determinants array', () => {
    expect(businessRegistrationDeterminants.length).toBeGreaterThan(0);
  });

  it('enforces PLC minimum capital of 15000 ETB', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 10000,
      shareholders_count: 2,
    });
    expect(result.valid).toBe(false);
    const violation = result.violations.find((v) => v.determinantId === 'plc-min-capital');
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('15,000');
  });

  it('passes PLC with sufficient capital', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 20000,
      shareholders_count: 2,
    });
    const capitalViolation = result.violations.find((v) => v.determinantId === 'plc-min-capital');
    expect(capitalViolation).toBeUndefined();
  });

  it('enforces PLC minimum 2 shareholders', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 20000,
      shareholders_count: 1,
    });
    expect(result.valid).toBe(false);
    const violation = result.violations.find((v) => v.determinantId === 'plc-min-shareholders');
    expect(violation).toBeDefined();
  });

  it('enforces SC minimum capital of 50000 ETB', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'SC',
      registered_capital: 30000,
      shareholders_count: 5,
    });
    expect(result.valid).toBe(false);
    const violation = result.violations.find((v) => v.determinantId === 'sc-min-capital');
    expect(violation).toBeDefined();
  });

  it('enforces SC minimum 5 shareholders', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'SC',
      registered_capital: 100000,
      shareholders_count: 3,
    });
    expect(result.valid).toBe(false);
    const violation = result.violations.find((v) => v.determinantId === 'sc-min-shareholders');
    expect(violation).toBeDefined();
  });

  it('requires PROSPECTUS document for Share Companies', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'SC',
      registered_capital: 100000,
      shareholders_count: 5,
    });
    expect(result.additionalDocuments).toContain('PROSPECTUS');
  });

  it('enforces OPPLC minimum capital of 15000 ETB', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'OPPLC',
      registered_capital: 5000,
    });
    expect(result.valid).toBe(false);
    const violation = result.violations.find((v) => v.determinantId === 'opplc-min-capital');
    expect(violation).toBeDefined();
  });

  it('requires foreign_investment_permit for companies with foreign shareholders', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      has_foreign_shareholders: true,
    });
    expect(result.additionalDocuments).toContain('INVESTMENT_PERMIT');
  });

  it('requires notarized foreign docs for companies with foreign shareholders', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      has_foreign_shareholders: true,
    });
    expect(result.additionalDocuments).toContain('NOTARIZED_FOREIGN_DOCS');
  });

  it('does not require foreign docs for domestic-only shareholders', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      has_foreign_shareholders: false,
    });
    expect(result.additionalDocuments).not.toContain('INVESTMENT_PERMIT');
    expect(result.additionalDocuments).not.toContain('NOTARIZED_FOREIGN_DOCS');
  });

  it('applies high-capital surcharge of 2000 ETB for capital > 1,000,000', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 1500000,
      shareholders_count: 2,
    });
    expect(result.additionalFees['high-capital-surcharge']).toBe(2000);
  });

  it('does not apply high-capital surcharge for capital <= 1,000,000', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      entity_type: 'PLC',
      registered_capital: 1000000,
      shareholders_count: 2,
    });
    expect(result.additionalFees['high-capital-surcharge']).toBeUndefined();
  });

  it('requires NBE license for financial sector K64', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      business_sector: 'K64',
    });
    expect(result.additionalDocuments).toContain('NBE_LICENSE');
  });

  it('requires NBE license for financial sector K65', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      business_sector: 'K65',
    });
    expect(result.additionalDocuments).toContain('NBE_LICENSE');
  });

  it('requires MIB license for media sector J58', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      business_sector: 'J58',
    });
    expect(result.additionalDocuments).toContain('MIB_LICENSE');
  });

  it('requires AACBE clearance for Addis Ababa registration', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      registered_address: { region: 'Addis Ababa' },
    });
    expect(result.additionalDocuments).toContain('AACBE_CLEARANCE');
  });

  it('does not require AACBE clearance for non-Addis Ababa registration', () => {
    const result = WorkflowEngine.evaluate(businessRegistrationDeterminants, {
      registered_address: { region: 'Oromia' },
    });
    expect(result.additionalDocuments).not.toContain('AACBE_CLEARANCE');
  });
});

describe('validateShareholderCount', () => {
  it('accepts PLC with exactly 2 shareholders (minimum)', () => {
    const result = validateShareholderCount('PLC', 2);
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('accepts PLC with more than 2 shareholders', () => {
    const result = validateShareholderCount('PLC', 5);
    expect(result.valid).toBe(true);
  });

  it('rejects PLC with 1 shareholder', () => {
    const result = validateShareholderCount('PLC', 1);
    expect(result.valid).toBe(false);
    expect(result.message).toBeDefined();
    expect(result.message).toContain('PLC');
    expect(result.message).toContain('2');
  });

  it('accepts SC with exactly 5 shareholders', () => {
    const result = validateShareholderCount('SC', 5);
    expect(result.valid).toBe(true);
  });

  it('accepts SC with more than 5 shareholders', () => {
    const result = validateShareholderCount('SC', 10);
    expect(result.valid).toBe(true);
  });

  it('rejects SC with fewer than 5 shareholders', () => {
    const result = validateShareholderCount('SC', 3);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('SC');
  });

  it('rejects SC with 4 shareholders (boundary)', () => {
    const result = validateShareholderCount('SC', 4);
    expect(result.valid).toBe(false);
  });

  it('accepts OPPLC with exactly 1 shareholder', () => {
    const result = validateShareholderCount('OPPLC', 1);
    expect(result.valid).toBe(true);
  });

  it('rejects OPPLC with more than 1 shareholder', () => {
    const result = validateShareholderCount('OPPLC', 2);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('OPPLC');
    expect(result.message).toContain('1');
  });

  it('accepts GP with 2 partners', () => {
    const result = validateShareholderCount('GP', 2);
    expect(result.valid).toBe(true);
  });

  it('rejects GP with 1 partner', () => {
    const result = validateShareholderCount('GP', 1);
    expect(result.valid).toBe(false);
  });

  it('accepts LP with 2 partners', () => {
    const result = validateShareholderCount('LP', 2);
    expect(result.valid).toBe(true);
  });

  it('accepts LLP with 3 partners', () => {
    const result = validateShareholderCount('LLP', 3);
    expect(result.valid).toBe(true);
  });

  it('accepts unknown entity types with any shareholder count', () => {
    const result = validateShareholderCount('PARTNERSHIP', 2);
    expect(result.valid).toBe(true);
  });
});

describe('validateSharePercentages', () => {
  it('accepts shareholders summing to exactly 100%', () => {
    const shareholders = [{ share_percentage: 60 }, { share_percentage: 40 }];
    const result = validateSharePercentages(shareholders);
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('rejects shareholders summing to less than 100%', () => {
    const shareholders = [{ share_percentage: 60 }, { share_percentage: 30 }]; // 90%
    const result = validateSharePercentages(shareholders);
    expect(result.valid).toBe(false);
    expect(result.message).toBeDefined();
    expect(result.message).toContain('100%');
  });

  it('rejects shareholders summing to more than 100%', () => {
    const shareholders = [{ share_percentage: 60 }, { share_percentage: 50 }]; // 110%
    const result = validateSharePercentages(shareholders);
    expect(result.valid).toBe(false);
  });

  it('accepts floating-point percentages within 0.01% tolerance', () => {
    const shareholders = [
      { share_percentage: 33.33 },
      { share_percentage: 33.33 },
      { share_percentage: 33.34 },
    ]; // 100.00%
    const result = validateSharePercentages(shareholders);
    expect(result.valid).toBe(true);
  });

  it('accepts single 100% shareholder', () => {
    const shareholders = [{ share_percentage: 100 }];
    const result = validateSharePercentages(shareholders);
    expect(result.valid).toBe(true);
  });

  it('rejects empty shareholders array (0% total)', () => {
    const result = validateSharePercentages([]);
    expect(result.valid).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('accepts equal three-way split', () => {
    const shareholders = [
      { share_percentage: 50 },
      { share_percentage: 25 },
      { share_percentage: 25 },
    ];
    const result = validateSharePercentages(shareholders);
    expect(result.valid).toBe(true);
  });

  it('error message includes current total percentage', () => {
    const shareholders = [{ share_percentage: 70 }, { share_percentage: 20 }]; // 90%
    const result = validateSharePercentages(shareholders);
    expect(result.message).toContain('90.00%');
  });
});
