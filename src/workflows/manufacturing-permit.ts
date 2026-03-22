import type { Determinant } from './engine.js';
import { WorkflowEngine } from './engine.js';

/**
 * Determinants for Ethiopian Manufacturing Investment Permit.
 * References:
 * - Environmental Pollution Control Proclamation 1317/2025 (environmental categories)
 * - Ethiopian Investment Proclamation 1180/2020
 * - Industrial Parks Proclamation 1038/2017
 */
export const manufacturingPermitDeterminants: Determinant[] = [
  // ── Environmental Category Requirements ───────────────────────────────────
  {
    id: 'esia-cat-a-full-assessment',
    name: 'Category A requires full Environmental and Social Impact Assessment',
    field: 'environmental_impact_category',
    operator: 'eq',
    value: 'A',
    effect: {
      type: 'add_document',
      target: 'FULL_ESIA_REPORT',
      message: 'Category A projects require a comprehensive Environmental and Social Impact Assessment (ESIA) certified by the Ethiopian Environmental Authority',
    },
  },
  {
    id: 'esia-cat-a-public-consultation',
    name: 'Category A requires public consultation record',
    field: 'environmental_impact_category',
    operator: 'eq',
    value: 'A',
    effect: {
      type: 'add_document',
      target: 'PUBLIC_CONSULTATION_RECORD',
      message: 'Category A projects must provide a public consultation record from affected communities',
    },
  },
  {
    id: 'esia-cat-b-limited-assessment',
    name: 'Category B requires limited environmental assessment',
    field: 'environmental_impact_category',
    operator: 'eq',
    value: 'B',
    effect: {
      type: 'add_document',
      target: 'LIMITED_ESIA_REPORT',
      message: 'Category B projects require a Limited Environmental Assessment',
    },
  },
  // Category C only requires standard documents (fire safety, layout plan)

  // ── High-Capacity Production ───────────────────────────────────────────────
  {
    id: 'high-capacity-water-permit',
    name: 'Large water consumers require water use permit',
    field: 'uses_significant_water',
    operator: 'eq',
    value: true,
    effect: {
      type: 'add_document',
      target: 'WATER_USE_PERMIT',
      message: 'Manufacturing operations with significant water consumption require a permit from the Ministry of Water and Energy',
    },
  },

  // ── Chemical/Hazardous Materials ───────────────────────────────────────────
  {
    id: 'hazmat-safety-plan',
    name: 'Hazardous materials require chemical safety plan',
    field: 'uses_hazardous_materials',
    operator: 'eq',
    value: true,
    effect: {
      type: 'add_document',
      target: 'CHEMICAL_SAFETY_PLAN',
      message: 'Operations using hazardous chemical materials require an approved Chemical Safety Plan',
    },
  },

  // ── Food Manufacturing ─────────────────────────────────────────────────────
  {
    id: 'food-manufacturing-fda',
    name: 'Food manufacturing requires EFDA product registration',
    field: 'manufacturing_sector',
    operator: 'in',
    value: ['C10', 'C11'],
    effect: {
      type: 'add_document',
      target: 'EFDA_PRODUCT_REGISTRATION',
      message: 'Food and beverage manufacturers must provide Ethiopian Food and Drug Authority (EFDA) product registration',
    },
  },

  // ── Pharmaceutical Manufacturing ───────────────────────────────────────────
  {
    id: 'pharma-efda-license',
    name: 'Pharmaceutical manufacturing requires EFDA manufacturing license',
    field: 'manufacturing_sector',
    operator: 'eq',
    value: 'C21',
    effect: {
      type: 'add_document',
      target: 'EFDA_MANUFACTURING_LICENSE',
      message: 'Pharmaceutical manufacturers require an EFDA Manufacturing License in addition to this permit',
    },
  },

  // ── Employment Requirements ────────────────────────────────────────────────
  {
    id: 'large-employer-eic-registration',
    name: 'Manufacturers employing >100 workers require EIC registration',
    field: 'employment_plan.permanent',
    operator: 'gte',
    value: 100,
    effect: {
      type: 'add_document',
      target: 'EIC_REGISTRATION',
      message: 'Manufacturing operations employing 100+ permanent workers must be registered with the Ethiopian Investment Commission (EIC)',
    },
  },
];

/**
 * Calculate manufacturing permit total fee.
 * Base fees: application (1,000) + inspection (3,000) + ESIA review (varies by category)
 */
export function calculateManufacturingPermitFee(
  environmentalCategory: 'A' | 'B' | 'C',
): {
  applicationFee: number;
  inspectionFee: number;
  esiaReviewFee: number;
  total: number;
} {
  const applicationFee = 1000;
  const inspectionFee = 3000;
  const esiaReviewFee = WorkflowEngine.esiaReviewFee(environmentalCategory);

  return {
    applicationFee,
    inspectionFee,
    esiaReviewFee,
    total: applicationFee + inspectionFee + esiaReviewFee,
  };
}
