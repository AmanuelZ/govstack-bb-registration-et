# Fayda / eSignet Integration Guide

## Overview

[Fayda](https://fayda.et) is Ethiopia's national digital identity system, built on [MOSIP](https://mosip.io) (Modular Open Source Identity Platform). [eSignet](https://esignet.io) provides the OpenID Connect (OIDC) authentication layer over MOSIP.

This document explains how the GovStack Registration BB integrates with Fayda for citizen authentication.

---

## Authentication Flow

```
Citizen                Registration BB          eSignet (Fayda)
   │                         │                        │
   │  GET /api/v1/auth/login  │                        │
   │─────────────────────────>│                        │
   │                         │  Discover OIDC metadata │
   │                         │────────────────────────>│
   │                         │<────────────────────────│
   │                         │  Generate PKCE          │
   │                         │  code_verifier + state  │
   │  302 → eSignet           │                        │
   │<─────────────────────────│                        │
   │                         │                        │
   │  GET /authorize?...      │                        │
   │─────────────────────────────────────────────────>│
   │  (citizen authenticates via OTP or biometrics)   │
   │<─────────────────────────────────────────────────│
   │  302 → /api/v1/auth/callback?code=...            │
   │─────────────────────────>│                        │
   │                         │  POST /token            │
   │                         │  (code + code_verifier) │
   │                         │────────────────────────>│
   │                         │  id_token + access_token│
   │                         │<────────────────────────│
   │                         │  GET /userinfo          │
   │                         │────────────────────────>│
   │                         │  { sub, name, email }   │
   │                         │<────────────────────────│
   │                         │  Upsert user in DB      │
   │                         │  Issue session JWT      │
   │  { jwt, user }           │                        │
   │<─────────────────────────│                        │
```

---

## Key Security Properties

### PKCE (Proof Key for Code Exchange)

Every authorization request uses PKCE (RFC 7636):

1. `code_verifier` — random 64-byte string, generated per-request
2. `code_challenge` = `BASE64URL(SHA256(code_verifier))`
3. `code_challenge_method: S256` sent in authorization URL
4. `code_verifier` sent in token exchange — eSignet verifies

This prevents authorization code interception attacks. The `code_verifier` is stored server-side (in-memory Map with 5-minute TTL) keyed by `state` parameter.

### Pairwise Subject Tokens (PSUT)

Fayda issues a unique `sub` claim to each relying party (RP). The `sub` value returned to the Registration BB is a PSUT — a hash of the citizen's actual Fayda ID (FIN) and this specific RP's identifier. This means:

- The Registration BB **never sees the citizen's raw FIN**
- Cross-service identity correlation is prevented at the protocol level
- Citizens cannot be tracked across different government services using the same identifier

The PSUT is stored as `faydaId` in the `User` model.

### ACR Values

The authorization request specifies acceptable authentication methods via `acr_values`:

| ACR Value | Method |
|-----------|--------|
| `mosip:idp:acr:generated-code` | OTP sent to registered phone |
| `mosip:idp:acr:biometrics` | Fingerprint or iris via MOSIP |

The Registration BB requests OTP by default. Biometrics can be requested for higher-assurance operations.

---

## Configuration

All Fayda configuration is in `src/config/index.ts` and read from environment:

```bash
# eSignet discovery URL (append /.well-known/openid-configuration)
FAYDA_ISSUER_URL=https://esignet.fayda.et

# Client credentials registered with eSignet
FAYDA_CLIENT_ID=govstack-registration-et

# Must match exactly what is registered in eSignet
FAYDA_REDIRECT_URI=https://registration.govstack.et/api/v1/auth/callback

# Enable mock eSignet for local development
MOCK_FAYDA_ENABLED=true
```

---

## Mock eSignet Server

For local development, a mock eSignet server is provided at `mock-fayda/`. It:

- Exposes OIDC discovery at `http://localhost:4011/.well-known/openid-configuration`
- Accepts any `code_challenge` (no PKCE validation in mock)
- Returns pre-configured test identities based on `login_hint`

### Test Identities

| Login Hint | Name | Roles |
|------------|------|-------|
| `ET-TEST-001` | Ayantu Bekele Gemechu | applicant |
| `ET-TEST-002` | Dawit Haile Tesfaye | applicant |
| `ET-TEST-003` | Mekdes Alemu Worku | operator |
| `ET-TEST-004` | Yonas Girma Tadesse | admin |

### Dev Mode Shortcut

In development (`NODE_ENV=development`), the auth middleware accepts an `X-API-Key` header as an alternative to JWT:

```bash
curl -H "X-API-Key: dev:ET-TEST-002" http://localhost:3001/api/v1/auth/me
```

This sets `request.userId` to the provided value without any JWT verification, allowing development without going through the full OIDC flow.

**This shortcut is disabled in production.**

---

## Production Deployment

For production deployment against the live Fayda/eSignet:

1. **Register with Fayda**: Contact the Ethiopian National ID Program (NIDP) to register as an eSignet relying party. You will receive a `client_id`.

2. **Provide redirect URI**: Register `https://your-domain/api/v1/auth/callback` with eSignet.

3. **Set environment variables**:
   ```bash
   FAYDA_ISSUER_URL=https://esignet.fayda.et
   FAYDA_CLIENT_ID=<your-client-id>
   FAYDA_REDIRECT_URI=https://your-domain/api/v1/auth/callback
   MOCK_FAYDA_ENABLED=false
   JWT_SECRET=<strong-random-secret-32+-chars>
   ```

4. **Disable dev auth**: Ensure `MOCK_FAYDA_ENABLED=false`. The `X-API-Key: dev:*` shortcut is automatically disabled in production.

---

## Session JWT Structure

After successful authentication, the server issues a session JWT (`fast-jwt`):

```json
{
  "sub": "user-uuid",
  "roles": ["applicant"],
  "faydaId": "PSUT-derived-value",
  "iat": 1705312200,
  "exp": 1705398600
}
```

- **Expiry**: 24 hours
- **Algorithm**: HS256 (HMAC-SHA256 with `JWT_SECRET`)
- **Claims**: `sub` (internal user UUID), `roles`, `faydaId` (PSUT)

The client should send this JWT in the `Authorization: Bearer <token>` header on all subsequent requests.

---

## References

- [eSignet Documentation](https://docs.esignet.io)
- [MOSIP Documentation](https://docs.mosip.io)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [Fayda National ID Program](https://fayda.et)
