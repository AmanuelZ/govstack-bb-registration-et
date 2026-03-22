import { config } from './index.js';

/**
 * Fayda / eSignet OIDC configuration.
 * Fayda is Ethiopia's MOSIP-based national digital identity system.
 * eSignet is the OIDC/OAuth2 layer on top of MOSIP.
 *
 * ACR values follow MOSIP's defined levels:
 * - mosip:idp:acr:generated-code  — OTP via registered phone/email
 * - mosip:idp:acr:biometrics      — Biometric authentication (fingerprint/iris/face)
 * - mosip:idp:acr:knowledge       — Knowledge-based (security questions)
 */
export const faydaConfig = {
  issuerUrl: config.faydaIssuerUrl,
  clientId: config.faydaClientId,
  clientAssertionType: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' as const,
  redirectUri: config.faydaRedirectUri,

  /** OIDC scopes requested */
  scopes: ['openid', 'profile', 'phone'] as const,

  /**
   * ACR (Authentication Context Reference) values.
   * Ordered by preference — eSignet will attempt highest-available.
   */
  acrValues: [
    'mosip:idp:acr:generated-code',
    'mosip:idp:acr:biometrics',
  ] as const,

  /**
   * Claims requested via OIDC claims parameter.
   * `individual_id` is the Fayda FIN derivative (PSUT — Pairwise Subject Token),
   * unique per RP to prevent cross-service tracking.
   */
  claims: {
    userinfo: {
      name: { essential: true },
      gender: { essential: false },
      birthdate: { essential: true },
      phone_number: { essential: true },
      address: { essential: false },
      individual_id: { essential: true },
    },
  },

  /** Well-known discovery URL */
  discoveryUrl: `${config.faydaIssuerUrl}/.well-known/openid-configuration`,

  /** Base64-encoded private key for private_key_jwt client authentication (optional) */
  privateKeyBase64: config.faydaPrivateKey,
};

export type FaydaConfig = typeof faydaConfig;
