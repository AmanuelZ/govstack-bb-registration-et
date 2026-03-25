/**
 * Amharic (አማርኛ) translations for the Registration Building Block.
 * Structure mirrors en.ts — all keys must match.
 */
import type { TranslationShape } from './en.js';

export const am: TranslationShape = {
  // ── አጠቃላይ ──────────────────────────────────────────────────────────────
  app: {
    name: 'የምዝገባ ግንባታ ብሎክ',
    description: 'የGovStack ምዝገባ ግንባታ ብሎክ ዝርዝር መግለጫ የኢትዮጵያ ማጣቀሻ ትግበራ',
  },

  // ── ስህተቶች ──────────────────────────────────────────────────────────────
  errors: {
    notFound: "{{resource}} '{{id}}' አልተገኘም",
    unauthorized: 'ማረጋገጫ ያስፈልጋል',
    forbidden: 'ይህን ድርጊት ለማከናወን ፈቃድ የለዎትም',
    badRequest: 'ልክ ያልሆነ ጥያቄ',
    conflict: 'የመረጃ ግጭት',
    unprocessable: 'ጥያቄው ሊሠራ አልቻለም',
    internalError: 'ያልተጠበቀ ስህተት ተከስቷል',
    tooManyRequests: 'በጣም ብዙ ጥያቄዎች። እባክዎ ቆየት ብለው ይሞክሩ።',
    invalidWorkflowTransition: "ከ'{{from}}' ወደ '{{to}}' ልክ ያልሆነ የሥራ ፍሰት ሽግግር",
    invalidFormData: 'የቅጽ ውሂብ ማረጋገጫ አልተሳካም',
    documentUploadFailed: 'ሰነድ መስቀል አልተሳካም',
    paymentRequired: 'ለመቀጠል ክፍያ ያስፈልጋል',
    faydaAuthFailed: 'የፋይዳ ማረጋገጫ አልተሳካም',
    imHeaderInvalid: "ልክ ያልሆነ የInformation-Mediator-Client ራስጌ: '{{header}}'",
  },

  // ── ማመልከቻ ──────────────────────────────────────────────────────────────
  application: {
    submitted: 'ማመልከቻው በተሳካ ሁኔታ ቀርቧል',
    updated: 'ማመልከቻው በተሳካ ሁኔታ ተሻሽሏል',
    withdrawn: 'ማመልከቻው ተሰርዟል',
    cannotUpdate: "ማመልከቻውን በ'{{status}}' ሁኔታ ማሻሻል አይቻልም",
    onlyOwnerCanUpdate: 'የራስዎን ማመልከቻዎች ብቻ ማሻሻል ይችላሉ',
    noWorkflowSteps: 'አገልግሎቱ የተዋቀሩ የሥራ ፍሰት ደረጃዎች የሉትም',
    requirementsNotMet: 'የማመልከቻ መረጃው የአገልግሎት መስፈርቶችን አያሟላም',
  },

  // ── የሥራ ፍሰት ──────────────────────────────────────────────────────────
  workflow: {
    taskAssigned: 'ተግባር ለ{{role}} ተመድቧል',
    taskCompleted: 'ተግባሩ ተጠናቋል',
    approvalRequired: 'ከ{{role}} ፈቃድ ያስፈልጋል',
    applicationApproved: 'ማመልከቻው ጸድቋል',
    applicationRejected: 'ማመልከቻው ውድቅ ተደርጓል',
    sentBack: 'ማመልከቻው ለማሻሻል ተመልሷል',
  },

  // ── የንግድ ምዝገባ ──────────────────────────────────────────────────────
  businessRegistration: {
    insufficientCapital: 'የተመዘገበ ካፒታል ለ{{entityType}} ቢያንስ ብር {{minimum}} መሆን አለበት',
    invalidShareholderCount: '{{entityType}} ቢያንስ {{minimum}} ባለአክሲዮኖች ያስፈልጉታል',
    sharePercentagesMustEqual100: 'የባለአክሲዮኖች መቶኛ ድርሻ በትክክል 100% መድረስ አለበት',
    highCapitalSurcharge: 'ከብር 1,000,000 በላይ ለተመዘገበ ካፒታል ከፍተኛ ካፒታል ተጨማሪ ክፍያ ተፈጻሚ ይሆናል',
  },

  // ── የንግድ ፈቃድ ──────────────────────────────────────────────────────────
  tradeLicense: {
    renewalFee: 'የንግድ ፈቃድ ማደስ ክፍያ: ብር {{amount}}',
    latePenalty: 'ዘግይቶ ማደስ ቅጣት: ብር {{amount}} ({{months}} ወር(ዎች) ዘግይቷል)',
    gracePeriod: 'ከበጀት ዓመት መጨረሻ በኋላ 30 ቀን የፀጋ ጊዜ',
    licenseCancelled: 'ፈቃዱ ተሰርዟል — ማደስ ከ6 ወር በላይ ዘግይቷል',
    addressChangeRequired: 'የንግድ አድራሻ ሲቀየር አዲስ የአድራሻ ዝርዝሮች ያስፈልጋሉ',
    laborClearanceRequired: 'ከ50 በላይ ሠራተኞች ያላቸው ንግዶች ከሠራተኛና ማኅበራዊ ጉዳይ ሚኒስቴር ፈቃድ ያስፈልጋቸዋል',
  },

  // ── የማምረቻ ፈቃድ ──────────────────────────────────────────────────────
  manufacturingPermit: {
    esiaRequired: 'ለምድብ {{category}} የአካባቢና ማኅበራዊ ተጽዕኖ ግምገማ ያስፈልጋል',
    waterPermitRequired: 'በቀን ከ{{threshold}} ኩቢክ ሜትር በላይ ለሚጠቀሙ የውሃ አጠቃቀም ፈቃድ ያስፈልጋል',
    chemicalSafetyRequired: 'ለአደገኛ ቁሳቁሶች የኬሚካል ደህንነት አስተዳደር ዕቅድ ያስፈልጋል',
    foodSafetyRequired: 'የምግብ ደህንነት ባለሥልጣን የምስክር ወረቀት ያስፈልጋል',
    pharmaRequired: 'የIFDA የመድኃኒት ማምረት ፈቃድ ያስፈልጋል',
  },

  // ── ቀን ────────────────────────────────────────────────────────────────
  calendar: {
    fiscalYear: 'የኢትዮጵያ በጀት ዓመት {{year}} ዓ.ም.',
    fiscalYearEnd: 'የበጀት ዓመቱ {{date}} ላይ ያበቃል',
  },
} as const;
