import { StateProvider } from './state/StateContext';
import { useActiveModule } from './state/hooks';
import { TabBar } from './components/TabBar';
import { IndustryView } from './views/IndustryView/IndustryView';
import { HoldingsView } from './views/HoldingsView/HoldingsView';
import { RegionsView } from './views/RegionsView/RegionsView';
import { OptimizerView } from './views/OptimizerView';
import { AppTooltip } from './components/AppTooltip';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl } from './i18n/config';

function ActiveView() {
  const active = useActiveModule();
  if (active === 'optimizer') return <OptimizerView />;
  if (active === 'holdings') return <HoldingsView />;
  if (active === 'regions') return <RegionsView />;
  return <IndustryView industryKey={active} />;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keep <html lang> and text direction in sync with the active locale.
  useEffect(() => {
    const lng = i18n.resolvedLanguage ?? 'en';
    document.documentElement.lang = lng;
    document.documentElement.dir = isRtl(lng) ? 'rtl' : 'ltr';
  }, [i18n.resolvedLanguage]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <StateProvider>
      <header className="game-header">
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 14l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="header-title-wrapper">
              <h1>{t('header.title')}</h1>
              <p>{t('header.subtitle')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LanguageSwitcher />
            <button
              type="button"
              className="theme-toggle-btn icon-only"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
              title={theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
            >
              {theme === 'light' ? (
                <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <a
              className="theme-toggle-btn icon-only"
              href="https://github.com/driversti/erepublik-productivity-calculator"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg className="theme-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5z" />
              </svg>
            </a>
          </div>
        </div>
      </header>
      <TabBar />
      <ActiveView />
      <footer className="game-footer">
        {t('footer')}
      </footer>
      <AppTooltip />
    </StateProvider>
  );
}

