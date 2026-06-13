// Pure HTML renderer for the profit report. Light theme, self-contained (inline
// CSS, no external assets/scripts). Input: ReportModel. Output: HTML string.
// Explanatory prose is in Ukrainian (the reader's language); data labels stay English.
import type {
  ReportModel, IndustryBlock, CompanyBreakdown, RankRow, BreakevenRow, ProduceVsBuyRow, RmVerdictRow, RelocationRow, DamageCostBlock,
} from './types';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cc = (n: number | null): string => (n === null ? '—' : n.toFixed(2));
const pct = (n: number): string => `${n >= 0 ? '+' : ''}${n}%`;
const explain = (text: string): string => `<div class="explain">${text}</div>`;

const STYLE = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; padding: 24px; background: #f7f8fa; color: #1f2430;
  font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 1100px; }
h1 { font-size: 22px; margin: 0 0 4px; }
h2 { font-size: 17px; margin: 28px 0 6px; padding-bottom: 6px; border-bottom: 2px solid #e3e6ec; }
h3 { font-size: 15px; margin: 18px 0 6px; }
.sub { color: #6b7280; font-size: 12px; }
.explain { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 9px 13px; border-radius: 6px;
  margin: 6px 0 14px; color: #334155; font-size: 13px; }
.explain b { color: #1e3a8a; }
.guide { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin: 12px 0 8px; }
.guide ul { margin: 8px 0 0; padding-left: 20px; }
.guide li { margin: 3px 0; }
.card { background: #fff; border: 1px solid #e3e6ec; border-radius: 10px; padding: 16px; margin: 12px 0;
  box-shadow: 0 1px 2px rgba(16,24,40,.04); }
table { border-collapse: collapse; width: 100%; margin: 8px 0; }
th, td { text-align: right; padding: 6px 10px; border-bottom: 1px solid #eef0f4; white-space: nowrap; }
th:first-child, td:first-child { text-align: left; }
th { color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
tr:last-child td { border-bottom: none; }
.pos { color: #15803d; font-weight: 600; }
.neg { color: #b91c1c; font-weight: 600; }
.idle { color: #b45309; background: #fef3c7; padding: 1px 6px; border-radius: 6px; font-size: 12px; }
.tag { color: #6b7280; font-size: 12px; }
.formula { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #374151;
  background: #f3f4f6; padding: 6px 10px; border-radius: 6px; overflow-x: auto; }
.best { background: #ecfdf5; }
.kpi { display: inline-block; margin-right: 28px; }
.kpi .v { font-size: 20px; font-weight: 700; }
.kpi .l { color: #6b7280; font-size: 12px; }
footer { margin-top: 32px; color: #9ca3af; font-size: 12px; }
`;

function netClass(n: number | null): string {
  if (n === null) return '';
  return n >= 0 ? 'pos' : 'neg';
}

function companyRow(c: CompanyBreakdown): string {
  const idle = c.runnable ? '' : ' <span class="idle">idle — потрібен найм</span>';
  const t = c.terms;
  const formula =
    `mult = 1 ${pct(t.countryBonus)} (країна) ${pct(t.regionBonus)} (регіон)` +
    `${t.tycoon ? ` ${pct(t.tycoon)} (Tycoon)` : ''} −${t.pollution}% (забруднення) = ×${c.multiplier.toFixed(4)}`;
  const side = c.produces
    ? `${c.unitsPerSession.toFixed(2)} RM/сесію × ${cc(c.price)} ×(1−${c.vat}% ПДВ) = ${cc(c.netRevenue)} дохід`
    : `${c.unitsPerSession.toFixed(2)} шт/сесію × ${cc(c.price)} ×(1−${c.vat}% ПДВ) = ${cc(c.netRevenue)} ` +
      `− сировина ${cc(c.rmCost)} (${c.rmPerSession.toFixed(2)} од.) − податок ${cc(c.workTax)}${c.salary ? ` − зарплата ${cc(c.salary)}` : ''}`;
  return `<tr>
    <td>${esc(c.name)} ×${c.count}${idle} <span class="tag">${c.basis.toUpperCase()}</span></td>
    <td>×${c.multiplier.toFixed(4)}</td>
    <td class="${netClass(c.netPerSession)}">${cc(c.netPerSession)}</td>
    <td class="${netClass(c.netPerDay)}">${cc(c.netPerDay)}</td>
  </tr>
  <tr><td colspan="4"><div class="formula">${formula}<br>${side}</div></td></tr>`;
}

function industrySection(b: IndustryBlock): string {
  const ownCost = b.ownRmCost === null
    ? 'твоя виробнича собівартість — (не виробляєш цю сировину)'
    : `твоя виробнича собівартість ${b.ownRmCost.toFixed(2)}/од. (довідково — у розрахунках RM береться за ринком)`;
  return `<div class="card">
    <h3>${b.icon} ${esc(b.label)} — ${esc(b.country)} / ${esc(b.region)}</h3>
    <div class="sub">бонус країни ${pct(b.countryBonus)} · бонус регіону ${pct(b.regionBonus)} · ПДВ ${b.vat}% · податок на працю ${b.workTax}% · середня зарплата ${cc(b.avgSalary)}</div>
    <div class="sub">${esc(b.rmName)}: ринок ${cc(b.rmPrice)}/од. · ${ownCost}</div>
    <table>
      <thead><tr><th>Компанія</th><th>Множник</th><th>Чисто / сесію</th><th>Чисто / день</th></tr></thead>
      <tbody>${b.companies.map(companyRow).join('') || '<tr><td colspan="4" class="tag">нема налаштованих компаній</td></tr>'}</tbody>
    </table>
  </div>`;
}

function rankingSection(rows: RankRow[], rmBasis: 'market' | 'own'): string {
  const body = rows
    .map(
      (r, i) => `<tr class="${i === 0 ? 'best' : ''}">
      <td>${esc(r.label)} Q${r.quality} ${r.kind === 'rm' ? '(сировина)' : ''} <span class="tag">${r.basis.toUpperCase()}</span></td>
      <td class="${netClass(r.netNoTycoon)}">${cc(r.netNoTycoon)}</td>
      <td class="${netClass(r.netTycoon)}">${cc(r.netTycoon)}</td>
    </tr>`,
    )
    .join('');
  const basis = rmBasis === 'own'
    ? 'Сировина для заводів оцінена за <b>твоєю собівартістю</b> (вертикальний погляд).'
    : 'Сировина для заводів оцінена за <b>ринковою ціною</b> (маржинальний погляд).';
  return `<h2>🏆 Що найвигідніше виробляти — чисто за сесію</h2>
  ${explain(`Усі пари (індустрія × якість) відсортовані за чистим прибутком на одну робочу сесію. Верхній зелений рядок — найвигідніше. Колонки: без Tycoon і з ним. ${basis}`)}
  <div class="card"><table>
    <thead><tr><th>Варіант</th><th>Без Tycoon</th><th>З Tycoon</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function breakevenSection(rows: BreakevenRow[], salaryBasis: 'country-avg' | 'user'): string {
  if (!rows.length) return '';
  const body = rows
    .map((r) => {
      const selfOk = r.userSalary <= r.selfUseCap;
      const resaleOk = r.userSalary <= r.resaleCap;
      return `<tr>
      <td>${esc(r.label)} Q${r.quality}</td>
      <td>${r.selfUseCap.toFixed(2)}</td>
      <td>${r.resaleCap.toFixed(2)}</td>
      <td>${cc(r.userSalary)}</td>
      <td class="${selfOk ? 'pos' : 'neg'}">${selfOk ? 'виробляти' : 'купувати'}</td>
      <td class="${resaleOk ? 'pos' : 'neg'}">${resaleOk ? 'прибутково' : 'збиток'}</td>
    </tr>`;
    })
    .join('');
  const salaryLabel = salaryBasis === 'user' ? 'твоя зарплата' : 'середня зарплата країни';
  return `<h2>👷 Поріг найму — максимальна зарплата, щоб виробляти вигідніше за купівлю</h2>
  ${explain(`Будинки й авіа-зброю <b>не можна</b> робити самому (WAM) — лише найманцями. «Поріг» — найбільша зарплата за сесію, за якої виробництво ще б'є купівлю. <b>Self-use</b> = робити для себе дешевше, ніж купити готове. <b>Resale</b> = робити на продаж з прибутком. Якщо твоя ставка ≤ порогу → «виробляти», інакше → «купувати». Вердикт рахується проти: <b>${salaryLabel}</b>.`)}
  <div class="card">
    <table>
      <thead><tr><th>Якість</th><th>Поріг self-use</th><th>Поріг resale</th><th>Зарплата (${salaryLabel})</th><th>Для себе</th><th>На продаж</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

function produceVsBuySection(rows: ProduceVsBuyRow[]): string {
  if (!rows.length) return '';
  const body = rows
    .map(
      (r) => `<tr>
      <td>${esc(r.label)} Q${r.quality}</td>
      <td class="${r.produceIsCheaper ? 'pos' : 'neg'}">${r.produceCost.toFixed(2)}</td>
      <td>${r.buyPrice.toFixed(2)}</td>
      <td class="${r.produceIsCheaper ? 'pos' : 'neg'}">${r.produceIsCheaper ? 'виробляти' : 'купувати'}</td>
    </tr>`,
    )
    .join('');
  return `<h2>🏭 Виробляти vs купувати (для себе)</h2>
  ${explain('Якщо товар потрібен <b>тобі самому</b> (напр. зброя на війну), питання не «продати», а «зробити чи купити». «Собівартість» — скільки тобі коштує зробити 1 шт (сировина за ринком + податок на працю). Якщо вона <b>нижча</b> за ринкову ціну купівлі → вигідно виробляти; якщо вища → дешевше купити готове. (Сировину рахуємо за ринком — це і є вартість твого власного каучуку, бо міг би його продати.)')}
  <div class="card"><table>
    <thead><tr><th>Якість</th><th>Твоя собівартість / шт</th><th>Купити на ринку</th><th>Вердикт</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function rmSection(rows: RmVerdictRow[]): string {
  const body = rows
    .filter((r) => r.hasPrice)
    .map(
      (r) => `<tr>
      <td>${esc(r.label)} (краще Q${r.bestQuality})</td>
      <td>${r.sellRaw.toFixed(4)}</td>
      <td>${r.convert.toFixed(4)}</td>
      <td class="${r.convertIsBetter ? 'pos' : 'neg'}">${r.convertIsBetter ? 'ПЕРЕРОБЛЯТИ' : 'ПРОДАВАТИ СИРИМ'}</td>
    </tr>`,
    )
    .join('');
  return `<h2>🔄 Переробляти чи продавати сировину — на 1 одиницю сировини</h2>
  ${explain('Що краще зробити з однією одиницею сировини: продати її сирою на ринку, чи переробити у готовий товар. «Переробляти» — конверсія вигідніша (число — додана вартість на одиницю сировини, вже з урахуванням податку заводу).')}
  <div class="card"><table>
    <thead><tr><th>Індустрія</th><th>Продати сирим</th><th>Переробити (варт./од.)</th><th>Вердикт</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function damageCostSection(d: DamageCostBlock): string {
  const target = Math.round(d.targetDamage / 1_000_000);
  const sorted = [...d.rows].sort((a, b) => a.totalCost - b.totalCost);
  const minHits = Math.min(...d.rows.map((r) => r.hitsPer100M));
  const body = sorted
    .map(
      (r, i) => `<tr class="${i === 0 ? 'best' : ''}">
      <td>Q${r.quality} (вогн. +${r.firepower}%)</td>
      <td>${r.damagePerHit.toFixed(0)}</td>
      <td class="${r.hitsPer100M === minHits ? 'pos' : ''}">${r.hitsPer100M.toFixed(0)}</td>
      <td>${r.weaponCost.toFixed(0)}</td>
      <td>${r.foodCost.toFixed(0)}</td>
      <td class="${i === 0 ? 'pos' : ''}">${r.totalCost.toFixed(0)}</td>
    </tr>`,
    )
    .join('');
  return `<h2>⚔️ Вартість шкоди (на ${target}М)</h2>
  ${explain(`Скільки коштує завдати ${target}М шкоди різними якостями зброї. Шкода/хіт = 10×(1+сила/400)×(1+ранг/5)×(1+вогнева/100), сила <b>${d.strength.toLocaleString('uk')}</b>, ранг <b>${d.rankValue}</b>. Кожен хіт = <b>−${d.energyPerHit} енергії</b>, енергія з їжі по <b>${d.energyCostPerUnit.toFixed(3)} CC/од.</b> «Вартість зброї» + «вартість їжі/енергії» = <b>повна вартість</b>. Зелений рядок — найдешевший сумарно; зелена колонка хітів — найменше натисків (= найменше енергії). Без natural enemy / бустерів (вони множники, рейтинг не міняють).`)}
  <div class="card"><table>
    <thead><tr><th>Якість</th><th>Шкода/хіт</th><th>Хітів</th><th>Зброя (CC)</th><th>Їжа (CC)</th><th>Разом (CC)</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function relocationSection(rows: RelocationRow[]): string {
  const blocks = rows
    .map((r) => {
      const cand = r.best
        .map(
          (c) => `<tr class="${c.isCurrent ? 'best' : ''}"><td>${esc(c.region)} / ${esc(c.country)}${c.isCurrent ? ' <span class="tag">(зараз)</span>' : ''}</td><td>${pct(c.regionBonus)}</td></tr>`,
        )
        .join('');
      const note = r.countryBonusMaxed
        ? 'Бонус країни вже +100% (максимум) — важить лише бонус регіону.'
        : '';
      return `<h3>${esc(r.label)} — зараз ${esc(r.currentRegion)} (бонус регіону ${pct(r.currentBonus)})</h3>
      <div class="sub">${note}</div>
      <table><thead><tr><th>Регіон</th><th>Бонус регіону</th></tr></thead><tbody>${cand}</tbody></table>`;
    })
    .join('');
  return `<h2>🌍 Релокація — регіони з вищою продуктивністю</h2>
  ${explain('Регіони відсортовані за бонусом продуктивності. Коли бонус країни вже максимальний, єдиний важіль продуктивності — бонус регіону. Для повного profit-скану всього всесвіту скористайся вкладкою <b>Optimizer</b> у застосунку (вона враховує і ціни, і податки кожної країни).')}
  <div class="card">${blocks}</div>`;
}

function guide(m: ReportModel): string {
  return `<div class="guide">
    <strong>📖 Як читати цей звіт</strong>
    <ul>
      <li>Усі суми — в <b>CC</b> (ігрова валюта). 🟢 зелене = прибуток, 🔴 червоне = збиток.</li>
      <li><b>«на сесію»</b> = один захід роботи в одну компанію. Для WAM це раз на день на компанію, тож <b>«на день» = на сесію × кількість компаній</b>.</li>
      <li><b>WAM</b> = ти працюєш сам (Work as Manager). <b>HIRED</b> = найманці. Будинки й авіа можна робити <b>лише</b> найманцями.</li>
      <li><b>Tycoon</b> — преміум-бонус +20% до виробництва. Показую числа без нього і з ним.</li>
      <li>Базис цього звіту: сировина заводів — <b>${m.rmBasis === 'own' ? 'твоя собівартість' : 'ринкова ціна'}</b>; найм рахується від <b>${m.salaryBasis === 'user' ? 'твоєї зарплати' : 'середньої по країні'}</b>.</li>
      <li>Порядок секцій: скільки заробляєш зараз → розклад кожної компанії → що найвигідніше робити → чи варто наймати → переробляти чи продавати сировину${m.relocation ? ' → куди переїхати' : ''}.</li>
    </ul>
  </div>`;
}

export function renderReport(m: ReportModel): string {
  const dmg = m.damageCost && m.damageCost.rows.length ? damageCostSection(m.damageCost) : '';
  const reloc = m.relocation && m.relocation.length ? relocationSection(m.relocation) : '';
  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>eRepublik Profit Report — ${esc(m.generatedAt)}</title>
<style>${STYLE}</style>
</head>
<body>
<h1>eRepublik — звіт прибутковості</h1>
<div class="sub">Згенеровано ${esc(m.generatedAt)} · Tycoon ${m.hasTycoon ? 'УВІМК' : 'ВИМК'} · ${m.wamEnabled ? 'WAM увімкнено' : 'без WAM'} · твоя зарплата ${cc(m.offeredSalary)}</div>

${guide(m)}

<h2>💰 Поточний прибуток за день (за поточного налаштування)</h2>
${explain('Скільки чистими приносять усі твої компанії за день <b>зараз</b>. Дві цифри — без бонусу Tycoon і з ним. Будинки/авіа дають 0 при WAM-only, бо власник їх не може працювати — вони простоюють, доки не наймеш робітників.')}
<div class="card">
  <span class="kpi"><span class="v ${netClass(m.dailyTotalNoTycoon)}">${cc(m.dailyTotalNoTycoon)}</span><br><span class="l">CC / день — без Tycoon</span></span>
  <span class="kpi"><span class="v ${netClass(m.dailyTotalTycoon)}">${cc(m.dailyTotalTycoon)}</span><br><span class="l">CC / день — з Tycoon</span></span>
</div>

<h2>🔍 Розклад кожної компанії (перевір будь-яке число руками)</h2>
${explain('Кожен рядок — одна якість заводу/сировини. Сірий рядок під ним — формула: <b>множник продуктивності → одиниць за сесію → × ціна − ПДВ − сировина − податок = чисто/сесію</b>, далі × кількість = за день. «idle» = простоює.')}
${m.industries.map(industrySection).join('')}

${rankingSection(m.ranking, m.rmBasis)}
${produceVsBuySection(m.produceVsBuy)}
${breakevenSection(m.breakeven, m.salaryBasis)}
${rmSection(m.rmVerdicts)}
${dmg}
${reloc}

<footer>Усі суми в CC. Ціни й модифікатори завантажені наживо в момент генерації. Виробнича математика — golden-parity рушій застосунку.</footer>
</body>
</html>`;
}
