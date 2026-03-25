import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode } from './errors.js';

describe('AppError i18n support', () => {
  describe('factory methods include i18n keys', () => {
    it('notFound has i18n key and params', () => {
      const err = AppError.notFound('Application', 'abc123');
      expect(err.i18nKey).toBe('errors.notFound');
      expect(err.i18nParams).toEqual({ resource: 'Application', id: 'abc123' });
    });

    it('badRequest has i18n key', () => {
      const err = AppError.badRequest('bad input');
      expect(err.i18nKey).toBe('errors.badRequest');
    });

    it('unauthorized has i18n key', () => {
      const err = AppError.unauthorized('not logged in');
      expect(err.i18nKey).toBe('errors.unauthorized');
    });

    it('forbidden has i18n key', () => {
      const err = AppError.forbidden('no access');
      expect(err.i18nKey).toBe('errors.forbidden');
    });

    it('conflict has i18n key', () => {
      const err = AppError.conflict('duplicate');
      expect(err.i18nKey).toBe('errors.conflict');
    });

    it('unprocessable has i18n key', () => {
      const err = AppError.unprocessable('invalid data');
      expect(err.i18nKey).toBe('errors.unprocessable');
    });

    it('invalidWorkflowTransition has i18n key and params', () => {
      const err = AppError.invalidWorkflowTransition('PENDING', 'EXPIRED');
      expect(err.i18nKey).toBe('errors.invalidWorkflowTransition');
      expect(err.i18nParams).toEqual({ from: 'PENDING', to: 'EXPIRED' });
    });

    it('imHeaderInvalid has i18n key and params', () => {
      const err = AppError.imHeaderInvalid('BAD/HEADER');
      expect(err.i18nKey).toBe('errors.imHeaderInvalid');
      expect(err.i18nParams).toEqual({ header: 'BAD/HEADER' });
    });
  });

  describe('error handler localization', () => {
    it('notFound English message is default', () => {
      const err = AppError.notFound('Service', 'xyz');
      expect(err.message).toBe("Service 'xyz' not found");
      expect(err.errorCode).toBe(ErrorCode.NOT_FOUND);
    });

    it('AppError preserves all properties with i18n additions', () => {
      const err = AppError.notFound('User', '123');
      expect(err.statusCode).toBe(404);
      expect(err.errorCode).toBe(ErrorCode.NOT_FOUND);
      expect(err.i18nKey).toBe('errors.notFound');
      expect(err.i18nParams).toEqual({ resource: 'User', id: '123' });
      expect(err.details).toBeUndefined();
    });
  });
});
