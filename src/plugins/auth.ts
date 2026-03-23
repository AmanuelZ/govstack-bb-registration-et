import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPrismaClient } from '../config/database.js';
import { generateAuthorizationUrl, exchangeCodeForTokens } from '../integrations/fayda/client.js';
import { issueSessionJwt } from '../integrations/fayda/middleware.js';
import { config } from '../config/index.js';
import { logger } from '../common/logger.js';

// In-memory PKCE store (use Redis in production)
const pkceStore = new Map<string, { codeVerifier: string; nonce: string; expiresAt: number }>();

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/auth/login
   * Redirects to Fayda eSignet authorization endpoint.
   * Query param: ?login_hint=test_applicant (dev only, for mock provider)
   */
  fastify.get(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Initiate Fayda/eSignet login',
        description: 'Redirects to the Fayda eSignet authorization endpoint. Returns 302 redirect.',
        querystring: {
          type: 'object',
          properties: {
            login_hint: {
              type: 'string',
              description:
                'Development only: hint for mock provider (test_applicant, test_name_reviewer, etc.)',
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { url, codeVerifier, state, nonce } = await generateAuthorizationUrl();

      // Store PKCE verifier keyed by state (5 minute TTL)
      pkceStore.set(state, {
        codeVerifier,
        nonce,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      // Clean expired entries
      for (const [key, value] of pkceStore.entries()) {
        if (value.expiresAt < Date.now()) pkceStore.delete(key);
      }

      const loginHint = (request.query as Record<string, string | undefined>)['login_hint'];
      const redirectUrl = loginHint ? `${url}&login_hint=${encodeURIComponent(loginHint)}` : url;

      void reply.redirect(redirectUrl);
    },
  );

  /**
   * GET /api/v1/auth/callback
   * Handles the authorization code callback from Fayda eSignet.
   * Creates or updates the local user record and issues a session JWT.
   */
  fastify.get(
    '/auth/callback',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Fayda/eSignet OIDC callback',
        description:
          'Receives the authorization code from Fayda eSignet, exchanges it for tokens, and issues a session JWT.',
        querystring: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
            error: { type: 'string' },
            error_description: { type: 'string' },
          },
          required: ['code', 'state'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string', description: 'Session JWT for subsequent API calls' },
              userId: { type: 'string', format: 'uuid' },
              roles: { type: 'array', items: { type: 'string' } },
              name: { type: 'string' },
              expiresIn: { type: 'integer', description: 'Token validity in seconds' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;

      if (query['error']) {
        logger.warn(
          { error: query['error'], description: query['error_description'] },
          'Fayda auth error',
        );
        return reply.status(401).send({
          code: 'BB-REG-4201',
          message: `Authentication failed: ${query['error_description'] ?? query['error']}`,
          correlationId: request.correlationId,
          timestamp: new Date().toISOString(),
        });
      }

      const code = query['code'];
      const state = query['state'];

      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      const pkce = pkceStore.get(state);
      if (!pkce || pkce.expiresAt < Date.now()) {
        return reply.status(400).send({
          code: 'BB-REG-4201',
          message: 'Invalid or expired authorization state',
          correlationId: request.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
      pkceStore.delete(state);

      const { userInfo } = await exchangeCodeForTokens(code, pkce.codeVerifier, pkce.nonce);

      const prisma = getPrismaClient();

      // Upsert user record linked to Fayda PSUT
      const user = await prisma.user.upsert({
        where: { faydaPsut: userInfo.sub },
        update: {
          fullName: userInfo.name ?? 'Unknown',
          ...(userInfo.name_am !== undefined && { fullNameAm: userInfo.name_am }),
          ...(userInfo.phone_number !== undefined && { phoneNumber: userInfo.phone_number }),
          lastLoginAt: new Date(),
        },
        create: {
          faydaPsut: userInfo.sub,
          ...(userInfo.individual_id !== undefined && { faydaFin: userInfo.individual_id }),
          fullName: userInfo.name ?? 'Unknown',
          ...(userInfo.name_am !== undefined && { fullNameAm: userInfo.name_am }),
          ...(userInfo.phone_number !== undefined && { phoneNumber: userInfo.phone_number }),
          roles: ['applicant'],
          lastLoginAt: new Date(),
        },
      });

      const token = issueSessionJwt({
        userId: user.id,
        faydaPsut: user.faydaPsut,
        roles: user.roles,
        faydaClaims: userInfo,
      });

      logger.info(
        { userId: user.id, psut: user.faydaPsut.slice(0, 8) + '***', roles: user.roles },
        'User authenticated via Fayda',
      );

      void reply.send({
        token,
        userId: user.id,
        roles: user.roles,
        name: user.fullName,
        expiresIn: 8 * 3600,
      });
    },
  );

  /**
   * GET /api/v1/auth/me
   * Returns the current user's profile (requires valid session JWT).
   */
  fastify.get(
    '/auth/me',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              name: { type: 'string' },
              roles: { type: 'array', items: { type: 'string' } },
              faydaPsut: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.session) {
        return reply.status(401).send({
          code: 'BB-REG-4001',
          message: 'Not authenticated',
          correlationId: request.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
      void reply.send({
        userId: request.session.userId,
        name: request.session.faydaClaims.name,
        roles: request.session.roles,
        faydaPsut: request.session.faydaPsut,
      });
    },
  );
}

// Satisfy the config import linting (config is used to silence unused warning if needed)
void config;
