import type { IndustryConfig } from '../../data/types';
import type { IndustryView } from '../../calc/strategy';
import type { HiredView } from '../../calc/hiredView';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { tip } from '../../components/tooltip';
import { industryLabel, industryRm } from '../../i18n/names';

const cc = (n: number) => `${n.toFixed(2)} CC`;
const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface FwProps { kind: 'fw'; cfg: IndustryConfig; view: IndustryView }
interface HiredProps { kind: 'hired'; cfg: IndustryConfig; view: HiredView }
type Props = FwProps | HiredProps;

// Normalize the two view shapes into one display model.
function normalize(p: Props) {
  if (p.kind === 'fw') {
    const v = p.view;
    return {
      net: v.displayNet, companies: v.totalFactories, output: v.totalOutput, rmUsed: v.totalRM,
      revenue: v.grossRevenue, rmCost: v.displayRMCost, workTax: v.displayWorkTax, salary: v.displaySalary,
      rmProduced: v.totalRMProduced, netBalance: v.netBalance, optionABuy: v.optionABuyCost,
      optionANet: v.optionANet, optionBNet: v.optionBNet, producing: v.producingRM,
      breakdown: v.breakdown.map((b) => ({ quality: b.quality, companies: b.companies, workers: b.workers, output: b.output, profit: b.grossProfit })),
    };
  }
  const v = p.view;
  return {
    net: v.displayNet, companies: v.totalCompanies, output: v.totalOutput, rmUsed: v.totalRMUsed,
    revenue: v.grossRevenue, rmCost: v.displayRMCost, workTax: 0, salary: v.displaySalary,
    rmProduced: v.totalRMProduced, netBalance: v.netBalance, optionABuy: v.optionABuyCost,
    optionANet: v.optionANet, optionBNet: v.optionBNet, producing: v.producingRM,
    breakdown: v.breakdown.map((b) => ({ quality: b.quality, companies: b.companies, workers: b.workers, output: b.output, profit: b.profit })),
  };
}

function recommendation(t: TFunction, a: number, b: number, rm: string): string {
  if (a > b) return t('industry:summary.recommendA' as never, { rm, delta: (a - b).toFixed(2) });
  if (b > a) return t('industry:summary.recommendB' as never, { delta: (b - a).toFixed(2) });
  return t('industry:summary.recommendEqual' as never);
}

