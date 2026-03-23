import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { GovStackError } from './types.js';
import { randomUUID } from 'crypto';

/** Standard error codes aligned with GovStack CFR */
export enum ErrorCode {
  // 4xx
  BAD_REQUEST = 'BB-REG-4000',
  UNAUTHORIZED = 'BB-REG-4001',
  FORBIDDEN = 'BB-REG-4003',
  NOT_FOUND = 'BB-REG-4004',
  CONFLICT = 'BB-REG-4009',
  UNPROCESSABLE = 'BB-REG-4022',
  TOO_MANY_REQUESTS = 'BB-REG-4029',

  // 5xx
  INTERNAL_ERROR = 'BB-REG-5000',
  SERVICE_UNAVAILABLE = 'BB-REG-5003',

  // Domain-specific
  INVALID_WORKFLOW_TRANSITION = 'BB-REG-4100',
  INVALID_FORM_DATA = 'BB-REG-4101',
  DOCUMENT_UPLOAD_FAILED = 'BB-REG-4102',
  PAYMENT_REQUIRED = 'BB-REG-4103',
  FAYDA_AUTH_FAILED = 'BB-REG-4201',
  IM_HEADER_INVALID = 'BB-REG-4202',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, ErrorCode.BAD_REQUEST, details);
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, 403, ErrorCode.FORBIDDEN);
  }

  static notFound(resource: string, id: string): AppError {
    return new AppError(`${resource} '${id}' not found`, 404, ErrorCode.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, ErrorCode.CONFLICT);
  }

  static unprocessable(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 422, ErrorCode.UNPROCESSABLE, details);
  }

  static invalidWorkflowTransition(from: string, to: string): AppError {
    return new AppError(
      `Invalid workflow transition from '${from}' to '${to}'`,
      422,
      ErrorCode.INVALID_WORKFLOW_TRANSITION,
      { from, to },
    );
  }

  static imHeaderInvalid(header: string): AppError {
    return new AppError(
      `Invalid Information-Mediator-Client header: '${header}'`,
      400,
      ErrorCode.IM_HEADER_INVALID,
      { header },
    );
  }
}

/**
 * Fastify error handler — converts all errors to GovStack-compliant JSON responses.
 * Ensures correlation IDs are always present in error responses.
 */
export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const correlationId = (request.headers['x-correlation-id'] as string | undefined) ?? randomUUID();

  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    const body: GovStackError = {
      code: error.errorCode,
      message: error.message,
      correlationId,
      timestamp,
      ...(error.details !== undefined && { details: error.details }),
    };
    void reply.status(error.statusCode).send(body);
    return;
  }

  // Fastify validation errors (schema validation failure)
  if ('statusCode' in error && error.statusCode === 400) {
    const body: GovStackError = {
      code: ErrorCode.BAD_REQUEST,
      message: error.message,
      correlationId,
      timestamp,
    };
    void reply.status(400).send(body);
    return;
  }

  // Fastify 404
  if ('statusCode' in error && error.statusCode === 404) {
    const body: GovStackError = {
      code: ErrorCode.NOT_FOUND,
      message: error.message,
      correlationId,
      timestamp,
    };
    void reply.status(404).send(body);
    return;
  }

  // Log unexpected errors
  request.log.error({ err: error, correlationId }, 'Unhandled error');

  const body: GovStackError = {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    correlationId,
    timestamp,
  };
  void reply.status(500).send(body);
}
