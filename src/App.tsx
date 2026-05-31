import { StateProvider } from './state/StateContext';
import { useActiveModule } from './state/hooks';
import { TabBar } from './components/TabBar';
import { IndustryView } from './views/IndustryView/IndustryView';
import { HoldingsView } from './views/HoldingsView/HoldingsView';
import { AppTooltip } from './components/AppTooltip';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function ActiveView() {
  const active = useActiveModule();
  if (active === 'holdings') return <HoldingsView />;
  return <IndustryView industryKey={active} />;
}

export default function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

