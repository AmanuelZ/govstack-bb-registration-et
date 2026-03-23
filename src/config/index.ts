import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load .env file in development/test. In production, env vars are injected by the container runtime.
if (process.env['NODE_ENV'] !== 'production') {
  dotenvConfig();
}

/**
 * Environment configuration — validated at startup via Zod.
 * Application will NOT start if required environment variables are missing or malformed.
 * GovStack CFR: fail-fast configuration validation.
 */
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().min(1024).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  apiVersion: z.string().default('v1'),

  // Database
  databaseUrl: z.string().url(),

  // Redis
  redisUrl: z.string().url(),

  // Fayda / eSignet OIDC
  faydaIssuerUrl: z.string().url(),
  faydaClientId: z.string().min(1),
  faydaRedirectUri: z.string().url(),
  faydaPrivateKey: z.string().optional(),

  // Internal JWT
  jwtSecret: z.string().min(32),
  jwtExpiry: z.string().default('8h'),

  // Information Mediator
  imValidateClients: z
    .preprocess((v) => v === true || v === 'true' || v === '1', z.boolean())
    .default(false),
  imRegisteredClients: z.string().default(''),

  // File storage
  uploadDir: z.string().default('./uploads'),
  maxFileSizeMb: z.coerce.number().int().min(1).max(100).default(10),

  // Encryption (AES-256-GCM for PII)
  encryptionKey: z.string().min(64).optional(), // 32 bytes hex = 64 chars

  // Development flags
  mockFaydaEnabled: z
    .preprocess((v) => v === true || v === 'true' || v === '1', z.boolean())
    .default(false),
  seedTestData: z
    .preprocess((v) => v === true || v === 'true' || v === '1', z.boolean())
    .default(false),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    nodeEnv: process.env['NODE_ENV'],
    port: process.env['PORT'],
    host: process.env['HOST'],
    logLevel: process.env['LOG_LEVEL'],
    apiVersion: process.env['API_VERSION'],
    databaseUrl: process.env['DATABASE_URL'],
    redisUrl: process.env['REDIS_URL'],
    faydaIssuerUrl: process.env['FAYDA_ISSUER_URL'],
    faydaClientId: process.env['FAYDA_CLIENT_ID'],
    faydaRedirectUri: process.env['FAYDA_REDIRECT_URI'],
    faydaPrivateKey: process.env['FAYDA_PRIVATE_KEY'],
    jwtSecret: process.env['JWT_SECRET'],
    jwtExpiry: process.env['JWT_EXPIRY'],
    imValidateClients: process.env['IM_VALIDATE_CLIENTS'],
    imRegisteredClients: process.env['IM_REGISTERED_CLIENTS'],
    uploadDir: process.env['UPLOAD_DIR'],
    maxFileSizeMb: process.env['MAX_FILE_SIZE_MB'],
    encryptionKey: process.env['ENCRYPTION_KEY'],
    mockFaydaEnabled: process.env['MOCK_FAYDA_ENABLED'],
    seedTestData: process.env['SEED_TEST_DATA'],
  });

  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${issues}`);
  }

  return result.data;
}

export const config = loadConfig();
