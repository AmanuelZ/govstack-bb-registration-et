# Privacy Policy

**Effective Date:** 2024-01-01
**Governed by:** Ethiopian Data Protection Proclamation 1038/2011
**Administered by:** Ministry of Trade and Regional Integration, Federal Democratic Republic of Ethiopia

---

## 1. Overview

This Privacy Policy describes how the GovStack Registration Building Block (`govstack-bb-registration-et`) collects, uses, stores, shares, and protects personal data in the course of delivering digital government registration services to natural persons and legal entities in Ethiopia.

This system operates in accordance with the **Ethiopian Data Protection Proclamation No. 1038/2011**, the **Ethiopian Commercial Code Proclamation No. 1243/2021**, and aligned GovStack privacy requirements (CFR 5.5).

---

## 2. Data Collected

### 2.1 Identity Data (via Fayda / eSignet)

- **Pairwise Subject Unique Token (PSUT):** A cryptographic, pairwise token issued by the Fayda National ID System (MOSIP-based) per service. The raw Fayda Identification Number (FIN) is **never stored** by this system.
- **Ethiopian National ID Number (FIN):** Presented by the user during authentication but immediately resolved to a PSUT by the eSignet OIDC layer. Only the PSUT is persisted.
- **Verified claims from Fayda:** Full name, date of birth, gender, and address as released by the Fayda identity provider during the OpenID Connect flow, subject to the user's consent at the Fayda authentication screen.

### 2.2 Business Registration Data

- Business name, proposed trade name, and business type (sole proprietorship, partnership, PLC, share company)
- Business sector and sub-sector classification
- Principal place of business address (region, woreda, kebele, street address)
- Stated capital and shareholder information where required by the Commercial Code
- Contact telephone number and email address of the applicant

### 2.3 Trade License Data

- Existing trade license number and issuing authority
- License category and sub-category
- Previous renewal history (dates, status, officer reference)
- Declared business activities for the renewal period

### 2.4 Manufacturing Permit Data

- Facility address and GPS coordinates (optional, where submitted)
- Production capacity declaration
- Product categories and relevant HS/customs codes
- Environmental and safety compliance declarations

### 2.5 Uploaded Documents

- Scanned copies of identity documents, memoranda of association, tax registration certificates, lease agreements, environmental permits, and other supporting materials required per workflow
- Document metadata: filename, MIME type, file size, upload timestamp, uploader identity (PSUT-linked)

### 2.6 Audit Logs

- Actor identifier (PSUT or operator employee ID), action performed, resource type and ID, HTTP method, endpoint path, outcome status, and UTC timestamp
- IP addresses of operators accessing the administrative interface
- Correlation IDs linking related log entries across distributed components

### 2.7 Application Processing Data

- Application status transitions and timestamps
- Assigned reviewer / officer identity
- Review notes and rejection reasons (where applicable)
- Fee payment reference numbers and payment status (amount, currency, payer reference; no raw card or bank account data)

---

## 3. How Data Is Used

| Purpose | Legal Basis |
|---|---|
| Delivering the requested registration service (business registration, trade license renewal, manufacturing permit) | Performance of a public task (Proclamation 1038/2011, Art. 5) |
| Verifying applicant identity against the Fayda National ID registry | Legal obligation |
| Generating legally valid certificates and trade licenses | Performance of a public task; Ethiopian Commercial Code 1243/2021 |
| Collecting applicable government fees and issuing receipts | Legal obligation |
| Maintaining an immutable audit trail of all administrative actions | Legal obligation (Proclamation 1038/2011, Art. 14; public-sector record-keeping requirements) |
| Statistical reporting on service delivery volumes and turnaround times | Public interest / government accountability |
| Detecting and preventing fraud, system abuse, or unauthorized access | Legitimate interest of the public authority |

Data is **not used for commercial profiling**, sold to third parties, or used for purposes incompatible with those listed above.

---

## 4. Data Retention

| Data Category | Retention Period | Authority |
|---|---|---|
| Business registration applications and certificates | **10 years** from date of issuance or final rejection | Ethiopian Commercial Code 1243/2021, record-keeping provisions |
| Trade license renewal records | **10 years** from last renewal | Ethiopian Commercial Code 1243/2021 |
| Manufacturing permit records | **10 years** from issuance or expiry | Ministry of Trade internal policy; sector regulations |
| Uploaded documents | **10 years** from upload, linked to the associated application record | Ethiopian Commercial Code 1243/2021 |
| Audit logs | **7 years** from log creation date | Ethiopian Data Protection Proclamation 1038/2011, Art. 14; public-sector audit requirements |
| Fee payment records | **10 years** from transaction date | Ethiopian Tax Authority record-keeping regulations |
| Session tokens and OAuth state | **15 minutes** (access token TTL) / **8 hours** (session cookie) | Operational necessity only |

On expiry of the retention period, data is deleted or anonymised in accordance with a documented data disposal procedure maintained by the Ministry of Trade.

