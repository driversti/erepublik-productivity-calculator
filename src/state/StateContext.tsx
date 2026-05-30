import { createContext, useContext, useEffect, useReducer, type ReactNode, type Dispatch } from 'react';
import { reducer, type Action } from './reducer';
import { loadState, saveState } from './persistence';
import type { AppState } from './types';

interface Ctx {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StateCtx = createContext<Ctx | null>(null);

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => {
    saveState(state);
  }, [state]);
  return <StateCtx.Provider value={{ state, dispatch }}>{children}</StateCtx.Provider>;
}

// Internal escape hatch — components should prefer the facade hooks in hooks.ts.
export function useAppState(): Ctx {
  const v = useContext(StateCtx);
  if (!v) throw new Error('useAppState must be used within <StateProvider>');
  return v;
}
