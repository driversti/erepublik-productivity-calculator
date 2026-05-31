import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Holding } from '../../state/types';
import type { IndustryConfig } from '../../data/types';
import type { IndustryResult } from '../../calc/types';
import type { HoldingsApi } from '../../state/hooks';
import { holdingFactoryCell, useModule, useSharedFlags } from '../../state/hooks';
import { Counter } from '../../components/Counter';
import { factoryIconUrl, rmIconUrl } from '../IndustryView/icons';
import { productivityMultiplier, pollutionAt, roundNumber, gameRawProduction } from '../../calc/rounding';
import { tip } from '../../components/tooltip';
import { industryLabel, industryRm } from '../../i18n/names';

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

// One collapsible industry section inside a holding. Refactored to use dense tables
// matching the main IndustryView style.
export function HoldingSection({ holding, cfg, result, hasTycoon, api, defaultCollapsed }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { t } = useTranslation(['common', 'industry', 'holdings', 'tooltips']);
  const ind = holding.industries[cfg.key];
  const poll = (i: number) => pollutionAt(ind.qualityPollution, i);

  const factoryMult = (q: number) => productivityMultiplier({ countryBonus: ind.countryBonus, regionBonus: ind.regionBonus, hasTycoon, pollutionRate: poll(q) });
  const rmMult = () => productivityMultiplier({ countryBonus: ind.countryBonus, regionBonus: ind.regionBonus, hasTycoon, pollutionRate: poll(0) });

  const mod = useModule(cfg.key);
  const shared = useSharedFlags();

  return (
    <div className={`hld-section${collapsed ? ' collapsed' : ''}`} data-industry={cfg.key} data-testid={`hld-section-${cfg.key}`}>
      <div className="hld-section-head" onClick={() => setCollapsed((c) => !c)} style={{ cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <span className="hld-ind-name">{industryLabel(t, cfg)}</span>
        <span className="hld-ind-mods">{t('holdings:section.mods', { country: ind.countryBonus, region: ind.regionBonus, pollution: poll(1).toFixed(2) })}</span>
        <span className={`hld-ind-net ${result.net >= 0 ? 'text-success' : 'text-danger'}`}>
          {result.net >= 0 ? '+' : ''}{result.net.toFixed(2)} CC
        </span>
        <span className="hld-chev">{collapsed ? '▸' : '▾'}</span>
      </div>
      {!collapsed && (
        <div className="hld-section-body" style={{ padding: 0 }}>
          <div className="table-card" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 0 }}>
            <div className="card-header" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-color)', padding: '6px 12px' }}>
              <h2 style={{ fontSize: 11 }}>{t('industry:tables.factoriesHeaderShort', { label: industryLabel(t, cfg) })}</h2>
            </div>
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
                  const cell = holdingFactoryCell(holding, cfg.key, 'factory', def.quality);
                  const m = factoryMult(def.quality);
                  const singleOutput = cfg.type === 'fw' ? roundNumber(def.baseOutput * m, 2) : def.baseOutput * m;
                  
                  const companies = cell.companies || 0;
                  const maxWorkers = companies * def.maxEmployees;
                  const workers = Math.min(cell.workers || 0, maxWorkers);
                  const sessions = cfg.type === 'fw' ? ((shared.wamEnabled ? companies : 0) + workers) : workers;
                  
                  const singleRM = roundNumber((def.baseRM ?? 0) * m, 2);
                  const cardOutput = singleOutput * sessions;
                  const cardRM = singleRM * sessions;
                  const cardRevenue = cardOutput * (mod.prices[def.quality] ?? 0) * (1 - ind.vat / 100);
                  
                  const taxPerSession = (holding.workTaxRate / 100) * holding.averageSalary;
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
                          <span className="pollution-badge" style={{ color: poll(def.quality) > 0 ? '#e74c3c' : 'var(--text-secondary)' }}>
                            ({poll(def.quality).toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="align-center">
                        <Counter
                          label={t('labels.companies')}
                          value={cell.companies || 0}
                          max={9999}
                          hideLabel
                          onChange={(v) => api.setCell(holding.id, cfg.key, 'factory', def.quality, 'companies', v)}
                        />
                      </td>
                      <td className="align-center">
                        <Counter
                          label={t('labels.workers')}
                          value={cell.workers || 0}
                          max={maxWorkers}
                          hideLabel
                          onChange={(v) => api.setCell(holding.id, cfg.key, 'factory', def.quality, 'workers', v)}
                        />
                      </td>
                      <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                        {t('industry:tables.outputSession', { value: num(singleOutput) })}
                      </td>
                      <td className={`align-right ${factoryNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                        {factoryNetProfit >= 0 ? '+' : ''}{num(factoryNetProfit)} CC
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-card" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 0, borderTop: '1px solid var(--border-color)' }}>
            <div className="card-header" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-color)', padding: '6px 12px' }}>
              <h2 style={{ fontSize: 11 }}>{t('industry:tables.rmHeaderShort', { rm: industryRm(t, cfg) })}</h2>
            </div>
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
                  const kind = cfg.type === 'fw' ? 'plantation' : 'rm';
                  const cell = holdingFactoryCell(holding, cfg.key, kind, def.quality);
                  const m = rmMult();
                  const singleOutput = gameRawProduction((def.baseOutput / 100) * m);

                  const companies = cell.companies || 0;
                  const maxWorkers = companies * def.maxEmployees;
                  const workers = Math.min(cell.workers || 0, maxWorkers);
                  const sessions = cfg.type === 'fw' ? ((shared.wamEnabled ? companies : 0) + workers) : workers;
                  
                  const cardOutput = singleOutput * sessions;
                  const taxPerSession = (holding.workTaxRate / 100) * holding.averageSalary;
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
                          <span className="pollution-badge" style={{ color: poll(0) > 0 ? '#e74c3c' : 'var(--text-secondary)' }}>
                            ({poll(0).toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="align-center">
                        <Counter
                          label={t('labels.companies')}
                          value={cell.companies || 0}
                          max={9999}
                          hideLabel
                          onChange={(v) => api.setCell(holding.id, cfg.key, kind, def.quality, 'companies', v)}
                        />
                      </td>
                      <td className="align-center">
                        {def.maxEmployees > 0 ? (
                          <Counter
                            label={t('labels.workers')}
                            value={cell.workers || 0}
                            max={maxWorkers}
                            hideLabel
                            onChange={(v) => api.setCell(holding.id, cfg.key, kind, def.quality, 'workers', v)}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>—</span>
                        )}
                      </td>
                      <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                        {t('industry:tables.outputSessionRm', { value: num(singleOutput), rm: industryRm(t, cfg) })}
                      </td>
                      <td className={`align-right ${plantNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                        {plantNetProfit >= 0 ? '+' : ''}{num(plantNetProfit)} CC
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
