import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { INDUSTRIES, getIndustry } from '../../data/industries';
import type { IndustryKey } from '../../data/types';
import { industryLabel } from '../../i18n/names';
import {
  useOptimizer,
  useModule,
  useSharedFlags,
  useIndustryView,
  useHiredView,
  fwFactoryCells,
} from '../../state/hooks';
import type { FwModule, HiredModule } from '../../state/types';
import type { OptimizerConfig } from '../../calc/optimizer';
import type { CountryEconomySource } from '../../services/economySource';
import { LiveEconomySource } from '../../services/liveEconomy';
import { fetchRegionData, BUNDLED_DATASET } from '../../services/regionData';
import { runScan, type ScanProgress } from './runScan';
import { ResultsTable } from './ResultsTable';

// Single shared live source; the test injects a stub via the `source` prop.
const DEFAULT_SOURCE: CountryEconomySource = new LiveEconomySource();

interface Props {
  source?: CountryEconomySource;
}

export function OptimizerView({ source = DEFAULT_SOURCE }: Props) {
  const { t } = useTranslation();
  const { optimizer, setParams, setResults } = useOptimizer();
  const { industry, threshold, maxCandidates, topN, results, baselineNet, skippedCount, fetchedAt, noBonusCount } = optimizer;

  const cfg = getIndustry(industry);
  const mod = useModule(industry);
  const shared = useSharedFlags();
  // Both views are called unconditionally (Rules of Hooks); pick by industry type.
  const fwView = useIndustryView(industry);
  const hiredView = useHiredView(industry);
  const liveBaseline = cfg.type === 'fw' ? fwView.displayNet : hiredView.displayNet;

  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [countryFlags, setCountryFlags] = useState<Record<string, string>>(BUNDLED_DATASET.countryFlags);

  // Load flags from the live dataset (falls back to the bundled seed).
  useEffect(() => {
    let live = true;
    fetchRegionData().then((d) => { if (live) setCountryFlags(d.countryFlags); });
    return () => { live = false; };
  }, []);

  const rmCells = cfg.type === 'fw'
    ? (mod as FwModule).plantations ?? {}
    : (mod as HiredModule).rm ?? {};
  const factoryCells = cfg.type === 'fw'
    ? fwFactoryCells(mod as FwModule, cfg.maxFactoryQuality)
    : (mod as HiredModule).factories ?? {};

  const onScan = async () => {
    if (scanning) return;
    setScanning(true);
    setError(false);
    setEmpty(false);
    setProgress(null);
    try {
      const config: OptimizerConfig = {
        industry: cfg,
        factoryCells,
        rmCells,
        prices: mod.prices,
        rmPrice: shared[cfg.rmPriceKey],
        hasTycoon: shared.hasTycoon,
        wamEnabled: shared.wamEnabled,
        offeredSalary: shared.offeredSalary,
      };
      const outcome = await runScan(
        source,
        { industry, config, baselineNet: liveBaseline, threshold, maxCandidates, topN },
        setProgress,
      );
      if (!outcome) {
        setEmpty(true);
        return;
      }
      setResults(outcome);
    } catch {
      setError(true);
    } finally {
      setScanning(false);
      setProgress(null);
    }
  };

  const progressLine = progress
    ? progress.phase === 'economics'
      ? t('optimizer.phaseEconomics', { done: progress.done, total: progress.total })
      : t('optimizer.phasePollution', { done: progress.done, total: progress.total })
    : null;

  return (
    <section className="optimizer-view" data-testid="optimizer-view">
      <div className="optimizer-intro">
        <h2>{t('optimizer.title')}</h2>
        <p>{t('optimizer.intro')}</p>
      </div>

      <div className="optimizer-controls">
        <div className="optimizer-industry-switch">
          {INDUSTRIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`regions-ind-btn${industry === c.key ? ' active' : ''}`}
              data-testid={`optimizer-ind-${c.key}`}
              onClick={() => setParams({ industry: c.key as IndustryKey })}
            >
              {c.icon} {industryLabel(t, c)}
            </button>
          ))}
        </div>

        <label className="optimizer-field">
          {t('optimizer.threshold')}
          <input
            type="number"
            data-testid="optimizer-threshold"
            value={threshold}
            min={0}
            onChange={(e) => setParams({ threshold: Number(e.target.value) })}
          />
        </label>
        <label className="optimizer-field">
          {t('optimizer.maxCandidates')}
          <input
            type="number"
            data-testid="optimizer-max-candidates"
            value={maxCandidates}
            min={1}
            onChange={(e) => setParams({ maxCandidates: Number(e.target.value) })}
          />
        </label>
        <label className="optimizer-field">
          {t('optimizer.topN')}
          <input
            type="number"
            data-testid="optimizer-top-n"
            value={topN}
            min={1}
            onChange={(e) => setParams({ topN: Number(e.target.value) })}
          />
        </label>

        <button
          type="button"
          className="optimizer-scan-btn"
          data-testid="optimizer-scan"
          onClick={onScan}
          disabled={scanning}
        >
          {scanning ? t('optimizer.scanning') : t('optimizer.scan')}
        </button>
      </div>

      {progressLine && (
        <p className="optimizer-progress" data-testid="optimizer-progress">{progressLine}</p>
      )}
      {error && (
        <p className="optimizer-error" data-testid="optimizer-error">{t('optimizer.error')}</p>
      )}
      {empty && (
        <p className="optimizer-empty" data-testid="optimizer-empty">{t('optimizer.noCandidates')}</p>
      )}

      {results.length > 0 && (
        <>
          <div className="optimizer-summary">
            <p className="optimizer-baseline" data-testid="optimizer-baseline">
              {baselineNet != null
                ? t('optimizer.baseline', { net: baselineNet.toFixed(2) })
                : t('optimizer.baselineNone')}
            </p>
            {skippedCount > 0 && (
              <p className="optimizer-skipped" data-testid="optimizer-skipped">
                {t('optimizer.skipped', { count: skippedCount })}
              </p>
            )}
            {fetchedAt && (
              <p className="optimizer-fetched-at">{t('optimizer.fetchedAt', { date: new Date(fetchedAt).toLocaleString() })}</p>
            )}
            {noBonusCount > 0 && (
              <p className="optimizer-skipped" data-testid="optimizer-no-bonus">
                {t('optimizer.noBonusRegions', { count: noBonusCount })}
              </p>
            )}
          </div>
          <ResultsTable results={results} baselineNet={baselineNet} countryFlags={countryFlags} />
        </>
      )}
    </section>
  );
}
