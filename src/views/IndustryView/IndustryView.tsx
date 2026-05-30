import type { IndustryKey } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import type { Cell } from '../../calc/types';
import { getIndustry } from '../../data/industries';
import { useState } from 'react';
import { useModule, useIndustryView, useHiredView, useSetFactoryCell, useIndustrySync } from '../../state/hooks';
import { FactoryCard } from '../../components/FactoryCard';
import { SummarySidebar } from './SummarySidebar';
import { ModifiersPanel } from './ModifiersPanel';
import { PricesPanel } from './PricesPanel';
import { factoryIconUrl, rmIconUrl } from './icons';
import { productivityMultiplier, pollutionAt, roundNumber, gameRawProduction } from '../../calc/rounding';

const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  industryKey: IndustryKey;
}

export function IndustryView({ industryKey }: Props) {
  const cfg = getIndustry(industryKey);
  const mod = useModule(industryKey);
  const setCell = useSetFactoryCell();

  // Both hooks are called unconditionally (Rules of Hooks); the irrelevant one
  // is cheap and ignored.
  const fwView = useIndustryView(industryKey);
  const hiredView = useHiredView(industryKey);
  const summary = cfg.type === 'fw'
    ? <SummarySidebar kind="fw" cfg={cfg} view={fwView} />
    : <SummarySidebar kind="hired" cfg={cfg} view={hiredView} />;

  // Per-card single-session output. Cards show base×country×region×pollution at
  // the card level (tycoon/WAM affect totals, computed in the calc views).
  const factoryMult = (q: number) =>
    productivityMultiplier({ countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, hasTycoon: false, pollutionRate: pollutionAt(mod.qualityPollution, q) });
  const rmMult = () =>
    productivityMultiplier({ countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, hasTycoon: false, pollutionRate: pollutionAt(mod.qualityPollution, 0) });

  const sync = useIndustrySync(industryKey);
  const [syncing, setSyncing] = useState(false);
  const onSyncPrices = () => {
    setSyncing(true);
    sync.syncPrices().catch((e) => console.error('Price sync failed:', e)).finally(() => setSyncing(false));
  };

  return (
    <main className="app-container" data-testid={`industry-view-${industryKey}`}>
      {summary}
      <section className="config-area">
        <ModifiersPanel cfg={cfg} mod={mod} onSelectCountry={sync.selectCountry} onSelectRegion={sync.selectRegion} onSyncPrices={onSyncPrices} syncing={syncing} />
        <PricesPanel cfg={cfg} mod={mod} />

        <div className="config-card">
          <h3 className="details-title">Your {cfg.label} Factories</h3>
          <div className="factories-grid" data-testid="factories-container">
            {cfg.factoriesData.map((def) => {
              const cell = readFactoryCell(cfg.type, mod, def.quality);
              const m = factoryMult(def.quality);
              const singleOutput = cfg.type === 'fw' ? roundNumber(def.baseOutput * m, 2) : def.baseOutput * m;
              return (
                <FactoryCard
                  key={def.quality}
                  def={def}
                  cell={cell}
                  testId={`factory-card-${def.quality}`}
                  iconUrl={factoryIconUrl(cfg, def.quality)}
                  pollutionRate={pollutionAt(mod.qualityPollution, def.quality)}
                  outputText={`${num(singleOutput)} / session`}
                  onCompanies={(v) => setCell(industryKey, 'factory', def.quality, 'companies', v)}
                  onWorkers={(v) => setCell(industryKey, 'factory', def.quality, 'workers', v)}
                />
              );
            })}
          </div>
        </div>

        <div className="config-card">
          <h3 className="details-title">Your {cfg.rmName} Companies</h3>
          <div className="factories-grid" data-testid="plantations-container">
            {cfg.rmData.map((def) => {
              const cell = readRmCell(cfg.type, mod, def.quality);
              const singleOutput = gameRawProduction((def.baseOutput / 100) * rmMult());
              const rmKind = cfg.type === 'fw' ? 'plantation' : 'rm';
              return (
                <FactoryCard
                  key={def.quality}
                  def={def}
                  cell={cell}
                  testId={`rm-card-${def.quality}`}
                  iconUrl={rmIconUrl(cfg, def.quality)}
                  pollutionRate={pollutionAt(mod.qualityPollution, 0)}
                  outputText={`${num(singleOutput)} ${cfg.rmName} / session`}
                  borderColor="#e67e22"
                  hideWorkers={def.maxEmployees === 0}
                  onCompanies={(v) => setCell(industryKey, rmKind, def.quality, 'companies', v)}
                  onWorkers={(v) => setCell(industryKey, rmKind, def.quality, 'workers', v)}
                />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function readFactoryCell(type: string, mod: FwModule | HiredModule, q: number): Cell {
  if (type === 'fw') return (mod as FwModule)[q] ?? { companies: 0, workers: 0 };
  return (mod as HiredModule).factories[q] ?? { companies: 0, workers: 0 };
}

function readRmCell(type: string, mod: FwModule | HiredModule, q: number): Cell {
  if (type === 'fw') return (mod as FwModule).plantations[q] ?? { companies: 0, workers: 0 };
  return (mod as HiredModule).rm[q] ?? { companies: 0, workers: 0 };
}
