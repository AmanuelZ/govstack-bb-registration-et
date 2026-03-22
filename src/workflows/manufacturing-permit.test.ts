import { describe, it, expect } from 'vitest';
import {
  manufacturingPermitDeterminants,
  calculateManufacturingPermitFee,
} from './manufacturing-permit.js';
import { WorkflowEngine } from './engine.js';

describe('manufacturingPermitDeterminants', () => {
  it('exports a non-empty determinants array', () => {
    expect(manufacturingPermitDeterminants.length).toBeGreaterThan(0);
  });

  it('requires full ESIA report for Category A', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      environmental_impact_category: 'A',
    });
    expect(result.additionalDocuments).toContain('FULL_ESIA_REPORT');
  });

  it('requires public consultation record for Category A', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      environmental_impact_category: 'A',
    });
    expect(result.additionalDocuments).toContain('PUBLIC_CONSULTATION_RECORD');
  });

  it('requires limited ESIA report for Category B', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      environmental_impact_category: 'B',
    });
    expect(result.additionalDocuments).toContain('LIMITED_ESIA_REPORT');
  });

  it('does not require ESIA documents for Category C', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      environmental_impact_category: 'C',
    });
    expect(result.additionalDocuments).not.toContain('FULL_ESIA_REPORT');
    expect(result.additionalDocuments).not.toContain('LIMITED_ESIA_REPORT');
    expect(result.additionalDocuments).not.toContain('PUBLIC_CONSULTATION_RECORD');
  });

  it('does not require Category A documents for Category B', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      environmental_impact_category: 'B',
    });
    expect(result.additionalDocuments).not.toContain('FULL_ESIA_REPORT');
    expect(result.additionalDocuments).not.toContain('PUBLIC_CONSULTATION_RECORD');
  });

  it('requires water use permit for significant water consumers', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      uses_significant_water: true,
    });
    expect(result.additionalDocuments).toContain('WATER_USE_PERMIT');
  });

  it('does not require water use permit when water not significantly used', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      uses_significant_water: false,
    });
    expect(result.additionalDocuments).not.toContain('WATER_USE_PERMIT');
  });

  it('requires chemical safety plan for hazardous materials', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      uses_hazardous_materials: true,
    });
    expect(result.additionalDocuments).toContain('CHEMICAL_SAFETY_PLAN');
  });

  it('does not require chemical safety plan without hazardous materials', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      uses_hazardous_materials: false,
    });
    expect(result.additionalDocuments).not.toContain('CHEMICAL_SAFETY_PLAN');
  });

  it('requires EFDA product registration for food manufacturing (C10)', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      manufacturing_sector: 'C10',
    });
    expect(result.additionalDocuments).toContain('EFDA_PRODUCT_REGISTRATION');
  });

  it('requires EFDA product registration for beverage manufacturing (C11)', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      manufacturing_sector: 'C11',
    });
    expect(result.additionalDocuments).toContain('EFDA_PRODUCT_REGISTRATION');
  });

  it('requires EFDA manufacturing license for pharmaceutical sector (C21)', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      manufacturing_sector: 'C21',
    });
    expect(result.additionalDocuments).toContain('EFDA_MANUFACTURING_LICENSE');
  });

  it('does not require EFDA documents for general manufacturing sector', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      manufacturing_sector: 'C20',
    });
    expect(result.additionalDocuments).not.toContain('EFDA_PRODUCT_REGISTRATION');
    expect(result.additionalDocuments).not.toContain('EFDA_MANUFACTURING_LICENSE');
  });

  it('requires EIC registration for >= 100 permanent employees', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      employment_plan: { permanent: 100 },
    });
    expect(result.additionalDocuments).toContain('EIC_REGISTRATION');
  });

  it('requires EIC registration for > 100 permanent employees', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      employment_plan: { permanent: 200 },
    });
    expect(result.additionalDocuments).toContain('EIC_REGISTRATION');
  });

  it('does not require EIC registration for < 100 permanent employees', () => {
    const result = WorkflowEngine.evaluate(manufacturingPermitDeterminants, {
      employment_plan: { permanent: 50 },
    });
    expect(result.additionalDocuments).not.toContain('EIC_REGISTRATION');
  });
});

describe('calculateManufacturingPermitFee', () => {
  it('always includes application fee of 1000 ETB', () => {
    expect(calculateManufacturingPermitFee('A').applicationFee).toBe(1000);
    expect(calculateManufacturingPermitFee('B').applicationFee).toBe(1000);
    expect(calculateManufacturingPermitFee('C').applicationFee).toBe(1000);
  });

  it('always includes inspection fee of 3000 ETB', () => {
    expect(calculateManufacturingPermitFee('A').inspectionFee).toBe(3000);
    expect(calculateManufacturingPermitFee('B').inspectionFee).toBe(3000);
    expect(calculateManufacturingPermitFee('C').inspectionFee).toBe(3000);
  });

  it('Category A has ESIA review fee of 50000 ETB', () => {
    expect(calculateManufacturingPermitFee('A').esiaReviewFee).toBe(50000);
  });

  it('Category B has ESIA review fee of 15000 ETB', () => {
    expect(calculateManufacturingPermitFee('B').esiaReviewFee).toBe(15000);
  });

  it('Category C has ESIA review fee of 5000 ETB', () => {
    expect(calculateManufacturingPermitFee('C').esiaReviewFee).toBe(5000);
  });

  it('Category A total is 54000 ETB', () => {
    expect(calculateManufacturingPermitFee('A').total).toBe(54000);
  });

  it('Category B total is 19000 ETB', () => {
    expect(calculateManufacturingPermitFee('B').total).toBe(19000);
  });

  it('Category C total is 9000 ETB', () => {
    expect(calculateManufacturingPermitFee('C').total).toBe(9000);
  });

  it('returns higher fee for Category A than B than C', () => {
    const feeA = calculateManufacturingPermitFee('A').total;
    const feeB = calculateManufacturingPermitFee('B').total;
    const feeC = calculateManufacturingPermitFee('C').total;
    expect(feeA).toBeGreaterThan(feeB);
    expect(feeB).toBeGreaterThan(feeC);
  });

  it('total equals sum of component fees', () => {
    for (const category of ['A', 'B', 'C'] as const) {
      const result = calculateManufacturingPermitFee(category);
      expect(result.total).toBe(result.applicationFee + result.inspectionFee + result.esiaReviewFee);
    }
  });

  it('returns positive numbers for all categories', () => {
    expect(calculateManufacturingPermitFee('A').total).toBeGreaterThan(0);
    expect(calculateManufacturingPermitFee('B').total).toBeGreaterThan(0);
    expect(calculateManufacturingPermitFee('C').total).toBeGreaterThan(0);
  });

  it('minimum total (Category C) is at least 4000 ETB base fees', () => {
    const result = calculateManufacturingPermitFee('C');
    // 1000 (application) + 3000 (inspection) = 4000 minimum
    expect(result.total).toBeGreaterThanOrEqual(4000);
  });
});
