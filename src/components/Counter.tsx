// A single labelled counter row (Companies or Workers), using the legacy
// .house-counter-row / .counter-group / .btn-counter / .counter-input classes.
// Clamps to [0, max] and reports the next value.
import { useTranslation } from 'react-i18next';

interface CounterProps {
  label: string;
  value: number;
  max: number;
  hideLabel?: boolean;
  onChange: (next: number) => void;
}

export function Counter({ label, value, max, hideLabel, onChange }: CounterProps) {
  const { t } = useTranslation();
  const clamp = (v: number) => Math.max(0, Math.min(max, Number.isFinite(v) ? v : 0));
  return (
    <div className="house-counter-row">
      {!hideLabel && <span className="house-counter-label">{label}</span>}
      <div className="counter-group counter-group-sm">
        <button type="button" className="btn-counter" aria-label={t('counter.minusAria', { label })} onClick={() => onChange(clamp(value - 1))}>
          −
        </button>
        <input
          type="number"
          className="counter-input"
          aria-label={label}
          value={value}
          min={0}
          max={max}
          onChange={(e) => onChange(clamp(parseInt(e.target.value || '0', 10)))}
        />
        <button type="button" className="btn-counter" aria-label={t('counter.plusAria', { label })} onClick={() => onChange(clamp(value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}
