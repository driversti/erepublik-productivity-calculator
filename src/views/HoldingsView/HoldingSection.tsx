import { useState } from 'react';
import type { Holding } from '../../state/types';
import type { IndustryConfig } from '../../data/types';
import type { IndustryResult } from '../../calc/types';
import type { HoldingsApi } from '../../state/hooks';
import { holdingFactoryCell } from '../../state/hooks';
import { FactoryCard } from '../../components/FactoryCard';
import { factoryIconUrl, rmIconUrl } from '../IndustryView/icons';
import { productivityMultiplier, pollutionAt, roundNumber, gameRawProduction } from '../../calc/rounding';

const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  holding: Holding;
  cfg: IndustryConfig;
  result: IndustryResult;
  hasTycoon: boolean;
  api: HoldingsApi;
  /** collapsed by default when the industry has no companies */
  defaultCollapsed: boolean;
}

// One collapsible industry section inside a holding. Collapse state is local so
// it survives parent re-renders (mirrors the legacy prevCollapsed behavior).
export function HoldingSection({ holding, cfg, result, hasTycoon, api, defaultCollapsed }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const ind = holding.industries[cfg.key];
  const poll = (i: number) => pollutionAt(ind.qualityPollution, i);

  const factoryMult = (q: number) => productivityMultiplier({ countryBonus: ind.countryBonus, regionBonus: ind.regionBonus, hasTycoon, pollutionRate: poll(q) });
  const rmMult = () => productivityMultiplier({ countryBonus: ind.countryBonus, regionBonus: ind.regionBonus, hasTycoon, pollutionRate: poll(0) });

  return (
    <div className={`hld-section${collapsed ? ' collapsed' : ''}`} data-industry={cfg.key} data-testid={`hld-section-${cfg.key}`}>
      <div className="hld-section-head" onClick={() => setCollapsed((c) => !c)} style={{ cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <span className="hld-ind-name">{cfg.label}</span>
        <span className="hld-ind-mods">Country +{ind.countryBonus}% · Region +{ind.regionBonus}% · Pollution {poll(1).toFixed(2)}%</span>
        <span className={`hld-ind-net ${result.net >= 0 ? 'text-success' : 'text-danger'}`}>
          {result.net >= 0 ? '+' : ''}{result.net.toFixed(2)} CC
        </span>
        <span className="hld-chev">{collapsed ? '▸' : '▾'}</span>
      </div>
      {!collapsed && (
        <div className="hld-section-body">
          <div className="factories-grid">
            {cfg.factoriesData.map((def) => {
              const cell = holdingFactoryCell(holding, cfg.key, 'factory', def.quality);
              const m = factoryMult(def.quality);
              const single = cfg.type === 'fw' ? roundNumber(def.baseOutput * m, 2) : def.baseOutput * m;
              return (
                <FactoryCard
                  key={`f${def.quality}`}
                  def={def}
                  cell={cell}
                  iconUrl={factoryIconUrl(cfg, def.quality)}
                  pollutionRate={poll(def.quality)}
                  outputText={`${num(single)} / session`}
                  onCompanies={(v) => api.setCell(holding.id, cfg.key, 'factory', def.quality, 'companies', v)}
                  onWorkers={(v) => api.setCell(holding.id, cfg.key, 'factory', def.quality, 'workers', v)}
                />
              );
            })}
            {cfg.rmData.map((def) => {
              const kind = cfg.type === 'fw' ? 'plantation' : 'rm';
              const cell = holdingFactoryCell(holding, cfg.key, kind, def.quality);
              const single = gameRawProduction((def.baseOutput / 100) * rmMult());
              return (
                <FactoryCard
                  key={`r${def.quality}`}
                  def={def}
                  cell={cell}
                  iconUrl={rmIconUrl(cfg, def.quality)}
                  pollutionRate={poll(0)}
                  outputText={`${num(single)} ${cfg.rmName} / session`}
                  borderColor="#78909c"
                  hideWorkers={def.maxEmployees === 0}
                  onCompanies={(v) => api.setCell(holding.id, cfg.key, kind, def.quality, 'companies', v)}
                  onWorkers={(v) => api.setCell(holding.id, cfg.key, kind, def.quality, 'workers', v)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
