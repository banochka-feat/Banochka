'use strict';

const STORE_KEY = 'banochka-v1';
const $ = (id) => document.getElementById(id);

// ---------- State ----------
let state = load();
let editingId = null;
let range = 'all';

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.deposits)) return { goal: s.goal || null, deposits: s.deposits };
    }
  } catch (e) { /* ignore */ }
  return { goal: null, deposits: [] };
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Не удалось сохранить'); }
}

// ---------- Formatting ----------
const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const fmt = (n) => money.format(Math.round(n * 100) / 100) + ' ₽';
const fmtShort = (n) => {
  if (Math.abs(n) >= 1e6) return money.format(Math.round(n / 1e5) / 10) + ' млн ₽';
  if (Math.abs(n) >= 1e4) return money.format(Math.round(n / 100) / 10) + ' тыс ₽';
  return fmt(n);
};
const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const monthFmt = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

function parseAmount(str) {
  const n = parseFloat(String(str).replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : NaN;
}
function toLocalInput(ts) {
  const d = new Date(ts);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function relDay(ts) {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 864e5);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  return dateFmt.format(d);
}

// ---------- Render ----------
function sorted() {
  return [...state.deposits].sort((a, b) => b.ts - a.ts);
}

function render(freshId) {
  const list = sorted();
  const total = list.reduce((s, d) => s + d.amount, 0);

  $('total').textContent = fmt(total);

  // goal & jar
  const goal = state.goal;
  let pct = 0;
  if (goal && goal.amount > 0) {
    pct = Math.min(1, total / goal.amount);
    $('goalText').textContent = (goal.name ? goal.name + ' · ' : 'Цель · ') + fmtShort(goal.amount);
    $('progressWrap').hidden = false;
    $('progressBar').style.width = (pct * 100).toFixed(1) + '%';
    const left = goal.amount - total;
    $('progressLeft').textContent = left > 0 ? `Осталось ${fmt(left)}` : '🎉 Цель достигнута!';
    $('jarPct').textContent = Math.floor(pct * 100) + '%';
  } else {
    $('goalText').textContent = 'Поставить цель';
    $('progressWrap').hidden = true;
    // Without a goal the jar fills gently based on number of deposits
    pct = list.length ? Math.min(0.85, 0.15 + list.length * 0.05) : 0;
    $('jarPct').textContent = list.length ? '' : '';
  }
  const level = 144 - pct * 108 - 6; // jar interior 36..144
  $('liquidGroup').style.transform = `translateY(${pct > 0 ? level : 150}px)`;

  // stats
  const now = new Date();
  const monthSum = list
    .filter((d) => { const t = new Date(d.ts); return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear(); })
    .reduce((s, d) => s + d.amount, 0);
  $('statMonth').textContent = fmtShort(monthSum);
  $('statCount').textContent = list.length;
  $('statAvg').textContent = fmtShort(list.length ? total / list.length : 0);

  renderHistory(list, freshId);
  renderChart();
}

function renderHistory(list, freshId) {
  const box = $('history');
  box.innerHTML = '';
  $('empty').hidden = list.length > 0;

  const groups = new Map();
  for (const d of list) {
    const dt = new Date(d.ts);
    const key = dt.getFullYear() + '-' + dt.getMonth();
    if (!groups.has(key)) groups.set(key, { label: monthFmt.format(dt).replace(' г.', ''), items: [], sum: 0 });
    const g = groups.get(key);
    g.items.push(d); g.sum += d.amount;
  }

  for (const g of groups.values()) {
    const sec = document.createElement('div');
    sec.className = 'month';
    sec.innerHTML = `<div class="month-head"><span class="month-name"></span><span class="month-sum"></span></div><div class="list card"></div>`;
    sec.querySelector('.month-name').textContent = g.label;
    sec.querySelector('.month-sum').textContent = '+' + fmt(g.sum);
    const ul = sec.querySelector('.list');
    for (const d of g.items) {
      const b = document.createElement('button');
      b.className = 'item' + (d.id === freshId ? ' fresh' : '');
      b.innerHTML = `<div class="item-ico">🪙</div><div class="item-main"><div class="item-note"></div><div class="item-date"></div></div><div class="item-amt"></div>`;
      b.querySelector('.item-note').textContent = d.note || 'Пополнение';
      b.querySelector('.item-date').textContent = `${relDay(d.ts)}, ${timeFmt.format(new Date(d.ts))}`;
      b.querySelector('.item-amt').textContent = '+' + fmt(d.amount);
      b.addEventListener('click', () => openDeposit(d));
      ul.appendChild(b);
    }
    box.appendChild(sec);
  }
}

function renderChart() {
  const card = $('chartCard');
  const all = [...state.deposits].sort((a, b) => a.ts - b.ts);
  if (all.length < 1) { card.hidden = true; return; }
  card.hidden = false;

  const end = Date.now();
  let start;
  if (range === 'all') start = Math.min(all[0].ts, end - 864e5);
  else start = end - Number(range) * 864e5;

  // cumulative series
  let cum = 0;
  const pts = [];
  for (const d of all) {
    cum += d.amount;
    if (d.ts < start) { pts.length = 0; pts.push({ t: start, v: cum }); continue; }
    if (pts.length === 0) pts.push({ t: start, v: cum - d.amount });
    pts.push({ t: d.ts, v: cum });
  }
  if (pts.length === 0) pts.push({ t: start, v: 0 });
  pts.push({ t: Math.max(end, pts[pts.length - 1].t), v: cum });

  const t0 = start, t1 = pts[pts.length - 1].t;
  const maxV = Math.max(...pts.map((p) => p.v), 1);
  const W = 100, H = 100;
  const x = (t) => ((t - t0) / Math.max(1, t1 - t0)) * W;
  const y = (v) => H - (v / maxV) * H * 0.92;

  // step line (money arrives in steps)
  let d = `M${x(pts[0].t)},${y(pts[0].v)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${x(pts[i].t)},${y(pts[i - 1].v)} L${x(pts[i].t)},${y(pts[i].v)}`;
  }
  const area = `${d} L${W},${H} L0,${H} Z`;

  const chart = $('chart');
  chart.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: var(--accent); stop-opacity: .35"/>
        <stop offset="1" style="stop-color: var(--accent); stop-opacity: 0"/>
      </linearGradient></defs>
      <line class="grid" x1="0" x2="100" y1="${y(maxV)}" y2="${y(maxV)}"/>
      <line class="grid" x1="0" x2="100" y1="${y(maxV / 2)}" y2="${y(maxV / 2)}"/>
      <line class="grid" x1="0" x2="100" y1="100" y2="100"/>
      <path class="area" d="${area}"/>
      <path class="line" d="${d}"/>
    </svg>
    <div class="max-label">${fmtShort(maxV)}</div>`;
  const last = pts[pts.length - 1];
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.style.left = x(last.t) + '%';
  dot.style.top = y(last.v) + '%';
  chart.appendChild(dot);

  $('axisStart').textContent = shortDate.format(new Date(t0));
  $('axisEnd').textContent = 'сегодня';
}

// ---------- Sheets ----------
const backdrop = $('sheetBackdrop');
let openSheet = null;
function showSheet(el) {
  if (openSheet) openSheet.classList.remove('on');
  openSheet = el;
  el.classList.add('on');
  backdrop.classList.add('on');
}
function hideSheet() {
  if (openSheet) openSheet.classList.remove('on');
  openSheet = null;
  backdrop.classList.remove('on');
  document.activeElement && document.activeElement.blur();
}
backdrop.addEventListener('click', hideSheet);

// swipe down to close
document.querySelectorAll('.sheet').forEach((sheet) => {
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', (e) => {
    if (sheet.scrollTop > 0) return;
    y0 = e.touches[0].clientY; dy = 0;
    sheet.style.transition = 'none';
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 === null) return;
    sheet.style.transition = ''; sheet.style.transform = '';
    if (dy > 90) hideSheet();
    y0 = null;
  });
});

function openDeposit(dep) {
  editingId = dep ? dep.id : null;
  $('sheetTitle').textContent = dep ? 'Вложение' : 'Новое вложение';
  $('fAmount').value = dep ? String(dep.amount).replace('.', ',') : '';
  $('fDate').value = toLocalInput(dep ? dep.ts : Date.now());
  $('fNote').value = dep ? dep.note || '' : '';
  $('deleteBtn').hidden = !dep;
  showSheet($('sheet'));
  if (!dep) setTimeout(() => $('fAmount').focus(), 320);
}

$('addBtn').addEventListener('click', () => openDeposit(null));

$('quick').addEventListener('click', (e) => {
  const v = e.target.dataset.add;
  if (!v) return;
  const cur = parseAmount($('fAmount').value) || 0;
  $('fAmount').value = String(cur + Number(v)).replace('.', ',');
});

$('sheet').addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = parseAmount($('fAmount').value);
  if (!(amount > 0)) { toast('Введи сумму больше нуля'); $('fAmount').focus(); return; }
  const ts = $('fDate').value ? new Date($('fDate').value).getTime() : Date.now();
  const note = $('fNote').value.trim();
  let id = editingId;
  if (id) {
    const d = state.deposits.find((x) => x.id === id);
    Object.assign(d, { amount, ts, note });
    toast('Изменено');
  } else {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    state.deposits.push({ id, amount, ts, note });
    toast('+' + fmt(amount) + ' в баночку');
    if (navigator.vibrate) navigator.vibrate(15);
  }
  save();
  hideSheet();
  render(id);
});

$('deleteBtn').addEventListener('click', () => {
  if (!editingId) return;
  if (!confirm('Удалить это вложение?')) return;
  state.deposits = state.deposits.filter((x) => x.id !== editingId);
  save(); hideSheet(); render(); toast('Удалено');
});

// goal
$('goalBtn').addEventListener('click', () => {
  $('gName').value = state.goal ? state.goal.name || '' : '';
  $('gAmount').value = state.goal ? String(state.goal.amount).replace('.', ',') : '';
  showSheet($('goalSheet'));
});
$('goalSheet').addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = parseAmount($('gAmount').value);
  if (!(amount > 0)) { toast('Введи сумму цели'); return; }
  state.goal = { name: $('gName').value.trim(), amount };
  save(); hideSheet(); render(); toast('Цель сохранена');
});
$('goalClear').addEventListener('click', () => {
  state.goal = null; save(); hideSheet(); render();
});

// range
$('rangeSeg').addEventListener('click', (e) => {
  const r = e.target.dataset.range;
  if (!r) return;
  range = r;
  $('rangeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.range === r));
  renderChart();
});

// menu
$('menuBtn').addEventListener('click', () => showSheet($('menuSheet')));
$('exportBtn').addEventListener('click', async () => {
  const json = JSON.stringify(state, null, 2);
  const name = `banochka-${toLocalInput(Date.now()).slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Баночка — резервная копия' });
      return;
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!s || !Array.isArray(s.deposits)) throw new Error();
    const clean = s.deposits
      .filter((d) => d && isFinite(d.amount) && d.amount > 0 && isFinite(d.ts))
      .map((d) => ({ id: String(d.id || Math.random().toString(36).slice(2)), amount: +d.amount, ts: +d.ts, note: String(d.note || '').slice(0, 80) }));
    state = { goal: s.goal && s.goal.amount > 0 ? { name: String(s.goal.name || ''), amount: +s.goal.amount } : null, deposits: clean };
    save(); hideSheet(); render(); toast('Восстановлено: ' + clean.length);
  } catch (err) {
    toast('Не удалось прочитать файл');
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Удалить все записи и цель? Это нельзя отменить.')) return;
  state = { goal: null, deposits: [] };
  save(); hideSheet(); render(); toast('Баночка очищена');
});

