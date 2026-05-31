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
// (handled in the reducer via SET_MODULE_FIELD). Uses the legacy card / form-row /
// control-group / toggle-container / switch classes.
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
    <div className="card modifiers-card">
      <div className="card-header">
        <h2><span className="active-module"><span className="module-name">{cfg.icon} {cfg.label} Industry</span></span></h2>
      </div>
      <div className="card-body">
        <div className="form-row">
          <div className="control-group">
            <label className="control-label">Country</label>
            <select className="market-input" value={mod.selectedCountryId} onChange={(e) => onSelectCountry(e.target.value)}>
              <option value="">— Select country —</option>
              {countryEntries.map(([id, c]) => (
                <option key={id} value={id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">Region</label>
            <select className="market-input" value={mod.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => onSelectRegion(e.target.value)}>
              <option value="">— Select region —</option>
              {regionEntries.map(([id, r]) => (
                <option key={id} value={r.permalink}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="sync-status text-muted" style={{ marginBottom: 8 }}>{syncStatus}</div>

        <hr className="section-divider" />

        <div className="form-row">
          <div className="control-group">
            <label className="control-label">Country {cfg.label} Bonus (%)</label>
            <input type="number" className="market-input" min="0" max="100" value={mod.countryBonus}
              onChange={(e) => setField(cfg.key, 'countryBonus', parseFloat(e.target.value || '0'))} />
          </div>
          <div className="control-group">
            <label className="control-label">Region Bonus (%)</label>
            <input type="number" className="market-input" min="0" max="100" value={mod.regionBonus}
              onChange={(e) => setField(cfg.key, 'regionBonus', parseFloat(e.target.value || '0'))} />
          </div>
        </div>

        <div className="toggle-container">
          <span className="control-label">Tycoon Pack (+20%)</span>
          <label className="switch">
            <input type="checkbox" aria-label="Tycoon Pack" checked={shared.hasTycoon} onChange={shared.toggleTycoon} />
            <span className="switch-slider" />
          </label>
        </div>
        {isFw && (
          <div className="toggle-container">
            <span className="control-label">Work as Manager</span>
            <label className="switch">
              <input type="checkbox" aria-label="Work as Manager" checked={shared.wamEnabled} onChange={shared.toggleWam} />
              <span className="switch-slider" />
            </label>
          </div>
        )}

        <div className="form-row">
          {isFw && (
            <div className="control-group">
              <label className="control-label">Work Tax (%)</label>
              <input type="number" className="market-input" step="0.5" min="0" max="25" value={mod.workTaxRate}
                onChange={(e) => setField(cfg.key, 'workTaxRate', parseFloat(e.target.value || '0'))} />
            </div>
          )}
          {isFw && (
            <div className="control-group">
              <label className="control-label">Average Salary (CC)</label>
              <input type="number" className="market-input" step="10" min="0" value={mod.averageSalary}
                onChange={(e) => setField(cfg.key, 'averageSalary', parseFloat(e.target.value || '0'))} />
            </div>
          )}
          <div className="control-group">
            <label className="control-label">Offered Salary (CC)</label>
            <input type="number" className="market-input" step="1" min="0" value={shared.offeredSalary}
              onChange={(e) => shared.setShared('offeredSalary', parseFloat(e.target.value || '0'))} />
          </div>
          <div className="control-group">
            <label className="control-label">VAT (%)</label>
            <input type="number" className="market-input" step="0.5" min="0" max="50" value={mod.vat}
              onChange={(e) => setField(cfg.key, 'vat', parseFloat(e.target.value || '0'))} />
          </div>
        </div>

        <button type="button" className={`btn btn-primary${syncing ? ' loading' : ''}`} onClick={onSyncPrices} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync Live Prices'}
        </button>
      </div>
    </div>
  );
}
