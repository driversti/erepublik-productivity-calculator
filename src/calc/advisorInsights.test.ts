import { describe, it, expect } from 'vitest';
import { generateInsights } from './advisorInsights';
import { initialState } from '../state/blank';
import type { AdvisorReport, AdvisorRow } from './advisor';

const row = (o: Partial<AdvisorRow> & Pick<AdvisorRow,'industry'|'quality'|'kind'>): AdvisorRow => ({
  wamNet: null, hireNet: null, hireNetTycoon: null, roiRm: null, owned: 0, hasPrice: true, excluded: false, ...o,
});
function report(rows: AdvisorRow[], rmVerdicts: AdvisorReport['rmVerdicts'] = []): AdvisorReport {
  const topWam = rows.filter(r => r.hasPrice && !r.excluded && r.wamNet !== null)
    .sort((a,b)=>(b.wamNet as number)-(a.wamNet as number))[0] ?? null;
  return { rows, rmVerdicts, topWam };
}

describe('generateInsights — WAM-only player', () => {
  const s = initialState(); s.wamEnabled = true; s.hasTycoon = false; s.offeredSalary = 7800;
  const rows = [
    row({ industry:'weapons', quality:5, kind:'rm', wamNet:139.78, hireNet:-7573, hireNetTycoon:-7550, owned:200 }),
    row({ industry:'weapons', quality:7, kind:'factory', wamNet:-413.61, hireNet:-8126, hireNetTycoon:-8162, roiRm:-0.24, owned:24 }),
    row({ industry:'weapons', quality:6, kind:'factory', wamNet:681.06, hireNet:-7031, hireNetTycoon:-6958, roiRm:1.18, owned:0 }),
    row({ industry:'houses', quality:5, kind:'factory', wamNet:null, hireNet:-3553, hireNetTycoon:-3119, roiRm:-0.6, owned:1 }),
  ];
  const r = report(rows, [{ industry:'weapons', bestQuality:6, sellRaw:45.5, convert:100.3, convertIsBetter:true, delta:54.8, hasPrice:true }]);
  const ins = generateInsights(r, s);
  const types = ins.map(i => i.type);

  it('flags the owned WAM loss-maker', () => {
    const lm = ins.find(i => i.type === 'lossMaker');
    expect(lm).toBeTruthy();
    expect(lm!.params.industry).toBe('weapons');
    expect(lm!.params.quality).toBe(7);
    expect(Number(lm!.params.total)).toBeLessThan(0);
  });
  it('flags owned hired companies as dead capital', () => {
    expect(types).toContain('deadCapital');
  });
  it('reports hiring unprofitable everywhere', () => {
    const h = ins.find(i => i.type === 'hiring')!;
    expect(h.params.mode).toBe('none');
  });
  it('names the main earner (owned, highest total)', () => {
    const me = ins.find(i => i.type === 'mainEarner')!;
    expect(me.params.industry).toBe('weapons');
    expect(me.params.quality).toBe(5);
  });
  it('suggests a positive best action and always ends with a caveat', () => {
    expect(types).toContain('bestAction');
    expect(types[types.length - 1]).toBe('caveat');
  });
});

describe('generateInsights — magnate (hires + Tycoon)', () => {
  const s = initialState(); s.wamEnabled = false; s.hasTycoon = true; s.offeredSalary = 50;
  const rows = [
    row({ industry:'houses', quality:5, kind:'factory', wamNet:null, hireNet:120, hireNetTycoon:160, roiRm:0.5, owned:3 }),
  ];
  it('reports hiring is viable (with Tycoon) and picks a hire best action', () => {
    const ins = generateInsights(report(rows), s);
    const h = ins.find(i => i.type === 'hiring')!;
    expect(['some','tycoon']).toContain(h.params.mode);
    const ba = ins.find(i => i.type === 'bestAction')!;
    expect(ba.params.mode).toBe('hire');
  });
});

describe('generateInsights — hiring pays only with Tycoon', () => {
  it("reports hiring mode 'tycoon' when only the Tycoon hire net is positive", () => {
    const s = initialState(); s.wamEnabled = false; s.hasTycoon = true; s.offeredSalary = 100;
    const rows = [
      row({ industry:'houses', quality:5, kind:'factory', wamNet:null, hireNet:-5, hireNetTycoon:40, roiRm:0.3, owned:0 }),
    ];
    const ins = generateInsights(report(rows), s);
    const h = ins.find(i => i.type === 'hiring')!;
    expect(h.params.mode).toBe('tycoon');
  });
});
