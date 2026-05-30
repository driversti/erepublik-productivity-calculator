import type { IndustryConfig } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import { useSetModuleField, useSharedFlags } from '../../state/hooks';
import { countries, regions } from '../../data/travel';

interface Props {
  cfg: IndustryConfig;
  mod: FwModule | HiredModule;
  onSelectCountry: (countryId: string) => void;
  onSelectRegion: (permalink: string) => void;
  onSyncPrices: () => void;
  syncing?: boolean;
}

// Location dropdowns + modifier inputs. Manual number edits de-sync the location
// (handled in the reducer via SET_MODULE_FIELD).
export function ModifiersPanel({ cfg, mod, onSelectCountry, onSelectRegion, onSyncPrices, syncing }: Props) {
  const setField = useSetModuleField();
  const shared = useSharedFlags();
  const isFw = cfg.type === 'fw';

  const countryEntries = Object.entries(countries).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const selectedCountry = mod.selectedCountryId ? countries[Number(mod.selectedCountryId)] : undefined;
  const regionEntries = selectedCountry
    ? selectedCountry.regions.map((id) => [id, regions[id]] as const).filter(([, r]) => r)
    : [];

  const syncStatus = mod.selectedCountryId && mod.selectedRegionPermalink
    ? `Auto-sync: Synced (Country +${mod.countryBonus}%, Region +${mod.regionBonus}%)`
    : mod.selectedCountryId
      ? 'Auto-sync: Region not selected'
      : 'Auto-sync: Not configured';

  return (
    <div className="config-card">
      <div className="config-header">
        <span className="active-module"><span className="module-icon">{cfg.icon}</span><span className="module-name">{cfg.label} Industry</span></span>
      </div>

      <div className="modifier-grid">
        <div className="market-input-group">
          <span className="market-label">Country</span>
          <select className="market-input" value={mod.selectedCountryId} onChange={(e) => onSelectCountry(e.target.value)}>
            <option value="">— Select country —</option>
            {countryEntries.map(([id, c]) => (
              <option key={id} value={id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="market-input-group">
          <span className="market-label">Region</span>
          <select className="market-input" value={mod.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => onSelectRegion(e.target.value)}>
            <option value="">— Select region —</option>
            {regionEntries.map(([id, r]) => (
              <option key={id} value={r.permalink}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="sync-status" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', margin: '6px 0' }}>{syncStatus}</div>

      <div className="modifier-grid">
        <div className="market-input-group">
          <span className="market-label">Country {cfg.label} Bonus (%)</span>
          <input type="number" className="market-input" min="0" max="100" value={mod.countryBonus}
            onChange={(e) => setField(cfg.key, 'countryBonus', parseFloat(e.target.value || '0'))} />
        </div>
        <div className="market-input-group">
          <span className="market-label">Region Bonus (%)</span>
          <input type="number" className="market-input" min="0" max="100" value={mod.regionBonus}
            onChange={(e) => setField(cfg.key, 'regionBonus', parseFloat(e.target.value || '0'))} />
        </div>
        <label className="toggle-row market-input-group">
          <input type="checkbox" checked={shared.hasTycoon} onChange={shared.toggleTycoon} /> Tycoon Pack (+20%)
        </label>
        {isFw && (
          <label className="toggle-row market-input-group">
            <input type="checkbox" checked={shared.wamEnabled} onChange={shared.toggleWam} /> Work as Manager
          </label>
        )}
        {isFw && (
          <div className="market-input-group">
            <span className="market-label">Work Tax (%)</span>
            <input type="number" className="market-input" step="0.5" min="0" max="25" value={mod.workTaxRate}
              onChange={(e) => setField(cfg.key, 'workTaxRate', parseFloat(e.target.value || '0'))} />
          </div>
        )}
        {isFw && (
          <div className="market-input-group">
            <span className="market-label">Average Salary (CC)</span>
            <input type="number" className="market-input" step="10" min="0" value={mod.averageSalary}
              onChange={(e) => setField(cfg.key, 'averageSalary', parseFloat(e.target.value || '0'))} />
          </div>
        )}
        <div className="market-input-group">
          <span className="market-label">Offered Salary (CC)</span>
          <input type="number" className="market-input" step="1" min="0" value={shared.offeredSalary}
            onChange={(e) => shared.setShared('offeredSalary', parseFloat(e.target.value || '0'))} />
        </div>
        <div className="market-input-group">
          <span className="market-label">VAT (%)</span>
          <input type="number" className="market-input" step="0.5" min="0" max="50" value={mod.vat}
            onChange={(e) => setField(cfg.key, 'vat', parseFloat(e.target.value || '0'))} />
        </div>
      </div>

      <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={onSyncPrices} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync Live Prices'}
      </button>
    </div>
  );
}
