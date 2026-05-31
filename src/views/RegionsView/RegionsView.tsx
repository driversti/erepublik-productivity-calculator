import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INDUSTRIES } from '../../data/industries';
import type { IndustryKey } from '../../data/types';
import { industryLabel } from '../../i18n/names';
import { SNAPSHOT_DATE, COUNTRY_FLAGS } from '../../data/regionResources';
import { rankRegions, countriesForIndustry } from '../../regions/ranking';

// eRepublik flag URLs are protocol-relative ("//..."); make them absolute https.
const flagSrc = (url?: string): string | undefined =>
  url ? (url.startsWith('//') ? `https:${url}` : url) : undefined;

export function RegionsView() {
  const { t } = useTranslation();
  const [industry, setIndustry] = useState<IndustryKey>('food');
  const [country, setCountry] = useState<string>('');

  const ranked = rankRegions(industry, country ? { country } : undefined);
  const countries = countriesForIndustry(industry);

  // Available countries differ per industry, so reset the filter on switch.
  const changeIndustry = (key: IndustryKey) => {
    setIndustry(key);
    setCountry('');
  };

  return (
    <section className="regions-view" data-testid="regions-view">
      <div className="regions-toolbar">
        <div className="regions-industry-switch">
          {INDUSTRIES.map((cfg) => (
            <button
              key={cfg.key}
              type="button"
              className={`regions-ind-btn${industry === cfg.key ? ' active' : ''}`}
              data-testid={`regions-ind-${cfg.key}`}
              onClick={() => changeIndustry(cfg.key)}
            >
              {cfg.icon} {industryLabel(t, cfg)}
            </button>
          ))}
        </div>
        <label className="regions-country-filter">
          {t('regions.country')}
          <select
            data-testid="regions-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">{t('regions.allCountries')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="regions-snapshot-note">
        {t('regions.snapshotNote', { date: SNAPSHOT_DATE })}
      </p>

      <table className="regions-table">
        <thead>
          <tr>
            <th scope="col">{t('regions.columns.rank')}</th>
            <th scope="col">{t('regions.columns.region')}</th>
            <th scope="col">{t('regions.columns.country')}</th>
            <th scope="col">{t('regions.columns.bonus')}</th>
            <th scope="col">{t('regions.columns.resources')}</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, i) => {
            const src = flagSrc(COUNTRY_FLAGS[row.region.currentCountry]);
            return (
              <tr key={row.region.id} data-testid="regions-row">
                <td className="regions-rank">{i + 1}</td>
                <td>{row.region.name}</td>
                <td data-testid="regions-country-cell">
                  <span className="regions-country-cell">
                    {src && <img className="regions-flag" src={src} alt="" aria-hidden="true" />}
                    {row.region.currentCountry}
                  </span>
                </td>
                <td className="regions-bonus">
                  {t('regions.bonusValue', { value: row.totalBonus })}
                </td>
                <td>
                  <span className="regions-chips">
                    {row.matched.map((res) => (
                      <span key={res.name} className="regions-chip">
                        {res.name} +{res.bonus}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
