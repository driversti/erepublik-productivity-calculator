import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { AdvisorRow } from '../../calc/advisor';
import type { IndustryKey } from '../../data/types';

type SortKey = 'wam' | 'hire' | 'hireTycoon' | 'roi';

// null (not applicable) always sorts to the bottom regardless of direction.
function valueOf(row: AdvisorRow, key: SortKey): number {
  const v = key === 'wam' ? row.wamNet : key === 'hire' ? row.hireNet : key === 'hireTycoon' ? row.hireNetTycoon : row.roiRm;
  return v ?? -Infinity;
}

function num(v: number | null): string {
  return v === null ? '—' : (v > 0 ? '+' : '') + v.toFixed(2);
}

function cls(v: number | null): string {
  if (v === null) return 'dim';
  return v > 0 ? 'pos' : v < 0 ? 'neg' : 'dim';
}

export function ProductionTable({ rows, onToggleExclude }: { rows: AdvisorRow[]; onToggleExclude?: (industry: IndustryKey, quality: number) => void }) {
  const { t } = useTranslation(['common', 'advisor']);
  const [sortKey, setSortKey] = useState<SortKey>('wam');
  const [desc, setDesc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    const d = valueOf(b, sortKey) - valueOf(a, sortKey);
    return desc ? d : -d;
  });

  const onSort = (key: SortKey) => {
    if (key === sortKey) setDesc((d) => !d);
    else { setSortKey(key); setDesc(true); }
  };

  const header = (key: SortKey, label: string) => (
    <th
      data-testid={`sort-${key}`}
      className={`sortable${sortKey === key ? ' active' : ''}`}
      onClick={() => onSort(key)}
    >
      {label} <span className="ar">{sortKey === key ? (desc ? '▼' : '▲') : ''}</span>
    </th>
  );

  return (
    <section className="advisor-table-panel">
      <h3>{t('advisor:table.title')}</h3>
      <table className="advisor-table">
        <thead>
          <tr>
            <th className="l">{t('advisor:table.rank')}</th>
            <th className="l">{t('advisor:table.product')}</th>
            {header('wam', t('advisor:table.wam'))}
            {header('hire', t('advisor:table.hire'))}
            {header('hireTycoon', t('advisor:table.hireTycoon'))}
            {header('roi', t('advisor:table.roi'))}
            <th className="l">{t('advisor:table.owned')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const cfg = getIndustry(r.industry);
            return (
              <tr
                key={`${r.industry}-${r.kind}-${r.quality}`}
                className={[r.owned ? 'own' : '', r.hasPrice ? '' : 'unpriced', r.kind === 'rm' ? 'rm-row' : '', r.excluded ? 'excluded' : ''].filter(Boolean).join(' ')}
                data-testid="advisor-row"
              >
                <td className="l dim">{i + 1}</td>
                <td className="l" title={r.hasPrice ? undefined : t('advisor:table.noPrice')}>
                  {r.kind === 'rm'
                    ? <>{cfg.icon} {cfg.rmName} Q{r.quality} <span className="rm-badge">{t('advisor:table.rmBadge')}</span></>
                    : <>{cfg.icon} {industryLabel(t, cfg)} Q{r.quality}
                        <button
                          type="button"
                          className="exclude-toggle"
                          data-testid={`exclude-${r.industry}-${r.quality}`}
                          title={t('advisor:table.excludeToggle')}
                          aria-pressed={r.excluded}
                          onClick={() => onToggleExclude?.(r.industry, r.quality)}
                        >🚫</button>
                        {r.excluded && <span className="excluded-badge">{t('advisor:table.excludedBadge')}</span>}
                      </>}
                </td>
                <td className={cls(r.wamNet)}>{num(r.wamNet)}</td>
                <td className={cls(r.hireNet)}>{num(r.hireNet)}</td>
                <td className={cls(r.hireNetTycoon)}>{num(r.hireNetTycoon)}</td>
                <td className={cls(r.roiRm)}>{num(r.roiRm)}</td>
                <td className="l">{r.owned ? `×${r.owned}` : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="advisor-note">{t('advisor:table.noWamNote')}</p>
    </section>
  );
}
