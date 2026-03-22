/**
 * Mock Fayda eSignet OIDC Provider
 *
 * Implements the minimal OIDC endpoints required by the registration BB:
 * - GET  /.well-known/openid-configuration
 * - GET  /v1/esignet/oauth/.well-known/jwks.json
 * - GET  /authorize
 * - POST /v1/esignet/oauth/v2/token
 * - GET  /v1/esignet/oidc/userinfo
 *
 * Test users (realistic Ethiopian identities with mock Fayda FINs):
 * - test_applicant      → Ayantu Bekele Gemechu   (ETH001234567890) — applicant
 * - test_name_reviewer  → Dawit Haile Tesfaye      (ETH001234567891) — operator:name-reviewer
 * - test_doc_verifier   → Mekdes Alemu Worku        (ETH001234567892) — operator:document-verifier
 * - test_reg_officer    → Yonas Girma Tadesse        (ETH001234567893) — operator:registration-officer
 *
 * Usage (login_hint query param selects the test user):
 *   GET /authorize?...&login_hint=test_applicant
 */

'use strict';

const express = require('express');
const { SignJWT, generateKeyPair, exportJWK } = require('jose');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = parseInt(process.env.PORT || '4011', 10);
const ISSUER = process.env.ISSUER || `http://localhost:${PORT}`;

// RSA key pair generated at startup — used to sign ID tokens.
let keyPair;
let publicJwk;

const TEST_USERS = {
  test_applicant: {
    sub: 'psut_ayantu_bekele_001',
    individual_id: 'ETH001234567890',
    name: 'Ayantu Bekele Gemechu',
    name_am: 'አያንቱ በቀለ ገመቹ',
    gender: 'female',
    birthdate: '1990-03-14',
    phone_number: '+251911234567',
    roles: ['applicant'],
  },
  test_name_reviewer: {
    sub: 'psut_dawit_haile_002',
    individual_id: 'ETH001234567891',
    name: 'Dawit Haile Tesfaye',
    name_am: 'ዳዊት ኃይሌ ተስፋዬ',
    gender: 'male',
    birthdate: '1985-07-22',
    phone_number: '+251922345678',
    roles: ['operator:name-reviewer'],
  },
  test_doc_verifier: {
    sub: 'psut_mekdes_alemu_003',
    individual_id: 'ETH001234567892',
    name: 'Mekdes Alemu Worku',
    name_am: 'መቅደስ አለሙ ወርቁ',
    gender: 'female',
    birthdate: '1988-11-05',
    phone_number: '+251933456789',
    roles: ['operator:document-verifier'],
  },
  test_reg_officer: {
    sub: 'psut_yonas_girma_004',
    individual_id: 'ETH001234567893',
    name: 'Yonas Girma Tadesse',
    name_am: 'ዮናስ ግርማ ታደሰ',
    gender: 'male',
    birthdate: '1982-04-30',
    phone_number: '+251944567890',
    roles: [
      'operator:registration-officer',
      'operator:license-officer',
      'operator:permit-authority',
    ],
  },
};

// In-memory store: authorization codes and access tokens.
// TTL-based expiry is enforced on read; no background cleanup needed for dev use.
const authCodes = new Map();

async function init() {
  keyPair = await generateKeyPair('RS256', { modulusLength: 2048 });
  publicJwk = {
    ...(await exportJWK(keyPair.publicKey)),
    kid: 'mock-fayda-key-1',
    use: 'sig',
    alg: 'RS256',
  };
  console.log(`[mock-fayda] RSA key pair generated`);
  console.log(`[mock-fayda] Issuer: ${ISSUER}`);
}

// ─── OIDC Discovery ───────────────────────────────────────────────────────────

