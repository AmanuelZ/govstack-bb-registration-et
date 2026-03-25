import { describe, it, expect, beforeEach } from 'vitest';
import { t, tBilingual, setLocale, getLocale } from './index.js';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('en');
  });

  describe('t (translate)', () => {
    it('resolves a simple English key', () => {
      expect(t('app.name')).toBe('Registration Building Block');
    });

    it('resolves a simple Amharic key', () => {
      expect(t('app.name', undefined, 'am')).toBe('የምዝገባ ግንባታ ብሎክ');
    });

    it('interpolates {{variables}} in English', () => {
      const result = t('errors.notFound', { resource: 'Application', id: 'abc123' });
      expect(result).toBe("Application 'abc123' not found");
    });

    it('interpolates {{variables}} in Amharic', () => {
      const result = t('errors.notFound', { resource: 'ማመልከቻ', id: 'abc123' }, 'am');
      expect(result).toBe("ማመልከቻ 'abc123' አልተገኘም");
    });

    it('returns key if translation not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('preserves unmatched placeholders', () => {
      const result = t('errors.notFound', { resource: 'User' });
      expect(result).toContain('{{id}}');
    });

    it('handles numeric parameters', () => {
      const result = t('tradeLicense.latePenalty', { amount: 2500, months: 1 });
      expect(result).toContain('2500');
      expect(result).toContain('1');
    });
  });

  describe('setLocale / getLocale', () => {
    it('defaults to English', () => {
      expect(getLocale()).toBe('en');
    });

    it('switches to Amharic', () => {
      setLocale('am');
      expect(getLocale()).toBe('am');
      expect(t('app.name')).toBe('የምዝገባ ግንባታ ብሎክ');
    });

    it('switches back to English', () => {
      setLocale('am');
      setLocale('en');
      expect(t('app.name')).toBe('Registration Building Block');
    });
  });

  describe('tBilingual', () => {
    it('returns both English and Amharic translations', () => {
      const result = tBilingual('app.name');
      expect(result.en).toBe('Registration Building Block');
      expect(result.am).toBe('የምዝገባ ግንባታ ብሎክ');
    });

    it('interpolates variables in both languages', () => {
      const result = tBilingual('errors.notFound', { resource: 'Service', id: 'xyz' });
      expect(result.en).toBe("Service 'xyz' not found");
      expect(result.am).toBe("Service 'xyz' አልተገኘም");
    });
  });

  describe('translation coverage', () => {
    it('has all error keys in Amharic', () => {
      const errorKeys = [
        'errors.notFound',
        'errors.unauthorized',
        'errors.forbidden',
        'errors.badRequest',
        'errors.unprocessable',
        'errors.internalError',
        'errors.faydaAuthFailed',
      ];
      for (const key of errorKeys) {
        const amResult = t(key, { resource: 'X', id: '1', from: 'A', to: 'B', header: 'H' }, 'am');
        expect(amResult).not.toBe(key); // Should not fall back to key
      }
    });

    it('has all application keys in Amharic', () => {
      const keys = [
        'application.submitted',
        'application.updated',
        'application.withdrawn',
        'application.cannotUpdate',
        'application.onlyOwnerCanUpdate',
      ];
      for (const key of keys) {
        const amResult = t(key, { status: 'PENDING' }, 'am');
        expect(amResult).not.toBe(key);
      }
    });

    it('has business registration keys in Amharic', () => {
      const result = t('businessRegistration.insufficientCapital', { minimum: 15000, entityType: 'PLC' }, 'am');
      expect(result).toContain('15000');
      expect(result).toContain('PLC');
    });

    it('has trade license keys in Amharic', () => {
      const result = t('tradeLicense.renewalFee', { amount: 5000 }, 'am');
      expect(result).toContain('5000');
    });

    it('has calendar keys in Amharic', () => {
      const result = t('calendar.fiscalYear', { year: 2017 }, 'am');
      expect(result).toContain('2017');
      expect(result).toContain('ዓ.ም.');
    });
  });
});
