import type { IndustryConfig } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import { useSetModulePrice, useSharedFlags } from '../../state/hooks';

interface Props {
  cfg: IndustryConfig;
  mod: FwModule | HiredModule;
}

// Q1..maxQ product price inputs + the single RM price input.
export function PricesPanel({ cfg, mod }: Props) {
  const setPrice = useSetModulePrice();
  const shared = useSharedFlags();
  const rmPriceValue = shared[cfg.rmPriceKey];

  return (
    <div className="market-card config-card">
      <h3 className="details-title">{cfg.label} Prices (CC)</h3>
      <div className="price-grid modifier-grid">
        {Array.from({ length: cfg.maxFactoryQuality }, (_, i) => i + 1).map((q) => (
          <div className="market-input-group" key={q}>
            <span className="market-label">Q{q} {cfg.label}</span>
            <input
              type="number"
              className="market-input"
              step="0.01"
              min="0"
              value={mod.prices[q] ?? 0}
              onChange={(e) => setPrice(cfg.key, q, parseFloat(e.target.value || '0'))}
            />
          </div>
        ))}
        <div className="market-input-group">
          <span className="market-label">{cfg.rmName} Price (CC)</span>
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
