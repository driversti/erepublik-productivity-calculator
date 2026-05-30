import type { IndustryConfig } from '../../data/types';
import type { IndustryView } from '../../calc/strategy';
import type { HiredView } from '../../calc/hiredView';

const cc = (n: number) => `${n.toFixed(2)} CC`;
const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cls = (n: number) => (n >= 0 ? 'kpi-value text-success' : 'kpi-value text-danger');

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

function recommendation(a: number, b: number, rm: string): string {
  if (a > b) return `Recommendation: Option A (Buy ${rm}) is more profitable by ${(a - b).toFixed(2)} CC/day`;
  if (b > a) return `Recommendation: Option B (Produce) is more profitable by ${(b - a).toFixed(2)} CC/day`;
  return 'Recommendation: Both options are equally profitable';
}

export function SummarySidebar(props: Props) {
  const { cfg } = props;
  const rm = cfg.rmName;
  const v = normalize(props);
  const grossProfit = v.revenue - v.rmCost;

  return (
    <aside className="summary-sidebar">
      <div className="summary-card">
        <div className="summary-header">
          <h2 className="summary-title">Profit Summary</h2>
          <span className="strategy-badge" style={{ fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 4, color: 'white', textTransform: 'uppercase', background: v.producing ? '#e67e22' : 'var(--erep-blue)' }}>
            {v.producing ? 'Option B' : 'Option A'}
          </span>
        </div>

        <div className="summary-kpis">
          <div className="kpi-block">
            <span className="kpi-label">Est. Daily Net Profit</span>
            <span className={cls(v.net)} data-testid="total-net-profit">{cc(v.net)}</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-block-inline">
              <span className="kpi-label">Total Companies</span>
              <span className="kpi-value-small" data-testid="total-factories-count">{v.companies}</span>
            </div>
            <div className="kpi-block-inline">
              <span className="kpi-label">{cfg.label} Output</span>
              <span className="kpi-value-small" data-testid="total-output">{num(v.output)}</span>
            </div>
            <div className="kpi-block-inline">
              <span className="kpi-label">{rm} Consumed</span>
              <span className="kpi-value-small" data-testid="total-rm-required">{num(v.rmUsed)} {rm}</span>
            </div>
          </div>
        </div>

        <div className="kpi-grid" style={{ marginTop: 8 }}>
          <div className="kpi-block-inline"><span className="kpi-label">Daily Revenue</span><span className="kpi-value-small kpi-blue" data-testid="total-gross-revenue">{cc(v.revenue)}</span></div>
          <div className="kpi-block-inline"><span className="kpi-label">Daily {rm} Cost</span><span className={v.rmCost < 0 ? 'kpi-value-small text-success' : 'kpi-value-small kpi-gold'} data-testid="total-rm-cost">{cc(v.rmCost)}</span></div>
          <div className="kpi-block-inline"><span className="kpi-label">Gross Profit</span><span className={v.net >= 0 ? 'kpi-value-small text-success' : 'kpi-value-small text-danger'} data-testid="total-gross-profit">{cc(grossProfit)}</span></div>
          <div className="kpi-block-inline"><span className="kpi-label">Daily Work Tax</span><span className="kpi-value-small kpi-red" data-testid="total-work-tax">-{cc(v.workTax)}</span></div>
          <div className="kpi-block-inline"><span className="kpi-label">Daily Salary</span><span className="kpi-value-small kpi-red" data-testid="total-salary">-{cc(v.salary)}</span></div>
        </div>

        <div className="details-section">
          <h3 className="details-title">Factory Breakdown</h3>
          <ul className="breakdown-list" data-testid="breakdown-list">
            {v.breakdown.length === 0 ? (
              <li className="info-text">No factories configured yet.</li>
            ) : (
              v.breakdown.map((b) => (
                <li className="breakdown-item" key={b.quality}>
                  <span className="breakdown-label">Q{b.quality} ({b.companies}c / {b.workers}w)</span>
                  <span className="breakdown-count" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span>+{num(b.output)}</span>
                    <span className={b.profit >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: 11, fontWeight: 700 }}>
                      {b.profit >= 0 ? '+' : ''}{b.profit.toFixed(2)} CC
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="details-section">
          <h3 className="details-title" style={{ marginBottom: 8 }}>{rm} Strategy Comparison</h3>
          <div className="kpi-block-inline" style={{ marginBottom: 6 }}>
            <span className="kpi-label">{rm} Produced</span>
            <span className="kpi-value-small" style={{ color: 'var(--erep-gold)', fontWeight: 700 }}>{v.rmProduced.toFixed(2)} {rm}</span>
          </div>
          <div className="kpi-block-inline" style={{ marginBottom: 10 }}>
            <span className="kpi-label">{rm} Net Balance</span>
            <span className={v.netBalance >= 0 ? 'kpi-value-small text-success' : 'kpi-value-small text-danger'} data-testid="rm-net-balance" style={{ fontWeight: 700 }}>
              {v.netBalance >= 0 ? '+' : ''}{v.netBalance.toFixed(2)} {rm}
            </span>
          </div>
          <div className="strategy-options">
            <div className="strategy-option-card" data-testid="strategy-buy-card" style={{ border: `1px solid ${!v.producing && v.optionANet >= v.optionBNet ? 'var(--erep-green)' : 'var(--border-color)'}`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Option A: Buy {rm}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>Market Cost: {v.optionABuy.toFixed(2)} CC</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>Net Profit: <span className={v.optionANet >= 0 ? 'text-success' : 'text-danger'}>{cc(v.optionANet)}</span></div>
            </div>
            <div className="strategy-option-card" data-testid="strategy-produce-card" style={{ border: `1px solid ${v.optionBNet > v.optionANet ? 'var(--erep-green)' : 'var(--border-color)'}`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Option B: Produce {rm}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>Balance: {v.netBalance.toFixed(2)} {rm}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>Net Profit: <span className={v.optionBNet >= 0 ? 'text-success' : 'text-danger'}>{cc(v.optionBNet)}</span></div>
            </div>
          </div>
          <div data-testid="strategy-recommendation" style={{ marginTop: 10, fontSize: 11, fontWeight: 700, padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid var(--border-color)' }}>
            {recommendation(v.optionANet, v.optionBNet, rm)}
          </div>
        </div>
      </div>
    </aside>
  );
}
