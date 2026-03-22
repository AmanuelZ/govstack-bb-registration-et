/**
 * Fayda/eSignet identity claims.
 * Fayda is Ethiopia's MOSIP-based national digital identity system.
 * eSignet is the OIDC/OAuth2 layer built on MOSIP.
 */
export interface FaydaTokenClaims {
  /** PSUT — Pairwise Subject Token. Unique per RP, derived from Fayda FIN */
  sub: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  nonce?: string;
  /** Authentication context reference */
  acr?: string;
  /** Fayda FIN derivative (returned if scope allows) */
  individual_id?: string;
}

export interface FaydaUserInfo {
  sub: string;
  name?: string;
  name_am?: string;
  gender?: 'male' | 'female';
  birthdate?: string;
  phone_number?: string;
  /** Fayda FIN — present when individual_id claim is granted */
  individual_id?: string;
  address?: {
    formatted?: string;
    region?: string;
  };
}

export interface OIDCSession {
  userId: string;
  faydaPsut: string;
  roles: string[];
  faydaClaims: FaydaUserInfo;
  issuedAt: number;
  expiresAt: number;
}
