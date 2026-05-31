import type { HoldingsApi } from '../../state/hooks';

interface Props {
  api: HoldingsApi;
}

// Holding picker (dropdown) + New/Rename/Delete/Clear actions, matching the
// legacy .holdings-toolbar / .holdings-picker / .holdings-actions markup.
export function HoldingToolbar({ api }: Props) {
  const { holdings, activeHoldingId, activeHolding } = api;

  const onNew = () => {
    const name = window.prompt('New holding name:', `Holding ${holdings.length + 1}`);
    if (name && name.trim()) api.create(name.trim());
  };
  const onRename = () => {
    if (!activeHolding) return;
    const name = window.prompt('Rename holding:', activeHolding.name);
    if (name && name.trim()) api.rename(activeHolding.id, name.trim());
  };
  const onDelete = () => {
    if (!activeHolding) return;
    if (window.confirm(`Delete holding "${activeHolding.name}"?`)) api.remove(activeHolding.id);
  };
  const onClear = () => {
    if (!activeHolding) return;
    if (window.confirm('Clear all companies in this holding? Location and synced bonuses are kept.')) {
      api.clearCompanies(activeHolding.id);
    }
  };

  return (
    <div className="holdings-toolbar">
      <div className="holdings-picker">
        <label className="control-label" htmlFor="hld-select">Holding</label>
        <select
          id="hld-select"
          className="market-input"
          data-testid="hld-picker"
          value={activeHoldingId}
          disabled={holdings.length === 0}
          onChange={(e) => api.switchTo(e.target.value)}
        >
          {holdings.length === 0 && <option value="">— none —</option>}
          {holdings.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>
      <div className="holdings-actions">
        <button type="button" className="btn btn-primary" onClick={onNew}>+ New</button>
        <button type="button" className="btn btn-secondary" onClick={onRename} disabled={!activeHolding}>Rename</button>
        <button type="button" className="btn btn-secondary" onClick={onDelete} disabled={!activeHolding}>Delete</button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={!activeHolding}>Clear Companies</button>
      </div>
    </div>
  );
}
