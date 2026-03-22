/**
 * Shared TypeScript types aligned with GovStack Registration BB specification.
 * All IDs are UUIDs. All timestamps are ISO 8601 UTC strings.
 */

/** GovStack Information Mediator client identifier */
export interface IMClient {
  instance: string;
  memberClass: string;
  memberCode: string;
  subsystem: string;
}

/** Standard GovStack error response */
export interface GovStackError {
  code: string;
  message: string;
  correlationId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Application status values per GovStack Registration BB spec */
export type ApplicationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT_BACK'
  | 'WITHDRAWN'
  | 'EXPIRED';

/** Task status values */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REASSIGNED';

/** Task action — operator decision on a task */
export type TaskAction = 'APPROVE' | 'REJECT' | 'SEND_BACK' | 'REQUEST_INFO';

/** User role within the system */
export type UserRole =
  | 'applicant'
  | 'operator:name-reviewer'
  | 'operator:document-verifier'
  | 'operator:registration-officer'
  | 'operator:compliance-checker'
  | 'operator:license-officer'
  | 'operator:technical-assessor'
  | 'operator:environmental-officer'
  | 'operator:permit-authority'
  | 'admin'
  | 'system';

/** Fayda identity claims extracted from eSignet OIDC token */
export interface FaydaClaims {
  sub: string;           // PSUT — Pairwise Subject Token (Fayda FIN derivative)
  name?: string;         // Full name in Latin script
  nameAm?: string;       // Full name in Amharic
  gender?: string;
  birthdate?: string;
  phoneNumber?: string;
  individualId?: string; // Fayda FIN (returned if scope allows)
}

/** Authenticated request context */
export interface RequestContext {
  correlationId: string;
  userId: string;
  userRole: UserRole;
  faydaClaims?: FaydaClaims;
  imClient?: IMClient;
}

/** Bilingual text — Amharic + English */
export interface BilingualText {
  en: string;
  am: string;
}

/** Ethiopian address structure */
export interface EthiopianAddress {
  region: string;
  subCity?: string;
  woreda: string;
  kebele?: string;
  houseNumber?: string;
}

/** GPS coordinates */
export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}
