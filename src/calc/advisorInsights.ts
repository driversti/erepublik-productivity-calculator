// Pure, deterministic plain-language insight generator over an AdvisorReport.
// Returns structured Insight objects (no i18n, no DOM); the view renders + formats.
import type { AppState } from '../state/types';
import type { AdvisorReport, AdvisorRow } from './advisor';
import { getIndustry } from '../data/industries';

export type InsightSeverity = 'good' | 'warn' | 'bad' | 'info';
export interface Insight {
  type: string;
  severity: InsightSeverity;
  params: Record<string, string | number>;
}

type Mode = 'wam' | 'hire' | 'idle';

function achievable(row: AdvisorRow, state: AppState): { net: number; mode: Mode } {
  const cfg = getIndustry(row.industry);
  if (cfg.type === 'fw' && state.wamEnabled && row.wamNet !== null) {
    return { net: row.wamNet, mode: 'wam' };
  }
  const hire = state.hasTycoon ? row.hireNetTycoon : row.hireNet;
  if (hire !== null) return { net: hire, mode: 'hire' };
  return { net: 0, mode: 'idle' };
}

const usable = (r: AdvisorRow) => r.hasPrice && !r.excluded;

export function generateInsights(report: AdvisorReport, state: AppState): Insight[] {
  const out: Insight[] = [];
  const rows = report.rows.filter(usable);

  // bestAction: highest positive achievable net across all usable rows.
  let best: { row: AdvisorRow; net: number; mode: Mode } | null = null;
  for (const r of rows) {
    const a = achievable(r, state);
    if (a.net > 0 && (!best || a.net > best.net)) best = { row: r, net: a.net, mode: a.mode };
  }
  if (best) {
    out.push({ type: 'bestAction', severity: 'good', params: {
      industry: best.row.industry, quality: best.row.quality, kind: best.row.kind,
      net: round(best.net), mode: best.mode,
    } });
  }

  // mainEarner: owned usable row with the highest positive total (count × achievable).
  let earner: { row: AdvisorRow; net: number; total: number } | null = null;
  for (const r of rows) {
    if (!r.owned) continue;
    const net = achievable(r, state).net;
    const total = net * r.owned;
    if (total > 0 && (!earner || total > earner.total)) earner = { row: r, net, total };
  }
  if (earner) {
    out.push({ type: 'mainEarner', severity: 'good', params: {
      industry: earner.row.industry, quality: earner.row.quality, kind: earner.row.kind,
      count: earner.row.owned, perDay: round(earner.net), total: round(earner.total),
    } });
  }

  // lossMakers (owned, WAM mode, negative) — worst first, max 3.
  const losers = rows
    .filter((r) => r.owned > 0)
    .map((r) => ({ r, a: achievable(r, state) }))
    .filter((x) => x.a.mode === 'wam' && x.a.net < 0)
    .sort((p, q) => p.a.net * p.r.owned - q.a.net * q.r.owned)
    .slice(0, 3);
  for (const { r, a } of losers) {
    out.push({ type: 'lossMaker', severity: 'bad', params: {
      industry: r.industry, quality: r.quality, count: r.owned,
      perDay: round(a.net), total: round(a.net * r.owned),
    } });
  }

  // deadCapital (owned, hire/idle mode, ≤ 0) — grouped into one insight if any.
  const dead = rows.filter((r) => {
    if (!r.owned) return false;
    const a = achievable(r, state);
    return (a.mode === 'hire' || a.mode === 'idle') && a.net <= 0;
  });
  if (dead.length) {
    const industries = [...new Set(dead.map((r) => r.industry))];
    out.push({ type: 'deadCapital', severity: 'warn', params: {
      industries: industries.join(','), count: dead.reduce((n, r) => n + r.owned, 0),
    } });
  }

  // rmStrategy: one per RM the player owns (an owned rm-kind row exists for that industry).
  const ownsRm = (industry: string) => report.rows.some((r) => r.kind === 'rm' && r.industry === industry && r.owned > 0);
  for (const v of report.rmVerdicts) {
    if (!v.hasPrice || !ownsRm(v.industry)) continue;
    out.push({ type: 'rmStrategy', severity: 'info', params: {
      industry: v.industry, convert: v.convertIsBetter ? 1 : 0,
      quality: v.bestQuality, delta: round(v.delta),
    } });
  }

  // hiring viability across usable rows.
  const anyHireNoTyc = rows.some((r) => (r.hireNet ?? -Infinity) > 0);
  const anyHireTyc = rows.some((r) => (r.hireNetTycoon ?? -Infinity) > 0);
  const hireMode = anyHireNoTyc ? 'some' : anyHireTyc ? 'tycoon' : 'none';
  out.push({ type: 'hiring', severity: 'info', params: { mode: hireMode, salary: round(state.offeredSalary) } });

  // caveat — always last.
  out.push({ type: 'caveat', severity: 'info', params: {} });
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