// amount inputs grow with their text so ₽ sits right after the number
// (measured with a hidden copy of the text in the same font)
const measurer = document.createElement('span');
measurer.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0';
document.body.appendChild(measurer);
function fitAmount(input) {
  const cs = getComputedStyle(input);
  for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'fontVariantNumeric']) measurer.style[k] = cs[k];
  measurer.textContent = input.value || input.placeholder || '0';
  input.style.width = Math.ceil(measurer.getBoundingClientRect().width) + 6 + 'px';
}
['fAmount', 'gAmount'].forEach((id) => {
  const el = $(id);
  el.addEventListener('input', () => fitAmount(el));
  fitAmount(el);
});
const _openDeposit = openDeposit;
openDeposit = function (dep) { _openDeposit(dep); fitAmount($('fAmount')); };
$('goalBtn').addEventListener('click', () => fitAmount($('gAmount')));
$('quick').addEventListener('click', () => fitAmount($('fAmount')));

// keep the open sheet above the iPhone keyboard
function fitToKeyboard() {
  const vv = window.visualViewport;
  if (!vv) return;
  const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  const root = document.documentElement.style;
  root.setProperty('--kb', kb + 'px');
  root.setProperty('--vvh', vv.height + 'px');
  document.body.classList.toggle('kb-open', kb > 80);
}
if (window.visualViewport) {
  visualViewport.addEventListener('resize', fitToKeyboard);
  visualViewport.addEventListener('scroll', fitToKeyboard);
  fitToKeyboard();
}

// ---------- Toast ----------
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2000);
}

// ---------- Init ----------
render();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
