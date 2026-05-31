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

  return (
    <div className="modifiers-toolbar">
      <div className="control-group">
        <label className="control-label">Country</label>
        <select className="market-input" style={{ width: '130px' }} value={mod.selectedCountryId} onChange={(e) => onSelectCountry(e.target.value)}>
          <option value="">— Select country —</option>
          {countryEntries.map(([id, c]) => (
            <option key={id} value={id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">Region</label>
        <select className="market-input" style={{ width: '130px' }} value={mod.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => onSelectRegion(e.target.value)}>
          <option value="">— Select region —</option>
          {regionEntries.map(([id, r]) => (
            <option key={id} value={r.permalink}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Bonuses are derived from the selected country/region and synced — display-only. */}
      <div className="control-group">
        <label className="control-label">Country Bonus (%)</label>
        <input type="number" className="market-input readonly-display" style={{ width: '60px' }} value={mod.countryBonus} readOnly tabIndex={-1} title="Country production bonus — set by country selection" />
      </div>

      <div className="control-group">
        <label className="control-label">Region Bonus (%)</label>
        <input type="number" className="market-input readonly-display" style={{ width: '60px' }} value={mod.regionBonus} readOnly tabIndex={-1} title="Region production bonus — set by region selection" />
      </div>

      {isFw && (
        <div className="control-group">
          <label className="control-label">Work Tax (%)</label>
          <input type="number" className="market-input" style={{ width: '55px' }} step="0.5" min="0" max="25" value={mod.workTaxRate}
            onChange={(e) => setField(cfg.key, 'workTaxRate', parseFloat(e.target.value || '0'))} />
        </div>
      )}

      {isFw && (
        <div className="control-group">
          <label className="control-label">Avg Salary</label>
          <input type="number" className="market-input" style={{ width: '65px' }} step="10" min="0" value={mod.averageSalary}
            onChange={(e) => setField(cfg.key, 'averageSalary', parseFloat(e.target.value || '0'))} />
        </div>
      )}

      <div className="control-group">
        <label className="control-label">Offered CC</label>
        <input type="number" className="market-input" style={{ width: '65px' }} step="1" min="0" value={shared.offeredSalary}
          onChange={(e) => shared.setShared('offeredSalary', parseFloat(e.target.value || '0'))} />
      </div>

      <div className="control-group">
        <label className="control-label">VAT (%)</label>
        <input type="number" className="market-input" style={{ width: '55px' }} step="0.5" min="0" max="50" value={mod.vat}
          onChange={(e) => setField(cfg.key, 'vat', parseFloat(e.target.value || '0'))} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 5 }}>
        <label className="checkbox-label" aria-label="Tycoon Pack">
          <input type="checkbox" checked={shared.hasTycoon} onChange={shared.toggleTycoon} />
          Tycoon (+20%)
        </label>
        {isFw && (
          <label className="checkbox-label" aria-label="Work as Manager">
            <input type="checkbox" checked={shared.wamEnabled} onChange={shared.toggleWam} />
            WAM
          </label>
        )}
      </div>

      <button type="button" className={`btn btn-primary${syncing ? ' loading' : ''}`} style={{ marginLeft: 'auto', width: 'auto', padding: '6px 12px', height: '30px' }} onClick={onSyncPrices} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync Live Prices'}
      </button>
    </div>
  );
}
