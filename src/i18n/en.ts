/**
 * English translations for the Registration Building Block.
 * All user-facing strings should be referenced through the i18n module.
 */
export const en = {
  // ── General ─────────────────────────────────────────────────────────────
  app: {
    name: 'Registration Building Block',
    description: 'Ethiopian reference implementation of the GovStack Registration Building Block',
  },

  // ── Errors ──────────────────────────────────────────────────────────────
  errors: {
    notFound: "{{resource}} '{{id}}' not found",
    unauthorized: 'Authentication required',
    forbidden: 'You do not have permission to perform this action',
    badRequest: 'Invalid request',
    conflict: 'Resource conflict',
    unprocessable: 'Request could not be processed',
    internalError: 'An unexpected error occurred',
    tooManyRequests: 'Too many requests. Please try again later.',
    invalidWorkflowTransition: "Invalid workflow transition from '{{from}}' to '{{to}}'",
    invalidFormData: 'Form data validation failed',
    documentUploadFailed: 'Document upload failed',
    paymentRequired: 'Payment is required to proceed',
    faydaAuthFailed: 'Fayda authentication failed',
    imHeaderInvalid: "Invalid Information-Mediator-Client header: '{{header}}'",
  },

  // ── Application ─────────────────────────────────────────────────────────
  application: {
    submitted: 'Application submitted successfully',
    updated: 'Application updated successfully',
    withdrawn: 'Application withdrawn',
    cannotUpdate: "Cannot update application in status '{{status}}'",
    onlyOwnerCanUpdate: 'You can only update your own applications',
    noWorkflowSteps: 'Service has no workflow steps configured',
    requirementsNotMet: 'Application data does not meet service requirements',
  },

  // ── Workflow ────────────────────────────────────────────────────────────
  workflow: {
    taskAssigned: 'Task assigned to {{role}}',
    taskCompleted: 'Task completed',
    approvalRequired: 'Approval required from {{role}}',
    applicationApproved: 'Application approved',
    applicationRejected: 'Application rejected',
    sentBack: 'Application sent back for revision',
  },

  // ── Business Registration ──────────────────────────────────────────────
  businessRegistration: {
    insufficientCapital: 'Registered capital must be at least ETB {{minimum}} for {{entityType}}',
    invalidShareholderCount: 'A {{entityType}} requires at least {{minimum}} shareholders',
    sharePercentagesMustEqual100: 'Shareholder percentages must sum to exactly 100%',
    highCapitalSurcharge:
      'High-capital surcharge applies for registered capital above ETB 1,000,000',
  },

  // ── Trade License ──────────────────────────────────────────────────────
  tradeLicense: {
    renewalFee: 'Trade license renewal fee: ETB {{amount}}',
    latePenalty: 'Late renewal penalty: ETB {{amount}} ({{months}} month(s) overdue)',
    gracePeriod: '30-day grace period after fiscal year end',
    licenseCancelled: 'License cancelled — renewal more than 6 months overdue',
    addressChangeRequired: 'New address details are required when business address has changed',
    laborClearanceRequired:
      'Businesses with more than 50 employees require clearance from the Ministry of Labor and Social Affairs',
  },

  // ── Manufacturing Permit ───────────────────────────────────────────────
  manufacturingPermit: {
    esiaRequired: 'Environmental and Social Impact Assessment required for Category {{category}}',
    waterPermitRequired:
      'Water use permit required for daily usage above {{threshold}} cubic meters',
    chemicalSafetyRequired: 'Chemical safety management plan required for hazardous materials',
    foodSafetyRequired: 'Food Safety Authority certification required',
    pharmaRequired: 'EFDA pharmaceutical manufacturing license required',
  },

  // ── Calendar ───────────────────────────────────────────────────────────
  calendar: {
    fiscalYear: 'Ethiopian Fiscal Year {{year}} E.C.',
    fiscalYearEnd: 'Fiscal year ends on {{date}}',
  },

  // ── Application Status Labels ─────────────────────────────────────────
  status: {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SENT_BACK: 'Sent Back',
    WITHDRAWN: 'Withdrawn',
    EXPIRED: 'Expired',
  },
} as const;

/** Structural type for translation dictionaries — same shape, different string values. */
export type TranslationShape = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
