import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../common/errors.js';
import { config } from '../config/index.js';
import type { IMClient } from '../common/types.js';

/**
 * GovStack Information Mediator header validation plugin.
 *
 * Every request must include the `Information-Mediator-Client` header in the format:
 *   {INSTANCE}/{CLASS}/{MEMBER}/{SUBSYSTEM}
 * Example: ET/GOV/10000001/REGISTRATION
 *
 * In development mode (IM_VALIDATE_CLIENTS=false), any valid-format header is accepted.
 * In production mode, the header value is checked against a registered client list.
 */

const IM_HEADER = 'information-mediator-client';
const IM_FORMAT_REGEX = /^[A-Z0-9_-]+\/[A-Z0-9_-]+\/[A-Z0-9_-]+\/[A-Z0-9_-]+$/i;

declare module 'fastify' {
  interface FastifyRequest {
    imClient: IMClient | undefined;
  }
}

/** Parse an IM client header string into its components */
function parseIMClient(header: string): IMClient {
  const parts = header.split('/');
  if (parts.length !== 4) {
    throw AppError.imHeaderInvalid(header);
  }

  const [instance, memberClass, memberCode, subsystem] = parts;
  if (!instance || !memberClass || !memberCode || !subsystem) {
    throw AppError.imHeaderInvalid(header);
  }

  return { instance, memberClass, memberCode, subsystem };
}

const registeredClients = new Set<string>(
  config.imRegisteredClients
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean),
);

const informationMediatorPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    // Skip IM validation for health/ready probes and API documentation
    if (
      request.url.startsWith('/api/v1/health') ||
      request.url.startsWith('/api/v1/ready') ||
      request.url.startsWith('/docs') ||
      request.url.startsWith('/api/v1/auth')
    ) {
      request.imClient = undefined;
      return;
    }

    const headerValue = request.headers[IM_HEADER];

    if (!headerValue || typeof headerValue !== 'string') {
      throw AppError.imHeaderInvalid('missing');
    }

    if (!IM_FORMAT_REGEX.test(headerValue)) {
      throw AppError.imHeaderInvalid(headerValue);
    }

    const imClient = parseIMClient(headerValue);

    if (config.imValidateClients && registeredClients.size > 0) {
      const clientKey = `${imClient.instance}/${imClient.memberClass}/${imClient.memberCode}/${imClient.subsystem}`;
      if (!registeredClients.has(clientKey)) {
        throw AppError.imHeaderInvalid(`unregistered client: ${clientKey}`);
      }
    }

    request.imClient = imClient;
  });
};

export default fp(informationMediatorPlugin, {
  name: 'information-mediator',
});
