import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { getPrismaClient } from '../../config/database.js';
import { AppError } from '../../common/errors.js';
import { config } from '../../config/index.js';
import { createHash } from 'crypto';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const MAX_SIZE_BYTES = config.maxFileSizeMb * 1024 * 1024;

// Ensure upload directory exists
mkdirSync(config.uploadDir, { recursive: true });

export async function documentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/documents',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Upload a supporting document',
        description:
          'Upload a supporting document for an application. Accepts PDF and image files up to the configured size limit.',
        consumes: ['multipart/form-data'],
        body: {
          type: 'object',
          required: ['applicationId', 'documentType', 'file'],
          properties: {
            applicationId: { type: 'string', format: 'uuid' },
            documentType: {
              type: 'string',
              description: 'e.g. MOA_AOA, TAX_CLEARANCE, BANK_LETTER',
            },
            file: { type: 'string', format: 'binary' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              applicationId: { type: 'string', format: 'uuid' },
              documentType: { type: 'string' },
              originalName: { type: 'string' },
              mimeType: { type: 'string' },
              sizeBytes: { type: 'integer' },
              checksum: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const prisma = getPrismaClient();
      const data = await request.file();

      if (!data) {
        throw AppError.badRequest('No file provided');
      }

      const { filename, mimetype, file: fileStream } = data;
      const fields = data.fields as Record<string, { value: string }>;
      const applicationId = fields['applicationId']?.value;
      const documentType = fields['documentType']?.value;

      if (!applicationId || !documentType) {
        throw AppError.badRequest('applicationId and documentType are required fields');
      }

      if (!ALLOWED_MIME_TYPES.has(mimetype)) {
        throw AppError.badRequest(
          `File type '${mimetype}' not allowed. Accepted: PDF, JPEG, PNG, WebP`,
        );
      }

      // Verify application exists
      const application = await prisma.application.findUnique({ where: { id: applicationId } });
      if (!application) {
        throw AppError.notFound('Application', applicationId);
      }

      const fileId = randomUUID();
      const extension = filename.split('.').pop() ?? 'bin';
      const storagePath = join(config.uploadDir, `${fileId}.${extension}`);
      const hash = createHash('sha256');
      let sizeBytes = 0;

      // Stream to disk while computing hash and size
      const writeStream = createWriteStream(storagePath);
      const chunks: Buffer[] = [];

      for await (const chunk of fileStream) {
        sizeBytes += chunk.length;
        if (sizeBytes > MAX_SIZE_BYTES) {
          writeStream.destroy();
          throw AppError.badRequest(`File exceeds maximum size of ${config.maxFileSizeMb}MB`);
        }
        hash.update(chunk);
        chunks.push(chunk as Buffer);
      }

      await pipeline(
        (async function* () {
          for (const chunk of chunks) yield chunk;
        })(),
        writeStream,
      );

      const checksum = hash.digest('hex');

      const doc = await prisma.applicationDocument.create({
        data: {
          applicationId,
          documentType,
          originalName: filename,
          storagePath,
          mimeType: mimetype,
          sizeBytes,
          checksum,
          uploadedById: applicationId, // TODO: replace with real user ID from auth
        },
      });

      void reply.status(201).send({
        id: doc.id,
        applicationId: doc.applicationId,
        documentType: doc.documentType,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        checksum: doc.checksum,
        createdAt: doc.createdAt,
      });
    },
  );
}
