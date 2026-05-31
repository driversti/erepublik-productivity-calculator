import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, LOCALE_STORAGE_KEY } from '../i18n/config';
import type { Locale } from '../i18n/config';
import { Flag } from './Flag';

// Header locale picker: a custom flag dropdown (not a native <select>, which
// can't show flags and styles inconsistently across browsers). Hidden while a
// single locale exists, so it needs no extra wiring until a second is added.
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (SUPPORTED_LOCALES.length <= 1) return null;

  const current = (i18n.resolvedLanguage ?? SUPPORTED_LOCALES[0]) as Locale;

  // Order the menu alphabetically by the displayed (native) language name.
  const sortedLocales = [...SUPPORTED_LOCALES].sort((a, b) =>
    t(`language.${a}`).localeCompare(t(`language.${b}`)),
  );

  const select = (lng: Locale) => {
    i18n.changeLanguage(lng);
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.label')}
        onClick={() => setOpen((v) => !v)}
      >
        <Flag locale={current} />
        <span className="lang-code">{current.toUpperCase()}</span>
        <svg className="lang-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t('language.label')}>
          {sortedLocales.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="option"
                aria-selected={l === current}
                className={`lang-option${l === current ? ' is-active' : ''}`}
                onClick={() => select(l)}
              >
                <Flag locale={l} />
                <span className="lang-name">{t(`language.${l}`)}</span>
                {l === current && (
                  <svg className="lang-check" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                    <path d="M2.5 6.5 L5 9 L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