app.get('/.well-known/openid-configuration', (_req, res) => {
  res.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/authorize`,
    token_endpoint: `${ISSUER}/v1/esignet/oauth/v2/token`,
    userinfo_endpoint: `${ISSUER}/v1/esignet/oidc/userinfo`,
    jwks_uri: `${ISSUER}/v1/esignet/oauth/.well-known/jwks.json`,
    scopes_supported: ['openid', 'profile', 'phone'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['pairwise'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['private_key_jwt'],
    claims_supported: [
      'sub',
      'name',
      'gender',
      'birthdate',
      'phone_number',
      'individual_id',
    ],
    acr_values_supported: [
      'mosip:idp:acr:generated-code',
      'mosip:idp:acr:biometrics',
    ],
  });
});

// ─── JWKS ─────────────────────────────────────────────────────────────────────

app.get('/v1/esignet/oauth/.well-known/jwks.json', (_req, res) => {
  res.json({ keys: [publicJwk] });
});

// ─── Authorization endpoint ───────────────────────────────────────────────────
// Simplified: auto-approves, no consent screen. Suitable for automated tests only.

app.get('/authorize', (req, res) => {
  const { redirect_uri, state, nonce, login_hint } = req.query;

  if (!redirect_uri || typeof redirect_uri !== 'string') {
    return res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri required' });
  }

  const userKey = typeof login_hint === 'string' && login_hint in TEST_USERS
    ? login_hint
    : 'test_applicant';
  const testUser = TEST_USERS[userKey];

  const code = crypto.randomUUID();
  authCodes.set(code, {
    user: testUser,
    nonce: typeof nonce === 'string' ? nonce : undefined,
    expiresAt: Date.now() + 60_000, // 60 second code TTL
  });

  // Schedule cleanup to avoid unbounded map growth
  setTimeout(() => authCodes.delete(code), 60_000);

  let redirectUrl;
  try {
    redirectUrl = new URL(redirect_uri);
  } catch {
    return res.status(400).json({ error: 'invalid_request', error_description: 'invalid redirect_uri' });
  }

  redirectUrl.searchParams.set('code', code);
  if (typeof state === 'string') redirectUrl.searchParams.set('state', state);

  res.redirect(302, redirectUrl.toString());
});

// ─── Token endpoint ───────────────────────────────────────────────────────────

app.post('/v1/esignet/oauth/v2/token', async (req, res) => {
  const { code, grant_type } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'invalid_request', error_description: 'code required' });
  }

  const entry = authCodes.get(code);
  if (!entry || Date.now() > entry.expiresAt) {
    authCodes.delete(code);
    return res.status(400).json({ error: 'invalid_grant', error_description: 'code expired or invalid' });
  }
  authCodes.delete(code); // authorization codes are single-use

  const { user, nonce } = entry;
  const now = Math.floor(Date.now() / 1000);

  const idTokenPayload = {
    sub: user.sub,
    iss: ISSUER,
    aud: process.env.CLIENT_ID || 'govstack-registration-et',
    iat: now,
    exp: now + 3600,
    acr: 'mosip:idp:acr:generated-code',
    individual_id: user.individual_id,
    name: user.name,
    ...(nonce ? { nonce } : {}),
  };

  const idToken = await new SignJWT(idTokenPayload)
    .setProtectedHeader({ alg: 'RS256', kid: 'mock-fayda-key-1' })
    .sign(keyPair.privateKey);

  const accessToken = crypto.randomBytes(32).toString('hex');

  // Store access token → user mapping with TTL for userinfo endpoint
  authCodes.set(`at:${accessToken}`, {
    user,
    expiresAt: Date.now() + 3_600_000, // 1 hour
  });
  setTimeout(() => authCodes.delete(`at:${accessToken}`), 3_600_000);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    id_token: idToken,
    scope: 'openid profile phone',
  });
});

// ─── UserInfo endpoint ────────────────────────────────────────────────────────

app.get('/v1/esignet/oidc/userinfo', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'invalid_token', error_description: 'Bearer token required' });
  }

  const token = authHeader.slice(7);
  const entry = authCodes.get(`at:${token}`);

  if (!entry || Date.now() > entry.expiresAt) {
    authCodes.delete(`at:${token}`);
    return res.status(401).json({ error: 'invalid_token', error_description: 'Token expired or invalid' });
  }

  const { user } = entry;
  res.json({
    sub: user.sub,
    name: user.name,
    gender: user.gender,
    birthdate: user.birthdate,
    phone_number: user.phone_number,
    individual_id: user.individual_id,
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

init()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[mock-fayda] Listening on port ${PORT}`);
      console.log(`[mock-fayda] Discovery: ${ISSUER}/.well-known/openid-configuration`);
      console.log(`[mock-fayda] Test users: ${Object.keys(TEST_USERS).join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('[mock-fayda] Fatal startup error:', err);
    process.exit(1);
  });
