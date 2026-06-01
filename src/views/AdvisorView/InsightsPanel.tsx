import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { Insight } from '../../calc/advisorInsights';
import type { IndustryKey } from '../../data/types';

const ICON: Record<string, string> = { good: '✅', warn: '⚠️', bad: '🛑', info: 'ℹ️' };

// Signed float: "+12.34" or "-12.34" — used for profit direction values.
const fmt = (n: unknown) => (typeof n === 'number' ? (n > 0 ? '+' : '') + n.toFixed(2) : String(n));

// Unsigned integer: "9927" — used where a leading +/- would read unnaturally.
const int = (n: unknown) => Math.round(Number(n)).toString();

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  const { t } = useTranslation(['common', 'advisor']);
  if (!insights.length) return null;

  const product = (industry: unknown, quality: unknown, kind?: unknown) => {
    const cfg = getIndustry(industry as IndustryKey);
    const label = kind === 'rm' ? cfg.rmName : industryLabel(t, cfg);
    return `${cfg.icon} ${label} Q${quality}`;
  };

  const line = (i: Insight): string => {
    const p = i.params;
    switch (i.type) {
      case 'bestAction':
        return t('advisor:insights.bestAction', {
          product: product(p.industry, p.quality, p.kind),
          net: fmt(p.net),
        });
      case 'mainEarner':
        return t('advisor:insights.mainEarner', {
          product: product(p.industry, p.quality, p.kind),
          count: p.count,
          total: int(p.total),
        });
      case 'lossMaker':
        return t('advisor:insights.lossMaker', {
          product: product(p.industry, p.quality),
          count: p.count,
          total: int(Math.abs(Number(p.total))),
        });
      case 'deadCapital':
        return t('advisor:insights.deadCapital', { count: p.count });
      case 'rmStrategy': {
        const cfg = getIndustry(p.industry as IndustryKey);
        return Number(p.convert)
          ? t('advisor:insights.rmStrategyConvert', { rm: cfg.rmName, quality: p.quality, delta: fmt(p.delta) })
          : t('advisor:insights.rmStrategySell', { rm: cfg.rmName, delta: fmt(p.delta) });
      }
      case 'hiring':
        return p.mode === 'none'
          ? t('advisor:insights.hiringNone', { salary: int(p.salary) })
          : p.mode === 'tycoon'
          ? t('advisor:insights.hiringTycoon')
          : t('advisor:insights.hiringSome');
      case 'caveat':
        return t('advisor:insights.caveat');
      default:
        return '';
    }
  };

  return (
    <section className="advisor-insights">
      <h3>{t('advisor:insights.title')}</h3>
      <ul>
        {insights.map((i, idx) => (
          <li key={`${i.type}-${idx}`} className={`insight insight-${i.severity}`} data-testid={`insight-${i.type}`}>
            <span className="insight-icon">{ICON[i.severity]}</span> {line(i)}
          </li>
        ))}
      </ul>
    </section>
  );
}
