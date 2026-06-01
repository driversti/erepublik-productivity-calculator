import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import type { RmVerdict } from '../../calc/advisor';

export function RmStrategyPanel({ verdicts }: { verdicts: RmVerdict[] }) {
  const { t } = useTranslation('advisor');
  const priced = verdicts.filter((v) => v.hasPrice);
  if (priced.length === 0) return null;

  return (
    <section className="advisor-rm-panel">
      <h3>{t('rm.title')}</h3>
      <div className="advisor-rm-grid">
        {priced.map((v) => {
          const cfg = getIndustry(v.industry);
          return (
            <div className="advisor-rm-card" key={v.industry} data-testid={`rm-${v.industry}`}>
              <div className="advisor-rm-head">{cfg.icon} {cfg.rmName}</div>
              <div className="advisor-rm-row"><span>{t('rm.sellRaw')}</span><b>{v.sellRaw.toFixed(2)}</b></div>
              <div className="advisor-rm-row"><span>{t('rm.convert')}</span><b>{v.convert.toFixed(2)}</b></div>
              <div className={`advisor-rm-verdict ${v.convertIsBetter ? 'pos' : 'neg'}`}>
                → {v.convertIsBetter ? t('rm.verdictConvert') : t('rm.verdictSell')} (+{v.delta.toFixed(2)})
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
