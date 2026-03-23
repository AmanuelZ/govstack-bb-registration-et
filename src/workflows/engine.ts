import { randomUUID } from 'crypto';

// randomUUID is imported for potential use by callers/submodules; keep the import.
void randomUUID;

/**
 * Workflow determinant — a condition that evaluates form data and returns a modifier.
 * Used to: adjust required documents, change fee amounts, validate field constraints.
 */
export interface Determinant {
  id: string;
  name: string;
  /** JSONPath-like field to evaluate (e.g. "entity_type", "registered_capital") */
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: unknown;
  /** What this determinant produces when true */
  effect: DeterminantEffect;
}

export interface DeterminantEffect {
  type:
    | 'require_field'
    | 'set_minimum'
    | 'add_fee'
    | 'add_document'
    | 'reject_submission'
    | 'add_workflow_step';
  target: string;
  params?: Record<string, unknown>;
  message?: string; // Shown to applicant if effect blocks submission
}

export interface DeterminantViolation {
  determinantId: string;
  name: string;
  message: string;
}

export interface WorkflowStep {
  stepCode: string;
  stepOrder: number;
  assignedRole: string;
  slaHours: number;
  allowedActions: string[];
  isTerminal: boolean;
}

export interface EvaluationResult {
  valid: boolean;
  violations: DeterminantViolation[];
  additionalFees: Record<string, number>;
  additionalDocuments: string[];
}

/**
 * GovStack Registration BB Workflow Engine.
 * Evaluates determinants against submitted form data and drives state transitions.
 */
export class WorkflowEngine {
  /**
   * Evaluate all determinants for a service against submitted form data.
   * Returns validation result with any violations, additional fees, or extra document requirements.
   */
  static evaluate(
    determinants: Determinant[],
    formData: Record<string, unknown>,
  ): EvaluationResult {
    const violations: DeterminantViolation[] = [];
    const additionalFees: Record<string, number> = {};
    const additionalDocuments: string[] = [];

    for (const det of determinants) {
      if (!WorkflowEngine.matches(det, formData)) continue;

      switch (det.effect.type) {
        case 'reject_submission':
          violations.push({
            determinantId: det.id,
            name: det.name,
            message: det.effect.message ?? `Condition '${det.name}' prevents submission`,
          });
          break;

        case 'require_field': {
          const target = det.effect.target;
          const val = formData[target];
          if (val === undefined || val === null || val === '') {
            violations.push({
              determinantId: det.id,
              name: det.name,
              message: det.effect.message ?? `Field '${target}' is required when ${det.name}`,
            });
          }
          break;
        }

        case 'set_minimum': {
          const target = det.effect.target;
          const minimum = det.effect.params?.['minimum'];
          const val = formData[target];
          if (typeof val === 'number' && typeof minimum === 'number' && val < minimum) {
            violations.push({
              determinantId: det.id,
              name: det.name,
              message:
                det.effect.message ??
                `'${target}' must be at least ${String(minimum)} when ${det.name}`,
            });
          }
          break;
        }

        case 'add_fee': {
          const amount = det.effect.params?.['amount'];
          if (typeof amount === 'number') {
            additionalFees[det.effect.target] = (additionalFees[det.effect.target] ?? 0) + amount;
          }
          break;
        }

        case 'add_document':
          if (!additionalDocuments.includes(det.effect.target)) {
            additionalDocuments.push(det.effect.target);
          }
          break;
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      additionalFees,
      additionalDocuments,
    };
  }

  private static matches(det: Determinant, formData: Record<string, unknown>): boolean {
    const fieldValue = WorkflowEngine.resolveField(det.field, formData);

    switch (det.operator) {
      case 'eq':
        return fieldValue === det.value;
      case 'neq':
        return fieldValue !== det.value;
      case 'gt':
        return (
          typeof fieldValue === 'number' && typeof det.value === 'number' && fieldValue > det.value
        );
      case 'gte':
        return (
          typeof fieldValue === 'number' && typeof det.value === 'number' && fieldValue >= det.value
        );
      case 'lt':
        return (
          typeof fieldValue === 'number' && typeof det.value === 'number' && fieldValue < det.value
        );
      case 'lte':
        return (
          typeof fieldValue === 'number' && typeof det.value === 'number' && fieldValue <= det.value
        );
      case 'in':
        return Array.isArray(det.value) && det.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(det.value) && !det.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private static resolveField(fieldPath: string, formData: Record<string, unknown>): unknown {
    // Support dot-notation: "address.region"
    return fieldPath.split('.').reduce<unknown>((obj, key) => {
      if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, formData);
  }

  /**
   * Calculate late penalty for trade license renewals.
   * Ethiopian fiscal year ends on Pagume 5/6 (September 11/12 Gregorian).
   * Grace period: 30 days after fiscal year end.
   * Late fee: first month ETB 2500, each subsequent month ETB 1500.
   */
  static calculateLatePenalty(fiscalYearEndDate: Date, renewalDate: Date): number {
    const gracePeriodEnd = new Date(fiscalYearEndDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

    if (renewalDate <= gracePeriodEnd) return 0;

    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    const lateMonths = Math.ceil((renewalDate.getTime() - gracePeriodEnd.getTime()) / msPerMonth);

    if (lateMonths <= 0) return 0;
    if (lateMonths === 1) return 2500;
    return 2500 + (lateMonths - 1) * 1500;
  }

  /**
   * Calculate Ethiopian fiscal year end date for a given Gregorian year.
   * Ethiopian fiscal year runs Meskerem 1 – Pagume 5/6 (Sept 11 – Sept 10 Gregorian approx).
   * Returns the fiscal year end date in Gregorian calendar.
   */
  static ethiopianFiscalYearEnd(gregorianYear: number): Date {
    // Pagume 5 is approximately September 10 in non-leap years, September 11 in leap years
    const isLeap =
      (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || gregorianYear % 400 === 0;
    return new Date(gregorianYear, 8, isLeap ? 11 : 10); // Month 8 = September (0-indexed)
  }

  /**
   * Determine ESIA review fee based on environmental impact category.
   * Per Ethiopian Proclamation 1317/2025:
   * - Category A (high impact, e.g., mining, large chemical): ETB 50,000
   * - Category B (medium impact, e.g., food processing, textiles): ETB 15,000
   * - Category C (low impact, e.g., handicrafts, small workshops): ETB 5,000
   */
  static esiaReviewFee(category: 'A' | 'B' | 'C'): number {
    const fees: Record<'A' | 'B' | 'C', number> = { A: 50000, B: 15000, C: 5000 };
    return fees[category];
  }
}
