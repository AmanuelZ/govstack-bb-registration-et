import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Locale } from '../i18n/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    locale: Locale;
  }
}

/**
 * Fastify plugin that parses the Accept-Language header and sets request.locale.
 *
 * Supported locales: 'en' (default), 'am' (Amharic).
 * Falls back to 'en' if the header is missing or unsupported.
 *
 * Examples:
 *   Accept-Language: am        → 'am'
 *   Accept-Language: am-ET     → 'am'
 *   Accept-Language: en-US     → 'en'
 *   Accept-Language: fr        → 'en' (unsupported, fallback)
 *   (no header)                → 'en'
 */
async function localePlugin(fastify: FastifyInstance): Promise<void> {
  const SUPPORTED: ReadonlySet<string> = new Set(['en', 'am']);

  fastify.decorateRequest('locale', 'en');

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const header = request.headers['accept-language'];
    if (!header) return;

    request.locale = parseAcceptLanguage(header, SUPPORTED);
  });
}

/**
 * Parse the Accept-Language header and return the best matching supported locale.
 * Handles weighted preferences: "am;q=0.9, en;q=0.8" → 'am'
 */
export function parseAcceptLanguage(header: string, supported: ReadonlySet<string>): Locale {
  const entries = header
    .split(',')
    .map((part) => {
      const [langRaw, ...params] = part.trim().split(';');
      const lang = (langRaw ?? '').trim().split('-')[0]?.toLowerCase() ?? '';
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1.0;
      return { lang, q: isNaN(q) ? 0 : q };
    })
    .filter((e) => supported.has(e.lang))
    .sort((a, b) => b.q - a.q);

  const best = entries[0];
  return (best?.lang as Locale) ?? 'en';
}

export default fp(localePlugin, {
  name: 'locale',
  fastify: '4.x',
});
