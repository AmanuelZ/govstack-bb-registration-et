# Ethiopian Government Workflows

This document describes the three registration workflows implemented, their Ethiopian legal basis, and how they map to the GovStack Registration Building Block state machine model.

---

## Legal Framework

| Workflow | Primary Legislation |
|----------|---------------------|
| Business Registration (PLC) | Commercial Code of Ethiopia (Proclamation 1243/2021) |
| Trade License Renewal | Trade Practice and Consumer Protection Proclamation 685/2010 |
| Manufacturing Permit | Investment Proclamation 1180/2020; Environmental Impact Assessment Proclamation 299/2002 |

---

## 1. Business Registration — Private Limited Company (PLC)

### Overview

A Private Limited Company (PLC) in Ethiopia — locally known as "የግል የተወሰነ ኃላፊነት ማህበር" — is the most common business entity for SMEs. Registration is handled by the Ministry of Trade and Regional Integration (MoTRI).

**Typical processing time**: 5 business days
**Minimum registered capital**: ETB 15,000
**Minimum shareholders**: 2 (maximum: 50)

### Entity Types Supported

| Code | Name (English) | Name (Amharic) | Min Capital | Min Shareholders |
|------|----------------|----------------|-------------|-----------------|
| PLC | Private Limited Company | ኃ.የ.ማ | 15,000 ETB | 2 |
| SC | Share Company | አ.ማ | 50,000 ETB | 5 |
| OPPLC | One-Person PLC | አንድ አካል ኃ.የ.ማ | 15,000 ETB | 1 (max 1) |
| SOLE_TRADER | Sole Trader | ብቸኛ ነጋዴ | None | N/A |
| PARTNERSHIP | Partnership | ሽርክና | None | 2+ |

### Workflow Steps

```
DRAFT → SUBMITTED → UNDER_REVIEW (name-review) →
  → UNDER_REVIEW (document-verification) →
  → UNDER_REVIEW (registration-officer) →
  → UNDER_REVIEW (compliance-check) →
  → APPROVED → [Certificate issued via Digital Registries BB]
```

| Step | Role | Action |
|------|------|--------|
| name-review | name-reviewer | Check uniqueness of proposed company name; verify no trademark conflict |
| document-verification | document-verifier | Verify ID documents, Memorandum of Association, share structure |
| registration-officer | registration-officer | Final registration check; assign commercial registration number |
| compliance-check | compliance-checker | Tax ID validation; sector-specific license check |

### Determinant Rules

Determinants modify requirements based on form data:

1. **PLC minimum capital** — capital < 15,000 ETB → violation (Art. 510, Commercial Code 1243/2021)
2. **SC minimum capital** — capital < 50,000 ETB → violation
3. **SC minimum shareholders** — shareholders < 5 → violation (Art. 304, Commercial Code 1243/2021)
4. **OPPLC shareholder limit** — shareholders > 1 → violation
5. **High-capital surcharge** — capital > 1,000,000 ETB → additional registration fee (0.1% of capital)
6. **Foreign shareholder documents** — `has_foreign_shareholders: true` → additional docs: `foreign_investment_permit`, `investment_agreement`
7. **Financial sector license** — `sector: banking|insurance|microfinance` → additional doc: `nbe_authorization_letter` (National Bank of Ethiopia)
8. **Media sector license** — `sector: broadcasting|print_media` → additional doc: `eba_authorization_letter` (Ethiopian Broadcasting Authority)
9. **Addis Ababa clearance** — location = Addis Ababa → additional doc: `aaca_clearance` (Addis Ababa City Administration)

### Shareholder Validation

The workflow engine validates:
- **Shareholder count** per entity type (see table above)
- **Share percentage sum** must equal exactly 100% (±0.01% tolerance for floating-point)

Implementation: `src/workflows/business-registration.ts`

---

## 2. Trade License Renewal

### Overview

All businesses in Ethiopia must renew their trade license annually before the end of the Ethiopian fiscal year (EFY). The fiscal year runs from Meskerem 1 to Nehase 30 (approximately September 11 to September 10 in the Gregorian calendar).

**Typical processing time**: 3 business days
**Late penalty**: 10% of renewal fee per 30 days overdue
**License cancellation**: if more than 6 months overdue

### Ethiopian Fiscal Calendar

Ethiopia uses the Ge'ez calendar (Ethiopic calendar), which has 13 months:
- 12 months of 30 days each
- Pagume: 5 days (6 in a leap year)

The fiscal year ends on **Pagume 5** (non-leap year) or **Pagume 6** (leap year), which corresponds to:
- **September 10** (non-leap Gregorian year)
- **September 11** (Gregorian leap year)

