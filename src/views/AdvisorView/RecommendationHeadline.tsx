import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { IndustryKey } from '../../data/types';
import type { AdvisorReport } from '../../calc/advisor';

function productName(t: TFunction, industry: IndustryKey, quality: number): string {
  const cfg = getIndustry(industry);
  return `${cfg.icon} ${industryLabel(t, cfg)} Q${quality}`;
}

export function RecommendationHeadline({ report }: { report: AdvisorReport }) {
  // `common` first so `t` is brand-compatible with `industryLabel`'s TFunction;
  // advisor strings are reached via the `advisor:` prefix.
  const { t } = useTranslation(['common', 'advisor']);
  const top = report.topWam;
  // Only present the top WAM pick when it is actually profitable; a "best of
  // several losses" is not a recommendation.
  const showTop = top !== null && top.wamNet !== null && top.wamNet > 0;

  // Hired viability: any priced quality whose Tycoon hired-session is positive.
  const hiredPositive = report.rows.filter((r) => r.hasPrice && r.hireNetTycoon > 0);

  return (
    <section className="advisor-headline">
      {showTop && (
        <div className="advisor-headline-top">
          🏆 {t('advisor:headline.topWam')}:&nbsp;
          <strong>{productName(t, top.industry, top.quality)}</strong>
          &nbsp;→&nbsp;
          <span className="pos">+{(top.wamNet as number).toFixed(2)} CC</span> {t('advisor:headline.perDay')}
        </div>
      )}
      <ul className="advisor-headline-list">
        <li>
          👷{' '}
          {hiredPositive.length === 0
            ? t('advisor:headline.hiredNone')
            : `${t('advisor:headline.hiredViable')} (${t('advisor:headline.hiredViableTycoon')}): ` +
              hiredPositive.map((r) => productName(t, r.industry, r.quality)).join(', ')}
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
    </section>
  );
}
