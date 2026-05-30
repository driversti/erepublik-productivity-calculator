import type { FactoryDef } from '../data/types';
import type { Cell } from '../calc/types';
import { StarRating } from './StarRating';
import { IconImage } from './IconImage';
import { CounterGroup } from './Counter';

interface FactoryCardProps {
  def: FactoryDef;
  cell: Cell;
  iconUrl: string;
  pollutionRate: number;
  /** primary stat line, e.g. "888.00 items" */
  outputText: string;
  /** optional secondary stat (RM used/produced) */
  rmText?: string;
  /** optional profit line */
  profitText?: string;
  hideWorkers?: boolean;
  borderColor?: string;
  testId?: string;
  onCompanies: (v: number) => void;
  onWorkers: (v: number) => void;
}

export function FactoryCard({
  def, cell, iconUrl, pollutionRate, outputText, rmText, profitText,
  hideWorkers, borderColor, testId, onCompanies, onWorkers,
}: FactoryCardProps) {
  const maxWorkers = (cell.companies || 0) * def.maxEmployees;
  return (
    <div className="factory-row-card" data-testid={testId} style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : undefined}>
      <div className="factory-avatar-area">
        <IconImage src={iconUrl} />
      </div>
      <div className="factory-info-area">
        <div className="factory-title">{def.name}</div>
        <div className="stars-container">
          <StarRating quality={def.quality} />
        </div>
        <div className="factory-pollution" style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)' }}>
          Pollution: {pollutionRate.toFixed(2)}%
        </div>
      </div>
      <div className="factory-stats-area">
        <div className="stat-item">
          <span className="stat-label">Daily Output</span>
          <span className="stat-value" style={{ color: 'var(--erep-blue)' }}>{outputText}</span>
        </div>
        {rmText !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Daily RM</span>
            <span className="stat-value" style={{ color: 'var(--erep-gold)' }}>{rmText}</span>
          </div>
        )}
        {profitText !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Est. Daily Profit</span>
            <span className="stat-value">{profitText}</span>
          </div>
        )}
      </div>
      <div className="factory-action-area">
        <CounterGroup
          companies={cell.companies || 0}
          workers={cell.workers || 0}
          maxWorkers={maxWorkers}
          hideWorkers={hideWorkers}
          onCompanies={onCompanies}
          onWorkers={onWorkers}
        />
      </div>
    </div>
  );
}
