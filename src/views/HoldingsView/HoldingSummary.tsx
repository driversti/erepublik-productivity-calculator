import { useTranslation } from 'react-i18next';
import type { Holding } from '../../state/types';
import { INDUSTRIES } from '../../data/industries';
import { useHoldingSummary } from '../../state/hooks';
import { tip } from '../../components/tooltip';
import { industryLabel } from '../../i18n/names';

const cc = (n: number) => `${n.toFixed(2)} CC`;

interface Props {
  holding: Holding;
}

export function HoldingSummary({ holding }: Props) {
  const sum = useHoldingSummary(holding);
  const rows = sum.perIndustry.filter((p) => p.companies > 0);
  const { t } = useTranslation(['common', 'holdings', 'tooltips']);

  return (
    <aside className="holdings-summary">
      <div className="card summary-card">
        <div className="card-header"><h2>{t('holdings:summary.title')}</h2></div>
        <div className="card-body">
          <div className="kpi-list">
            <div className="kpi-block" {...tip(t('tooltips:hldNetProfit'))}>
              <span className="kpi-label">{t('holdings:summary.netProfit')}</span>
              <span className={sum.net >= 0 ? 'kpi-value text-success' : 'kpi-value text-danger'} data-testid="hld-net-profit">{cc(sum.net)}</span>
            </div>
            <div className="kpi-block-inline" {...tip(t('tooltips:sumTotalCompanies'))}>
              <span className="kpi-label">{t('holdings:summary.totalCompanies')}</span>
              <span className="kpi-value-small" data-testid="hld-total-companies">{sum.companies}</span>
            </div>
            <div className="kpi-block" {...tip(t('tooltips:hldRevenue'))}><span className="kpi-label">{t('holdings:summary.revenue')}</span><span className="kpi-value kpi-blue" data-testid="hld-revenue">{cc(sum.revenue)}</span></div>
            <div className="kpi-block" {...tip(t('tooltips:hldRmNet'))}><span className="kpi-label">{t('holdings:summary.rmNet')}</span><span className={sum.rmNetCost <= 0 ? 'kpi-value text-success' : 'kpi-value kpi-gold'} data-testid="hld-rm-net">{cc(sum.rmNetCost)}</span></div>
            <div className="kpi-block" {...tip(t('tooltips:hldWorkTax'))}><span className="kpi-label">{t('holdings:summary.workTax')}</span><span className="kpi-value kpi-red" data-testid="hld-work-tax">-{cc(sum.workTax)}</span></div>
            <div className="kpi-block" {...tip(t('tooltips:hldSalary'))}><span className="kpi-label">{t('holdings:summary.salaries')}</span><span className="kpi-value kpi-red" data-testid="hld-salary">-{cc(sum.salary)}</span></div>
          </div>
          <hr className="section-divider" />
          <div className="summary-details">
            <h3 className="details-title">{t('holdings:summary.perIndustry')}</h3>
            <ul className="breakdown-list" data-testid="hld-breakdown">
              {rows.length === 0 ? (
                <li className="info-text">{t('holdings:summary.empty')}</li>
              ) : (
                rows.map((p) => {
                  const cfg = INDUSTRIES.find((c) => c.key === p.key)!;
                  return (
                    <li className="breakdown-item" key={p.key}>
                      <span className="breakdown-label">{t('holdings:summary.breakdownItem', { icon: cfg.icon, label: industryLabel(t, cfg), companies: p.companies })}</span>
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
