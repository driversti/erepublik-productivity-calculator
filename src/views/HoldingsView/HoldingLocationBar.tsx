import { useState } from 'react';
import type { Holding } from '../../state/types';
import { useHoldingSync } from '../../state/hooks';
import { countries, regions } from '../../data/travel';

interface Props {
  holding: Holding;
}

// Location selects + "Sync Live Prices" for the active holding. Selecting a
// region scrapes modifiers into every industry of the holding (legacy
// syncHoldingModifiers); Sync Prices refreshes the shared price state.
export function HoldingLocationBar({ holding }: Props) {
  const sync = useHoldingSync();
  const [syncing, setSyncing] = useState(false);

  const selectedCountry = holding.selectedCountryId ? countries[Number(holding.selectedCountryId)] : undefined;
  const countryEntries = Object.entries(countries).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const regionEntries = selectedCountry
    ? selectedCountry.regions.map((id) => [id, regions[id]] as const).filter(([, r]) => r)
    : [];

  const status = holding.selectedCountryId && holding.selectedRegionPermalink
    ? 'Auto-sync: Synced'
    : holding.selectedCountryId
      ? 'Auto-sync: Region not selected'
      : 'Auto-sync: Not configured';

  const onSyncPrices = () => {
    setSyncing(true);
    sync.syncPrices().catch((e) => console.error('Holding price sync failed:', e)).finally(() => setSyncing(false));
  };

  return (
    <div className="card holdings-location-bar" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', padding: 12 }}>
      <div className="market-input-group">
        <span className="market-label">Holding Country</span>
        <select className="market-input" value={holding.selectedCountryId} onChange={(e) => sync.selectCountry(holding.id, e.target.value)}>
          <option value="">— Select country —</option>
          {countryEntries.map(([id, c]) => (
            <option key={id} value={id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="market-input-group">
        <span className="market-label">Holding Region</span>
        <select className="market-input" value={holding.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => sync.selectRegion(holding.id, e.target.value)}>
          <option value="">— Select region —</option>
          {regionEntries.map(([id, r]) => (
            <option key={id} value={r.permalink}>{r.name}</option>
          ))}
        </select>
      </div>
      <span className="sync-status" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{status}</span>
      <button type="button" className="btn btn-primary" onClick={onSyncPrices} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync Live Prices'}
      </button>
    </div>
  );
}
