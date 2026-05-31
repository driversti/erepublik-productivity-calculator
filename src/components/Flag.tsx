import { LOCALE_FLAG } from '../i18n/config';
import type { Locale } from '../i18n/config';
import { FLAG_URL } from './flagUrls';

// Flags: only the SVGs actually used (one per locale, via LOCALE_FLAG) are
// bundled as Vite assets — see the generated flagUrls.ts — instead of shipping
// the full flag-icons world-sprite CSS. Rendered as <img> (not a CSS
// background) so the data-URI inlining Vite applies to small SVGs can't break
// CSS url() escaping. SVG flags stay crisp and OS-independent (emoji flags
// fail on Windows).
export function Flag({ locale }: { locale: Locale }) {
  const url = FLAG_URL[LOCALE_FLAG[locale]];
  return <img className="lang-flag" src={url} alt="" aria-hidden="true" />;
}
