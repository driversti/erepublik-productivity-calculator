import type { IndustryConfig } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import { useSetModulePrice, useSharedFlags } from '../../state/hooks';
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
import { industryRm } from '../../i18n/names';

interface Props {
  cfg: IndustryConfig;
  mod: FwModule | HiredModule;
}

// Q1..maxQ product price inputs + the single RM price input. Rendered horizontally
// under the tables to minimize vertical sidebar height.
export function PricesPanel({ cfg, mod }: Props) {
  const { t } = useTranslation(['common', 'industry', 'tooltips']);
  const setPrice = useSetModulePrice();
  const shared = useSharedFlags();
  const rmPriceValue = shared[cfg.rmPriceKey];

  return (
    <div className="table-card" style={{ marginTop: 15 }}>
      <div className="card-header">
        <h2>{t('industry:prices.header', { label: cfg.label })}</h2>
      </div>
      <div className="card-body" style={{ padding: '8px 12px' }}>
        <div className="prices-horizontal-flow">
          {Array.from({ length: cfg.maxFactoryQuality }, (_, i) => i + 1).map((q) => (
            <div className="price-inline-group" key={q}>
              <label className="price-inline-label">{t('industry:prices.qLabel', { q })}</label>
              <input
                type="number"
                className="food-price-input"
                step="0.01"
                min="0"
                value={mod.prices[q] ?? 0}
                onChange={(e) => setPrice(cfg.key, q, parseFloat(e.target.value || '0'))}
                {...tip(t('tooltips:productPrice'))}
              />
            </div>
          ))}
          <div className="price-inline-divider" />
          <div className="price-inline-group">
            <label className="price-inline-label">{industryRm(t, cfg)}</label>
            <input
              type="number"
              className="food-price-input"
              step="0.01"
              min="0"
              value={rmPriceValue}
              onChange={(e) => shared.setShared(cfg.rmPriceKey, parseFloat(e.target.value || '0'))}
              {...tip(t('tooltips:rmPrice'))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