---

## 5. PII Protections

### 5.1 Encryption at Rest

All fields in the database that contain Personally Identifiable Information (PII) — including names, addresses, and identity-linked tokens — are encrypted at the application layer using **AES-256-GCM** before being written to PostgreSQL. Encryption keys are managed via environment-level secrets and are never stored alongside the ciphertext.

### 5.2 Fayda PSUT and No Raw FIN Storage

The Fayda eSignet integration uses OpenID Connect with the `sub` claim set to a **Pairwise Subject Unique Token (PSUT)**, which is unique to the combination of the Fayda subscriber and this relying party. The raw Fayda Identification Number (FIN, analogous to a national ID number) is **never transmitted to or stored by this system**. This architectural decision prevents cross-system correlation of a citizen's national ID number across unrelated government services.

### 5.3 Redacted Logs

The Pino-based structured logger is configured with a serializer that redacts the following fields from all log output before writing to any sink: `authorization`, `x-api-key`, `password`, `nationalId`, `fin`, `psut`, `email`, `phone`, `dob`. Log entries containing request/response bodies strip PII fields automatically.

### 5.4 Transport Security

All communications between clients and the system, and between the system and external Building Blocks (via the Information Mediator), use **TLS 1.2 or higher**. Plain-text HTTP connections are rejected at the load balancer / reverse proxy layer.

### 5.5 Access Control

- Citizens can only access their own application records, enforced by PSUT-scoped queries.
- Ministry operators are assigned role-based access (reviewer, approver, administrator) with the principle of least privilege.
- Administrative endpoints require both a valid JWT and a valid Information Mediator `X-GovStack-Client` header.

---

## 6. Cross-Building-Block Data Sharing

Data is shared with other GovStack Building Blocks solely for the purpose of delivering the registration service. All inter-BB communication is routed through the **Information Mediator Building Block** and carries a validated `X-GovStack-Client` header identifying the calling system.

| Recipient BB | Data Shared | Purpose |
|---|---|---|
| **Digital Registries BB** | Issued certificate metadata (certificate number, applicant PSUT-linked reference, issue date, expiry date, certificate type) | Long-term official record storage and cross-ministry certificate verification |
| **Payment BB** | Fee amount, currency, application reference number, payer PSUT-linked reference | Initiating fee collection and reconciling payment status |
| **Fayda / eSignet (Identity BB)** | Authorization code, PKCE verifier (outbound only) | Authenticating the applicant; receiving verified identity claims |

No data is shared with foreign governments, commercial entities, or organisations outside the scope of Ethiopian government service delivery without explicit legal authorisation.

---

## 7. User Rights

Under the Ethiopian Data Protection Proclamation 1038/2011, data subjects have the following rights:

### 7.1 Right of Access
You may request a copy of the personal data held about you in this system. Requests will be fulfilled within **30 calendar days**.

### 7.2 Right of Correction
If data held about you is inaccurate or incomplete, you may request correction. Identity data (name, date of birth) that was sourced from the Fayda National ID registry must be corrected at the Fayda level first.

### 7.3 Right of Deletion
You may request deletion of personal data that is no longer required for the original purpose, subject to legal retention obligations. Data that must be retained under the Ethiopian Commercial Code or audit-trail requirements cannot be deleted before the end of the mandatory retention period.

### 7.4 Right to Object
You may object to processing where it is based on legitimate interest rather than legal obligation or public task. Objections related to statistical processing will be considered; objections related to mandatory audit trails cannot be accommodated.

### 7.5 How to Submit a Request

Submit all data rights requests in writing (letter or email) to:

**Ministry of Trade and Regional Integration**
Data Protection Officer
P.O. Box 704
Addis Ababa, Federal Democratic Republic of Ethiopia
Email: dataprotection@trade.gov.et

You must provide proof of identity when submitting a request. Requests will be acknowledged within **5 business days** and completed within **30 calendar days**, with a possible extension of a further 30 days for complex requests.

---

## 8. Cookies and Session Management

This system does not use tracking or advertising cookies. It uses a single **HttpOnly, Secure, SameSite=Strict** session cookie solely to maintain an authenticated session during your interaction with the registration portal. This cookie expires at the end of your session or after 8 hours of inactivity, whichever is sooner.

---

## 9. Changes to This Policy

Material changes to this Privacy Policy will be published on the Ministry of Trade and Regional Integration website with a minimum of **30 days' notice** before taking effect, except where changes are required immediately by law.

---

## 10. Contact

**Ministry of Trade and Regional Integration**
Addis Ababa, Federal Democratic Republic of Ethiopia
Website: https://www.trade.gov.et
Email: dataprotection@trade.gov.et
Telephone: +251 11 551 8025

---

*This document was prepared in accordance with the GovStack Registration Building Block specification and the Ethiopian Data Protection Proclamation No. 1038/2011.*