The WorkflowEngine calculates this automatically via `ethiopianFiscalYearEnd(year)`.

### Fee Grades

| Grade | Annual Revenue | Base Renewal Fee |
|-------|----------------|------------------|
| Grade 1 | < ETB 100,000 | ETB 500 |
| Grade 2 | ETB 100,000 – 500,000 | ETB 1,000 |
| Grade 3 | > ETB 500,000 | ETB 2,000 |

Late penalty = `floor(daysLate / 30) * 0.10 * baseFee`

### Workflow Steps

```
DRAFT → SUBMITTED → UNDER_REVIEW (license-officer) →
  → [Payment BB: fee collection] →
  → APPROVED → [Digital Registries BB: license renewal record]
```

### Determinant Rules

1. **Address change** — `address_changed: true` → additional doc: `updated_lease_agreement`, triggers re-inspection
2. **Large employer** — `employee_count >= 50` → additional doc: `labor_clearance_certificate` (Ministry of Labour)
3. **Grade-based fee** — revenue tier determines base fee (see table)
4. **License cancellation check** — if > 6 months overdue, application is auto-rejected and cancellation flagged

Implementation: `src/workflows/trade-license-renewal.ts`

---

## 3. Manufacturing Permit

### Overview

Manufacturing businesses require a permit from the Ministry of Industry (MoI) in addition to a trade license. Permits are subject to Ethiopian Environmental and Social Impact Assessment (ESIA) requirements under Proclamation 299/2002.

**Typical processing time**: 14 business days (more for ESIA Category A)
**ESIA Authority**: Ethiopian Environmental and Forest Research Institute (EFRI) / regional environmental bureaus

### ESIA Categories

| Category | Description | Requirement |
|----------|-------------|-------------|
| A | High-impact: large-scale mining, cement, tanneries, large agro-industry | Full ESIA + public consultation (minimum 15 days) |
| B | Moderate-impact: medium-scale food processing, light manufacturing | Limited environmental assessment |
| C | Low-impact: handicraft, small food processing | Self-declaration only |

### Sector-Specific Requirements

| Sector | Additional Requirement |
|--------|----------------------|
| `food_processing` | EFDA manufacturing license (Ethiopian Food and Drug Authority) |
| `pharmaceuticals` | EFDA manufacturing license + Good Manufacturing Practice (GMP) certificate |
| `water-intensive` (uses_water_source: true) | Water use permit (Ethiopian Water Resources Authority) |
| `hazardous_materials` (uses_hazardous_materials: true) | Hazmat safety management plan |
| Large employer (> 100 workers) | EIC registration (Ethiopian Investment Commission) |

### Fee Structure

| Component | Amount (ETB) |
|-----------|-------------|
| Application fee | 1,000 |
| Inspection fee | 3,000 |
| ESIA (Category A) | 50,000 |
| ESIA (Category B) | 15,000 |
| ESIA (Category C) | 5,000 |

### Workflow Steps

```
DRAFT → SUBMITTED → UNDER_REVIEW (technical-assessment) →
  [If ESIA required] → UNDER_REVIEW (environmental-review) →
  → UNDER_REVIEW (permit-authority) →
  → APPROVED → [Digital Registries BB: permit record]
```

Implementation: `src/workflows/manufacturing-permit.ts`

---

## GovStack State Machine Mapping

All three workflows implement the GovStack Registration BB state machine:

```
ApplicationStatus enum:
  DRAFT        — applicant is filling the form
  SUBMITTED    — form submitted, awaiting operator pickup
  UNDER_REVIEW — one or more back-office tasks active
  RETURNED     — sent back to applicant for corrections
  APPROVED     — all steps complete, certificate issued
  REJECTED     — rejected at any step
  WITHDRAWN    — applicant withdrew
```

Transitions are enforced by `application.service.ts`. Invalid transitions throw `AppError.invalidWorkflowTransition(from, to)`.

---

## Workflow Determinant Engine

The `WorkflowEngine` class (`src/workflows/engine.ts`) evaluates determinants against submitted form data:

```typescript
type Determinant = {
  id: string;
  condition: Record<string, unknown>;  // form field conditions
  violation?: string;                  // error message if violated
  additionalDocuments?: string[];      // extra required docs
  additionalFees?: number;             // extra fee amount (ETB)
};

type EvaluationResult = {
  valid: boolean;
  violations: string[];
  additionalDocuments: string[];
  additionalFees: number;
};
```

Conditions support dot-notation for nested fields (e.g., `registered_address.region`) and comparison operators via field matching.
