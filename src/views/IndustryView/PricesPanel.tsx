import type { IndustryConfig } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import { useSetModulePrice, useSharedFlags } from '../../state/hooks';

interface Props {
  cfg: IndustryConfig;
  mod: FwModule | HiredModule;
}

// Q1..maxQ product price inputs + the single RM price input. Uses the legacy
// card / prices-grid / price-input-row classes.
export function PricesPanel({ cfg, mod }: Props) {
  const setPrice = useSetModulePrice();
  const shared = useSharedFlags();
  const rmPriceValue = shared[cfg.rmPriceKey];

  return (
    <div className="card food-prices-card">
      <div className="card-header"><h2>{cfg.label} Prices (CC)</h2></div>
      <div className="card-body">
        <div className="prices-grid">
          {Array.from({ length: cfg.maxFactoryQuality }, (_, i) => i + 1).map((q) => (
            <div className="price-input-row" key={q}>
              <label className="food-price-label">Q{q} {cfg.label}</label>
              <input
                type="number"
                className="food-price-input"
                step="0.01"
                min="0"
                value={mod.prices[q] ?? 0}
                onChange={(e) => setPrice(cfg.key, q, parseFloat(e.target.value || '0'))}
              />
            </div>
          ))}
        </div>
        <div className="control-group" style={{ marginTop: 12, marginBottom: 0 }}>
          <label className="control-label">{cfg.rmName} Price (CC)</label>
          <input
            type="number"
            className="market-input"
            step="0.01"
            min="0"
            value={rmPriceValue}
            onChange={(e) => shared.setShared(cfg.rmPriceKey, parseFloat(e.target.value || '0'))}
          />
        </div>
      </div>
    </div>
  );
}
