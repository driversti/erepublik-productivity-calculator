import { INDUSTRIES } from '../data/industries';
import { useActiveModule, useSwitchModule } from '../state/hooks';
import { useTranslation } from 'react-i18next';
import { industryLabel } from '../i18n/names';

// Industry tabs + the Holdings tab. Mirrors the legacy .module-nav / .nav-tab markup.
export function TabBar() {
  const active = useActiveModule();
  const switchTo = useSwitchModule();
  const { t } = useTranslation();
  return (
    <nav className="module-nav">
      <div className="nav-container">
        {INDUSTRIES.map((cfg) => (
          <button
            key={cfg.key}
            type="button"
            className={`nav-tab tab-${cfg.key}${active === cfg.key ? ' active' : ''}`}
            data-testid={`tab-${cfg.key}`}
            onClick={() => switchTo(cfg.key)}
          >
            {cfg.icon} {industryLabel(t, cfg)}
          </button>
        ))}
        <button
          type="button"
          className={`nav-tab${active === 'holdings' ? ' active' : ''}`}
          data-testid="tab-holdings"
          onClick={() => switchTo('holdings')}
        >
          {t('tabs.holdings')}
        </button>
      </div>
    </nav>
  );
}
