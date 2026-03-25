/**
 * Internationalization (i18n) module for the Registration Building Block.
 *
 * Supports Amharic (አማርኛ) and English.
 * Uses simple template interpolation ({{key}}) — no heavy i18n library dependency.
 *
 * Usage:
 *   import { t, setLocale } from './i18n/index.js';
 *   t('errors.notFound', { resource: 'Application', id: 'abc123' })
 *   // → "Application 'abc123' not found"
 *
 *   setLocale('am');
 *   t('errors.notFound', { resource: 'ማመልከቻ', id: 'abc123' })
 *   // → "ማመልከቻ 'abc123' አልተገኘም"
 */

import { en, type TranslationShape } from './en.js';
import { am } from './am.js';

export type Locale = 'en' | 'am';

const translations: Record<Locale, TranslationShape> = { en, am };

let currentLocale: Locale = 'en';

/**
 * Set the active locale.
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Get the current locale.
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Look up a translation key using dot-notation and interpolate {{variables}}.
 *
 * @param key - Dot-notation path, e.g. 'errors.notFound'
 * @param params - Values to interpolate into {{placeholders}}
 * @param locale - Override locale for this call only
 * @returns Translated and interpolated string, or the key itself if not found
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale?: Locale,
): string {
  const lang = locale ?? currentLocale;
  const dict = translations[lang] ?? translations.en;

  // Resolve dot-notation key
  const value = key.split('.').reduce<unknown>((obj, k) => {
    if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
      return (obj as Record<string, unknown>)[k];
    }
    return undefined;
  }, dict);

  if (typeof value !== 'string') {
    return key; // Fallback to key if translation not found
  }

  if (!params) return value;

  // Interpolate {{key}} placeholders
  return value.replace(/\{\{(\w+)\}\}/g, (_match, paramKey: string) => {
    const val = params[paramKey];
    return val !== undefined ? String(val) : `{{${paramKey}}}`;
  });
}

/**
 * Get a translated string in both locales (for bilingual display).
 */
export function tBilingual(
  key: string,
  params?: Record<string, string | number>,
): { en: string; am: string } {
  return {
    en: t(key, params, 'en'),
    am: t(key, params, 'am'),
  };
}

// Re-export types
export type { TranslationShape } from './en.js';
