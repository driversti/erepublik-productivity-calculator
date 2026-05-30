import { StateProvider } from './state/StateContext';
import { useActiveModule } from './state/hooks';
import { TabBar } from './components/TabBar';
import { IndustryView } from './views/IndustryView/IndustryView';
import { HoldingsView } from './views/HoldingsView/HoldingsView';

function ActiveView() {
  const active = useActiveModule();
  if (active === 'holdings') return <HoldingsView />;
  return <IndustryView industryKey={active} />;
}

export default function App() {
  return (
    <StateProvider>
      <header className="app-header">
        <h1 className="app-title">eRepublik Productivity &amp; Profit Calculator</h1>
      </header>
      <TabBar />
      <ActiveView />
    </StateProvider>
  );
}
