import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdvisor, useAdvisorInsights, useHoldingSync, useToggleExcludedQuality } from '../../state/hooks';
import { RecommendationHeadline } from './RecommendationHeadline';
import { InsightsPanel } from './InsightsPanel';
import { ProductionTable } from './ProductionTable';
import { RmStrategyPanel } from './RmStrategyPanel';

export function AdvisorView() {
  const { t } = useTranslation('advisor');
  const report = useAdvisor();
  const insights = useAdvisorInsights();
  const toggleExclude = useToggleExcludedQuality();
  const { syncPrices } = useHoldingSync();
  const [syncing, setSyncing] = useState(false);

  const onSync = async () => {
    setSyncing(true);
    try {
      await syncPrices();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="advisor-view">
      <h2>{t('title')}</h2>
      <p className="advisor-intro">{t('intro')}</p>
      <div className="advisor-toolbar">
        <button type="button" className="btn-sync" onClick={onSync} disabled={syncing} data-testid="advisor-sync">
          {syncing ? t('syncing') : t('syncPrices')}
        </button>
      </div>
      <RecommendationHeadline report={report} />
      <InsightsPanel insights={insights} />
      <ProductionTable rows={report.rows} onToggleExclude={toggleExclude} />
      <RmStrategyPanel verdicts={report.rmVerdicts} />
    </main>
  );
}
