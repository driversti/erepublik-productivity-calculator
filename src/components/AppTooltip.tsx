import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { TIP_ID } from './tooltip';

// One global tooltip instance for the whole app. Anchored elements opt in via
// the tip() helper (data-tooltip-id / data-tooltip-content). delayShow gives a
// 1s hover dwell before showing so tooltips don't pop up the instant the cursor
// crosses an element.
export function AppTooltip() {
  return <Tooltip id={TIP_ID} className="app-tooltip" place="top" delayShow={1000} />;
}
