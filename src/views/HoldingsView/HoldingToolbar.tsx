import type { HoldingsApi } from '../../state/hooks';

interface Props {
  api: HoldingsApi;
}

// Holding tabs + New/Rename/Delete/Clear actions. Ported from the legacy
// holdings-bar; rename/new use window.prompt like the original.
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
    <div className="holdings-bar">
      <div className="holdings-tabs" data-testid="hld-tabs">
        {holdings.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`nav-tab${h.id === activeHoldingId ? ' active' : ''}`}
            data-testid={`hld-tab-${h.id}`}
            onClick={() => api.switchTo(h.id)}
          >
            {h.name}
          </button>
        ))}
      </div>
      <div className="holdings-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onNew}>+ New</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRename} disabled={!activeHolding}>Rename</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onDelete} disabled={!activeHolding}>Delete</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClear} disabled={!activeHolding}>Clear Companies</button>
      </div>
    </div>
  );
}
