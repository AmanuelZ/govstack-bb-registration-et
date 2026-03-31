import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env['DATABASE_URL'] } },
});

// ─────────────────────────────────────────────────────────────────────────────
// ESIC CODES
// ─────────────────────────────────────────────────────────────────────────────

const esicCodes = [
  // Section A: Agriculture, Forestry and Fishing
  {
    code: 'A01',
    sectionCode: 'A',
    sectionEn: 'Agriculture, Forestry and Fishing',
    sectionAm: 'ግብርና፣ ደን እና አሳ ማጥመድ',
    divisionEn: 'Crop and animal production, hunting and related service activities',
    divisionAm: 'የሰብል እና እንስሳት ምርት፣ አደን እና ተዛማጅ አገልግሎቶች',
  },
  {
    code: 'A02',
    sectionCode: 'A',
    sectionEn: 'Agriculture, Forestry and Fishing',
    sectionAm: 'ግብርና፣ ደን እና አሳ ማጥመድ',
    divisionEn: 'Forestry and logging',
    divisionAm: 'ደን እና ቁሪ መቁረጥ',
  },
  {
    code: 'A03',
    sectionCode: 'A',
    sectionEn: 'Agriculture, Forestry and Fishing',
    sectionAm: 'ግብርና፣ ደን እና አሳ ማጥመድ',
    divisionEn: 'Fishing and aquaculture',
    divisionAm: 'አሳ ማጥመድ እና የውሃ ሀብት ልማት',
  },

  // Section C: Manufacturing
  {
    code: 'C10',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of food products',
    divisionAm: 'የምግብ ምርቶች ማምረት',
    groupEn: 'Processing and preserving of meat and production of meat products',
    groupAm: 'ሥጋ ማቀነባበርና ማስቀመጥ',
  },
  {
    code: 'C11',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of beverages',
    divisionAm: 'መጠጦችን ማምረት',
  },
  {
    code: 'C12',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of tobacco products',
    divisionAm: 'የትምባሆ ምርቶች ማምረት',
  },
  {
    code: 'C13',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of textiles',
    divisionAm: 'ጨርቃ ጨርቅ ማምረት',
  },
  {
    code: 'C14',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of wearing apparel',
    divisionAm: 'ልብስ ማምረት',
  },
  {
    code: 'C15',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of leather and related products',
    divisionAm: 'ቆዳ እና ተዛማጅ ምርቶች ማምረት',
  },
  {
    code: 'C16',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of wood and wood products',
    divisionAm: 'እንጨትና የእንጨት ምርቶች ማምረት',
  },
  {
    code: 'C17',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of paper and paper products',
    divisionAm: 'ወረቀትና የወረቀት ምርቶች ማምረት',
  },
  {
    code: 'C20',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of chemicals and chemical products',
    divisionAm: 'ኬሚካልና ኬሚካል ምርቶች ማምረት',
  },
  {
    code: 'C21',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of basic pharmaceutical products',
    divisionAm: 'መሠረታዊ የፋርማሲ ምርቶች ማምረት',
  },
  {
    code: 'C22',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of rubber and plastics products',
    divisionAm: 'ላስቲክ እና ፕላስቲክ ምርቶች ማምረት',
  },
  {
    code: 'C24',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of basic metals',
    divisionAm: 'መሠረታዊ ብረቶች ማምረት',
  },
  {
    code: 'C25',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of fabricated metal products',
    divisionAm: 'የተቀነባበሩ የብረት ምርቶች ማምረት',
  },
  {
    code: 'C26',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of computer, electronic and optical products',
    divisionAm: 'ኮምፒውተር፣ ኤሌክትሮኒክ እና ኦፕቲካል ምርቶች ማምረት',
  },
  {
    code: 'C27',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of electrical equipment',
    divisionAm: 'የኤሌክትሪክ መሣሪያዎች ማምረት',
  },
  {
    code: 'C28',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of machinery and equipment',
    divisionAm: 'ማሽኖችና መሣሪያዎች ማምረት',
  },
  {
    code: 'C29',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Manufacture of motor vehicles',
    divisionAm: 'ሞተር ተሽከርካሪዎች ማምረት',
  },
  {
    code: 'C33',
    sectionCode: 'C',
    sectionEn: 'Manufacturing',
    sectionAm: 'ማምረቻ',
    divisionEn: 'Repair and installation of machinery and equipment',
    divisionAm: 'ማሽኖችና መሣሪያዎች ጥገናና ማስቀመጥ',
  },

  // Section F: Construction
  {
    code: 'F41',
    sectionCode: 'F',
    sectionEn: 'Construction',
    sectionAm: 'ግንባታ',
    divisionEn: 'Construction of buildings',
    divisionAm: 'ሕንጻዎች ግንባታ',
  },
  {
    code: 'F42',
    sectionCode: 'F',
    sectionEn: 'Construction',
    sectionAm: 'ግንባታ',
    divisionEn: 'Civil engineering',
    divisionAm: 'ሲቪል ምህንድስና',
  },
  {
    code: 'F43',
    sectionCode: 'F',
    sectionEn: 'Construction',
    sectionAm: 'ግንባታ',
    divisionEn: 'Specialised construction activities',
    divisionAm: 'ልዩ ልዩ የግንባታ ሥራዎች',
  },

  // Section G: Wholesale and Retail Trade
  {
    code: 'G45',
    sectionCode: 'G',
    sectionEn: 'Wholesale and Retail Trade',
    sectionAm: 'ጅምላ እና ችርቻሮ ንግድ',
    divisionEn: 'Wholesale and retail trade and repair of motor vehicles',
    divisionAm: 'ሞተር ተሽከርካሪዎች ጅምላ፣ ችርቻሮ ንግድ እና ጥገና',
  },
  {
    code: 'G46',
    sectionCode: 'G',
    sectionEn: 'Wholesale and Retail Trade',
    sectionAm: 'ጅምላ እና ችርቻሮ ንግድ',
    divisionEn: 'Wholesale trade, except of motor vehicles',
    divisionAm: 'ጅምላ ንግድ (ሞተር ተሽከርካሪዎች ሳይሆን)',
  },
  {
    code: 'G47',
    sectionCode: 'G',
    sectionEn: 'Wholesale and Retail Trade',
    sectionAm: 'ጅምላ እና ችርቻሮ ንግድ',
    divisionEn: 'Retail trade, except of motor vehicles',
    divisionAm: 'ችርቻሮ ንግድ (ሞተር ተሽከርካሪዎች ሳይሆን)',
  },

  // Section H: Transportation and Storage
  {
    code: 'H49',
    sectionCode: 'H',
    sectionEn: 'Transportation and Storage',
    sectionAm: 'ትራንስፖርት እና ማከማቻ',
    divisionEn: 'Land transport and transport via pipelines',
    divisionAm: 'የምድር ትራንስፖርት እና በቧንቧ ማጓጓዝ',
  },
  {
    code: 'H50',
    sectionCode: 'H',
    sectionEn: 'Transportation and Storage',
    sectionAm: 'ትራንስፖርት እና ማከማቻ',
    divisionEn: 'Water transport',
    divisionAm: 'የውሃ ትራንስፖርት',
  },
  {
    code: 'H51',
    sectionCode: 'H',
    sectionEn: 'Transportation and Storage',
    sectionAm: 'ትራንስፖርት እና ማከማቻ',
    divisionEn: 'Air transport',
    divisionAm: 'የአየር ትራንስፖርት',
  },
  {
    code: 'H52',
    sectionCode: 'H',
    sectionEn: 'Transportation and Storage',
    sectionAm: 'ትራንስፖርት እና ማከማቻ',
    divisionEn: 'Warehousing and support activities for transportation',
    divisionAm: 'ጎጆ ማስቀመጥ እና ለትራንስፖርት ድጋፍ ሥራዎች',
  },
  {
    code: 'H53',
    sectionCode: 'H',
    sectionEn: 'Transportation and Storage',
    sectionAm: 'ትራንስፖርት እና ማከማቻ',
    divisionEn: 'Postal and courier activities',
    divisionAm: 'ፖስታ እና ኩሪየር አገልግሎቶች',
  },

  // Section I: Accommodation and Food Service
  {
    code: 'I55',
    sectionCode: 'I',
    sectionEn: 'Accommodation and Food Service Activities',
    sectionAm: '숙박 እና ምግብ አገልግሎት',
    divisionEn: 'Accommodation',
    divisionAm: 'ማረፊያ አገልግሎት',
  },
  {
    code: 'I56',
    sectionCode: 'I',
    sectionEn: 'Accommodation and Food Service Activities',
    sectionAm: '숙박 እና ምግብ አገልግሎት',
    divisionEn: 'Food and beverage service activities',
    divisionAm: 'ምግብ እና መጠጥ አገልግሎት',
  },

  // Section J: Information and Communication
  {
    code: 'J58',
    sectionCode: 'J',
    sectionEn: 'Information and Communication',
    sectionAm: 'ኢንፎርሜሽን እና ኮምዩኒኬሽን',
    divisionEn: 'Publishing activities',
    divisionAm: 'የህትመት አገልግሎቶች',
  },
  {
    code: 'J59',
    sectionCode: 'J',
    sectionEn: 'Information and Communication',
    sectionAm: 'ኢንፎርሜሽን እና ኮምዩኒኬሽን',
    divisionEn: 'Motion picture, video and television programme production',
    divisionAm: 'ፊልም፣ ቪዲዮ እና ቴሌቪዥን ፕሮግራም ምርት',
  },
  {
    code: 'J60',
    sectionCode: 'J',
    sectionEn: 'Information and Communication',
    sectionAm: 'ኢንፎርሜሽን እና ኮምዩኒኬሽን',
    divisionEn: 'Programming and broadcasting activities',
    divisionAm: 'ፕሮግራሚንግ እና ስርጭት አገልግሎቶች',
  },
  {
    code: 'J61',
    sectionCode: 'J',
    sectionEn: 'Information and Communication',
    sectionAm: 'ኢንፎርሜሽን እና ኮምዩኒኬሽን',
    divisionEn: 'Telecommunications',
    divisionAm: 'ቴሌኮሙኒኬሽን',
  },
  {
    code: 'J62',
    sectionCode: 'J',
    sectionEn: 'Information and Communication',
    sectionAm: 'ኢንፎርሜሽን እና ኮምዩኒኬሽን',
    divisionEn: 'Computer programming, consultancy and related activities',
    divisionAm: 'የኮምፒዩተር ፕሮግራሚንግ፣ ምክር አሰጣጥ እና ተዛማጅ አገልግሎቶች',
  },
  {
    code: 'J63',
    sectionCode: 'J',
    sectionEn: 'Information and Communication',
    sectionAm: 'ኢንፎርሜሽን እና ኮምዩኒኬሽን',
    divisionEn: 'Information service activities',
    divisionAm: 'የኢንፎርሜሽን አገልግሎቶች',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...');

  // ── ESIC Codes ──────────────────────────────────────────────────────────────
  console.log('Seeding ESIC codes...');
  for (const code of esicCodes) {
    await prisma.esicCode.upsert({
      where: { code: code.code },
      update: {
        sectionEn: code.sectionEn,
        sectionAm: code.sectionAm,
        divisionEn: code.divisionEn,
        divisionAm: code.divisionAm,
        ...(code.groupEn !== undefined && { groupEn: code.groupEn }),
        ...(code.groupAm !== undefined && { groupAm: code.groupAm }),
      },
      create: {
        code: code.code,
        sectionCode: code.sectionCode,
        sectionEn: code.sectionEn,
        sectionAm: code.sectionAm,
        divisionEn: code.divisionEn,
        divisionAm: code.divisionAm,
        ...(code.groupEn !== undefined && { groupEn: code.groupEn }),
        ...(code.groupAm !== undefined && { groupAm: code.groupAm }),
      },
    });
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  console.log('Seeding users...');

  const userAyantu = await prisma.user.upsert({
    where: { faydaPsut: 'psut_ayantu_bekele_001' },
    update: {},
    create: {
      faydaPsut: 'psut_ayantu_bekele_001',
      faydaFin: 'ETH001234567890',
      fullName: 'Ayantu Bekele Gemechu',
      fullNameAm: 'አያንቱ በቀለ ገመቹ',
      email: 'ayantu.bekele@example.et',
      phoneNumber: '+251911234567',
      roles: ['applicant'],
    },
  });

  const userDawit = await prisma.user.upsert({
    where: { faydaPsut: 'psut_dawit_haile_002' },
    update: {},
    create: {
      faydaPsut: 'psut_dawit_haile_002',
      faydaFin: 'ETH002345678901',
      fullName: 'Dawit Haile Tesfaye',
      fullNameAm: 'ዳዊት ሃይሌ ተስፋዬ',
      email: 'dawit.haile@moti.gov.et',
      phoneNumber: '+251922345678',
      roles: ['applicant', 'operator:name-reviewer'],
    },
  });

  const userMekdes = await prisma.user.upsert({
    where: { faydaPsut: 'psut_mekdes_alemu_003' },
    update: {},
    create: {
      faydaPsut: 'psut_mekdes_alemu_003',
      faydaFin: 'ETH003456789012',
      fullName: 'Mekdes Alemu Worku',
      fullNameAm: 'መቅደስ አለሙ ወርቁ',
      email: 'mekdes.alemu@moti.gov.et',
      phoneNumber: '+251933456789',
      roles: ['applicant', 'operator:document-verifier'],
    },
  });

  const userYonas = await prisma.user.upsert({
    where: { faydaPsut: 'psut_yonas_girma_004' },
    update: {},
    create: {
      faydaPsut: 'psut_yonas_girma_004',
      faydaFin: 'ETH004567890123',
      fullName: 'Yonas Girma Tadesse',
      fullNameAm: 'ዮናስ ግርማ ታደሰ',
      email: 'yonas.girma@moti.gov.et',
      phoneNumber: '+251944567890',
      roles: [
        'applicant',
        'operator:registration-officer',
        'operator:license-officer',
        'operator:permit-authority',
      ],
    },
  });

  const userTigist = await prisma.user.upsert({
    where: { faydaPsut: 'psut_tigist_mulugeta_005' },
    update: {},
    create: {
      faydaPsut: 'psut_tigist_mulugeta_005',
      faydaFin: 'ETH005678901234',
      fullName: 'Tigist Mulugeta Belay',
      fullNameAm: 'ትግስት ሙሉጌታ በላይ',
      email: 'tigist.mulugeta@moenr.gov.et',
      phoneNumber: '+251955678901',
      roles: [
        'applicant',
        'operator:compliance-checker',
        'operator:technical-assessor',
        'operator:environmental-officer',
      ],
    },
  });

  // ── Service 1: Business Registration (PLC) ──────────────────────────────────
  console.log('Seeding services...');

  const servicePlc = await prisma.service.upsert({
    where: { code: 'et-business-registration-plc' },
    update: {
      nameEn: 'Business Registration (Private Limited Company)',
      nameAm: 'የንግድ ምዝገባ (ግል ሀላፊነቱ የተወሰነ የኅብረት ሥራ ማኅበር)',
      isActive: true,
    },
    create: {
      code: 'et-business-registration-plc',
      nameEn: 'Business Registration (Private Limited Company)',
      nameAm: 'የንግድ ምዝገባ (ግል ሀላፊነቱ የተወሰነ የኅብረት ሥራ ማኅበር)',
      descriptionEn:
        'Register a new Private Limited Company (PLC) with the Ministry of Trade and Industry. Includes name reservation, memorandum of association, and certificate of incorporation.',
      descriptionAm:
        'አዲስ ግል ሃላፊነቱ የተወሰነ ማህበር (ፒኤልሲ) ከንግድና ኢንዱስትሪ ሚኒስቴር ጋር ይመዝገቡ። የስም ቦታ ማስያዝ፣ የመመስረቻ ሰነድ እና የምዝገባ ምስክርነት ያካትታል።',
      ministryEn: 'Ministry of Trade and Industry',
      ministryAm: 'የንግድ እና ኢንዱስትሪ ሚኒስቴር',
      estimatedDays: 5,
      validityMonths: 12,
      metadata: {
        regulatoryConfig: {
          capitalRequirements: { PLC: 15000, SC: 50000, OPPLC: 15000 },
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
        },
      },
    },
  });

  // Workflow Steps for PLC
  const plcSteps = [
    {
      stepCode: 'name-review',
      stepOrder: 1,
      nameEn: 'Company Name Review',
      nameAm: 'የኩባንያ ስም ግምገማ',
      assignedRole: 'operator:name-reviewer',
      slaHours: 24,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'],
      nextStepCode: 'document-verification',
    },
    {
      stepCode: 'document-verification',
      stepOrder: 2,
      nameEn: 'Document Verification',
      nameAm: 'ሰነድ ማረጋገጥ',
      assignedRole: 'operator:document-verifier',
      slaHours: 48,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK', 'REQUEST_INFO'],
      nextStepCode: 'registration',
    },
    {
      stepCode: 'registration',
      stepOrder: 3,
      nameEn: 'Registration Processing',
      nameAm: 'ምዝገባ ማስኬድ',
      assignedRole: 'operator:registration-officer',
      slaHours: 48,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'],
      nextStepCode: 'certificate-issuance',
    },
    {
      stepCode: 'certificate-issuance',
      stepOrder: 4,
      nameEn: 'Certificate Issuance',
      nameAm: 'ምስክርነት መስጠት',
      assignedRole: 'operator:registration-officer',
      slaHours: 8,
      isTerminal: true,
      allowedActions: ['APPROVE', 'REJECT'],
      nextStepCode: null,
    },
  ];

  for (const step of plcSteps) {
    await prisma.workflowStep.upsert({
      where: { serviceId_stepCode: { serviceId: servicePlc.id, stepCode: step.stepCode } },
      update: { allowedActions: step.allowedActions, slaHours: step.slaHours },
      create: {
        serviceId: servicePlc.id,
        stepCode: step.stepCode,
        stepOrder: step.stepOrder,
        nameEn: step.nameEn,
        nameAm: step.nameAm,
        assignedRole: step.assignedRole,
        slaHours: step.slaHours,
        isTerminal: step.isTerminal,
        allowedActions: step.allowedActions,
        ...(step.nextStepCode !== null && { nextStepCode: step.nextStepCode }),
        metadata: {},
      },
    });
  }

  // Fees for PLC
  const plcFees = [
    {
      feeCode: 'registration-fee',
      nameEn: 'Registration Fee',
      nameAm: 'የምዝገባ ክፍያ',
      feeType: 'FIXED',
      amountEtb: 500,
      formula: null,
    },
    {
      feeCode: 'capital-duty',
      nameEn: 'Capital Duty',
      nameAm: 'የካፒታል ቀረጥ',
      feeType: 'CALCULATED',
      amountEtb: null,
      formula: 'registered_capital * 0.001',
    },
  ];

  for (const fee of plcFees) {
    await prisma.fee.upsert({
      where: { serviceId_feeCode: { serviceId: servicePlc.id, feeCode: fee.feeCode } },
      update: {},
      create: {
        serviceId: servicePlc.id,
        feeCode: fee.feeCode,
        nameEn: fee.nameEn,
        nameAm: fee.nameAm,
        feeType: fee.feeType,
        ...(fee.amountEtb !== null && { amountEtb: fee.amountEtb }),
        ...(fee.formula !== null && { formula: fee.formula }),
        isRequired: true,
      },
    });
  }

  // EForm for PLC
  await prisma.eForm.upsert({
    where: { serviceId_version: { serviceId: servicePlc.id, version: 1 } },
    update: {},
    create: {
      serviceId: servicePlc.id,
      version: 1,
      titleEn: 'Business Registration Application Form — Private Limited Company',
      titleAm: 'የንግድ ምዝገባ ማመልከቻ ቅጽ — ግል ሃላፊነቱ የተወሰነ ማህበር',
      schema: {
        type: 'object',
        required: [
          'company_name_en',
          'company_name_am',
          'entity_type',
          'business_sector',
          'registered_capital',
          'shareholders',
          'registered_address',
          'managing_director',
        ],
        properties: {
          company_name_en: {
            type: 'string',
            title: 'Company Name (English)',
            titleAm: 'የኩባንያ ስም (እንግሊዝኛ)',
            minLength: 3,
            maxLength: 200,
          },
          company_name_am: {
            type: 'string',
            title: 'Company Name (Amharic)',
            titleAm: 'የኩባንያ ስም (አማርኛ)',
            minLength: 3,
            maxLength: 200,
          },
          alternative_names: {
            type: 'array',
            title: 'Alternative Company Names',
            titleAm: 'አማራጭ የኩባንያ ስሞች',
            items: { type: 'string', maxLength: 200 },
            maxItems: 3,
          },
          entity_type: {
            type: 'string',
            title: 'Entity Type',
            titleAm: 'የድርጅት ዓይነት',
            enum: ['PLC', 'SC', 'OPPLC', 'GP', 'LP', 'LLP'],
            enumLabels: {
              en: {
                PLC: 'Private Limited Company',
                SC: 'Share Company',
                OPPLC: 'One-Person PLC',
                GP: 'General Partnership',
                LP: 'Limited Partnership',
                LLP: 'Limited Liability Partnership',
              },
              am: {
                PLC: 'ግል ሃላፊነቱ የተወሰነ ማህበር',
                SC: 'አክሲዮን ኩባንያ',
                OPPLC: 'አንድ ሰው ፒኤልሲ',
                GP: 'ጠቅላላ አጋርነት',
                LP: 'ውሱን አጋርነት',
                LLP: 'ውሱን ሃላፊነት አጋርነት',
              },
            },
          },
          business_sector: {
            type: 'string',
            title: 'Business Sector (ESIC Code)',
            titleAm: 'የንግድ ዘርፍ (ESIC ኮድ)',
            description: 'Select from Ethiopian Standard Industrial Classification',
          },
          registered_capital: {
            type: 'number',
            title: 'Registered Capital (ETB)',
            titleAm: 'የተመዘገበ ካፒታል (ብር)',
            minimum: 15000,
            description: 'Minimum registered capital is ETB 15,000',
          },
          shareholders: {
            type: 'array',
            title: 'Shareholders',
            titleAm: 'አክሲዮን ባለቤቶች',
            minItems: 2,
            items: {
              type: 'object',
              required: ['full_name', 'nationality', 'id_type', 'id_number', 'share_percentage'],
              properties: {
                full_name: { type: 'string', title: 'Full Name', titleAm: 'ሙሉ ስም' },
                nationality: { type: 'string', title: 'Nationality', titleAm: 'ዜግነት' },
                id_type: {
                  type: 'string',
                  enum: ['FAYDA', 'PASSPORT', 'KEBELE_ID'],
                  title: 'ID Type',
                  titleAm: 'መታወቂያ ዓይነት',
                },
                id_number: { type: 'string', title: 'ID Number', titleAm: 'መታወቂያ ቁጥር' },
                share_percentage: {
                  type: 'number',
                  minimum: 1,
                  maximum: 100,
                  title: 'Share Percentage (%)',
                  titleAm: 'የአክሲዮን መጠን (%)',
                },
              },
            },
          },
          registered_address: {
            type: 'object',
            title: 'Registered Office Address',
            titleAm: 'የተመዘገበ ጽህፈት ቤት አድራሻ',
            required: ['region', 'woreda'],
            properties: {
              region: { type: 'string', title: 'Region', titleAm: 'ክልል' },
              sub_city: { type: 'string', title: 'Sub-City / Zone', titleAm: 'ክፍለ ከተማ / ዞን' },
              woreda: { type: 'string', title: 'Woreda', titleAm: 'ወረዳ' },
              kebele: { type: 'string', title: 'Kebele', titleAm: 'ቀበሌ' },
              house_number: {
                type: 'string',
                title: 'House / Plot Number',
                titleAm: 'ቤት / ፕሎት ቁጥር',
              },
              po_box: { type: 'string', title: 'P.O. Box', titleAm: 'ፖ.ሳ.ቁ' },
              phone: { type: 'string', title: 'Office Phone', titleAm: 'ቢሮ ስልክ' },
              email: { type: 'string', format: 'email', title: 'Office Email', titleAm: 'ቢሮ ኢሜይል' },
            },
          },
          managing_director: {
            type: 'object',
            title: 'Managing Director',
            titleAm: 'ስራ አስኪያጅ ዳይሬክተር',
            required: ['full_name', 'nationality', 'id_type', 'id_number'],
            properties: {
              full_name: { type: 'string', title: 'Full Name', titleAm: 'ሙሉ ስም' },
              nationality: { type: 'string', title: 'Nationality', titleAm: 'ዜግነት' },
              id_type: {
                type: 'string',
                enum: ['FAYDA', 'PASSPORT', 'KEBELE_ID'],
                title: 'ID Type',
                titleAm: 'መታወቂያ ዓይነት',
              },
              id_number: { type: 'string', title: 'ID Number', titleAm: 'መታወቂያ ቁጥር' },
              phone: { type: 'string', title: 'Phone', titleAm: 'ስልክ' },
              email: { type: 'string', format: 'email', title: 'Email', titleAm: 'ኢሜይል' },
            },
          },
        },
      },
      uiSchema: {
        'ui:order': [
          'company_name_en',
          'company_name_am',
          'alternative_names',
          'entity_type',
          'business_sector',
          'registered_capital',
          'shareholders',
          'registered_address',
          'managing_director',
        ],
        registered_capital: {
          'ui:help':
            'Minimum ETB 15,000. Capital duty will be calculated at 0.1% of registered capital.',
        },
        shareholders: { 'ui:description': 'At least 2 shareholders required for PLC formation.' },
      },
    },
  });

  // ── Service 2: Trade License Renewal ────────────────────────────────────────

  const serviceTrade = await prisma.service.upsert({
    where: { code: 'et-trade-license-renewal' },
    update: { isActive: true },
    create: {
      code: 'et-trade-license-renewal',
      nameEn: 'Trade License Renewal',
      nameAm: 'የንግድ ፈቃድ ታደሳ',
      descriptionEn:
        'Renew an existing trade license issued by the Ministry of Trade and Industry. Applicable to all commercial entities operating within Ethiopia.',
      descriptionAm:
        'ከንግድና ኢንዱስትሪ ሚኒስቴር የተሰጠ ነባር የንግድ ፈቃድ ይዩ። በኢትዮጵያ ውስጥ ለሚሰሩ ሁሉም የንግድ ድርጅቶች ይሠራል።',
      ministryEn: 'Ministry of Trade and Industry',
      ministryAm: 'የንግድ እና ኢንዱስትሪ ሚኒስቴር',
      estimatedDays: 3,
      validityMonths: 12,
      metadata: {},
    },
  });

  const tradeSteps = [
    {
      stepCode: 'compliance-check',
      stepOrder: 1,
      nameEn: 'Compliance Check',
      nameAm: 'የተሟላ ሁኔታ ማረጋገጥ',
      assignedRole: 'operator:compliance-checker',
      slaHours: 24,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK', 'REQUEST_INFO'],
      nextStepCode: 'license-review',
    },
    {
      stepCode: 'license-review',
      stepOrder: 2,
      nameEn: 'License Review',
      nameAm: 'ፈቃድ ግምገማ',
      assignedRole: 'operator:license-officer',
      slaHours: 24,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'],
      nextStepCode: 'license-issuance',
    },
    {
      stepCode: 'license-issuance',
      stepOrder: 3,
      nameEn: 'License Issuance',
      nameAm: 'ፈቃድ መስጠት',
      assignedRole: 'operator:license-officer',
      slaHours: 8,
      isTerminal: true,
      allowedActions: ['APPROVE', 'REJECT'],
      nextStepCode: null,
    },
  ];

  for (const step of tradeSteps) {
    await prisma.workflowStep.upsert({
      where: { serviceId_stepCode: { serviceId: serviceTrade.id, stepCode: step.stepCode } },
      update: { allowedActions: step.allowedActions },
      create: {
        serviceId: serviceTrade.id,
        stepCode: step.stepCode,
        stepOrder: step.stepOrder,
        nameEn: step.nameEn,
        nameAm: step.nameAm,
        assignedRole: step.assignedRole,
        slaHours: step.slaHours,
        isTerminal: step.isTerminal,
        allowedActions: step.allowedActions,
        ...(step.nextStepCode !== null && { nextStepCode: step.nextStepCode }),
        metadata: {},
      },
    });
  }

  const tradeFees = [
    {
      feeCode: 'renewal-fee-grade1',
      nameEn: 'Renewal Fee — Grade 1 (Large Enterprise)',
      nameAm: 'የታደሳ ክፍያ — ደረጃ 1 (ትልቅ ድርጅት)',
      feeType: 'FIXED',
      amountEtb: 5000,
    },
    {
      feeCode: 'renewal-fee-grade2',
      nameEn: 'Renewal Fee — Grade 2 (Medium Enterprise)',
      nameAm: 'የታደሳ ክፍያ — ደረጃ 2 (መካከለኛ ድርጅት)',
      feeType: 'FIXED',
      amountEtb: 2000,
    },
    {
      feeCode: 'renewal-fee-grade3',
      nameEn: 'Renewal Fee — Grade 3 (Small Enterprise)',
      nameAm: 'የታደሳ ክፍያ — ደረጃ 3 (ትንሽ ድርጅት)',
      feeType: 'FIXED',
      amountEtb: 500,
    },
  ];

  for (const fee of tradeFees) {
    await prisma.fee.upsert({
      where: { serviceId_feeCode: { serviceId: serviceTrade.id, feeCode: fee.feeCode } },
      update: {},
      create: {
        serviceId: serviceTrade.id,
        feeCode: fee.feeCode,
        nameEn: fee.nameEn,
        nameAm: fee.nameAm,
        feeType: fee.feeType,
        amountEtb: fee.amountEtb,
        isRequired: false,
      },
    });
  }

  await prisma.eForm.upsert({
    where: { serviceId_version: { serviceId: serviceTrade.id, version: 1 } },
    update: {},
    create: {
      serviceId: serviceTrade.id,
      version: 1,
      titleEn: 'Trade License Renewal Application Form',
      titleAm: 'የንግድ ፈቃድ ታደሳ ማመልከቻ ቅጽ',
      schema: {
        type: 'object',
        required: ['license_number', 'fiscal_year', 'annual_revenue', 'employee_count'],
        properties: {
          license_number: {
            type: 'string',
            title: 'Existing License Number',
            titleAm: 'ነባር ፈቃድ ቁጥር',
            pattern: '^TL-[0-9]{4}-[0-9]{6}$',
          },
          fiscal_year: {
            type: 'string',
            title: 'Fiscal Year',
            titleAm: 'የፋይናንስ ዓመት',
            enum: ['2016/2017', '2017/2018', '2018/2019'],
          },
          annual_revenue: {
            type: 'number',
            title: 'Annual Revenue (ETB)',
            titleAm: 'ዓመታዊ ገቢ (ብር)',
            minimum: 0,
          },
          employee_count: {
            type: 'integer',
            title: 'Number of Employees',
            titleAm: 'የሰራተኞች ቁጥር',
            minimum: 0,
          },
          business_address_changed: {
            type: 'boolean',
            title: 'Has the business address changed?',
            titleAm: 'የንግድ አድራሻ ተቀይሯል?',
            default: false,
          },
          new_address: {
            type: 'object',
            title: 'New Business Address',
            titleAm: 'አዲስ የንግድ አድራሻ',
            description: 'Required only if business address has changed',
            properties: {
              region: { type: 'string', title: 'Region', titleAm: 'ክልል' },
              sub_city: { type: 'string', title: 'Sub-City / Zone', titleAm: 'ክፍለ ከተማ / ዞን' },
              woreda: { type: 'string', title: 'Woreda', titleAm: 'ወረዳ' },
              kebele: { type: 'string', title: 'Kebele', titleAm: 'ቀበሌ' },
              house_number: {
                type: 'string',
                title: 'House / Plot Number',
                titleAm: 'ቤት / ፕሎት ቁጥር',
              },
            },
          },
        },
      },
      uiSchema: {
        'ui:order': [
          'license_number',
          'fiscal_year',
          'annual_revenue',
          'employee_count',
          'business_address_changed',
          'new_address',
        ],
        new_address: { 'ui:condition': { field: 'business_address_changed', value: true } },
      },
    },
  });

  // ── Service 3: Manufacturing Permit ─────────────────────────────────────────

  const serviceManufacturing = await prisma.service.upsert({
    where: { code: 'et-manufacturing-permit' },
    update: { isActive: true },
    create: {
      code: 'et-manufacturing-permit',
      nameEn: 'Manufacturing Investment Permit',
      nameAm: 'የማኑፋክቸሪንግ ኢንቨስትመንት ፈቃድ',
      descriptionEn:
        'Obtain a manufacturing investment permit from the Ministry of Industry. Required for all new manufacturing enterprises. Includes technical assessment, environmental review, and permit issuance.',
      descriptionAm: 'ከኢንዱስትሪ ሚኒስቴር የማኑፋክቸሪንግ ኢንቨስትመንት ፈቃድ ያውጡ። ለሁሉም አዲስ ማምረቻ ድርጅቶች ያስፈልጋል።',
      ministryEn: 'Ministry of Industry',
      ministryAm: 'የኢንዱስትሪ ሚኒስቴር',
      estimatedDays: 14,
      validityMonths: 36,
      metadata: {},
    },
  });

  const manufacturingSteps = [
    {
      stepCode: 'technical-assessment',
      stepOrder: 1,
      nameEn: 'Technical Assessment',
      nameAm: 'ቴክኒካዊ ግምገማ',
      assignedRole: 'operator:technical-assessor',
      slaHours: 72,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK', 'REQUEST_INFO'],
      nextStepCode: 'environmental-review',
    },
    {
      stepCode: 'environmental-review',
      stepOrder: 2,
      nameEn: 'Environmental Impact Review',
      nameAm: 'የአካባቢ ተፅእኖ ግምገማ',
      assignedRole: 'operator:environmental-officer',
      slaHours: 120,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK', 'REQUEST_INFO'],
      nextStepCode: 'permit-review',
    },
    {
      stepCode: 'permit-review',
      stepOrder: 3,
      nameEn: 'Permit Review',
      nameAm: 'ፈቃድ ግምገማ',
      assignedRole: 'operator:permit-authority',
      slaHours: 48,
      isTerminal: false,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'],
      nextStepCode: 'permit-issuance',
    },
    {
      stepCode: 'permit-issuance',
      stepOrder: 4,
      nameEn: 'Permit Issuance',
      nameAm: 'ፈቃድ መስጠት',
      assignedRole: 'operator:permit-authority',
      slaHours: 8,
      isTerminal: true,
      allowedActions: ['APPROVE', 'REJECT'],
      nextStepCode: null,
    },
  ];

  for (const step of manufacturingSteps) {
    await prisma.workflowStep.upsert({
      where: {
        serviceId_stepCode: { serviceId: serviceManufacturing.id, stepCode: step.stepCode },
      },
      update: { allowedActions: step.allowedActions },
      create: {
        serviceId: serviceManufacturing.id,
        stepCode: step.stepCode,
        stepOrder: step.stepOrder,
        nameEn: step.nameEn,
        nameAm: step.nameAm,
        assignedRole: step.assignedRole,
        slaHours: step.slaHours,
        isTerminal: step.isTerminal,
        allowedActions: step.allowedActions,
        ...(step.nextStepCode !== null && { nextStepCode: step.nextStepCode }),
        metadata: {},
      },
    });
  }

  const manufacturingFees = [
    {
      feeCode: 'application-fee',
      nameEn: 'Application Processing Fee',
      nameAm: 'የማመልከቻ ማስኬጃ ክፍያ',
      feeType: 'FIXED',
      amountEtb: 1000,
    },
    {
      feeCode: 'inspection-fee',
      nameEn: 'Factory Inspection Fee',
      nameAm: 'የፋብሪካ ምርመራ ክፍያ',
      feeType: 'FIXED',
      amountEtb: 3000,
    },
    {
      feeCode: 'esia-review-fee',
      nameEn: 'Environmental & Social Impact Assessment Fee',
      nameAm: 'የአካባቢ እና ማህበራዊ ተፅእኖ ምዘና ክፍያ',
      feeType: 'CONDITIONAL',
      amountEtb: null,
      conditions: {
        if: { field: 'environmental_impact_category', operator: 'eq', value: 'A' },
        then: { amount: 15000 },
        else: {
          if: { field: 'environmental_impact_category', operator: 'eq', value: 'B' },
          then: { amount: 8000 },
          else: { amount: 3000 },
        },
      },
    },
  ];

  for (const fee of manufacturingFees) {
    await prisma.fee.upsert({
      where: { serviceId_feeCode: { serviceId: serviceManufacturing.id, feeCode: fee.feeCode } },
      update: {},
      create: {
        serviceId: serviceManufacturing.id,
        feeCode: fee.feeCode,
        nameEn: fee.nameEn,
        nameAm: fee.nameAm,
        feeType: fee.feeType,
        ...(fee.amountEtb !== null && { amountEtb: fee.amountEtb }),
        ...('conditions' in fee && fee.conditions !== undefined && { conditions: fee.conditions }),
        isRequired: true,
      },
    });
  }

  await prisma.eForm.upsert({
    where: { serviceId_version: { serviceId: serviceManufacturing.id, version: 1 } },
    update: {},
    create: {
      serviceId: serviceManufacturing.id,
      version: 1,
      titleEn: 'Manufacturing Investment Permit Application Form',
      titleAm: 'የማኑፋክቸሪንግ ኢንቨስትመንት ፈቃድ ማመልከቻ ቅጽ',
      schema: {
        type: 'object',
        required: [
          'company_registration_number',
          'manufacturing_sector',
          'production_capacity',
          'raw_materials',
          'factory_location',
          'environmental_impact_category',
          'employment_plan',
        ],
        properties: {
          company_registration_number: {
            type: 'string',
            title: 'Company Registration Number',
            titleAm: 'የኩባንያ ምዝገባ ቁጥር',
          },
          manufacturing_sector: {
            type: 'string',
            title: 'Manufacturing Sector (ESIC Code)',
            titleAm: 'የማምረት ዘርፍ (ESIC ኮድ)',
            description: 'Must be from Section C of ESIC',
          },
          production_capacity: {
            type: 'object',
            title: 'Annual Production Capacity',
            titleAm: 'ዓመታዊ የምርት አቅም',
            required: ['quantity', 'unit', 'product_description'],
            properties: {
              quantity: { type: 'number', minimum: 0, title: 'Quantity', titleAm: 'መጠን' },
              unit: {
                type: 'string',
                enum: ['tonnes', 'units', 'litres', 'sq_metres', 'kg'],
                title: 'Unit',
                titleAm: 'መለኪያ',
              },
              product_description: {
                type: 'string',
                maxLength: 500,
                title: 'Product Description',
                titleAm: 'የምርት መግለጫ',
              },
            },
          },
          raw_materials: {
            type: 'array',
            title: 'Primary Raw Materials',
            titleAm: 'ዋና ዋና ጥሬ እቃዎች',
            minItems: 1,
            items: {
              type: 'object',
              required: ['material_name', 'annual_quantity_tonnes', 'source'],
              properties: {
                material_name: { type: 'string', title: 'Material Name', titleAm: 'የጥሬ እቃ ስም' },
                annual_quantity_tonnes: {
                  type: 'number',
                  minimum: 0,
                  title: 'Annual Quantity (tonnes)',
                  titleAm: 'ዓመታዊ መጠን (ቶን)',
                },
                source: {
                  type: 'string',
                  enum: ['LOCAL', 'IMPORTED', 'MIXED'],
                  title: 'Source',
                  titleAm: 'ምንጭ',
                },
              },
            },
          },
          factory_location: {
            type: 'object',
            title: 'Factory Location',
            titleAm: 'የፋብሪካ አካባቢ',
            required: ['region', 'woreda', 'industrial_zone'],
            properties: {
              region: { type: 'string', title: 'Region', titleAm: 'ክልል' },
              sub_city: { type: 'string', title: 'Sub-City / Zone', titleAm: 'ክፍለ ከተማ / ዞን' },
              woreda: { type: 'string', title: 'Woreda', titleAm: 'ወረዳ' },
              industrial_zone: {
                type: 'string',
                title: 'Industrial Zone / Site',
                titleAm: 'የኢንዱስትሪ ዞን / ቦታ',
              },
              plot_area_sqm: {
                type: 'number',
                minimum: 0,
                title: 'Plot Area (sq. metres)',
                titleAm: 'የቦታ ስፋት (ካሬ ሜትር)',
              },
              gps_latitude: {
                type: 'number',
                minimum: 3.4,
                maximum: 14.9,
                title: 'GPS Latitude',
                titleAm: 'ጂፒኤስ ኬክሮስ',
              },
              gps_longitude: {
                type: 'number',
                minimum: 33.0,
                maximum: 48.0,
                title: 'GPS Longitude',
                titleAm: 'ጂፒኤስ ምህዋር',
              },
            },
          },
          environmental_impact_category: {
            type: 'string',
            title: 'Environmental Impact Category',
            titleAm: 'የአካባቢ ተፅእኖ ምድብ',
            enum: ['A', 'B', 'C'],
            enumLabels: {
              en: {
                A: 'Category A — Significant impact (full ESIA required)',
                B: 'Category B — Moderate impact (partial assessment)',
                C: 'Category C — Minimal impact (screening only)',
              },
              am: {
                A: 'ምድብ A — ከፍተኛ ተፅእኖ (ሙሉ ESIA ያስፈልጋል)',
                B: 'ምድብ B — መካከለኛ ተፅእኖ (ከፊል ምዘና)',
                C: 'ምድብ C — አነስተኛ ተፅእኖ (ምርመራ ብቻ)',
              },
            },
          },
          employment_plan: {
            type: 'object',
            title: 'Employment Plan',
            titleAm: 'የሥራ ዕድል እቅድ',
            required: ['total_jobs', 'skilled_jobs', 'unskilled_jobs'],
            properties: {
              total_jobs: {
                type: 'integer',
                minimum: 1,
                title: 'Total Jobs Created',
                titleAm: 'ጠቅላላ የተፈጠሩ የሥራ ዕድሎች',
              },
              skilled_jobs: {
                type: 'integer',
                minimum: 0,
                title: 'Skilled Jobs',
                titleAm: 'የሙያ ሥራ ዕድሎች',
              },
              unskilled_jobs: {
                type: 'integer',
                minimum: 0,
                title: 'Unskilled Jobs',
                titleAm: 'ያልሰለጠኑ ሥራ ዕድሎች',
              },
              female_percentage: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                title: 'Target Female Employment (%)',
                titleAm: 'ዒላማ ሴት ሥራ ዕድል (%)',
              },
            },
          },
        },
      },
      uiSchema: {
        'ui:order': [
          'company_registration_number',
          'manufacturing_sector',
          'production_capacity',
          'raw_materials',
          'factory_location',
          'environmental_impact_category',
          'employment_plan',
        ],
        environmental_impact_category: {
          'ui:help':
            'Category A requires a full Environmental and Social Impact Assessment. Category B requires a partial assessment. Category C requires only a screening checklist.',
        },
      },
    },
  });

  // ── Sample Applications ──────────────────────────────────────────────────────
  console.log('Seeding sample applications...');

  const plcFormData = {
    company_name_en: 'Addis Tech Solutions PLC',
    company_name_am: 'አዲስ ቴክ ሶሉሽን ፒኤልሲ',
    entity_type: 'PLC',
    business_sector: 'J62',
    registered_capital: 500000,
    shareholders: [
      {
        full_name: 'Ayantu Bekele Gemechu',
        nationality: 'Ethiopian',
        id_type: 'FAYDA',
        id_number: 'ETH001234567890',
        share_percentage: 60,
      },
      {
        full_name: 'Dawit Haile Tesfaye',
        nationality: 'Ethiopian',
        id_type: 'FAYDA',
        id_number: 'ETH002345678901',
        share_percentage: 40,
      },
    ],
    registered_address: {
      region: 'Addis Ababa',
      sub_city: 'Bole',
      woreda: '03',
      kebele: '14',
      house_number: 'Building A, Floor 3',
    },
    managing_director: {
      full_name: 'Ayantu Bekele Gemechu',
      nationality: 'Ethiopian',
      id_type: 'FAYDA',
      id_number: 'ETH001234567890',
      phone: '+251911234567',
      email: 'ayantu@addistech.et',
    },
  };

  // Application 1: PLC — PENDING at name-review
  const app1 = await prisma.application.upsert({
    where: { fileId: 'a1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      fileId: 'a1000000-0000-0000-0000-000000000001',
      serviceId: servicePlc.id,
      applicantId: userAyantu.id,
      status: 'PENDING',
      currentStep: 'name-review',
      eFormVersion: 1,
      formData: plcFormData,
      calculatedFees: {
        'registration-fee': { nameEn: 'Registration Fee', amountEtb: 500 },
        'capital-duty': { nameEn: 'Capital Duty', amountEtb: 500 },
      },
    },
  });

  await prisma.task.upsert({
    where: { id: 'b1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'b1000000-0000-0000-0000-000000000001',
      applicationId: app1.id,
      workflowStep: 'name-review',
      assignedRole: 'operator:name-reviewer',
      status: 'PENDING',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      formVariables: plcFormData,
    },
  });

  await prisma.applicationStatusHistory.upsert({
    where: { id: 'c1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'c1000000-0000-0000-0000-000000000001',
      applicationId: app1.id,
      toStatus: 'PENDING',
      changedById: userAyantu.id,
      reason: 'Application submitted',
      correlationId: 'seed-correlation-001',
    },
  });

  // Application 2: PLC — APPROVED (all tasks completed)
  const app2 = await prisma.application.upsert({
    where: { fileId: 'a1000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      fileId: 'a1000000-0000-0000-0000-000000000002',
      serviceId: servicePlc.id,
      applicantId: userAyantu.id,
      status: 'APPROVED',
      currentStep: 'certificate-issuance',
      eFormVersion: 1,
      formData: {
        ...plcFormData,
        company_name_en: 'Green Ethiopia Agro PLC',
        registered_capital: 2000000,
      },
      calculatedFees: {
        'registration-fee': { nameEn: 'Registration Fee', amountEtb: 500 },
        'capital-duty': { nameEn: 'Capital Duty', amountEtb: 2000 },
      },
      registryRef: 'REG-2016-00042',
      certificateUrl: 'https://registry.moti.gov.et/certificates/REG-2016-00042.pdf',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Trade license renewal applications
  const tradeFormData = {
    license_number: 'TL-2015-001234',
    fiscal_year: '2016/2017',
    annual_revenue: 12500000,
    employee_count: 45,
    business_address_changed: false,
  };

  // Application 3: Trade License — IN_REVIEW
  const app3 = await prisma.application.upsert({
    where: { fileId: 'a1000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      fileId: 'a1000000-0000-0000-0000-000000000003',
      serviceId: serviceTrade.id,
      applicantId: userDawit.id,
      status: 'IN_REVIEW',
      currentStep: 'license-review',
      eFormVersion: 1,
      formData: tradeFormData,
      calculatedFees: {
        'renewal-fee-grade1': { nameEn: 'Renewal Fee — Grade 1', amountEtb: 5000 },
      },
    },
  });

  await prisma.task.upsert({
    where: { id: 'b1000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'b1000000-0000-0000-0000-000000000003',
      applicationId: app3.id,
      workflowStep: 'license-review',
      assignedRole: 'operator:license-officer',
      status: 'PENDING',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      formVariables: tradeFormData,
    },
  });

  // Application 4: Trade License — REJECTED
  const app4 = await prisma.application.upsert({
    where: { fileId: 'a1000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      fileId: 'a1000000-0000-0000-0000-000000000004',
      serviceId: serviceTrade.id,
      applicantId: userMekdes.id,
      status: 'REJECTED',
      currentStep: 'compliance-check',
      eFormVersion: 1,
      formData: { ...tradeFormData, license_number: 'TL-2014-009876' },
      calculatedFees: { 'renewal-fee-grade3': { nameEn: 'Renewal Fee — Grade 3', amountEtb: 500 } },
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.applicationStatusHistory.upsert({
    where: { id: 'c1000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: 'c1000000-0000-0000-0000-000000000004',
      applicationId: app4.id,
      fromStatus: 'PENDING',
      toStatus: 'REJECTED',
      changedById: userTigist.id,
      reason: 'Tax clearance certificate expired. Reapply after obtaining valid tax clearance.',
      correlationId: 'seed-correlation-004',
    },
  });

  // Manufacturing permit applications
  const manufacturingFormData = {
    company_registration_number: 'REG-2015-00789',
    manufacturing_sector: 'C15',
    production_capacity: {
      quantity: 500000,
      unit: 'units',
      product_description: 'Leather shoes and footwear for export',
    },
    raw_materials: [
      { material_name: 'Bovine leather hides', annual_quantity_tonnes: 250, source: 'LOCAL' },
      { material_name: 'Synthetic sole material', annual_quantity_tonnes: 50, source: 'IMPORTED' },
    ],
    factory_location: {
      region: 'Oromia',
      woreda: 'Sululta',
      industrial_zone: 'Sululta Industrial Park',
      plot_area_sqm: 5000,
      gps_latitude: 9.1256,
      gps_longitude: 38.7645,
    },
    environmental_impact_category: 'B',
    employment_plan: {
      total_jobs: 250,
      skilled_jobs: 50,
      unskilled_jobs: 200,
      female_percentage: 60,
    },
  };

  // Application 5: Manufacturing — PENDING at technical-assessment
  const app5 = await prisma.application.upsert({
    where: { fileId: 'a1000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      fileId: 'a1000000-0000-0000-0000-000000000005',
      serviceId: serviceManufacturing.id,
      applicantId: userYonas.id,
      status: 'PENDING',
      currentStep: 'technical-assessment',
      eFormVersion: 1,
      formData: manufacturingFormData,
      calculatedFees: {
        'application-fee': { nameEn: 'Application Processing Fee', amountEtb: 1000 },
        'inspection-fee': { nameEn: 'Factory Inspection Fee', amountEtb: 3000 },
      },
    },
  });

  await prisma.task.upsert({
    where: { id: 'b1000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: 'b1000000-0000-0000-0000-000000000005',
      applicationId: app5.id,
      workflowStep: 'technical-assessment',
      assignedRole: 'operator:technical-assessor',
      status: 'PENDING',
      dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      formVariables: manufacturingFormData,
    },
  });

  // Application 6: Manufacturing — SENT_BACK
  const app6 = await prisma.application.upsert({
    where: { fileId: 'a1000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      fileId: 'a1000000-0000-0000-0000-000000000006',
      serviceId: serviceManufacturing.id,
      applicantId: userTigist.id,
      status: 'SENT_BACK',
      currentStep: 'technical-assessment',
      eFormVersion: 1,
      formData: {
        ...manufacturingFormData,
        manufacturing_sector: 'C24',
        company_registration_number: 'REG-2016-01122',
      },
      calculatedFees: {
        'application-fee': { nameEn: 'Application Processing Fee', amountEtb: 1000 },
        'inspection-fee': { nameEn: 'Factory Inspection Fee', amountEtb: 3000 },
      },
    },
  });

  await prisma.applicationStatusHistory.upsert({
    where: { id: 'c1000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      id: 'c1000000-0000-0000-0000-000000000006',
      applicationId: app6.id,
      fromStatus: 'PENDING',
      toStatus: 'SENT_BACK',
      changedById: userTigist.id,
      reason:
        'GPS coordinates for factory location appear to be outside the designated industrial zone. Please verify and resubmit with corrected coordinates.',
      correlationId: 'seed-correlation-006',
    },
  });

  // Suppress unused variable warnings for app2, app6
  void app2;
  void app6;

  console.log('Seed completed successfully.');
  console.log(
    `  Users: 5 (${userAyantu.id}, ${userDawit.id}, ${userMekdes.id}, ${userYonas.id}, ${userTigist.id})`,
  );
  console.log(`  Services: 3 (${servicePlc.id}, ${serviceTrade.id}, ${serviceManufacturing.id})`);
  console.log('  ESIC Codes:', esicCodes.length);
  console.log('  Applications: 6');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
