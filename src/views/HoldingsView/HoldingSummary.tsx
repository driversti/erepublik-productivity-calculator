import type { Holding } from '../../state/types';
import { INDUSTRIES } from '../../data/industries';
import { useHoldingSummary } from '../../state/hooks';

const cc = (n: number) => `${n.toFixed(2)} CC`;

interface Props {
  holding: Holding;
}

export function HoldingSummary({ holding }: Props) {
  const sum = useHoldingSummary(holding);
  const rows = sum.perIndustry.filter((p) => p.companies > 0);

  return (
    <aside className="holdings-summary">
      <div className="card summary-card">
        <div className="card-header"><h2>Holding Summary</h2></div>
        <div className="card-body">
          <div className="kpi-list">
            <div className="kpi-block">
              <span className="kpi-label">Total Net Profit</span>
              <span className={sum.net >= 0 ? 'kpi-value text-success' : 'kpi-value text-danger'} data-testid="hld-net-profit">{cc(sum.net)}</span>
            </div>
            <div className="kpi-block-inline">
              <span className="kpi-label">Total Companies</span>
              <span className="kpi-value-small" data-testid="hld-total-companies">{sum.companies}</span>
            </div>
            <div className="kpi-block"><span className="kpi-label">Daily Revenue</span><span className="kpi-value kpi-blue" data-testid="hld-revenue">{cc(sum.revenue)}</span></div>
            <div className="kpi-block"><span className="kpi-label">Raw Material (net)</span><span className={sum.rmNetCost <= 0 ? 'kpi-value text-success' : 'kpi-value kpi-gold'} data-testid="hld-rm-net">{cc(sum.rmNetCost)}</span></div>
            <div className="kpi-block"><span className="kpi-label">Work Tax</span><span className="kpi-value kpi-red" data-testid="hld-work-tax">-{cc(sum.workTax)}</span></div>
            <div className="kpi-block"><span className="kpi-label">Salaries</span><span className="kpi-value kpi-red" data-testid="hld-salary">-{cc(sum.salary)}</span></div>
          </div>
          <hr className="section-divider" />
          <div className="summary-details">
            <h3 className="details-title">Per industry</h3>
            <ul className="breakdown-list" data-testid="hld-breakdown">
              {rows.length === 0 ? (
                <li className="info-text">No companies in this holding yet.</li>
              ) : (
                rows.map((p) => {
                  const cfg = INDUSTRIES.find((c) => c.key === p.key)!;
                  return (
                    <li className="breakdown-item" key={p.key}>
                      <span className="breakdown-label">{cfg.icon} {p.label} ({p.companies}c)</span>
                      <span className={`breakdown-count ${p.net >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }}>
                        {p.net >= 0 ? '+' : ''}{p.net.toFixed(2)} CC
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
