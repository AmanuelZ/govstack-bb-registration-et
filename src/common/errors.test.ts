import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode } from './errors.js';

describe('AppError', () => {
  it('creates bad request error', () => {
    const err = AppError.badRequest('invalid input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe(ErrorCode.BAD_REQUEST);
    expect(err.message).toBe('invalid input');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('creates unauthorized error', () => {
    const err = AppError.unauthorized('not authenticated');
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.message).toBe('not authenticated');
  });

  it('creates forbidden error', () => {
    const err = AppError.forbidden('access denied');
    expect(err.statusCode).toBe(403);
    expect(err.errorCode).toBe(ErrorCode.FORBIDDEN);
    expect(err.message).toBe('access denied');
  });

  it('creates not found error', () => {
    const err = AppError.notFound('Application', 'abc-123');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(err.message).toContain('abc-123');
    expect(err.message).toContain('Application');
  });

  it('creates conflict error', () => {
    const err = AppError.conflict('already exists');
    expect(err.statusCode).toBe(409);
    expect(err.errorCode).toBe(ErrorCode.CONFLICT);
    expect(err.message).toBe('already exists');
  });

  it('creates unprocessable error', () => {
    const err = AppError.unprocessable('validation failed', { violations: ['min capital'] });
    expect(err.statusCode).toBe(422);
    expect(err.errorCode).toBe(ErrorCode.UNPROCESSABLE);
    expect(err.details).toEqual({ violations: ['min capital'] });
  });

  it('creates invalid workflow transition error', () => {
    const err = AppError.invalidWorkflowTransition('DRAFT', 'COMPLETED');
    expect(err.statusCode).toBe(422);
    expect(err.errorCode).toBe(ErrorCode.INVALID_WORKFLOW_TRANSITION);
    expect(err.details).toEqual({ from: 'DRAFT', to: 'COMPLETED' });
    expect(err.message).toContain('DRAFT');
    expect(err.message).toContain('COMPLETED');
  });

  it('creates IM header invalid error', () => {
    const err = AppError.imHeaderInvalid('bad-header');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe(ErrorCode.IM_HEADER_INVALID);
    expect(err.message).toContain('bad-header');
    expect(err.details).toEqual({ header: 'bad-header' });
  });

  it('is instanceof Error and AppError', () => {
    const err = AppError.badRequest('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.name).toBe('AppError');
  });

  it('has no details when not provided for unauthorized', () => {
    const err = AppError.unauthorized('test');
    expect(err.details).toBeUndefined();
  });

  it('has no details when not provided for forbidden', () => {
    const err = AppError.forbidden('no access');
    expect(err.details).toBeUndefined();
  });

  it('has no details when not provided for conflict', () => {
    const err = AppError.conflict('duplicate');
    expect(err.details).toBeUndefined();
  });

  it('has no details when unprocessable is called without details', () => {
    const err = AppError.unprocessable('validation failed');
    expect(err.details).toBeUndefined();
  });

  it('has no details when badRequest is called without details', () => {
    const err = AppError.badRequest('bad input');
    expect(err.details).toBeUndefined();
  });

  it('ErrorCode enum has expected values', () => {
    expect(ErrorCode.BAD_REQUEST).toBe('BB-REG-4000');
    expect(ErrorCode.UNAUTHORIZED).toBe('BB-REG-4001');
    expect(ErrorCode.FORBIDDEN).toBe('BB-REG-4003');
    expect(ErrorCode.NOT_FOUND).toBe('BB-REG-4004');
    expect(ErrorCode.CONFLICT).toBe('BB-REG-4009');
    expect(ErrorCode.UNPROCESSABLE).toBe('BB-REG-4022');
    expect(ErrorCode.INVALID_WORKFLOW_TRANSITION).toBe('BB-REG-4100');
    expect(ErrorCode.IM_HEADER_INVALID).toBe('BB-REG-4202');
    expect(ErrorCode.INTERNAL_ERROR).toBe('BB-REG-5000');
  });

  it('notFound formats message correctly with quotes', () => {
    const err = AppError.notFound('Service', 'svc-999');
    expect(err.message).toBe("Service 'svc-999' not found");
  });

  it('invalidWorkflowTransition formats message correctly', () => {
    const err = AppError.invalidWorkflowTransition('SUBMITTED', 'DRAFT');
    expect(err.message).toBe("Invalid workflow transition from 'SUBMITTED' to 'DRAFT'");
  });
});
