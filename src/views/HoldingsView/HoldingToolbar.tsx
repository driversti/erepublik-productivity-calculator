import { useTranslation } from 'react-i18next';
import type { HoldingsApi } from '../../state/hooks';
import { tip } from '../../components/tooltip';

interface Props {
  api: HoldingsApi;
}

// Holding picker (dropdown) + New/Rename/Delete/Clear actions, matching the
// legacy .holdings-toolbar / .holdings-picker / .holdings-actions markup.
export function HoldingToolbar({ api }: Props) {
  const { holdings, activeHoldingId, activeHolding } = api;
  const { t } = useTranslation(['holdings', 'tooltips']);

  const onNew = () => {
    const name = window.prompt(t('holdings:toolbar.newPrompt'), t('holdings:toolbar.newDefault', { n: holdings.length + 1 }));
    if (name && name.trim()) api.create(name.trim());
  };
  const onRename = () => {
    if (!activeHolding) return;
    const name = window.prompt(t('holdings:toolbar.renamePrompt'), activeHolding.name);
    if (name && name.trim()) api.rename(activeHolding.id, name.trim());
  };
  const onDelete = () => {
    if (!activeHolding) return;
    if (window.confirm(t('holdings:toolbar.deleteConfirm', { name: activeHolding.name }))) api.remove(activeHolding.id);
  };
  const onClear = () => {
    if (!activeHolding) return;
    if (window.confirm(t('holdings:toolbar.clearConfirm'))) {
      api.clearCompanies(activeHolding.id);
    }
  };

  return (
    <div className="holdings-toolbar">
      <div className="holdings-picker">
        <label className="control-label" htmlFor="hld-select">{t('holdings:toolbar.holding')}</label>
        <select
          id="hld-select"
          className="market-input"
          data-testid="hld-picker"
          value={activeHoldingId}
          disabled={holdings.length === 0}
          onChange={(e) => api.switchTo(e.target.value)}
          {...tip(t('tooltips:hldPicker'))}
        >
          {holdings.length === 0 && <option value="">{t('holdings:toolbar.none')}</option>}
          {holdings.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>
      <div className="holdings-actions">
        <button type="button" className="btn btn-primary" onClick={onNew}>{t('holdings:toolbar.new')}</button>
        <button type="button" className="btn btn-secondary" onClick={onRename} disabled={!activeHolding}>{t('holdings:toolbar.rename')}</button>
        <button type="button" className="btn btn-secondary" onClick={onDelete} disabled={!activeHolding}>{t('holdings:toolbar.delete')}</button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={!activeHolding}>{t('holdings:toolbar.clearCompanies')}</button>
      </div>
    </div>
  );
}
