// A single labelled counter row (Companies or Workers), reusing the legacy
// .counter-* CSS classes. Clamps to [0, max] and reports the next value.

interface CounterProps {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}

export function Counter({ label, value, max, onChange }: CounterProps) {
  const clamp = (v: number) => Math.max(0, Math.min(max, v));
  return (
    <div className="counter-row">
      <span className="counter-label">{label}</span>
      <div className="counter-controls">
        <button type="button" className="counter-btn btn-minus" aria-label={`${label} minus`} onClick={() => onChange(clamp(value - 1))}>
          −
        </button>
        <span className="counter-value">{value}</span>
        <button type="button" className="counter-btn btn-plus" aria-label={`${label} plus`} onClick={() => onChange(clamp(value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}

interface CounterGroupProps {
  companies: number;
  workers: number;
  maxWorkers: number;
  hideWorkers?: boolean;
  onCompanies: (v: number) => void;
  onWorkers: (v: number) => void;
}

// Companies + (optional) Workers, matching the legacy fwCounterGroupsHtml.
export function CounterGroup({ companies, workers, maxWorkers, hideWorkers, onCompanies, onWorkers }: CounterGroupProps) {
  return (
    <>
      <Counter label="Companies" value={companies} max={9999} onChange={onCompanies} />
      {!hideWorkers && <Counter label="Workers" value={workers} max={maxWorkers} onChange={onWorkers} />}
    </>
  );
}
