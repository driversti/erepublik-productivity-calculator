import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { TIP_ID } from './tooltip';

// One global tooltip instance for the whole app. Anchored elements opt in via
// the tip() helper (data-tooltip-id / data-tooltip-content).
export function AppTooltip() {
  return <Tooltip id={TIP_ID} className="app-tooltip" place="top" />;
}
