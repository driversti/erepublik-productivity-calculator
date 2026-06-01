import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { IndustryKey } from '../../data/types';
import type { AdvisorReport } from '../../calc/advisor';

function productName(t: TFunction, row: { industry: IndustryKey; quality: number; kind: 'factory' | 'rm' }): string {
  const cfg = getIndustry(row.industry);
  const label = row.kind === 'rm' ? cfg.rmName : industryLabel(t, cfg);
  return `${cfg.icon} ${label} Q${row.quality}`;
}

export function RecommendationHeadline({ report }: { report: AdvisorReport }) {
  const { t } = useTranslation(['common', 'advisor']);
  const top = report.topWam;
  const anyPriced = report.rows.some((r) => r.hasPrice);

  // Only present the top WAM pick when it is actually profitable; a "best of
  // several losses" is not a recommendation.
  const showTop = top !== null && top.wamNet !== null && top.wamNet > 0;

  // Hired viability, split: profitable already vs profitable only once Tycoon is on.
  const hiredPlain = report.rows.filter((r) => r.hasPrice && !r.excluded && (r.hireNet ?? 0) > 0);
  const hiredTycoonOnly = report.rows.filter((r) => r.hasPrice && !r.excluded && (r.hireNet ?? 0) <= 0 && (r.hireNetTycoon ?? 0) > 0);

  const names = (rows: typeof report.rows) => rows.map((r) => productName(t, r)).join(', ');

  return (
    <section className="advisor-headline">
      {!anyPriced && <div className="advisor-headline-top">{t('advisor:headline.syncHint')}</div>}
      {showTop && (
        <div className="advisor-headline-top">
          🏆 {t('advisor:headline.topWam')}:&nbsp;
          <strong>{productName(t, top)}</strong>
          &nbsp;→&nbsp;
          <span className="pos">+{(top.wamNet as number).toFixed(2)} CC</span> {t('advisor:headline.perDay')}
        </div>
      )}
      {anyPriced && (
        <ul className="advisor-headline-list">
          <li>
            👷{' '}
            {hiredPlain.length === 0 && hiredTycoonOnly.length === 0
              ? t('advisor:headline.hiredNone')
              : [
                  hiredPlain.length ? `${t('advisor:headline.hiredProfit')} ${names(hiredPlain)}` : '',
                  hiredTycoonOnly.length ? `${t('advisor:headline.hiredTycoonOnly')} ${names(hiredTycoonOnly)}` : '',
                ].filter(Boolean).join(' · ')}
          </li>
          {report.rmVerdicts
            .filter((v) => v.hasPrice)
            .map((v) => {
              const cfg = getIndustry(v.industry);
              return (
                <li key={v.industry}>
                  {cfg.icon} {cfg.rmName}:{' '}
                  <span className={v.convertIsBetter ? 'pos' : 'neg'}>
                    {v.convertIsBetter ? t('advisor:headline.convert') : t('advisor:headline.sellRaw')}
                  </span>{' '}
                  (Δ {v.delta.toFixed(2)})
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
