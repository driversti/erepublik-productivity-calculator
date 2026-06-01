/** Locale-aware "N minutes ago" for an ISO timestamp; null when absent/invalid.
 *  `now` is injectable for tests. */
export function relativeMinutes(iso: string | null, locale: string, now: number = Date.now()): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const minutes = Math.max(0, Math.round((now - t) / 60000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(-minutes, 'minute');
}
