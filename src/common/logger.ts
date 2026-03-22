import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Structured Pino logger — GovStack CFR compliant.
 * All log entries include: timestamp (ISO 8601 UTC), level, correlation_id, service, version.
 */
export const logger = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: {
    service: 'govstack-registration-bb-et',
    version: '0.1.0',
  },
  redact: {
    paths: [
      '*.fayda_fin',
      '*.phone_number',
      '*.phoneNumber',
      '*.password',
      'req.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
});

export type Logger = typeof logger;
