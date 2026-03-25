import { describe, it, expect } from 'vitest';
import { parseAcceptLanguage } from './locale.js';

const SUPPORTED = new Set(['en', 'am']);

describe('parseAcceptLanguage', () => {
  it('returns "am" for Accept-Language: am', () => {
    expect(parseAcceptLanguage('am', SUPPORTED)).toBe('am');
  });

  it('returns "am" for Accept-Language: am-ET', () => {
    expect(parseAcceptLanguage('am-ET', SUPPORTED)).toBe('am');
  });

  it('returns "en" for Accept-Language: en', () => {
    expect(parseAcceptLanguage('en', SUPPORTED)).toBe('en');
  });

  it('returns "en" for Accept-Language: en-US', () => {
    expect(parseAcceptLanguage('en-US', SUPPORTED)).toBe('en');
  });

  it('returns "en" for unsupported language (fallback)', () => {
    expect(parseAcceptLanguage('fr', SUPPORTED)).toBe('en');
  });

  it('returns "en" for empty string', () => {
    expect(parseAcceptLanguage('', SUPPORTED)).toBe('en');
  });

  it('picks highest quality match: am;q=0.9, en;q=0.8', () => {
    expect(parseAcceptLanguage('am;q=0.9, en;q=0.8', SUPPORTED)).toBe('am');
  });

  it('picks highest quality match: en;q=1.0, am;q=0.5', () => {
    expect(parseAcceptLanguage('en;q=1.0, am;q=0.5', SUPPORTED)).toBe('en');
  });

  it('handles complex header: fr;q=1.0, am-ET;q=0.8, en;q=0.5', () => {
    expect(parseAcceptLanguage('fr;q=1.0, am-ET;q=0.8, en;q=0.5', SUPPORTED)).toBe('am');
  });

  it('treats missing q value as 1.0', () => {
    expect(parseAcceptLanguage('am, en;q=0.5', SUPPORTED)).toBe('am');
  });

  it('ignores unsupported languages in weighted list', () => {
    expect(parseAcceptLanguage('de;q=1.0, fr;q=0.9, am;q=0.1', SUPPORTED)).toBe('am');
  });

  it('returns "en" when all languages unsupported', () => {
    expect(parseAcceptLanguage('de, fr, ja', SUPPORTED)).toBe('en');
  });
});
