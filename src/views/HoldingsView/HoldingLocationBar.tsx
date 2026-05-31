import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Holding } from '../../state/types';
import { useHoldingSync } from '../../state/hooks';
import { useRegionList } from '../../state/useRegionList';
import { countries } from '../../data/travel';
import { tip } from '../../components/tooltip';

interface Props {
  holding: Holding;
}

// Location selects + "Sync Live Prices" for the active holding. Selecting a
// region scrapes modifiers into every industry of the holding (legacy
// syncHoldingModifiers). Uses the legacy card / holdings-location-bar /
// control-group / holdings-sync-col classes.
export function HoldingLocationBar({ holding }: Props) {
  const sync = useHoldingSync();
  const [syncing, setSyncing] = useState(false);
  const { t } = useTranslation(['common', 'holdings', 'tooltips']);

  const selectedCountry = holding.selectedCountryId ? countries[Number(holding.selectedCountryId)] : undefined;
  const countryEntries = Object.entries(countries).sort((a, b) => a[1].name.localeCompare(b[1].name));
  // Regions a country currently controls are fetched live from the Society page.
  const { regions: regionEntries, loading: regionsLoading } = useRegionList(holding.selectedCountryId);

  const status = holding.selectedCountryId && holding.selectedRegionPermalink
    ? t('holdings:location.statusSynced')
    : holding.selectedCountryId
      ? t('holdings:location.statusNoRegion')
      : t('holdings:location.statusNotConfigured');

  const onSyncPrices = () => {
    setSyncing(true);
    sync.syncPrices().catch((e) => console.error('Holding price sync failed:', e)).finally(() => setSyncing(false));
  };

  return (
    <div className="card">
      <div className="card-body holdings-location-bar">
        <div className="control-group">
          <label className="control-label">{t('holdings:location.country')}</label>
          <select className="market-input" value={holding.selectedCountryId} onChange={(e) => sync.selectCountry(holding.id, e.target.value)} {...tip(t('tooltips:hldCountry'))}>
            <option value="">{t('holdings:location.selectCountry')}</option>
            {countryEntries.map(([id, c]) => (<option key={id} value={id}>{c.name}</option>))}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">{t('holdings:location.region')}</label>
          <select className="market-input" value={holding.selectedRegionPermalink} disabled={!selectedCountry || regionsLoading} onChange={(e) => sync.selectRegion(holding.id, e.target.value)} {...tip(t('tooltips:hldRegion'))}>
            <option value="">{t('holdings:location.selectRegion')}</option>
            {regionEntries.map((r) => (<option key={r.permalink} value={r.permalink}>{r.name}</option>))}
          </select>
        </div>
        <div className="holdings-sync-col">
          <span className="sync-status text-muted" {...tip(t('tooltips:hldStatus'))}>{status}</span>
          <button type="button" className={`btn btn-primary${syncing ? ' loading' : ''}`} onClick={onSyncPrices} disabled={syncing} {...tip(t('tooltips:syncPrices'))}>
            {syncing ? t('buttons.syncing') : t('buttons.syncLivePrices')}
          </button>
        </div>
      </div>
    </div>
  );
}