export function SummarySidebar(props: Props) {
  const { t } = useTranslation(['common', 'industry', 'tooltips']);
  const { cfg } = props;
  const rm = industryRm(t, cfg);
  const v = normalize(props);
  const grossProfit = v.revenue - v.rmCost;
  const buyHighlight = !v.producing && v.optionANet >= v.optionBNet;
  const produceHighlight = v.optionBNet > v.optionANet;

  return (
    <div className="card summary-card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{t('industry:summary.title')}</h2>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 4, color: 'white', textTransform: 'uppercase', background: v.producing ? 'var(--erep-gold)' : 'var(--erep-blue)' }} {...tip(t('tooltips:strategyBadge'))}>
          {v.producing ? t('industry:summary.optionBBadge') : t('industry:summary.optionABadge')}
        </span>
      </div>
      <div className="card-body">
        <div className="kpi-list">
          <div className="kpi-block" {...tip(t('tooltips:sumNetProfit'))}>
            <span className="kpi-label">{t('industry:summary.netProfit')}</span>
            <span className={`kpi-value ${v.companies === 0 ? 'text-muted' : v.net >= 0 ? 'text-success' : 'text-danger'}`} data-testid="total-net-profit">{cc(v.net)}</span>
          </div>
          <hr className="kpi-divider" />
          <div className="kpi-block-inline" {...tip(t('tooltips:sumTotalCompanies'))}>
            <span className="kpi-label">{t('industry:summary.totalCompanies')}</span>
            <span className="kpi-value-small" data-testid="total-factories-count">{v.companies}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumOutput'))}>
            <span className="kpi-label">{t('industry:summary.output', { label: industryLabel(t, cfg) })}</span>
            <span className="kpi-value-small" data-testid="total-output">{num(v.output)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumRmConsumed'))}>
            <span className="kpi-label">{t('industry:summary.rmConsumed', { rm })}</span>
            <span className="kpi-value-small" data-testid="total-rm-required">{num(v.rmUsed)} {rm}</span>
          </div>
          <hr className="kpi-divider" />
          <div className="kpi-block-inline" {...tip(t('tooltips:sumRevenue'))}>
            <span className="kpi-label">{t('industry:summary.revenue')}</span>
            <span className={`kpi-value-small ${v.revenue === 0 ? 'text-muted' : 'kpi-blue'}`} data-testid="total-gross-revenue">{cc(v.revenue)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumRmCost'))}>
            <span className="kpi-label">{t('industry:summary.rmCost', { rm })}</span>
            <span className={`kpi-value-small ${v.rmCost === 0 ? 'text-muted' : v.rmCost < 0 ? 'text-success' : 'kpi-gold'}`} data-testid="total-rm-cost">{cc(v.rmCost)}</span>
          </div>
          <hr className="kpi-divider" />
          <div className="kpi-block-inline" {...tip(t('tooltips:sumGrossProfit'))}>
            <span className="kpi-label">{t('industry:summary.grossProfit')}</span>
            <span className={`kpi-value-small ${grossProfit === 0 ? 'text-muted' : grossProfit >= 0 ? 'text-success' : 'text-danger'}`} data-testid="total-gross-profit">{cc(grossProfit)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumWorkTax'))}>
            <span className="kpi-label">{t('industry:summary.workTax')}</span>
            <span className={`kpi-value-small ${v.workTax === 0 ? 'text-muted' : 'kpi-red'}`} data-testid="total-work-tax">{v.workTax === 0 ? cc(0) : `-${cc(v.workTax)}`}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumSalary'))}>
            <span className="kpi-label">{t('industry:summary.salary')}</span>
            <span className={`kpi-value-small ${v.salary === 0 ? 'text-muted' : 'kpi-red'}`} data-testid="total-salary">{v.salary === 0 ? cc(0) : `-${cc(v.salary)}`}</span>
          </div>
          <hr className="kpi-divider" />
          {/* Closing subtotal of the waterfall — mirrors the headline net at the top of the card. */}
          <div className="kpi-block-inline" {...tip(t('tooltips:sumNetProfit'))}>
            <span className="kpi-label">{t('industry:summary.netProfit')}</span>
            <span className={`kpi-value-small ${v.companies === 0 ? 'text-muted' : v.net >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }}>{cc(v.net)}</span>
          </div>
        </div>

        <hr className="section-divider" />

        <div className="summary-details">
          <h3 className="details-title">{t('industry:summary.breakdownTitle')}</h3>
          <ul className="breakdown-list" data-testid="breakdown-list">
            {v.breakdown.length === 0 ? (
              <li className="info-text" style={{ textAlign: 'center', fontStyle: 'italic' }}>{t('industry:summary.noFactories')}</li>
            ) : (
              v.breakdown.map((b) => (
                <li className="breakdown-item" key={b.quality}>
                  <span className="breakdown-label">{t('industry:summary.breakdownItem', { q: b.quality, companies: b.companies, workers: b.workers })}</span>
                  <span className="breakdown-count" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span {...tip(t('tooltips:breakdownOutput'))}>+{num(b.output)}</span>
                    <span className={b.profit >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: 11, fontWeight: 700 }} {...tip(t('tooltips:breakdownProfit'))}>
                      {b.profit >= 0 ? '+' : ''}{b.profit.toFixed(2)} CC
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <hr className="section-divider" />

        <div className="grain-comparison-section">
          <h3 className="details-title">{t('industry:summary.comparisonTitle', { rm })}</h3>
          <div className="kpi-block-inline" style={{ marginBottom: 4 }}>
            <span className="kpi-label">{t('industry:summary.rmProduced', { rm })}</span>
            <span className="kpi-value-small kpi-gold">{v.rmProduced.toFixed(2)} {rm}</span>
          </div>
          <div className="kpi-block-inline" style={{ marginBottom: 10 }}>
            <span className="kpi-label">{t('industry:summary.rmNetBalance', { rm })}</span>
            <span className={`kpi-value-small ${v.netBalance >= 0 ? 'text-success' : 'text-danger'}`} data-testid="rm-net-balance">
              {v.netBalance >= 0 ? '+' : ''}{v.netBalance.toFixed(2)} {rm}
            </span>
          </div>
          <div className="strategy-card-wrapper">
            <div className="strategy-option-card" data-testid="strategy-buy-card" {...tip(t('tooltips:optionA'))} style={buyHighlight ? { borderColor: 'var(--erep-green)', background: 'rgba(122,183,0,0.05)' } : undefined}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t('industry:summary.optionABuyTitle', { rm })}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>{t('industry:summary.optionAMarketCost', { cost: v.optionABuy.toFixed(2) })}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{t('industry:summary.netProfitInline')} <span className={v.optionANet >= 0 ? 'text-success' : 'text-danger'}>{cc(v.optionANet)}</span></div>
            </div>
            <div className="strategy-option-card" data-testid="strategy-produce-card" {...tip(t('tooltips:optionB'))} style={produceHighlight ? { borderColor: 'var(--erep-green)', background: 'rgba(122,183,0,0.05)' } : undefined}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t('industry:summary.optionBProduceTitle', { rm })}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>{t('industry:summary.optionBBalance', { balance: v.netBalance.toFixed(2), rm })}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{t('industry:summary.netProfitInline')} <span className={v.optionBNet >= 0 ? 'text-success' : 'text-danger'}>{cc(v.optionBNet)}</span></div>
            </div>
          </div>
          <div data-testid="strategy-recommendation" style={{ marginTop: 10, fontSize: 11, fontWeight: 700, padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-header)' }}>
            {recommendation(t, v.optionANet, v.optionBNet, rm)}
          </div>
        </div>
      </div>
    </div>
  );

}
