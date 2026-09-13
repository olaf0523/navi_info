export const integerFormat = new Intl.NumberFormat('ja-JP');

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

// Scraped URLs are only rendered as links when they are plain http(s).
export const safeUrl = (value) => (/^https?:\/\//i.test(value || '') ? value : '');

// Single-character mark for a company, ignoring legal-entity prefixes and suffixes.
export function monogram(name) {
  const core = name
    .replace(/^(株式会社|合同会社|有限会社|一般社団法人|一般財団法人)\s*/, '')
    .replace(/\s*(株式会社|合同会社|有限会社)$/, '')
    .trim();
  return ([...(core || name)][0] || '?').toUpperCase();
}
