import type { IndustryConfig } from '../../data/types';
import type { FwModule, HiredModule } from '../../state/types';
import { useSharedFlags } from '../../state/hooks';
import { countries, regions } from '../../data/travel';
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';

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
  const { t } = useTranslation(['common', 'industry', 'tooltips']);
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
        <label className="control-label">{t('industry:modifiers.country')}</label>
        <select className="market-input" style={{ width: '130px' }} value={mod.selectedCountryId} onChange={(e) => onSelectCountry(e.target.value)} {...tip(t('tooltips:country'))}>
          <option value="">{t('industry:modifiers.selectCountry')}</option>
          {countryEntries.map(([id, c]) => (
            <option key={id} value={id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">{t('industry:modifiers.region')}</label>
        <select className="market-input" style={{ width: '130px' }} value={mod.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => onSelectRegion(e.target.value)} {...tip(t('tooltips:region'))}>
          <option value="">{t('industry:modifiers.selectRegion')}</option>
          {regionEntries.map(([id, r]) => (
            <option key={id} value={r.permalink}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Bonuses are derived from the selected country/region and synced — display-only. */}
      <div className="control-group">
        <label className="control-label">{t('industry:modifiers.countryBonus')}</label>
        <input type="number" className="market-input readonly-display" style={{ width: '60px' }} value={mod.countryBonus} readOnly tabIndex={-1} {...tip(t('tooltips:countryBonus'))} />
      </div>

      <div className="control-group">
        <label className="control-label">{t('industry:modifiers.regionBonus')}</label>
        <input type="number" className="market-input readonly-display" style={{ width: '60px' }} value={mod.regionBonus} readOnly tabIndex={-1} {...tip(t('tooltips:regionBonus'))} />
      </div>

      {/* Work Tax, VAT and Avg Salary are derived from the selected country's economy — display-only. */}
      {isFw && (
        <div className="control-group">
          <label className="control-label">{t('industry:modifiers.workTax')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '55px' }} value={mod.workTaxRate} readOnly tabIndex={-1} {...tip(t('tooltips:workTax'))} />
        </div>
      )}

      <div className="control-group">
        <label className="control-label">{t('industry:modifiers.vat')}</label>
        <input type="number" className="market-input readonly-display" style={{ width: '55px' }} value={mod.vat} readOnly tabIndex={-1} {...tip(t('tooltips:vat'))} />
      </div>

      {isFw && (
        <div className="control-group">
          <label className="control-label">{t('industry:modifiers.avgSalary')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '80px' }} value={mod.averageSalary} readOnly tabIndex={-1} {...tip(t('tooltips:avgSalary'))} />
        </div>
      )}

      <div className="control-group">
        <label className="control-label">{t('industry:modifiers.offeredCc')}</label>
        <input type="number" className="market-input" style={{ width: '65px' }} step="1" min="0" value={shared.offeredSalary}
          onChange={(e) => shared.setShared('offeredSalary', parseFloat(e.target.value || '0'))} {...tip(t('tooltips:offeredCc'))} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 5 }}>
        <label className="checkbox-label" aria-label={t('industry:modifiers.tycoonAria')} {...tip(t('tooltips:tycoon'))}>
          <input type="checkbox" checked={shared.hasTycoon} onChange={shared.toggleTycoon} />
          {t('industry:modifiers.tycoon')}
        </label>
        {isFw && (
          <label className="checkbox-label" aria-label={t('industry:modifiers.wamAria')} {...tip(t('tooltips:wam'))}>
            <input type="checkbox" checked={shared.wamEnabled} onChange={shared.toggleWam} />
            {t('industry:modifiers.wam')}
          </label>
        )}
      </div>

      <button type="button" className={`btn btn-primary${syncing ? ' loading' : ''}`} style={{ marginLeft: 'auto', width: 'auto', padding: '6px 12px', height: '30px' }} onClick={onSyncPrices} disabled={syncing} {...tip(t('tooltips:syncPrices'))}>
        {syncing ? t('buttons.syncing') : t('buttons.syncLivePrices')}
      </button>
    </div>
  );
}
