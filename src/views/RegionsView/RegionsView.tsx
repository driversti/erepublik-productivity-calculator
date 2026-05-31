import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { INDUSTRIES } from '../../data/industries';
import type { IndustryKey } from '../../data/types';
import { industryLabel } from '../../i18n/names';
import { rankRegions, allCountries } from '../../regions/ranking';
import {
  fetchRegionData,
  refreshRegionData,
  BUNDLED_DATASET,
  type RegionDataSet,
} from '../../services/regionData';

// eRepublik flag URLs are protocol-relative ("//..."); make them absolute https.
const flagSrc = (url?: string): string | undefined =>
  url ? (url.startsWith('//') ? `https:${url}` : url) : undefined;

type RefreshStatus = { kind: 'idle' | 'loading' | 'ok' | 'error'; message?: string };

export function RegionsView() {
  const { t } = useTranslation();
  const [industry, setIndustry] = useState<IndustryKey>('food');
  const [country, setCountry] = useState<string>('');
  const [dataset, setDataset] = useState<RegionDataSet>(BUNDLED_DATASET);

  const [showRefresh, setShowRefresh] = useState(false);
  const [erpk, setErpk] = useState('');
  const [status, setStatus] = useState<RefreshStatus>({ kind: 'idle' });

  // Load the server-stored dataset on mount; falls back to the bundled seed.
  useEffect(() => {
    let live = true;
    fetchRegionData().then((d) => { if (live) setDataset(d); });
    return () => { live = false; };
  }, []);

  const ranked = rankRegions(dataset.regions, industry, country ? { country } : undefined);
  const countries = allCountries(dataset.regions);

  const submitRefresh = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: 'loading' });
    try {
      const data = await refreshRegionData(erpk);
      setDataset(data);
      setErpk('');
      setStatus({ kind: 'ok', message: t('regions.refreshOk', { count: data.regions.length }) });
    } catch (err) {
      setStatus({ kind: 'error', message: t('regions.refreshError', { message: (err as Error).message }) });
    }
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
              onClick={() => setIndustry(cfg.key)}
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

      <div className="regions-status-bar">
        <p className="regions-snapshot-note">{t('regions.updated', { date: dataset.fetchedAt })}</p>
        <button
          type="button"
          className="regions-refresh-toggle"
          data-testid="regions-refresh-toggle"
          onClick={() => setShowRefresh((s) => !s)}
        >
          {t('regions.updateData')}
        </button>
      </div>

      {showRefresh && (
        <form className="regions-refresh-form" onSubmit={submitRefresh}>
          <label className="regions-erpk-label" htmlFor="regions-erpk-input">
            {t('regions.erpkLabel')}
          </label>
          <input
            id="regions-erpk-input"
            data-testid="regions-erpk"
            type="password"
            autoComplete="off"
            placeholder={t('regions.erpkPlaceholder')}
            value={erpk}
            onChange={(e) => setErpk(e.target.value)}
          />
          <button
            type="submit"
            data-testid="regions-refresh-submit"
            disabled={status.kind === 'loading' || erpk.trim() === ''}
          >
            {status.kind === 'loading' ? t('regions.refreshing') : t('regions.refresh')}
          </button>
          {status.kind === 'ok' && <span className="regions-refresh-ok">{status.message}</span>}
          {status.kind === 'error' && <span className="regions-refresh-error">{status.message}</span>}
        </form>
      )}

      {ranked.length === 0 ? (
        <p className="regions-empty" data-testid="regions-empty">
          {t('regions.empty')}
        </p>
      ) : (
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
              const src = flagSrc(dataset.countryFlags[row.region.currentCountry]);
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
                  <td className="regions-bonus">{t('regions.bonusValue', { value: row.totalBonus })}</td>
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
      )}
    </section>
  );
}
