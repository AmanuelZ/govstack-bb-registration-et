import { createSigner, createVerifier } from 'fast-jwt';
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../../config/index.js';
import { AppError } from '../../common/errors.js';
import type { OIDCSession } from './types.js';
import type { UserRole } from '../../common/types.js';

// FastifyReply is used in the plugin type signature via Fastify internals; keep import.
void (undefined as unknown as FastifyReply);

type SignerFn = (payload: Record<string, unknown>) => string;

let signerInstance: SignerFn | undefined;

function getSigner(): SignerFn {
  if (!signerInstance) {
    signerInstance = createSigner({ key: config.jwtSecret, expiresIn: config.jwtExpiry }) as SignerFn;
  }
  return signerInstance;
}

const verifier = createVerifier({ key: config.jwtSecret });

/**
 * Issue an internal session JWT after successful Fayda authentication.
 */
export function issueSessionJwt(session: Omit<OIDCSession, 'issuedAt' | 'expiresAt'>): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: OIDCSession = {
    ...session,
    issuedAt: now,
    expiresAt: now + 8 * 3600,
  };
  return getSigner()(payload as unknown as Record<string, unknown>);
}

/**
 * Verify and decode an internal session JWT.
 */
export function verifySessionJwt(token: string): OIDCSession {
  try {
    return verifier(token) as OIDCSession;
  } catch {
    throw AppError.unauthorized('Invalid or expired session token');
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    session: OIDCSession | undefined;
    userId: string | undefined;
    userRoles: UserRole[];
  }
}

/**
 * Authentication plugin — extracts and verifies session JWT from Authorization header.
 * Also supports X-API-Key: dev:<userId> for development.
 * Sets request.session, request.userId, request.userRoles on authenticated requests.
 */
const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('session', undefined);
  fastify.decorateRequest('userId', undefined);
  fastify.decorateRequest('userRoles', null);

  fastify.addHook('onRequest', async (request) => {
    // Skip auth for public endpoints
    if (
      request.url.startsWith('/api/v1/health') ||
      request.url.startsWith('/api/v1/ready') ||
      request.url.startsWith('/docs') ||
      request.url.startsWith('/api/v1/auth')
    ) {
      request.userRoles = [];
      return;
    }

    // Dev mode: X-API-Key: dev:<userId>
    const apiKey = request.headers['x-api-key'] as string | undefined;
    if (config.nodeEnv !== 'production' && apiKey?.startsWith('dev:')) {
      const userId = apiKey.slice(4);
      request.userId = userId;
      request.userRoles = ['applicant'] as UserRole[];
      request.session = undefined;
      return;
    }

    // Production: Bearer JWT
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing Bearer token. Use Authorization: Bearer <jwt>');
    }

    const token = authHeader.slice(7);
    const session = verifySessionJwt(token);

    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      throw AppError.unauthorized('Session token has expired');
    }

    request.session = session;
    request.userId = session.userId;
    request.userRoles = session.roles as UserRole[];
  });
};

export default fp(authPlugin, { name: 'auth' });
