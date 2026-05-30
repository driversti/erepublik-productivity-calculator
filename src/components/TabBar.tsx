import { INDUSTRIES } from '../data/industries';
import { useActiveModule, useSwitchModule } from '../state/hooks';

// Industry tabs + the Holdings tab. Mirrors the legacy .module-nav / .nav-tab markup.
export function TabBar() {
  const active = useActiveModule();
  const switchTo = useSwitchModule();
  return (
    <nav className="module-nav">
      <div className="nav-container">
        {INDUSTRIES.map((cfg) => (
          <button
            key={cfg.key}
            type="button"
            className={`nav-tab${active === cfg.key ? ' active' : ''}`}
            data-testid={`tab-${cfg.key}`}
            onClick={() => switchTo(cfg.key)}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
        <button
          type="button"
          className={`nav-tab${active === 'holdings' ? ' active' : ''}`}
          data-testid="tab-holdings"
          onClick={() => switchTo('holdings')}
        >
          🗂️ Holdings
        </button>
      </div>
    </nav>
  );
}
