import type { Determinant } from './engine.js';

/**
 * Regulatory configuration for business registration.
 * These parameters are sourced from Service.metadata at runtime,
 * allowing administrators to update thresholds (e.g., minimum capital)
 * without code changes when legislation is amended.
 */
export interface RegulatoryConfig {
  capitalRequirements: Record<string, number>; // entity_type → minimum ETB
  shareholderLimits: Record<string, { min: number; max?: number }>;
  highCapitalThreshold: number; // capital above this incurs surcharge
  highCapitalSurcharge: number; // surcharge amount in ETB
}

/**
 * Default regulatory parameters per Commercial Code of Ethiopia (Proclamation 1243/2021).
 * Used as fallback when Service.metadata does not specify overrides.
 */
export const DEFAULT_REGULATORY_CONFIG: RegulatoryConfig = {
  capitalRequirements: {
    PLC: 15000,
    SC: 50000,
    OPPLC: 15000,
  },
  shareholderLimits: {
    PLC: { min: 2 },
    SC: { min: 5 },
    OPPLC: { min: 1, max: 1 },
    GP: { min: 2 },
    LP: { min: 2 },
    LLP: { min: 2 },
  },
  highCapitalThreshold: 1000000,
  highCapitalSurcharge: 2000,
};

/**
 * Build determinants for business registration from regulatory configuration.
 * This factory allows the same engine to enforce different thresholds
 * when legislation changes — just update Service.metadata.
 */
export function buildBusinessRegistrationDeterminants(
  config: RegulatoryConfig = DEFAULT_REGULATORY_CONFIG,
): Determinant[] {
  const determinants: Determinant[] = [];

  // ── Capital & Shareholder Rules (generated from config) ──────────────────
  for (const [entityType, minCapital] of Object.entries(config.capitalRequirements)) {
    determinants.push({
      id: `${entityType.toLowerCase()}-min-capital`,
      name: `${entityType} minimum registered capital (ETB ${minCapital.toLocaleString()})`,
      field: 'entity_type',
      operator: 'eq',
      value: entityType,
      effect: {
        type: 'set_minimum',
        target: 'registered_capital',
        params: { minimum: minCapital },
        message: `${entityType} requires minimum registered capital of ETB ${minCapital.toLocaleString()}`,
      },
    });
  }

  for (const [entityType, limits] of Object.entries(config.shareholderLimits)) {
    if (limits.min > 0 && config.capitalRequirements[entityType] !== undefined) {
      determinants.push({
        id: `${entityType.toLowerCase()}-min-shareholders`,
        name: `${entityType} minimum ${String(limits.min)} shareholders`,
        field: 'entity_type',
        operator: 'eq',
        value: entityType,
        effect: {
          type: 'set_minimum',
          target: 'shareholders_count',
          params: { minimum: limits.min },
          message: `${entityType} requires minimum ${String(limits.min)} shareholder(s)`,
        },
      });
    }
  }

  // ── SC Prospectus (always required, independent of config) ───────────────
  determinants.push({
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
  });

  // ── High-Capital Surcharge ───────────────────────────────────────────────
  determinants.push({
    id: 'high-capital-surcharge',
    name: `High-capital registration surcharge (> ETB ${config.highCapitalThreshold.toLocaleString()})`,
    field: 'registered_capital',
    operator: 'gt',
    value: config.highCapitalThreshold,
    effect: {
      type: 'add_fee',
      target: 'high-capital-surcharge',
      params: { amount: config.highCapitalSurcharge },
      message: `Registrations with capital exceeding ETB ${config.highCapitalThreshold.toLocaleString()} incur an additional processing fee of ETB ${config.highCapitalSurcharge.toLocaleString()}`,
    },
  });

  // ── Static Rules (not configurable — these are regulatory, not threshold-based) ──

  // Foreign Participation
  determinants.push(
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
  );

  // Restricted Sectors
  determinants.push(
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
  );

  // Address Validation
  determinants.push({
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
  });

  return determinants;
}

/** Default determinants using current Commercial Code values. */
export const businessRegistrationDeterminants: Determinant[] =
  buildBusinessRegistrationDeterminants();

/**
 * Validate shareholder count against entity type requirements.
 * Called separately because shareholders is an array, not a simple field.
 * Accepts optional config override from Service.metadata; falls back to defaults.
 */
export function validateShareholderCount(
  entityType: string,
  shareholderCount: number,
  config: RegulatoryConfig = DEFAULT_REGULATORY_CONFIG,
): { valid: boolean; message?: string } {
  const limits = config.shareholderLimits[entityType];
  if (!limits) return { valid: true };

  if (shareholderCount < limits.min) {
    return {
      valid: false,
      message: `${entityType} requires minimum ${String(limits.min)} shareholder(s). Provided: ${String(shareholderCount)}`,
    };
  }
  if (limits.max !== undefined && shareholderCount > limits.max) {
    return {
      valid: false,
      message: `${entityType} allows maximum ${String(limits.max)} shareholder(s). Provided: ${String(shareholderCount)}`,
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
