import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import informationMediatorPlugin from './information-mediator.js';
import { errorHandler } from '../common/errors.js';

/**
 * Build a minimal Fastify app with the IM plugin registered and a set of
 * test routes that mirror the real application's URL structure.
 */
async function buildTestApp(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false });

  // Register the GovStack error handler so AppErrors are serialised correctly
  fastify.setErrorHandler(errorHandler);

  await fastify.register(informationMediatorPlugin);

  // Protected API routes
  fastify.get('/api/v1/test', async () => ({ ok: true }));
  fastify.get('/api/v1/services', async () => ({ services: [] }));
  fastify.post('/api/v1/applications', async () => ({ id: 'app-1' }));

  // Exempt routes
  fastify.get('/api/v1/health', async () => ({ status: 'ok' }));
  fastify.get('/api/v1/ready', async () => ({ status: 'ready' }));
  fastify.get('/api/v1/auth/login', async () => ({ url: 'http://example.com' }));
  fastify.get('/api/v1/auth/callback', async () => ({ token: 'abc' }));
  fastify.get('/docs', async () => ({ openapi: '3.0' }));
  fastify.get('/docs/json', async () => ({ openapi: '3.0' }));

  await fastify.ready();
  return fastify;
}

describe('information-mediator plugin', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Missing / malformed header ─────────────────────────────────────────────

  it('rejects requests to protected routes with no IM header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/test' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects requests with malformed IM header (wrong segment count)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'INVALID' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects requests with IM header that has too few segments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'ET/GOV/10000001' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects requests with IM header that has too many segments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'ET/GOV/10000001/REGISTRATION/EXTRA' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects requests with empty IM header value', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': '' },
    });
    expect(res.statusCode).toBe(400);
  });

  // ── Valid header ───────────────────────────────────────────────────────────

  it('accepts requests with a valid four-segment IM header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'ET/GOV/10000001/REGISTRATION' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts valid IM header on POST routes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/applications',
      headers: {
        'information-mediator-client': 'ET/GOV/10000001/REGISTRATION',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts any valid-format IM header when client validation is disabled', async () => {
    // .env has IM_VALIDATE_CLIENTS=false, so any valid-format header is accepted
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services',
      headers: { 'information-mediator-client': 'XX/PRIVATE/99999999/ANYAPP' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts uppercase IM header as per GovStack spec', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'ET/GOV/10000001/ANALYTICS' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts IM header with hyphens and underscores in segments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'ET/GOV/10000001/TRADE-REGISTRY_BB' },
    });
    expect(res.statusCode).toBe(200);
  });

  // ── Exempt routes (no IM header required) ─────────────────────────────────

  it('skips IM validation for /api/v1/health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
  });

  it('skips IM validation for /api/v1/ready', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/ready' });
    expect(res.statusCode).toBe(200);
  });

  it('skips IM validation for /api/v1/auth/login', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/login' });
    expect(res.statusCode).toBe(200);
  });

  it('skips IM validation for /api/v1/auth/callback', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/callback' });
    expect(res.statusCode).toBe(200);
  });

  it('skips IM validation for /docs', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs' });
    expect(res.statusCode).toBe(200);
  });

  it('skips IM validation for /docs/json', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(res.statusCode).toBe(200);
  });

  // ── Error response shape ───────────────────────────────────────────────────

  it('returns JSON error body on missing header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/test' });
    const body = res.json<{ code: string; message: string }>();
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('message');
    expect(body.code).toBe('BB-REG-4202');
  });

  it('returns JSON error body on malformed header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'information-mediator-client': 'bad/header' },
    });
    const body = res.json<{ code: string; message: string }>();
    expect(body.code).toBe('BB-REG-4202');
    expect(body.message).toContain('bad/header');
  });
});
