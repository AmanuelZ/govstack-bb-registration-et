import type { Determinant } from './engine.js';

/**
 * Determinants for Ethiopian Business Registration (PLC/SC/OPPLC/GP/LP/LLP).
 * These rules implement the Ministry of Trade and Industry's requirements.
 *
 * Key rules per Commercial Code of Ethiopia (Proclamation 1243/2021):
 * - PLC: minimum 2 shareholders, minimum capital ETB 15,000
 * - SC (Share Company): minimum 5 shareholders, minimum capital ETB 50,000
 * - OPPLC (One-Person PLC): exactly 1 shareholder, minimum capital ETB 15,000
 * - GP/LP/LLP: minimum 2 partners, no minimum capital
 */
export const businessRegistrationDeterminants: Determinant[] = [
  // ── PLC Rules ────────────────────────────────────────────────────────────
  {
    id: 'plc-min-capital',
    name: 'PLC minimum registered capital (ETB 15,000)',
    field: 'entity_type',
    operator: 'eq',
    value: 'PLC',
    effect: {
      type: 'set_minimum',
      target: 'registered_capital',
      params: { minimum: 15000 },
      message: 'PLC requires minimum registered capital of ETB 15,000 (Commercial Code Art. 510)',
    },
  },
  {
    id: 'plc-min-shareholders',
    name: 'PLC minimum 2 shareholders',
    field: 'entity_type',
    operator: 'eq',
    value: 'PLC',
    effect: {
      type: 'set_minimum',
      target: 'shareholders_count',
      params: { minimum: 2 },
      message: 'PLC requires minimum 2 shareholders (Commercial Code Art. 510)',
    },
  },

  // ── SC (Share Company) Rules ─────────────────────────────────────────────
  {
    id: 'sc-min-capital',
    name: 'Share Company minimum registered capital (ETB 50,000)',
    field: 'entity_type',
    operator: 'eq',
    value: 'SC',
    effect: {
      type: 'set_minimum',
      target: 'registered_capital',
      params: { minimum: 50000 },
      message:
        'Share Company requires minimum registered capital of ETB 50,000 (Commercial Code Art. 295)',
    },
  },
  {
    id: 'sc-min-shareholders',
    name: 'Share Company minimum 5 shareholders',
    field: 'entity_type',
    operator: 'eq',
    value: 'SC',
    effect: {
      type: 'set_minimum',
      target: 'shareholders_count',
      params: { minimum: 5 },
      message: 'Share Company requires minimum 5 shareholders (Commercial Code Art. 295)',
    },
  },
  {
    id: 'sc-prospectus',
    name: 'Share Company requires prospectus document',
    field: 'entity_type',
    operator: 'eq',
    value: 'SC',
    effect: {
      type: 'add_document',
      target: 'PROSPECTUS',
      message: 'Share Companies must provide a prospectus for share subscription',
    },
  },

  // ── OPPLC (One-Person PLC) Rules ─────────────────────────────────────────
  {
    id: 'opplc-min-capital',
    name: 'One-Person PLC minimum capital (ETB 15,000)',
    field: 'entity_type',
    operator: 'eq',
    value: 'OPPLC',
    effect: {
      type: 'set_minimum',
      target: 'registered_capital',
      params: { minimum: 15000 },
      message: 'One-Person PLC requires minimum registered capital of ETB 15,000',
    },
  },

  // ── High-Capital Surcharge (any entity type) ─────────────────────────────
  {
    id: 'high-capital-surcharge',
    name: 'High-capital registration surcharge (> ETB 1,000,000)',
    field: 'registered_capital',
    operator: 'gt',
    value: 1000000,
    effect: {
      type: 'add_fee',
      target: 'high-capital-surcharge',
      params: { amount: 2000 },
      message:
        'Registrations with capital exceeding ETB 1,000,000 incur an additional processing fee of ETB 2,000',
    },
  },

  // ── Foreign Participation ─────────────────────────────────────────────────
  {
    id: 'foreign-investor-investment-permit',
    name: 'Foreign shareholders require investment permit',
    field: 'has_foreign_shareholders',
    operator: 'eq',
    value: true,
    effect: {
      type: 'add_document',
      target: 'INVESTMENT_PERMIT',
      message:
        'Companies with foreign shareholders must provide an Ethiopian Investment Commission investment permit',
    },
  },
  {
    id: 'foreign-investor-notarization',
    name: 'Foreign shareholders require notarized documents',
    field: 'has_foreign_shareholders',
    operator: 'eq',
    value: true,
    effect: {
      type: 'add_document',
      target: 'NOTARIZED_FOREIGN_DOCS',
      message: 'Foreign national shareholder documents must be notarized and apostilled',
    },
  },

  // ── Restricted Sectors ────────────────────────────────────────────────────
  {
    id: 'financial-services-special-license',
    name: 'Financial services sector requires NBE license',
    field: 'business_sector',
    operator: 'in',
    value: ['K64', 'K65', 'K66'],
    effect: {
      type: 'add_document',
      target: 'NBE_LICENSE',
      message:
        'Financial services businesses require a license from the National Bank of Ethiopia (NBE)',
    },
  },
  {
    id: 'media-mib-license',
    name: 'Media sector requires Ministry of Information license',
    field: 'business_sector',
    operator: 'in',
    value: ['J58', 'J59', 'J60'],
    effect: {
      type: 'add_document',
      target: 'MIB_LICENSE',
      message:
        'Media businesses require a license from the Ministry of Information and Communication Technology',
    },
  },

  // ── Address Validation ────────────────────────────────────────────────────
  {
    id: 'addis-ababa-business-license',
    name: 'Addis Ababa businesses require city trade bureau clearance',
    field: 'registered_address.region',
    operator: 'eq',
    value: 'Addis Ababa',
    effect: {
      type: 'add_document',
      target: 'AACBE_CLEARANCE',
      message:
        'Businesses registering in Addis Ababa require clearance from the Addis Ababa City Business and Economy Bureau',
    },
  },
];

/**
 * Validate shareholder count against entity type requirements.
 * Called separately because shareholders is an array, not a simple field.
 */
export function validateShareholderCount(
  entityType: string,
  shareholderCount: number,
): { valid: boolean; message?: string } {
  const minimums: Record<string, number> = {
    PLC: 2,
    SC: 5,
    OPPLC: 1,
    GP: 2,
    LP: 2,
    LLP: 2,
  };
  const maximums: Record<string, number> = {
    OPPLC: 1,
  };

  const minimum = minimums[entityType];
  const maximum = maximums[entityType];

  if (minimum !== undefined && shareholderCount < minimum) {
    return {
      valid: false,
      message: `${entityType} requires minimum ${String(minimum)} shareholder(s). Provided: ${String(shareholderCount)}`,
    };
  }
  if (maximum !== undefined && shareholderCount > maximum) {
    return {
      valid: false,
      message: `${entityType} allows maximum ${String(maximum)} shareholder(s). Provided: ${String(shareholderCount)}`,
    };
  }
  return { valid: true };
}

/**
 * Validate total shareholder percentages sum to exactly 100%.
 */
export function validateSharePercentages(shareholders: Array<{ share_percentage: number }>): {
  valid: boolean;
  message?: string;
} {
  const total = shareholders.reduce((sum, s) => sum + (s.share_percentage ?? 0), 0);
  // Allow ±0.01% floating point tolerance
  if (Math.abs(total - 100) > 0.01) {
    return {
      valid: false,
      message: `Shareholder percentages must sum to 100%. Current total: ${total.toFixed(2)}%`,
    };
  }
  return { valid: true };
}
