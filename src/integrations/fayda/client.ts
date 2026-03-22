import { Issuer, generators, type Client } from 'openid-client';
import { faydaConfig } from '../../config/fayda.js';
import { logger } from '../../common/logger.js';
import type { FaydaUserInfo } from './types.js';

let oidcClient: Client | undefined;

/**
 * Get or initialize the eSignet OIDC client.
 * Discovers issuer metadata from the well-known endpoint on first call.
 */
export async function getFaydaClient(): Promise<Client> {
  if (oidcClient) return oidcClient;

  logger.info({ issuerUrl: faydaConfig.issuerUrl }, 'Discovering Fayda eSignet OIDC metadata');

  const issuer = await Issuer.discover(faydaConfig.discoveryUrl);

  logger.info(
    {
      issuer: issuer.issuer,
      tokenEndpoint: issuer.token_endpoint,
      userinfoEndpoint: issuer.userinfo_endpoint,
    },
    'Fayda eSignet OIDC metadata discovered',
  );

  oidcClient = new issuer.Client({
    client_id: faydaConfig.clientId,
    // Use private_key_jwt if private key is configured, otherwise none for dev
    token_endpoint_auth_method: faydaConfig.privateKeyBase64 ? 'private_key_jwt' : 'none',
    redirect_uris: [faydaConfig.redirectUri],
    response_types: ['code'],
  });

  return oidcClient;
}

/**
 * Generate an authorization URL for the Fayda eSignet login flow.
 * Returns the URL to redirect the user to and the PKCE code verifier for the callback.
 */
export async function generateAuthorizationUrl(state?: string): Promise<{
  url: string;
  codeVerifier: string;
  state: string;
  nonce: string;
}> {
  const client = await getFaydaClient();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const nonce = generators.nonce();
  const authState = state ?? generators.state();

  const url = client.authorizationUrl({
    scope: faydaConfig.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: authState,
    nonce,
    acr_values: faydaConfig.acrValues.join(' '),
    claims: JSON.stringify(faydaConfig.claims),
  });

  return { url, codeVerifier, state: authState, nonce };
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  expectedNonce: string,
): Promise<{ userInfo: FaydaUserInfo; idTokenClaims: Record<string, unknown> }> {
  const client = await getFaydaClient();

  const tokenSet = await client.callback(faydaConfig.redirectUri, { code }, {
    code_verifier: codeVerifier,
    nonce: expectedNonce,
  });

  const userInfo = await client.userinfo(tokenSet.access_token ?? '') as FaydaUserInfo;
  const idTokenClaims = tokenSet.claims() as Record<string, unknown>;

  return { userInfo, idTokenClaims };
}
