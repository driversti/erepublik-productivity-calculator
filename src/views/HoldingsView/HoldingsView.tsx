import { useAppState } from '../../state/StateContext';
import { useHoldings, computeHoldingIndustry } from '../../state/hooks';
import { INDUSTRIES } from '../../data/industries';
import { HoldingToolbar } from './HoldingToolbar';
import { HoldingSection } from './HoldingSection';
import { HoldingSummary } from './HoldingSummary';

export function HoldingsView() {
  const api = useHoldings();
  const { state } = useAppState();
  const holding = api.activeHolding;

  return (
    <main className="app-container" data-testid="holdings-view" style={{ display: 'block' }}>
      <HoldingToolbar api={api} />

      {!holding ? (
        <div className="holdings-empty" data-testid="hld-empty">
          No holdings yet. Click <strong>+ New</strong> to create one.
        </div>
      ) : (
        <div className="holdings-content" data-testid="hld-content" style={{ display: 'flex' }}>
          <HoldingSummary holding={holding} />
          <section className="holdings-main">
            {INDUSTRIES.map((cfg) => {
              const result = computeHoldingIndustry(state, holding, cfg.key);
              return (
                <HoldingSection
                  key={cfg.key}
                  holding={holding}
                  cfg={cfg}
                  result={result}
                  hasTycoon={state.hasTycoon}
                  api={api}
                  defaultCollapsed={result.companies === 0}
                />
              );
            })}
          </section>
        </div>
      )}
    </main>
  );
}
