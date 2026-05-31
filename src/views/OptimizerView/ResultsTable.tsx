import { useTranslation } from 'react-i18next';
import type { RankedRegion } from '../../calc/optimizer';

// eRepublik flag URLs are protocol-relative ("//..."); make them absolute https.
const flagSrc = (url?: string): string | undefined =>
  url ? (url.startsWith('//') ? `https:${url}` : url) : undefined;

interface Props {
  results: RankedRegion[];
  baselineNet: number | null;
  countryFlags: Record<string, string>;
}

export function ResultsTable({ results, baselineNet, countryFlags }: Props) {
  const { t } = useTranslation();
  return (
    <table className="regions-table optimizer-table" data-testid="optimizer-table">
      <thead>
        <tr>
          <th scope="col">{t('optimizer.columns.rank')}</th>
          <th scope="col">{t('optimizer.columns.region')}</th>
          <th scope="col">{t('optimizer.columns.country')}</th>
          <th scope="col">{t('optimizer.columns.regionBonus')}</th>
          <th scope="col">{t('optimizer.columns.countryBonus')}</th>
          <th scope="col">{t('optimizer.columns.salary')}</th>
          <th scope="col">{t('optimizer.columns.workTax')}</th>
          <th scope="col">{t('optimizer.columns.vat')}</th>
          <th scope="col">{t('optimizer.columns.net')}</th>
          {baselineNet != null && <th scope="col">{t('optimizer.columns.delta')}</th>}
        </tr>
      </thead>
      <tbody>
        {results.map((row, i) => {
          const src = flagSrc(countryFlags[row.region.currentCountry]);
          const delta = baselineNet != null ? row.net - baselineNet : null;
          return (
            <tr key={row.region.id} data-testid="optimizer-row">
              <td className="regions-rank">{i + 1}</td>
              <td>{row.region.name}</td>
              <td>
                <span className="regions-country-cell">
                  {src && <img className="regions-flag" src={src} alt="" aria-hidden="true" />}
                  {row.region.currentCountry}
                </span>
              </td>
              <td className="regions-bonus">+{row.regionBonus}%</td>
              <td>+{row.economics.countryBonus}%</td>
              <td>{row.economics.averageSalary.toFixed(2)}</td>
              <td>{row.economics.workTaxRate}%</td>
              <td>{row.economics.vat}%</td>
              <td className="optimizer-net" data-testid="optimizer-net">
                {row.net.toFixed(2)}
                {row.pollution == null && (
                  <span className="optimizer-estimate-badge" data-testid="optimizer-estimate">
                    {t('optimizer.pollutionEstimate')}
                  </span>
                )}
              </td>
              {delta != null && (
                <td className="optimizer-delta">
                  {delta >= 0 ? '+' : ''}
                  {delta.toFixed(2)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
