import type { IndustryKey } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import type { Cell } from '../../calc/types';
import { getIndustry } from '../../data/industries';
import { useState } from 'react';
import { useModule, useIndustryView, useHiredView, useSetFactoryCell, useIndustrySync, useSharedFlags } from '../../state/hooks';
import { Counter } from '../../components/Counter';
import { SummarySidebar } from './SummarySidebar';
import { ModifiersPanel } from './ModifiersPanel';
import { PricesPanel } from './PricesPanel';
import { factoryIconUrl, rmIconUrl } from './icons';
import { productivityMultiplier, pollutionAt, roundNumber, gameRawProduction } from '../../calc/rounding';
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
import { industryLabel, industryRm } from '../../i18n/names';

const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  industryKey: IndustryKey;
}

export function IndustryView({ industryKey }: Props) {
  const { t } = useTranslation(['common', 'industry', 'tooltips']);
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

  // Per-card single-session output. Includes the Tycoon bonus to match the legacy
  // per-card display (the headline KPIs flow through the calc views, which also
  // honor tycoon/WAM). WAM is a session-count multiplier, not a per-session-output
  // one, so it's correctly absent here.
  const shared = useSharedFlags();
  const { hasTycoon } = shared;
  const factoryMult = (q: number) =>
    productivityMultiplier({ countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, hasTycoon, pollutionRate: pollutionAt(mod.qualityPollution, q) });
  const rmMult = () =>
    productivityMultiplier({ countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, hasTycoon, pollutionRate: pollutionAt(mod.qualityPollution, 0) });

  const sync = useIndustrySync(industryKey);
  const [syncing, setSyncing] = useState(false);
  const onSyncPrices = () => {
    setSyncing(true);
    sync.syncPrices().catch((e) => console.error('Price sync failed:', e)).finally(() => setSyncing(false));
  };

  return (
    <main className="app-container-wide" data-testid={`industry-view-${industryKey}`}>
      <ModifiersPanel cfg={cfg} mod={mod} onSelectCountry={sync.selectCountry} onSelectRegion={sync.selectRegion} onSyncPrices={onSyncPrices} syncing={syncing} />

      <div className="main-content-split">
        <aside className="left-side">
          {summary}
        </aside>

        <section className="workspace">
          <div className="table-card">
            <div className="card-header">
              <h2>{t('industry:tables.factoriesHeader', { label: industryLabel(t, cfg) })}</h2>
            </div>
            <div className="card-body" data-testid="factories-container" style={{ padding: 0 }}>
              <table className="dense-table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }} {...tip(t('tooltips:colQuality'))}>{t('industry:tables.headers.quality')}</th>
                    <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colCompanies'))}>{t('industry:tables.headers.companies')}</th>
                    <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colWorkers'))}>{t('industry:tables.headers.workers')}</th>
                    <th className="align-right" {...tip(t('tooltips:colOutput'))}>{t('industry:tables.headers.output')}</th>
                    <th className="align-right" {...tip(t('tooltips:colNetProfit'))}>{t('industry:tables.headers.netProfit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.factoriesData.map((def) => {
                    const cell = readFactoryCell(cfg.type, mod, def.quality);
                    const m = factoryMult(def.quality);
                    const singleOutput = cfg.type === 'fw' ? roundNumber(def.baseOutput * m, 2) : def.baseOutput * m;

                    const companies = cell.companies || 0;
                    const maxWorkers = companies * def.maxEmployees;
                    const workers = Math.min(cell.workers || 0, maxWorkers);
                    const sessions = cfg.type === 'fw' ? ((shared.wamEnabled ? companies : 0) + workers) : workers;

                    const singleRM = roundNumber((def.baseRM ?? 0) * m, 2);
                    const cardOutput = singleOutput * sessions;
                    const cardRM = singleRM * sessions;
                    const cardRevenue = cardOutput * (mod.prices[def.quality] ?? 0) * (1 - mod.vat / 100);

                    const taxPerSession = (mod.workTaxRate / 100) * mod.averageSalary;
                    const factoryTax = cfg.type === 'fw' ? ((shared.wamEnabled ? companies : 0) * taxPerSession) : 0;
                    const factoryLabor = workers * shared.offeredSalary;
                    const rmPrice = shared[cfg.rmPriceKey] ?? 0;
                    const factoryNetProfit = cardRevenue - factoryTax - factoryLabor - cardRM * rmPrice;

                    return (
                      <tr key={def.quality} data-testid={`factory-card-${def.quality}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={factoryIconUrl(cfg, def.quality)} alt={`Q${def.quality}`} className="factory-img" style={{ width: 24, height: 24 }} />
                            <span style={{ fontWeight: 700 }}>Q{def.quality}</span>
                            <span className="pollution-badge" style={{ color: pollutionAt(mod.qualityPollution, def.quality) > 0 ? '#e74c3c' : 'var(--text-secondary)' }}>
                              ({pollutionAt(mod.qualityPollution, def.quality).toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="align-center">
                          <Counter
                            label={t('labels.companies')}
                            value={cell.companies || 0}
                            max={9999}
                            hideLabel
                            onChange={(v) => setCell(industryKey, 'factory', def.quality, 'companies', v)}
                          />
                        </td>
                        <td className="align-center">
                          <Counter
                            label={t('labels.workers')}
                            value={cell.workers || 0}
                            max={maxWorkers}
                            hideLabel
                            onChange={(v) => setCell(industryKey, 'factory', def.quality, 'workers', v)}
                          />
                        </td>
                        <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                          {t('industry:tables.outputSession', { value: num(singleOutput) })}
                        </td>
                        <td className={`align-right ${companies === 0 ? 'text-muted' : factoryNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                          {companies === 0 ? '—' : `${factoryNetProfit >= 0 ? '+' : ''}${num(factoryNetProfit)} CC`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-card">
            <div className="card-header">
              <h2>{t('industry:tables.rmHeader', { rm: industryRm(t, cfg) })}</h2>
            </div>
            <div className="card-body" data-testid="plantations-container" style={{ padding: 0 }}>
              <table className="dense-table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }} {...tip(t('tooltips:colQuality'))}>{t('industry:tables.headers.quality')}</th>
                    <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colCompanies'))}>{t('industry:tables.headers.companies')}</th>
                    <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colWorkers'))}>{t('industry:tables.headers.workers')}</th>
                    <th className="align-right" {...tip(t('tooltips:colOutput'))}>{t('industry:tables.headers.output')}</th>
                    <th className="align-right" {...tip(t('tooltips:colNetProfit'))}>{t('industry:tables.headers.netProfit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.rmData.map((def) => {
                    const cell = readRmCell(cfg.type, mod, def.quality);
                    const m = rmMult();
                    const singleOutput = gameRawProduction((def.baseOutput / 100) * m);
                    const rmKind = cfg.type === 'fw' ? 'plantation' : 'rm';

                    const companies = cell.companies || 0;
                    const maxWorkers = companies * def.maxEmployees;
                    const workers = Math.min(cell.workers || 0, maxWorkers);
                    const sessions = cfg.type === 'fw' ? ((shared.wamEnabled ? companies : 0) + workers) : workers;

                    const cardOutput = singleOutput * sessions;
                    const taxPerSession = (mod.workTaxRate / 100) * mod.averageSalary;
                    const plantTax = cfg.type === 'fw' ? ((shared.wamEnabled ? companies : 0) * taxPerSession) : 0;
                    const plantLabor = workers * shared.offeredSalary;
                    const rmPrice = shared[cfg.rmPriceKey] ?? 0;
                    const producedValue = cardOutput * rmPrice;
                    const plantNetProfit = producedValue - plantTax - plantLabor;

                    return (
                      <tr key={def.quality} data-testid={`rm-card-${def.quality}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={rmIconUrl(cfg, def.quality)} alt={`Q${def.quality}`} className="factory-img" style={{ width: 24, height: 24 }} />
                            <span style={{ fontWeight: 700 }}>Q{def.quality}</span>
                            <span className="pollution-badge" style={{ color: pollutionAt(mod.qualityPollution, 0) > 0 ? '#e74c3c' : 'var(--text-secondary)' }}>
                              ({pollutionAt(mod.qualityPollution, 0).toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="align-center">
                          <Counter
                            label={t('labels.companies')}
                            value={cell.companies || 0}
                            max={9999}
                            hideLabel
                            onChange={(v) => setCell(industryKey, rmKind, def.quality, 'companies', v)}
                          />
                        </td>
                        <td className="align-center">
                          {def.maxEmployees > 0 ? (
                            <Counter
                              label={t('labels.workers')}
                              value={cell.workers || 0}
                              max={maxWorkers}
                              hideLabel
                              onChange={(v) => setCell(industryKey, rmKind, def.quality, 'workers', v)}
                            />
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>—</span>
                          )}
                        </td>
                        <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                          {t('industry:tables.outputSessionRm', { value: num(singleOutput), rm: industryRm(t, cfg) })}
                        </td>
                        <td className={`align-right ${companies === 0 ? 'text-muted' : plantNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                          {companies === 0 ? '—' : `${plantNetProfit >= 0 ? '+' : ''}${num(plantNetProfit)} CC`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <PricesPanel cfg={cfg} mod={mod} />
        </section>
      </div>
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
