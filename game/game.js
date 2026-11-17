'use strict';
/* =========================================================
   ТЁМНЫЙ ПУТЬ — first-person dark fantasy tapper
   All pixel art is generated in code.
   ========================================================= */

const $ = (id) => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d');
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const SAVE_KEY = 'darkpath-v1';

function nf(n) {
  n = Math.floor(n);
  if (n < 10000) return String(n);
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n.toFixed(1)) + u[i];
}
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hexToRgb(h) { const p = parseInt(h.slice(1), 16); return [(p >> 16) & 255, (p >> 8) & 255, p & 255]; }
function rgbToHex(r, g, b) { return '#' + ((1 << 24) | (clamp(r, 0, 255) << 16) | (clamp(g, 0, 255) << 8) | clamp(b, 0, 255)).toString(16).slice(1); }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(Math.round(A[0] * (1 - t) + B[0] * t), Math.round(A[1] * (1 - t) + B[1] * t), Math.round(A[2] * (1 - t) + B[2] * t));
}
const lighten = (c, t) => mixHex(c, '#ffffff', t);
const darken = (c, t) => mixHex(c, '#000000', t);

// =========================================================
// ZONES
// =========================================================
const ZONES = [
  {
    name: 'Проклятый лес', weather: 'fireflies',
    sky: ['#1a0b2e', '#3b1a5c', '#6b2f7a', '#b4528a'],
    mount: ['#2a1745', '#1d1033'], ground: ['#1f3d1c', '#2b5226', '#386b2e', '#4b8238'],
    path: ['#6e5a3a', '#8a7349', '#a38c5c'], tree: '#0d1a12', castle: '#2b2140', fog: 'rgba(170,140,220,',
    enemies: ['wolf', 'skeleton', 'bat'], boss: 'wolfking', extra: 'rocks',
  },
  {
    name: 'Безмолвное кладбище', weather: 'rain',
    sky: ['#081418', '#13303a', '#24525a', '#5f8f86'],
    mount: ['#16303a', '#0e2228'], ground: ['#26302c', '#323f39', '#3f4f47', '#4f6158'],
    path: ['#4f4a44', '#655f57', '#7c756b'], tree: '#0a1214', castle: '#1c2a30', fog: 'rgba(160,220,210,',
    enemies: ['skeleton', 'ghoul', 'bat', 'wraith'], boss: 'lich', extra: 'graves',
  },
  {
    name: 'Пепельные руины', weather: 'ash',
    sky: ['#1a0505', '#4a0f0a', '#8f2a12', '#e0702a'],
    mount: ['#3a0f0c', '#260807'], ground: ['#2a1a14', '#3a241a', '#4a2f20', '#5c3a26'],
    path: ['#5a4434', '#735743', '#8c6a52'], tree: '#140806', castle: '#2a100c', fog: 'rgba(255,140,80,',
    enemies: ['ghoul', 'imp', 'knight'], boss: 'demon', extra: 'pillars',
  },
  {
    name: 'Цитадель Тьмы', weather: 'storm',
    sky: ['#050308', '#140a1f', '#2e0f2e', '#6a1530'],
    mount: ['#1a0d22', '#100816'], ground: ['#17121c', '#211a28', '#2c2336', '#3a2e46'],
    path: ['#3c3448', '#4f465e', '#645a75'], tree: '#07040a', castle: '#120a18', fog: 'rgba(200,60,120,',
    enemies: ['knight', 'imp', 'wraith'], boss: 'darklord', extra: 'spikes',
  },
];
const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
const zoneOf = (zi) => ZONES[zi % ZONES.length];
const zoneName = (zi) => { const r = Math.floor(zi / ZONES.length); return zoneOf(zi).name + (r < ROMAN.length ? ROMAN[r] : ' ' + (r + 1)); };

// =========================================================
// ENEMY SPRITES
// heavy = chance of an unblockable (purple) attack
// =========================================================
const SPRITES = {
  skeleton: { name: 'Скелет', hp: 1, dmg: 1, spd: 1, heavy: 0.1, pal: { w: '#e8e2cf', s: '#a8a08a', k: '#2a2420', r: '#ff3b2f', b: '#7a5a3a' }, map: [
    '.....wwww.....',
    '....wwwwww....',
    '....wrwwrw....',
    '....wwwwww....',
    '.....wkkw.....',
    '......ww......',
    '....swwwws....',
    '...w.wkkw.w...',
    '...w.wwww.w...',
    '...w.wkkw.w..b',
    '..w..wwww..wb.',
    '..s..wkkw..b..',
    '......ww..b...',
    '.....w..w.....',
    '.....w..w.....',
    '.....s..s.....',
    '.....w..w.....',
    '....ww..ww....',
  ] },
  wolf: { name: 'Чёрный волк', hp: 0.8, dmg: 1.1, spd: 0.8, heavy: 0.05, pal: { k: '#1b1722', g: '#3a3348', l: '#5a5070', r: '#ffd23b', w: '#e8e2cf' }, map: [
    '..g........g..',
    '..gg......gg..',
    '..ggg....ggg..',
    '..gkggggggkg..',
    '..gkkggggkkg..',
    '..grrkggkrrg..',
    '...gkkggkkg...',
    '...ggkllkgg...',
    '....gkkkkg....',
    '....gwkkwg....',
    '...ggkkkkgg...',
    '..gggggggggg..',
    '.gggkggggkggg.',
    '.ggkk.gg.kkgg.',
    '.gg...gg...gg.',
    '.kk...kk...kk.',
  ] },
  bat: { name: 'Кровавая мышь', hp: 0.6, dmg: 0.9, spd: 0.7, heavy: 0, fly: 1, pal: { k: '#1e1024', p: '#4a1f4f', r: '#ff3b2f', w: '#f0e6e0' }, map: [
    'k..............k',
    'kk....k..k....kk',
    'kpk...kkkk...kpk',
    'kppk.kkkkkk.kppk',
    'kpppkkrkkrkkpppk',
    '.kppkkkkkkkkppk.',
    '..kpk.kkkk.kpk..',
    '...k..kwwk..k...',
    '.......kk.......',
  ] },
  ghoul: { name: 'Упырь', hp: 1.3, dmg: 1, spd: 1.15, heavy: 0.15, pal: { g: '#7f9a6a', d: '#566b48', c: '#4a3a5c', k: '#1a1420', r: '#ffe14d' }, map: [
    '....gggggg....',
    '...gggggggg...',
    '...grrgggrr...',
    '...gggggggg...',
    '....gkkkkg....',
    '.....gddg.....',
    '..cccccccccc..',
    '.gcccccccccg..',
    '.g.cccccccc.g.',
    'g..cccccccc..g',
    'd..cccccccc..d',
    '...cccccccc...',
    '...kkkkkkkk...',
    '...kk....kk...',
    '...kk....kk...',
    '...dd....dd...',
    '..ddd....ddd..',
  ] },
  imp: { name: 'Бес', hp: 0.9, dmg: 1.2, spd: 0.75, heavy: 0.2, pal: { r: '#c2362b', d: '#7a1d17', k: '#1a0a08', y: '#ffe14d', h: '#e8d8b0' }, map: [
    '.h..........h.',
    '.hh........hh.',
    '..hh.rrrr.hh..',
    '...rrrrrrrr...',
    '...ryyrryyr...',
    '...rrrrrrrr...',
    '....rkhhkr....',
    '.d...rrrr...d.',
    '.dd.rrrrrr.dd.',
    '.ddrrrrrrrrdd.',
    '..d.rrrrrr.d..',
    '....rrrrrr....',
    '....dd..dd....',
    '....d....d....',
    '...dd....dd...',
  ] },
  knight: { name: 'Павший рыцарь', hp: 1.6, dmg: 1.25, spd: 1.25, heavy: 0.3, pal: { m: '#6d6a7a', l: '#9a97a8', r: '#ff3b2f', p: '#4a1f3a', k: '#151219', s: '#c4c9da' }, map: [
    '.....mmmm......',
    '....mllllm.....',
    '...mmmmmmmm....',
    '...mrrrrrrm...s',
    '...mmmmmmmm..s.',
    '....mmmmmm..s..',
    '..pplllllllps..',
    '.ppmmmmmmmmpp..',
    'pp.mmllllmm.pp.',
    'p..mmmmmmmm..p.',
    'm..mmmmmmmm..m.',
    'l..kkkkkkkk..l.',
    '...pppppppp....',
    '..pppppppppp...',
    '..pppp..pppp...',
    '..mmm....mmm...',
    '.mmmm....mmmm..',
  ] },
  wraith: { name: 'Призрак', hp: 1.1, dmg: 1.4, spd: 0.9, heavy: 0.35, fly: 1, pal: { b: '#2c2a52', v: '#5a4fa0', c: '#9fe8ff', k: '#0c0a18' }, map: [
    '....bbbbbb....',
    '...bbbbbbbb...',
    '..bbkkkkkkbb..',
    '..bkkckkckkb..',
    '..bkkkkkkkkb..',
    '..bbkkkkkkbb..',
    '.vbbbbbbbbbbv.',
    'vvbbbvbbvbbbvv',
    'v.bbbbbbbbbb.v',
    '..bbvbbbbvbb..',
    '..bbbbbbbbbb..',
    '...bbvbbvbb...',
    '...bb.bb.bb...',
    '....b..b..b...',
  ] },
};
const BOSSES = {
  wolfking: { base: 'wolf', name: 'Вожак стаи Мракогрыз', tint: { g: '#5a2a2a', l: '#8a3a3a', r: '#ff3b2f' } },
  lich: { base: 'skeleton', name: 'Лич Безгласный', tint: { w: '#b8f0e0', s: '#5fa898', r: '#9fe8ff', k: '#123344', b: '#9fe8ff' } },
  demon: { base: 'imp', name: 'Пепельный Владыка', tint: { r: '#7a1d17', d: '#3a0a08', y: '#ff8b3d' } },
  darklord: { base: 'knight', name: 'Король Без Солнца', tint: { m: '#2a2236', l: '#4a3a66', r: '#ff2fd0', p: '#5a0f2a', s: '#ff6ad5' } },
};

// Sprite canvases with automatic light/shadow shading.
// modes: n (normal), white, red, purple, gold, black
const spriteCache = {};
const pixelCache = {};
function spritePalette(key, tint) { return Object.assign({}, SPRITES[key].pal, tint || {}); }
function getSprite(key, tint, mode) {
  const id = key + JSON.stringify(tint || {}) + mode;
  if (spriteCache[id]) return spriteCache[id];
  const s = SPRITES[key], pal = spritePalette(key, tint);
  const h = s.map.length, w = s.map[0].length;
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && s.map[y][x] !== '.';
  const c = document.createElement('canvas');
  c.width = w + 2; c.height = h + 2;
  const g = c.getContext('2d');
  const solid = { white: '#ffffff', gold: '#ffcc4d', black: '#000000', auraP: '#b04dff' }[mode];
  // outline
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!filled(x, y)) continue;
    g.fillStyle = solid || '#000000';
    g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y, 1, 3);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!filled(x, y)) continue;
    let col = pal[s.map[y][x]] || '#ff00ff';
    // shading: torch light from the lower-left, shadow on the right
    if (!filled(x - 1, y) || !filled(x, y - 1)) col = lighten(col, 0.22);
    else if (!filled(x + 1, y) || !filled(x, y + 1)) col = darken(col, 0.35);
    if (solid) col = solid;
    if (mode === 'red') col = mixHex(col, '#ff2a1a', 0.55);
    if (mode === 'purple') col = mixHex(col, '#b04dff', 0.6);
    g.fillStyle = col;
    g.fillRect(x + 1, y + 1, 1, 1);
  }
  spriteCache[id] = c;
  return c;
}
function spritePixels(key, tint) {
  const id = key + JSON.stringify(tint || {});
  if (pixelCache[id]) return pixelCache[id];
  const s = SPRITES[key], pal = spritePalette(key, tint), out = [];
  s.map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') out.push({ x: x + 1, y: y + 1, col: pal[ch] }); }));
  return (pixelCache[id] = out);
}

// =========================================================
// RELICS (chest rewards)
// =========================================================
const RELICS = {
  fang:   { ico: '🦷', name: 'Клык вожака', desc: '+8% урона' },
  skull:  { ico: '💀', name: 'Череп-копилка', desc: '+12% золота' },
  heart:  { ico: '🫀', name: 'Сердце упыря', desc: '+10% здоровья' },
  eye:    { ico: '👁', name: 'Глаз беса', desc: '+4% шанс крита' },
  thorns: { ico: '🌵', name: 'Терновый венец', desc: 'Враг получает 40% урона, когда бьёт тебя' },
  glass:  { ico: '⏳', name: 'Песочные часы', desc: 'Окно парирования и уклонения шире' },
  feather:{ ico: '🪶', name: 'Перо ворона', desc: '+12% опыта' },
  ember:  { ico: '🔥', name: 'Вечные угли', desc: 'Пламя факела сильнее на 25%' },
  leech:  { ico: '🩸', name: 'Пиявка', desc: '+0.8% лечения от урона' },
  ring:   { ico: '💍', name: 'Кольцо стража', desc: 'Блок гасит ещё 4% урона' },
  song:   { ico: '🎵', name: 'Песнь клинка', desc: 'Максимальное комбо выше на 25%' },
  star:   { ico: '⭐', name: 'Звезда удачи', desc: 'Элитные враги чаще (+3%)' },
  hourfire:{ ico: '☄', name: 'Осколок кометы', desc: 'Навыки перезаряжаются на 10% быстрее' },
};
const rl = (id) => (S.relics && S.relics[id]) || 0;

// =========================================================
// SAVE STATE
// =========================================================
const DEFAULT = {
  lvl: 1, xp: 0, gold: 0, zone: 0, wave: 1, maxZone: 0, potions: 1,
  up: { sword: 0, armor: 0, crit: 0, torch: 0, leech: 0 },
  relics: {}, souls: 0, rebirths: 0,
  kills: 0, bosses: 0, deaths: 0, parries: 0, dodges: 0, elites: 0, bestWave: 1, bestCombo: 0,
  diff: 'easy', muted: false, seenHint: false, seenV2: false, lastSeen: 0,
};
let S = load();
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return Object.assign({}, DEFAULT, d, { up: Object.assign({}, DEFAULT.up, d.up || {}), relics: Object.assign({}, d.relics || {}) });
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT));
}
function save() { S.lastSeen = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

// =========================================================
// STATS & ECONOMY
// =========================================================
const gw = () => S.zone * 10 + S.wave;
const DIFFS = {
  easy:   { name: 'Лёгкий',  mul: 1,   ico: '🌙' },
  normal: { name: 'Средний', mul: 1.2, ico: '🔥' },
  hard:   { name: 'Сложный', mul: 1.7, ico: '💀' },
};
const diff = () => DIFFS[S.diff] || DIFFS.easy;
const soulMul = () => 1 + S.souls * 0.1;
const baseDmg = (sw = S.up.sword) => (5 * Math.pow(1.3, sw) + (S.lvl - 1) * 0.6) * soulMul() * (1 + rl('fang') * 0.08);
const pDmg = () => baseDmg() * (berserkT > 0 ? 2 : 1);
const hpOf = (ar = S.up.armor) => Math.round((50 + (S.lvl - 1) * 5) * Math.pow(1.18, ar) * (1 + rl('heart') * 0.1));
const pMaxHp = () => hpOf();
const pCrit = (lv = S.up.crit) => Math.min(0.8, 0.05 + lv * 0.04 + rl('eye') * 0.04 + (berserkT > 0 ? 0.25 : 0));
const pCritMul = (lv = S.up.crit) => 2 + lv * 0.1;
const pBurn = (lv = S.up.torch) => lv * 0.4 * (1 + rl('ember') * 0.25);
const pLeech = (lv = S.up.leech) => lv * 0.007 + rl('leech') * 0.005;
const goldMul = () => soulMul() * (1 + rl('skull') * 0.12);
const xpNeed = () => Math.round(20 * Math.pow(1.32, S.lvl - 1));
const potionCost = () => Math.round(25 + gw() * 6 * Math.pow(1.06, gw()));
const parryWin = () => 0.3 + rl('glass') * 0.04;
const dodgeWin = () => 0.42 + rl('glass') * 0.04;
const blockReduce = () => Math.min(0.9, 0.6 + rl('ring') * 0.04);
const comboMax = () => 1 + rl('song') * 0.25;  // max bonus (1 = +100%)
const comboMul = () => 1 + Math.min(comboMax(), combo * 0.012);
const eliteChance = () => (gw() > 3 ? 0.07 + rl('star') * 0.03 : 0);
const skillCdMul = () => Math.max(0.4, 1 - rl('hourfire') * 0.1);
const goldPerKill = (g) => 3 * Math.pow(1.18, g - 1) * goldMul();

const UPGRADES = [
  { id: 'sword', ico: '⚔', name: 'Клинок', base: 14, grow: 1.48, max: 999,
    desc: () => `Урон ${nf(baseDmg())} → <b>${nf(baseDmg(S.up.sword + 1))}</b>` },
  { id: 'armor', ico: '🛡', name: 'Доспех', base: 18, grow: 1.5, max: 999,
    desc: () => `Здоровье ${nf(hpOf())} → <b>${nf(hpOf(S.up.armor + 1))}</b>` },
  { id: 'crit', ico: '🎯', name: 'Ярость', base: 30, grow: 1.55, max: 15,
    desc: () => `Крит ${Math.round(pCrit() * 100)}% ×${pCritMul().toFixed(1)} → <b>${Math.round(pCrit(S.up.crit + 1) * 100)}% ×${pCritMul(S.up.crit + 1).toFixed(1)}</b>` },
  { id: 'torch', ico: '🔥', name: 'Пламя факела', base: 50, grow: 1.6, max: 25,
    desc: () => `Жжёт врага: ${Math.round(pBurn() * 100)}% → <b>${Math.round(pBurn(S.up.torch + 1) * 100)}%</b> урона в сек` },
  { id: 'leech', ico: '🩸', name: 'Кровавая жажда', base: 40, grow: 1.6, max: 20,
    desc: () => `Лечит ${(pLeech() * 100).toFixed(1)}% → <b>${(pLeech(S.up.leech + 1) * 100).toFixed(1)}%</b> от урона` },
];
const upCost = (u) => Math.round(u.base * Math.pow(u.grow, S.up[u.id]));

// Sword look by upgrade level
const SWORD_TIERS = [
  { at: 0,  name: 'Железо', blade: '#9aa0b4', light: '#d8dcea', dark: '#6a6f82', guard: '#7a5a32', glow: null },
  { at: 5,  name: 'Сталь',  blade: '#b8c2d8', light: '#f2f6ff', dark: '#7c8aa6', guard: '#b08a3a', glow: null },
  { at: 10, name: 'Золото', blade: '#e0b84a', light: '#fff0a8', dark: '#a87a20', guard: '#6b2f7a', glow: 'rgba(255,210,90,' },
  { at: 15, name: 'Руны',   blade: '#5fb8d8', light: '#c8f4ff', dark: '#2a6a8a', guard: '#2a2236', glow: 'rgba(120,230,255,' },
  { at: 22, name: 'Пламя',  blade: '#ff7a2a', light: '#ffe08a', dark: '#b8261a', guard: '#1a0a08', glow: 'rgba(255,120,40,' },
];
const swordTier = () => SWORD_TIERS.filter((t) => S.up.sword >= t.at).pop();

// Skills
const SKILLS = {
  fire: { unlock: 3, cd: 12, ico: '💥', name: 'Огненный взрыв', short: 'Взрыв' },
  rage: { unlock: 7, cd: 30, ico: '⚡', name: 'Берсерк', short: 'Ярость', dur: 6 },
};

// =========================================================
// RUNTIME
// =========================================================
let LW = 180, LH = 320;
let bgCanvas = null;
let hp = pMaxHp();
let enemy = null;
let spawnTimer = 0.6;
let swing = 0, swingSide = 1;
let slashes = [];
let blockT = 0, blockCd = 0;
let dodgeT = 0, dodgeCd = 0, dodgeDir = 1;
let attackCd = 0;
let shake = 0, hitStop = 0;
let time = 0;
let paused = true, dead = false;
let particles = [], embers = [], weather = [], projectiles = [];
let burnAcc = 0, burnTick = 0;
let combo = 0, comboTimer = 0;
let berserkT = 0;
const skillCd = { fire: 0, rage: 0 };
let lightning = 0, nextLightning = 6;

function resize() {
  const W = innerWidth, H = innerHeight;
  if (H >= W) { LW = 180; LH = Math.round(180 * H / W); }
  else { LH = 220; LW = Math.round(220 * W / H); }
  cv.width = LW; cv.height = LH;
  ctx.imageSmoothingEnabled = false;
  bgCanvas = drawBackground(S.zone);
  weather = [];
}
addEventListener('resize', resize);

// =========================================================
// BACKGROUND
// =========================================================
function drawBackground(zi) {
  const Z = zoneOf(zi);
  const R = rng(1000 + zi * 77);
  const c = document.createElement('canvas');
  c.width = LW; c.height = LH;
  const g = c.getContext('2d');
  const hz = Math.round(LH * 0.40);
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); };
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const tri = (cx, top, halfW, h, col) => {
    g.fillStyle = col;
    for (let i = 0; i < h; i++) { const w = Math.round((i / h) * halfW); g.fillRect((cx - w) | 0, (top + i) | 0, w * 2 + 1, 1); }
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  // sky
  const bands = Z.sky.length;
  for (let y = 0; y < hz + 4; y++) {
    const t = (y / (hz + 4)) * (bands - 1);
    const i = Math.min(bands - 2, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < LW; x++) px(x, y, f > BAYER[y & 3][x & 3] / 16 ? Z.sky[i + 1] : Z.sky[i]);
  }
  for (let i = 0; i < LW * 0.5; i++) px(R() * LW, R() * hz * 0.6, R() < 0.2 ? '#ffffff' : 'rgba(255,255,255,.45)');
  // moon with halo
  const mx = LW * (0.72 + R() * 0.12), my = hz * 0.5, mr = 9;
  for (let y = -mr - 6; y <= mr + 6; y++) for (let x = -mr - 6; x <= mr + 6; x++) {
    const d = x * x + y * y;
    if (d <= mr * mr) px(mx + x, my + y, d > (mr - 1.5) ** 2 ? '#d8cfe8' : (((x + 3) ** 2 + (y - 2) ** 2) < 9 || ((x - 4) ** 2 + (y + 3) ** 2) < 4 ? '#bdb2d0' : '#f1ebff'));
    else if (d <= (mr + 6) ** 2 && BAYER[(y + 99) & 3][(x + 99) & 3] / 16 < 0.5 * (1 - (Math.sqrt(d) - mr) / 6)) px(mx + x, my + y, 'rgba(255,240,255,.18)');
  }
  for (let k = 0; k < 4; k++) {
    const cy = hz * (0.2 + R() * 0.45), cx = R() * LW, len = 30 + R() * 50;
    for (let x = 0; x < len; x++) {
      const th = Math.round(1 + Math.sin(x / len * Math.PI) * 3);
      rect(cx + x - len / 2, cy - th / 2, 1, th, 'rgba(0,0,0,.18)');
      if (x % 3 === 0) rect(cx + x - len / 2, cy - th / 2, 1, 1, 'rgba(255,255,255,.06)');
    }
  }
  // mountains
  for (let L = 0; L < 2; L++) {
    const base = hz + 2 - L * 2, amp = L === 0 ? hz * 0.42 : hz * 0.26;
    let y = base - amp * 0.5;
    const col = Z.mount[L];
    for (let x = 0; x < LW; x++) {
      y += (R() - 0.5) * (L === 0 ? 4 : 3);
      y = clamp(y, base - amp, base - 4);
      if (x % 37 === 0) y -= R() * 10;
      rect(x, y, 1, LH, col);
      if (L === 0 && R() < 0.5) px(x, y, lighten(col, 0.15));
    }
  }
  // hill + castle
  const cx = LW / 2;
  for (let x = -LW * 0.35; x < LW * 0.35; x++) {
    const hh = Math.cos((x / (LW * 0.35)) * Math.PI / 2) * hz * 0.12;
    rect(cx + x, hz - hh, 1, hh + 2, Z.ground[0]);
  }
  const ch = hz * 0.12, cBase = hz - ch + 2, castle = Z.castle;
  const towers = [[-18, 18, 5], [-9, 30, 6], [0, 40, 7], [9, 30, 6], [18, 18, 5]];
  rect(cx - 20, cBase - 14, 40, 14, castle);
  for (const [ox, h, w] of towers) {
    rect(cx + ox - w / 2, cBase - h, w, h, castle);
    rect(cx + ox - w / 2, cBase - h, 1, h, lighten(castle, 0.12));
    tri(cx + ox, cBase - h - w * 1.6, w / 2 + 1, w * 1.6, castle);
    for (let k = 0; k < 2; k++) if (R() < 0.8) px(cx + ox + (R() < 0.5 ? -1 : 1), cBase - h + 4 + k * 7, '#ffcf5a');
  }
  for (let x = -20; x < 20; x += 3) rect(cx + x, cBase - 16, 2, 2, castle);
  rect(cx - 2, cBase - 6, 4, 6, '#000');
  px(cx, cBase - 34, '#ff4a4a');

  // ground
  rect(0, hz, LW, LH - hz, Z.ground[0]);
  for (let y = hz; y < LH; y++) {
    const depth = (y - hz) / (LH - hz);
    for (let x = 0; x < LW; x++) if (R() < 0.25 + depth * 0.2) px(x, y, Z.ground[Math.min(3, 1 + Math.floor(R() * (1 + depth * 2.5)))]);
  }
  for (let i = 0; i < LW * 1.4; i++) {
    const y = hz + 10 + R() * (LH - hz), x = R() * LW;
    const s = 1 + Math.floor(((y - hz) / (LH - hz)) * 4);
    for (let k = 0; k < s; k++) px(x + (k % 2 ? 1 : -1) * (k >> 1), y - k, Z.ground[3]);
  }
  // path
  const pathX = (y) => { const t = (y - hz) / (LH - hz); return cx + Math.sin(t * 5.2 + 0.6) * (LW * 0.08) * (1 - t * 0.6) + (t * t) * LW * 0.04; };
  for (let y = cBase; y < LH; y++) {
    const t = Math.max(0, (y - hz) / (LH - hz));
    const w = 1.5 + t * t * LW * 0.42 + t * LW * 0.06;
    const xc = pathX(y);
    for (let x = Math.floor(xc - w); x <= xc + w; x++) {
      if (Math.abs(x - xc) > w - 1.5 && R() < 0.5) continue;
      px(x, y, Z.path[1]);
    }
    if (t > 0.08) {
      const rowH = Math.max(2, Math.round(2 + t * 7));
      if ((y - hz) % rowH === 0) {
        for (let x = Math.floor(xc - w); x <= xc + w; x++) if (R() < 0.85) px(x, y, Z.path[0]);
      } else {
        const sw = Math.max(3, Math.round(3 + t * 12));
        for (let x = Math.floor(xc - w); x <= xc + w; x++) {
          if (((x + ((Math.floor((y - hz) / rowH) % 2) * sw / 2)) | 0) % sw === 0) px(x, y, Z.path[0]);
          else if ((y - hz) % rowH === 1 && R() < 0.5) px(x, y, Z.path[2]);
          else if (R() < 0.05) px(x, y, Z.path[2]);
        }
      }
    }
  }
  // extras
  for (let i = 0; i < 9; i++) {
    const side = R() < 0.5 ? -1 : 1;
    const y = hz + 8 + R() * (LH - hz) * 0.7;
    const t = (y - hz) / (LH - hz);
    const x = pathX(y) + side * (t * LW * 0.45 + 10 + R() * 25);
    const s = 1 + t * 3.2;
    if (Z.extra === 'rocks') {
      rect(x - 3 * s, y - 2 * s, 6 * s, 2 * s, '#4a4552'); rect(x - 2 * s, y - 3 * s, 4 * s, 1 * s, '#6b6575');
    } else if (Z.extra === 'graves') {
      rect(x - 2 * s, y - 6 * s, 4 * s, 6 * s, '#5c6168'); rect(x - 1.5 * s, y - 7 * s, 3 * s, 1 * s, '#5c6168');
      rect(x - 2 * s, y - 6 * s, 1 * s, 6 * s, '#71777f');
      rect(x - 0.5 * s, y - 5 * s, 1 * s, 3 * s, '#3a3e44'); rect(x - 1.5 * s, y - 4 * s, 3 * s, 1 * s, '#3a3e44');
    } else if (Z.extra === 'pillars') {
      const h = (6 + R() * 8) * s;
      rect(x - 2 * s, y - h, 4 * s, h, '#5a4038'); rect(x - 3 * s, y - h, 6 * s, 1.5 * s, '#6e5046');
      rect(x + s, y - h * 0.6, 1 * s, h * 0.5, '#3f2b25');
    } else {
      tri(x, y - 8 * s, 1.5 * s, 8 * s, '#2a1f33'); px(x, y - 8 * s, '#ff2fd0');
    }
  }
  for (let i = 0; i < 16; i++) {
    const x = R() * LW; if (Math.abs(x - cx) < 30) continue;
    pine(g, x, hz + 2, 10 + R() * 10, Z.mount[1], tri);
  }
  const near = [[-6, 0.95], [16, 0.75], [LW - 14, 0.8], [LW + 6, 1.0], [32, 0.55], [LW - 34, 0.5]];
  for (const [x, k] of near) pine(g, x, LH * (0.55 + k * 0.25), LH * 0.75 * k, Z.tree, tri, true);
  return c;
}
function pine(g, x, baseY, h, col, tri, trunk) {
  if (trunk) { g.fillStyle = col; g.fillRect(x - h * 0.03, baseY - h * 0.3, h * 0.06, h * 0.3 + 40); }
  for (let i = 0; i < 4; i++) tri(x, baseY - h + i * h * 0.18, h * (0.12 + i * 0.07), h * 0.32, col);
}

// =========================================================
// ENEMIES
// =========================================================
function spawnEnemy() {
  const Z = zoneOf(S.zone);
  const isBoss = S.wave === 10;
  let key, tint = null, name;
  if (isBoss) { const b = BOSSES[Z.boss]; key = b.base; tint = b.tint; name = b.name; }
  else { key = pick(Z.enemies); name = SPRITES[key].name; }
  const elite = !isBoss && Math.random() < eliteChance();
  const sp = SPRITES[key];
  const g = gw();
  const maxHp = 24 * Math.pow(1.24, g - 1) * sp.hp * (isBoss ? 9 : 1) * (elite ? 3.5 : 1) * diff().mul;
  enemy = {
    key, tint, name, boss: isBoss, elite,
    hp: maxHp, maxHp,
    dmg: 6 * Math.pow(1.17, g - 1) * sp.dmg * (isBoss ? 1.7 : 1) * (elite ? 1.4 : 1) * diff().mul,
    phase: 'approach', t: 0, approachDur: isBoss ? 1.6 : 0.9,
    idle: rand(0.9, 1.6) * sp.spd + 0.4,
    heavyChance: g <= 2 ? 0 : Math.min(0.5, (isBoss ? 0.4 : sp.heavy) + S.zone * 0.04),
    kind: 'normal', windupDur: 0.78,
    flash: 0, flinch: 0, lunge: 0, stun: 0, dodged: false, wobble: Math.random() * 6,
    scale: 5 * (isBoss ? 1.45 : elite ? 1.15 : 1),
  };
  $('enemyName').textContent = (isBoss ? '☠ ' : elite ? '★ ' : '') + (elite ? 'Элитный ' : '') + name;
  $('enemyName').className = 'enemy-name' + (isBoss ? ' boss' : elite ? ' elite' : '');
  $('enemyBox').classList.remove('hidden');
  updateHud();
  if (isBoss) { showBanner('БОСС', name); sfx('boss'); shake = 0.3; }
}

const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
function enemyRect() {
  const sp = SPRITES[enemy.key];
  const img = getSprite(enemy.key, enemy.tint, 'n');
  const hz = LH * 0.40;
  const ap = enemy.phase === 'approach' ? easeOut(enemy.t / enemy.approachDur) : 1;
  const k = 0.18 + 0.82 * ap;
  let scale = enemy.scale * k * (LW / 180);
  const breathe = 1 + Math.sin(time * 3 + enemy.wobble) * 0.02;
  scale *= 1 + enemy.lunge * 0.18;
  const w = img.width * scale, h = img.height * scale * breathe;
  const footY = hz + (LH * 0.70 - hz) * ap + enemy.lunge * 14;
  let yOff = sp.fly ? -LH * 0.08 + Math.sin(time * 4 + enemy.wobble) * 4 : 0;
  if (enemy.phase === 'windup') yOff -= (enemy.t / enemy.windupDur) * (enemy.kind === 'heavy' ? 10 : 6);
  if (enemy.flinch > 0) yOff += 4 * (enemy.flinch / 0.14);
  let xOff = 0;
  if (enemy.phase === 'stun') xOff = Math.sin(time * 30) * 1.5;
  return { x: LW / 2 - w / 2 + xOff, y: footY - h + yOff, w, h, scale };
}

function updateEnemy(dt) {
  if (!enemy) { spawnTimer -= dt; if (spawnTimer <= 0) spawnEnemy(); return; }
  enemy.flash = Math.max(0, enemy.flash - dt);
  enemy.flinch = Math.max(0, enemy.flinch - dt);
  enemy.lunge = Math.max(0, enemy.lunge - dt * 5);
  enemy.t += dt;

  if (enemy.phase !== 'approach' && pBurn() > 0) {
    const d = baseDmg() * pBurn() * dt;
    burnAcc += d; burnTick += dt;
    enemy.hp -= d;
    if (burnTick >= 1) { floatNum('-' + nf(burnAcc), 'burn', 0.5 + rand(-0.12, 0.12), 0.42); burnAcc = 0; burnTick = 0; }
    if (enemy.hp <= 0) return killEnemy();
  }

  switch (enemy.phase) {
    case 'approach': if (enemy.t >= enemy.approachDur) setPhase('idle'); break;
    case 'idle': if (enemy.t >= enemy.idle) startWindup(); break;
    case 'windup': if (enemy.t >= enemy.windupDur) enemyStrike(); break;
    case 'stun': if (enemy.t >= enemy.stun) setPhase('idle', rand(0.6, 1.2)); break;
  }
}
function setPhase(p, idle) { enemy.phase = p; enemy.t = 0; if (idle !== undefined) enemy.idle = idle; }
function startWindup() {
  enemy.kind = Math.random() < enemy.heavyChance ? 'heavy' : 'normal';
  enemy.windupDur = enemy.kind === 'heavy' ? 0.95 : (enemy.boss ? 0.55 : 0.7);
  enemy.dodged = false;
  setPhase('windup');
  sfx(enemy.kind === 'heavy' ? 'heavy' : 'windup');
}

function enemyStrike() {
  enemy.lunge = 1;
  const heavy = enemy.kind === 'heavy';
  if (enemy.dodged) {
    S.dodges++;
    floatNum('УКЛОНЕНИЕ!', 'word', 0.5, 0.55);
    sfx('dodge');
    setPhase('stun'); enemy.stun = 0.9;
    return;
  }
  let dmg = enemy.dmg * rand(0.9, 1.1) * (heavy ? 1.6 : 1);
  if (blockT > 0 && !heavy) {
    dmg *= 1 - blockReduce();
    floatNum('БЛОК', 'word', 0.5, 0.62);
    sfx('block');
    spark(LW * 0.62, LH * 0.62, '#cfd6e6', 10);
  } else {
    if (blockT > 0 && heavy) floatNum('НЕ БЛОКИРУЕТСЯ', 'hurt', 0.5, 0.56);
    shake = heavy ? 0.4 : 0.25;
    flashRed();
    sfx('hurt');
    vibrate(heavy ? 60 : 30);
    combo = 0;
  }
  if (rl('thorns')) { enemy.hp -= dmg * 0.4 * rl('thorns'); if (enemy.hp <= 0) { hp -= dmg; return killEnemy(); } }
  hp -= dmg;
  floatNum('-' + nf(dmg), 'hurt', 0.5 + rand(-0.15, 0.15), 0.78);
  setPhase('idle', rand(0.7, 1.4) * SPRITES[enemy.key].spd * (enemy.boss ? 0.8 : 1));
  if (hp <= 0) die();
  updateHud();
}

function killEnemy() {
  const g = gw();
  const { boss, elite } = enemy;
  const gold = Math.round(goldPerKill(g) * (boss ? 8 : elite ? 4 : 1) * rand(0.9, 1.15));
  const xp = Math.round(6 * Math.pow(1.16, g - 1) * (boss ? 5 : elite ? 3 : 1) * (1 + rl('feather') * 0.12));
  S.gold += gold; S.kills++;
  if (elite) S.elites++;
  addXp(xp);
  const r = enemyRect();
  floatNum('+' + nf(gold), 'gold', (r.x + r.w / 2) / LW, (r.y + r.h * 0.3) / LH);
  dissolve(r);
  coins(r.x + r.w / 2, r.y + r.h * 0.6, boss ? 18 : elite ? 10 : 5);
  heal(pMaxHp() * 0.06, false);
  hitStop = 0.07;
  sfx('kill');
  enemy = null; spawnTimer = 0.7;
  $('enemyBox').classList.add('hidden');

  if (boss) {
    S.bosses++; S.zone++; S.wave = 1;
    if (S.zone > S.maxZone) S.maxZone = S.zone;
    S.potions++;
    spawnTimer = 99;
    setTimeout(() => openChest('Сундук босса', () => {
      showBanner('ПОБЕДА!', 'Новая земля: ' + zoneName(S.zone));
      bgCanvas = drawBackground(S.zone); weather = [];
      spawnTimer = 1.5;
    }), 700);
  } else {
    S.wave++;
    if (Math.random() < 0.025) { S.potions++; floatNum('+🧪', 'heal', 0.5, 0.5); }
    if (elite) { spawnTimer = 99; setTimeout(() => openChest('Сундук элиты', () => { spawnTimer = 0.6; }), 600); }
  }
  S.bestWave = Math.max(S.bestWave, gw());
  save(); updateHud();
}

function addXp(x) {
  S.xp += x;
  while (S.xp >= xpNeed()) {
    S.xp -= xpNeed();
    S.lvl++;
    hp = pMaxHp();
    const lv = S.lvl;
    const unlocked = Object.values(SKILLS).find((s) => s.unlock === lv);
    setTimeout(() => showBanner('УРОВЕНЬ ' + lv, unlocked ? 'Новый навык: ' + unlocked.name + '!' : 'Сила и здоровье выросли'), 250);
    sfx('level');
  }
}

// =========================================================
// PLAYER ACTIONS
// =========================================================
function attack() {
  if (paused || dead || attackCd > 0) return;
  attackCd = berserkT > 0 ? 0.08 : 0.11;
  swing = 1; swingSide = -swingSide;
  sfx('swing');
  if (!enemy || enemy.phase === 'approach') return;
  const r = enemyRect();
  let dmg = pDmg() * comboMul() * rand(0.9, 1.1);
  const crit = Math.random() < pCrit();
  if (crit) dmg *= pCritMul();
  const stunned = enemy.phase === 'stun';
  if (stunned) dmg *= 1.6;
  enemy.hp -= dmg;
  enemy.flash = 0.08; enemy.flinch = 0.14;
  combo++; comboTimer = 1.6;
  S.bestCombo = Math.max(S.bestCombo, combo);
  if (pLeech() > 0) heal(dmg * pLeech(), false);
  const nx = (r.x + r.w * rand(0.3, 0.7)) / LW, ny = (r.y + r.h * rand(0.25, 0.55)) / LH;
  floatNum(nf(dmg), crit ? 'crit' : (stunned ? 'word' : ''), nx, ny);
  slashes.push({ t: 0, side: swingSide, cx: nx * LW, cy: ny * LH, r: r.w * 0.45, crit });
  spark(nx * LW, ny * LH, crit ? '#ffd84d' : '#ffffff', crit ? 12 : 5);
  blood(nx * LW, ny * LH, crit ? 8 : 3);
  if (crit) { shake = Math.max(shake, 0.12); hitStop = Math.max(hitStop, 0.04); sfx('crit'); } else sfx('hit');
  if (enemy.hp <= 0) killEnemy();
  updateHud();
}

function block() {
  if (paused || dead || blockCd > 0) return;
  blockCd = 0.6; blockT = 0.32;
  $('blockBtn').classList.add('on', 'cd');
  setTimeout(() => $('blockBtn').classList.remove('on'), 120);
  if (enemy && enemy.phase === 'windup' && enemy.kind === 'normal' && enemy.windupDur - enemy.t <= parryWin()) {
    S.parries++;
    setPhase('stun'); enemy.stun = enemy.boss ? 1.1 : 1.5;
    blockT = 0; blockCd = 0.2;
    shake = 0.18; hitStop = 0.08;
    floatNum('ПАРИРОВАНО!', 'word', 0.5, 0.55);
    spark(LW * 0.55, LH * 0.6, '#9fe8ff', 24);
    sfx('parry'); vibrate(20);
  }
}

function dodge(dir) {
  if (paused || dead || dodgeCd > 0) return;
  dodgeCd = 0.8; dodgeT = 0.3; dodgeDir = dir;
  sfx('swing');
  if (enemy && enemy.phase === 'windup' && enemy.windupDur - enemy.t <= dodgeWin()) enemy.dodged = true;
}

function useSkill(id) {
  if (paused || dead) return;
  const sk = SKILLS[id];
  if (S.lvl < sk.unlock) { floatNum('Откроется на ' + sk.unlock + ' ур.', 'word', 0.5, 0.7); return; }
  if (skillCd[id] > 0) return;
  if (id === 'fire') {
    if (!enemy || enemy.phase === 'approach') return;
    skillCd.fire = sk.cd * skillCdMul();
    const tp = torchPos();
    projectiles.push({ x: tp.x - 10, y: tp.y - 6, t: 0 });
    sfx('fire');
  } else if (id === 'rage') {
    skillCd.rage = sk.cd * skillCdMul();
    berserkT = sk.dur;
    showBanner('БЕРСЕРК', 'Урон ×2, удары быстрее');
    sfx('rage'); shake = 0.2;
  }
}
function fireballHit() {
  if (!enemy) return;
  const r = enemyRect();
  const dmg = baseDmg() * 6 * (berserkT > 0 ? 2 : 1) * rand(0.95, 1.05);
  enemy.hp -= dmg; enemy.flash = 0.15;
  floatNum(nf(dmg), 'crit', 0.5, (r.y + r.h * 0.4) / LH);
  explosion(r.x + r.w / 2, r.y + r.h * 0.5);
  shake = 0.3; hitStop = 0.06;
  sfx('boom');
  if (enemy.hp <= 0) killEnemy();
  updateHud();
}

function drinkPotion() {
  if (paused || dead) return;
  if (S.potions <= 0) { openShop(); return; }
  if (hp >= pMaxHp()) { floatNum('Здоров', 'heal', 0.5, 0.75); return; }
  S.potions--;
  heal(pMaxHp() * 0.5, true);
  sfx('potion');
  for (let i = 0; i < 20; i++) particles.push({ x: rand(0, LW), y: LH, vx: 0, vy: rand(-80, -30), g: 0, life: rand(0.5, 1), col: '#5fd068', s: 1 });
  save(); updateHud();
}
function heal(n, show) {
  const before = hp;
  hp = Math.min(pMaxHp(), hp + n);
  if (show && hp > before) floatNum('+' + nf(hp - before), 'heal', 0.5, 0.75);
}

function die() {
  dead = true; hp = 0; S.deaths++; combo = 0; berserkT = 0;
  $('deathText').textContent = `Тьма поглотила тебя: ${zoneName(S.zone)}, волна ${S.wave}.`;
  setTimeout(() => $('death').classList.remove('hidden'), 700);
  sfx('death');
  save();
}
function revive() {
  dead = false; S.wave = 1; hp = pMaxHp();
  enemy = null; spawnTimer = 0.8;
  $('death').classList.add('hidden');
  $('enemyBox').classList.add('hidden');
  save(); updateHud();
}

// ---------- Chest with relic choice ----------
function openChest(title, after) {
  paused = true;
  $('chestTitle').textContent = title;
  const ids = Object.keys(RELICS).sort(() => Math.random() - 0.5).slice(0, 3);
  const box = $('chestCards');
  box.innerHTML = '';
  ids.forEach((id, i) => {
    const R = RELICS[id];
    const b = document.createElement('button');
    b.className = 'relic';
    b.style.animationDelay = (i * 0.12) + 's';
    b.innerHTML = `<div class="r-ico">${R.ico}</div><div class="r-name">${R.name}</div><div class="r-desc">${R.desc}</div><div class="r-have">${rl(id) ? 'есть: ' + rl(id) : 'новое'}</div>`;
    b.addEventListener('click', () => {
      S.relics[id] = rl(id) + 1;
      save(); sfx('buy');
      $('chest').classList.add('hidden');
      paused = false;
      hp = Math.min(hp, pMaxHp());
      updateHud();
      showBanner(R.name, R.desc);
      after && after();
    });
    box.appendChild(b);
  });
  $('chest').classList.remove('hidden');
  sfx('chest');
}

// ---------- Rebirth ----------
const soulsFor = () => Math.max(0, Math.floor(Math.pow(S.bestWave / 10, 1.6)) - S.souls);
function rebirth() {
  const gain = soulsFor();
  if (S.maxZone < 4 || gain <= 0) return;
  if (!confirm(`Переродиться? Уровень, золото, улучшения и земли сбросятся. Ты получишь ${gain} душ (+${gain * 10}% урона и золота навсегда). Реликвии останутся.`)) return;
  S.souls += gain; S.rebirths++;
  Object.assign(S, { lvl: 1, xp: 0, gold: 0, zone: 0, wave: 1, maxZone: 0, potions: 2, up: { sword: 0, armor: 0, crit: 0, torch: 0, leech: 0 }, bestWave: 1 });
  hp = pMaxHp(); enemy = null; spawnTimer = 1;
  bgCanvas = drawBackground(0); weather = [];
  save(); closeSheets(); updateHud();
  showBanner('ПЕРЕРОЖДЕНИЕ', `Души: ${S.souls}`);
  sfx('level');
}

// =========================================================
// PARTICLES & FX
// =========================================================
function spark(x, y, col, n) { for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-60, 60), vy: rand(-80, 20), g: 120, life: rand(0.2, 0.45), col, s: 1 }); }
function blood(x, y, n) { for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-40, 40), vy: rand(-50, 10), g: 200, life: rand(0.3, 0.6), col: Math.random() < 0.5 ? '#8a1010' : '#c21d1d', s: 1 + (Math.random() < 0.3) }); }
function coins(x, y, n) { for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-50, 50), vy: rand(-110, -50), g: 260, life: rand(0.6, 0.9), col: '#ffcc4d', s: 2, coin: 1 }); }
function explosion(x, y) {
  const cols = ['#fff6c8', '#ffd24a', '#ff7a1a', '#b8261a', '#3a1a10'];
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(20, 120);
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, g: 40, life: rand(0.3, 0.9), col: pick(cols), s: Math.random() < 0.4 ? 3 : 2 });
  }
}
// enemy falls apart into its own pixels
function dissolve(r) {
  const cell = r.scale;
  const s = Math.max(1, Math.round(cell));
  for (const p of spritePixels(enemy.key, enemy.tint)) {
    const x = r.x + p.x * cell, y = r.y + p.y * (r.h / getSprite(enemy.key, enemy.tint, 'n').height);
    particles.push({ x, y, vx: rand(-25, 25) + (x - LW / 2) * 0.4, vy: rand(-50, -5), g: 60, life: rand(0.4, 1.1), col: p.col, s, delay: rand(0, 0.15) });
  }
}
function updateParticles(dt) {
  for (const p of particles) {
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  particles = particles.filter((p) => p.life > 0);
  const tp = torchPos();
  if (Math.random() < dt * 14) embers.push({ x: tp.x - 10 + rand(-3, 3), y: tp.y - 8, vx: rand(-6, 10), vy: rand(-30, -14), life: rand(0.5, 1.2) });
  for (const e of embers) { e.life -= dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vx += rand(-20, 20) * dt; }
  embers = embers.filter((e) => e.life > 0);
  for (const s of slashes) s.t += dt;
  slashes = slashes.filter((s) => s.t < 0.16);
  // projectiles
  for (const p of projectiles) {
    p.t += dt;
    if (!enemy) { p.done = true; continue; }
    const r = enemyRect();
    const tx = r.x + r.w / 2, ty = r.y + r.h * 0.5;
    const k = clamp(p.t / 0.3, 0, 1);
    p.cx = p.x + (tx - p.x) * k; p.cy = p.y + (ty - p.y) * k - Math.sin(k * Math.PI) * 30;
    if (Math.random() < 0.9) particles.push({ x: p.cx, y: p.cy, vx: rand(-10, 10), vy: rand(-10, 10), g: -20, life: rand(0.15, 0.35), col: pick(['#ffd24a', '#ff7a1a', '#b8261a']), s: 2 });
    if (k >= 1) { p.done = true; fireballHit(); }
  }
  projectiles = projectiles.filter((p) => !p.done);
  updateWeather(dt);
}

// ---------- Weather ----------
function updateWeather(dt) {
  const type = zoneOf(S.zone).weather;
  const hz = LH * 0.4;
  const want = { fireflies: 22, rain: 110, ash: 60, storm: 70 }[type];
  while (weather.length < want) weather.push(newDrop(type, true));
  for (const w of weather) {
    w.life -= dt;
    if (type === 'fireflies') {
      w.vx += rand(-20, 20) * dt; w.vy += rand(-20, 20) * dt;
      w.vx = clamp(w.vx, -8, 8); w.vy = clamp(w.vy, -8, 8);
    }
    w.x += w.vx * dt; w.y += w.vy * dt;
    if (w.life <= 0 || w.y > LH + 4 || w.y < -10 || w.x < -10 || w.x > LW + 10) Object.assign(w, newDrop(type, false));
  }
  if (type === 'rain' || type === 'storm') {
    nextLightning -= dt;
    if (nextLightning <= 0) { lightning = 1; nextLightning = rand(6, 14); setTimeout(() => sfx('thunder'), 250); }
  }
  lightning = Math.max(0, lightning - dt * 3);
  void hz;
}
function newDrop(type, anywhere) {
  const y0 = anywhere ? rand(0, LH) : -4;
  switch (type) {
    case 'fireflies': return { x: rand(0, LW), y: rand(LH * 0.38, LH * 0.85), vx: 0, vy: 0, life: rand(2, 6), ph: Math.random() * 6 };
    case 'rain': return { x: rand(-20, LW), y: y0, vx: 30, vy: rand(220, 280), life: 3 };
    case 'ash': return Math.random() < 0.3
      ? { x: rand(0, LW), y: anywhere ? rand(0, LH) : LH + 2, vx: rand(-5, 5), vy: rand(-30, -12), life: rand(2, 5), ember: 1 }
      : { x: rand(0, LW), y: y0, vx: rand(-8, 4), vy: rand(10, 25), life: 10 };
    default: return { x: rand(0, LW), y: y0, vx: rand(-15, -5), vy: rand(30, 60), life: 10 };
  }
}
function drawWeather() {
  const type = zoneOf(S.zone).weather;
  for (const w of weather) {
    const x = Math.round(w.x), y = Math.round(w.y);
    if (type === 'fireflies') {
      const a = (Math.sin(time * 3 + w.ph) + 1) / 2;
      if (a < 0.3) continue;
      ctx.fillStyle = `rgba(210,255,120,${a})`; ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = `rgba(210,255,120,${a * 0.25})`; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
    } else if (type === 'rain') {
      ctx.fillStyle = 'rgba(180,220,230,.35)'; ctx.fillRect(x, y, 1, 4);
    } else if (type === 'ash') {
      ctx.fillStyle = w.ember ? (Math.sin(time * 9 + x) > 0 ? '#ffb04a' : '#ff6a1a') : 'rgba(190,180,170,.6)';
      ctx.fillRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = Math.sin(time * 5 + x) > 0 ? 'rgba(255,60,140,.7)' : 'rgba(150,20,60,.7)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function floatNum(text, cls, nx, ny) {
  const d = document.createElement('div');
  d.className = 'num ' + (cls || '');
  d.textContent = text;
  d.style.left = (nx * 100) + '%';
  d.style.top = (ny * 100) + '%';
  $('fx').appendChild(d);
  d.addEventListener('animationend', () => d.remove());
}
let bannerTimer;
function showBanner(t, sub, ms) {
  const b = $('banner');
  b.innerHTML = '';
  b.append(t);
  if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
  b.classList.add('on');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('on'), ms || 1800);
}
function flashRed() { const f = $('flash'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on'))); }
function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } }

// =========================================================
// RENDER
// =========================================================
const torchPos = () => ({ x: LW * 0.17, y: LH - LH * 0.24 });

function render() {
  ctx.save();
  if (shake > 0) ctx.translate(Math.round(rand(-2, 2) * shake * 10), Math.round(rand(-2, 2) * shake * 10));
  if (dodgeT > 0) ctx.translate(Math.round(Math.sin((dodgeT / 0.3) * Math.PI) * 26 * dodgeDir), 0);
  ctx.drawImage(bgCanvas, 0, 0);

  const Z = zoneOf(S.zone);
  const hz = LH * 0.40;
  for (let i = 0; i < 3; i++) {
    const y = hz + 6 + i * 10, off = (time * (4 + i * 3)) % LW;
    ctx.fillStyle = Z.fog + (0.035 + i * 0.012) + ')';
    for (let x = -LW; x < LW * 2; x += 40) {
      const w = 30 + Math.sin((x + i * 50) * 0.1) * 8;
      ctx.fillRect(Math.round(x + off - LW / 2), Math.round(y + Math.sin(time + x) * 1.5), Math.round(w), 3 + i);
    }
  }

  if (enemy) drawEnemy();
  drawSlashes();

  for (const p of particles) {
    if (p.delay > 0) continue;
    ctx.globalAlpha = clamp(p.life * 3, 0, 1);
    ctx.fillStyle = p.col;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    if (p.coin) { ctx.fillStyle = '#c7871b'; ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1); }
  }
  ctx.globalAlpha = 1;
  for (const p of projectiles) if (p.cx !== undefined) {
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(Math.round(p.cx) - 3, Math.round(p.cy) - 3, 7, 7);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(Math.round(p.cx) - 2, Math.round(p.cy) - 2, 5, 5);
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(Math.round(p.cx) - 1, Math.round(p.cy) - 1, 3, 3);
  }
  drawWeather();

  // darkness + torch light
  const tp = torchPos();
  const flick = Math.sin(time * 11) * 4 + Math.sin(time * 23) * 2;
  const grad = ctx.createRadialGradient(tp.x + 20, tp.y - 20, 10, LW * 0.5, LH * 0.55, LH * 0.75 + flick);
  grad.addColorStop(0, 'rgba(255,160,60,0.12)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,10,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(-30, 0, LW + 60, LH);
  if (lightning > 0) { ctx.fillStyle = `rgba(230,220,255,${lightning * 0.55})`; ctx.fillRect(-30, 0, LW + 60, LH); }
  if (berserkT > 0) {
    const g2 = ctx.createRadialGradient(LW / 2, LH / 2, LH * 0.25, LW / 2, LH / 2, LH * 0.7);
    g2.addColorStop(0, 'rgba(255,0,0,0)'); g2.addColorStop(1, `rgba(200,0,20,${0.35 + Math.sin(time * 10) * 0.1})`);
    ctx.fillStyle = g2; ctx.fillRect(-30, 0, LW + 60, LH);
  }

  drawTorch();
  drawSword();
  ctx.restore();
}

function drawEnemy() {
  const r = enemyRect();
  const heavy = enemy.kind === 'heavy';
  let mode = 'n';
  if (enemy.flash > 0) mode = 'white';
  else if (enemy.phase === 'windup') {
    const blink = Math.floor(enemy.t * 14) % 2 === 0 || enemy.t > enemy.windupDur * 0.6;
    mode = blink ? (heavy ? 'purple' : 'red') : 'n';
  }
  const img = getSprite(enemy.key, enemy.tint, mode);
  const X = Math.round(r.x), Y = Math.round(r.y), W = Math.round(r.w), H = Math.round(r.h);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  const sw = r.w * 0.7, fy = enemy.phase === 'approach' ? r.y + r.h : LH * 0.70 + enemy.lunge * 14;
  ctx.fillRect(Math.round(LW / 2 - sw / 2), Math.round(fy - 1), Math.round(sw), 3);

  // auras
  if (enemy.boss || enemy.elite || (enemy.phase === 'windup' && heavy)) {
    const auraMode = (enemy.phase === 'windup' && heavy) ? 'auraP' : enemy.elite ? 'gold' : 'red';
    ctx.globalAlpha = 0.28 + Math.sin(time * 6) * 0.12;
    const p = 2 + Math.round(Math.sin(time * 6) + 1);
    ctx.drawImage(getSprite(enemy.key, enemy.tint, auraMode), X - p, Y - p, W + p * 2, H + p * 2);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(img, X, Y, W, H);

  // telegraph
  if (enemy.phase === 'windup') {
    const remain = enemy.windupDur - enemy.t;
    const x = Math.round(LW / 2), y = Math.round(r.y - 16);
    if (heavy) {
      const ok = remain <= dodgeWin();
      ctx.fillStyle = '#000'; ctx.fillRect(x - 8, y - 1, 17, 13);
      ctx.fillStyle = ok ? '#e7b6ff' : '#b04dff';
      // two exclamation marks
      for (const dx of [-5, 3]) { ctx.fillRect(x + dx - 1, y, 4, 7); ctx.fillRect(x + dx - 1, y + 8, 4, 3); }
      // swipe arrows hint
      if (ok) { ctx.fillStyle = '#e7b6ff'; ctx.fillRect(x - 22, y + 4, 8, 2); ctx.fillRect(x - 22, y + 2, 2, 6); ctx.fillRect(x + 15, y + 4, 8, 2); ctx.fillRect(x + 21, y + 2, 2, 6); }
    } else {
      const ok = remain <= parryWin();
      ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 1, 7, 13);
      ctx.fillStyle = ok ? '#9fe8ff' : '#ff3b2f';
      ctx.fillRect(x - 2, y, 5, 7); ctx.fillRect(x - 2, y + 8, 5, 3);
    }
  }
  if (enemy.phase === 'stun') {
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + i * 2.1;
      const sx = LW / 2 + Math.cos(a) * r.w * 0.3, sy = r.y - 4 + Math.sin(a) * 3;
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1); ctx.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3);
    }
  }
}

function drawSlashes() {
  for (const s of slashes) {
    const k = s.t / 0.16;
    const a0 = s.side > 0 ? -0.9 : Math.PI + 0.9, dir = s.side > 0 ? 1 : -1;
    const len = 1.8 * Math.min(1, k * 2.5);
    const tier = swordTier();
    for (let i = 0; i < 26; i++) {
      const f = i / 25;
      if (f > len / 1.8) break;
      const a = a0 + dir * f * 1.8;
      const rr = s.r * (0.9 + 0.1 * Math.sin(f * Math.PI));
      const x = s.cx + Math.cos(a) * rr * 0.9 - Math.cos(a0 + dir * 0.9) * rr * 0.9;
      const y = s.cy + Math.sin(a) * rr * 0.5 - Math.sin(a0 + dir * 0.9) * rr * 0.5;
      const th = Math.max(1, Math.round(Math.sin(f * Math.PI) * (s.crit ? 4 : 3)));
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.fillStyle = s.crit ? '#ffe08a' : (tier.glow ? tier.light : '#ffffff');
      ctx.fillRect(Math.round(x), Math.round(y) - (th >> 1), 2, th);
    }
    ctx.globalAlpha = 1;
  }
}

function drawTorch() {
  const { x, y } = torchPos();
  const bob = Math.sin(time * 2) * 1.5 + (blockT > 0 ? 6 : 0);
  for (let i = 0; i < 60; i++) {
    const px = x - 10 + i * 0.12, py = y + bob + i;
    ctx.fillStyle = i % 7 === 0 ? '#3a2214' : '#5a3620';
    ctx.fillRect(Math.round(px) - 3, Math.round(py), 6, 1);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(Math.round(px) - 3, Math.round(py), 1, 1);
    ctx.fillStyle = '#2a170c'; ctx.fillRect(Math.round(px) + 3, Math.round(py), 1, 1);
  }
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(Math.round(x - 14), Math.round(y + bob - 2), 9, 6);
  ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x - 17), Math.round(y + bob + 26), 15, 16);
  ctx.fillStyle = '#4b4d5c'; ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 27), 13, 14);
  ctx.fillStyle = '#6f7286'; ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 27), 13, 3);
  ctx.fillStyle = '#34353f'; ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 33), 13, 1); ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 37), 13, 1);
  const fx = Math.round(x - 10), fy = Math.round(y + bob - 4);
  const f = (time * 12) | 0;
  const big = 1 + S.up.torch * 0.03;
  const layers = [['#b8261a', 7, 13], ['#ff7a1a', 5, 10], ['#ffd24a', 3, 7], ['#fff6c8', 1, 4]];
  for (const [col, w0, h0] of layers) {
    const w = w0 * big, h = Math.round(h0 * big);
    ctx.fillStyle = col;
    for (let i = 0; i < h; i++) {
      const ww = Math.max(1, Math.round(w * (1 - i / h) + ((f + i) % 3 === 0 ? 1 : 0)));
      const sway = Math.round(Math.sin(time * 9 + i * 0.6) * (i / h) * 2);
      ctx.fillRect(fx - ww + sway, fy - i, ww * 2, 1);
    }
  }
  for (const e of embers) { ctx.fillStyle = e.life > 0.5 ? '#ffd24a' : '#ff7a1a'; ctx.fillRect(Math.round(e.x), Math.round(e.y + bob), 1, 1); }
}

function drawSword() {
  const baseX = LW * 0.80, baseY = LH - LH * 0.13;
  const s = swing;
  const p = s > 0 ? Math.sin((1 - s) * Math.PI) : 0;
  const idleA = -0.42 + Math.sin(time * 2) * 0.02;
  const a = idleA - p * 1.1;
  const tx = -p * LW * 0.28, ty = -p * LH * 0.06;
  const blocking = blockT > 0;
  const T = swordTier();
  ctx.save();
  ctx.translate(Math.round(baseX + tx - (blocking ? LW * 0.18 : 0)), Math.round(baseY + ty - (blocking ? 10 : 0)));
  ctx.rotate(blocking ? -1.35 : a);
  const L = LH * 0.36;
  if (T.glow || berserkT > 0) {
    const g = berserkT > 0 ? 'rgba(255,40,40,' : T.glow;
    ctx.fillStyle = g + (0.25 + Math.sin(time * 6) * 0.1) + ')';
    ctx.fillRect(-7, -L - 6, 14, L + 4);
    ctx.fillStyle = g + '0.15)';
    ctx.fillRect(-10, -L - 9, 20, L + 8);
  }
  ctx.fillStyle = '#000'; ctx.fillRect(-4, -L - 4, 8, L + 2);
  ctx.fillStyle = T.blade; ctx.fillRect(-3, -L, 6, L);
  ctx.fillStyle = T.light; ctx.fillRect(-3, -L, 2, L);
  ctx.fillStyle = T.dark; ctx.fillRect(2, -L, 1, L);
  ctx.fillStyle = T.light; ctx.fillRect(-1, -L - 3, 2, 3);
  ctx.fillStyle = T.dark; ctx.fillRect(-1, -L * 0.85, 1, L * 0.75);
  if (T.at >= 15) for (let i = 1; i < 6; i++) { ctx.fillStyle = (Math.floor(time * 4) + i) % 3 ? T.light : '#ffffff'; ctx.fillRect(0, -L * i / 6.5, 1, 2); }
  if (s > 0.2) { ctx.globalAlpha = s * 0.5; ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, -L, 6, L); ctx.globalAlpha = 1; }
  ctx.fillStyle = '#000'; ctx.fillRect(-12, -2, 24, 6);
  ctx.fillStyle = T.guard; ctx.fillRect(-11, -1, 22, 4);
  ctx.fillStyle = lighten(T.guard, 0.35); ctx.fillRect(-11, -1, 22, 1);
  ctx.fillStyle = '#ff3b2f'; ctx.fillRect(-1, 0, 2, 2);
  ctx.fillStyle = '#3a1f14'; ctx.fillRect(-2, 3, 4, 14);
  ctx.fillStyle = '#000'; ctx.fillRect(-9, 5, 18, 16);
  ctx.fillStyle = '#4b4d5c'; ctx.fillRect(-8, 6, 16, 14);
  ctx.fillStyle = '#6f7286'; ctx.fillRect(-8, 6, 16, 3);
  ctx.fillStyle = '#34353f'; ctx.fillRect(-8, 12, 16, 1); ctx.fillRect(-8, 16, 16, 1);
  ctx.fillStyle = T.guard; ctx.fillRect(-3, 21, 6, 4);
  ctx.restore();
}

// =========================================================
// HUD
// =========================================================
function updateHud() {
  const max = pMaxHp();
  hp = Math.min(hp, max);
  $('hpFill').style.width = (Math.max(0, hp) / max * 100) + '%';
  $('hpText').textContent = nf(Math.max(0, hp)) + '/' + nf(max);
  $('xpFill').style.width = (S.xp / xpNeed() * 100) + '%';
  $('lvl').textContent = S.lvl;
  $('gold').textContent = nf(S.gold);
  $('zoneName').textContent = zoneName(S.zone);
  $('diffBadge').textContent = diff().ico;
  $('wave').textContent = S.wave === 10 ? 'БОСС' : `Волна ${S.wave}/10`;
  $('potionCount').textContent = S.potions;
  $('potionBtn').classList.toggle('empty', S.potions <= 0);
  $('potionBtn').classList.toggle('pulse', S.potions > 0 && hp < max * 0.3);
  $('flash').classList.toggle('low', !dead && hp < max * 0.25);
  if (enemy) $('ehpFill').style.width = clamp(enemy.hp / enemy.maxHp * 100, 0, 100) + '%';
  const canBuy = UPGRADES.some((u) => S.up[u.id] < u.max && S.gold >= upCost(u));
  $('shopBtn').classList.toggle('pulse', canBuy);
  $('soulsBox').hidden = S.souls <= 0;
  $('souls').textContent = S.souls;
}
function updateSkillsHud() {
  for (const id of ['fire', 'rage']) {
    const sk = SKILLS[id], el = $(id + 'Btn');
    const locked = S.lvl < sk.unlock;
    el.classList.toggle('locked', locked);
    const cd = skillCd[id], total = sk.cd * skillCdMul();
    const pct = locked ? 100 : (cd > 0 ? (cd / total) * 100 : 0);
    el.querySelector('.cdmask').style.background = `conic-gradient(rgba(0,0,0,.72) ${pct}%, transparent 0)`;
    el.querySelector('b').textContent = locked ? sk.unlock + ' ур' : (cd > 0 ? Math.ceil(cd) + 'с' : (id === 'rage' && berserkT > 0 ? Math.ceil(berserkT) + 'с' : sk.short));
    el.classList.toggle('ready', !locked && cd <= 0);
  }
  const c = $('combo');
  if (combo >= 5) {
    c.classList.add('on');
    $('comboN').textContent = combo;
    $('comboX').textContent = '×' + comboMul().toFixed(2);
  } else c.classList.remove('on');
}

// ---------- Shop ----------
function openShop() { renderShop(); openSheet('shop'); }
function renderShop() {
  $('shopGold').textContent = nf(S.gold);
  const list = $('shopList');
  list.innerHTML = '';
  const tier = swordTier(), next = SWORD_TIERS.find((t) => t.at > S.up.sword);
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.textContent = `Клинок: ${tier.name}` + (next ? ` · ${next.name} с ${next.at} ур.` : ' · высшая закалка');
  list.appendChild(tip);
  for (const u of UPGRADES) {
    const lvl = S.up[u.id], maxed = lvl >= u.max, cost = upCost(u);
    const row = document.createElement('div');
    row.className = 'up';
    row.innerHTML = `<div class="up-ico">${u.ico}</div><div class="up-main"><div class="up-name">${u.name} <i>ур.${lvl}</i></div><div class="up-desc">${u.desc()}</div></div>`;
    const b = document.createElement('button');
    b.className = 'buy' + (maxed ? ' max' : '');
    if (maxed) { b.textContent = 'MAX'; b.disabled = true; }
    else { b.innerHTML = `<i class="coin"></i>${nf(cost)}`; b.disabled = S.gold < cost; }
    b.addEventListener('click', () => {
      if (S.gold < cost || maxed) return;
      const before = pMaxHp();
      S.gold -= cost; S.up[u.id]++;
      hp += pMaxHp() - before;
      if (u.id === 'sword' && SWORD_TIERS.some((t) => t.at === S.up.sword)) showBanner('НОВАЯ ЗАКАЛКА', swordTier().name);
      sfx('buy'); save(); updateHud(); renderShop();
    });
    row.appendChild(b);
    list.appendChild(row);
  }
  const pc = potionCost();
  const row = document.createElement('div');
  row.className = 'up';
  row.innerHTML = `<div class="up-ico">🧪</div><div class="up-main"><div class="up-name">Зелье <i>есть: ${S.potions}</i></div><div class="up-desc">Мгновенно лечит <b>50%</b> здоровья</div></div>`;
  const b = document.createElement('button');
  b.className = 'buy';
  b.innerHTML = `<i class="coin"></i>${nf(pc)}`;
  b.disabled = S.gold < pc;
  b.addEventListener('click', () => { if (S.gold < pc) return; S.gold -= pc; S.potions++; sfx('buy'); save(); updateHud(); renderShop(); });
  row.appendChild(b);
  list.appendChild(row);
}

// ---------- Difficulty ----------
function renderDiff(box) {
  box.innerHTML = '';
  for (const [id, d] of Object.entries(DIFFS)) {
    const b = document.createElement('button');
    b.className = 'diff' + ((S.diff || 'easy') === id ? ' on' : '');
    b.innerHTML = `<span>${d.ico}</span>${d.name}<small>${d.mul === 1 ? 'обычные враги' : 'враги ×' + d.mul}</small>`;
    b.addEventListener('click', () => {
      S.diff = id; save(); updateHud();
      document.querySelectorAll('.diff-box').forEach(renderDiff);
      if (!paused && enemy) floatNum(d.name, 'word', 0.5, 0.5);
    });
    box.appendChild(b);
  }
}

// ---------- Map ----------
function openMap() {
  const list = $('mapList');
  list.innerHTML = '';
  const shown = Math.max(S.maxZone + 2, 4);
  for (let zi = 0; zi < shown; zi++) {
    const Z = zoneOf(zi), locked = zi > S.maxZone;
    const b = document.createElement('button');
    b.className = 'zone' + (zi === S.zone ? ' cur' : '') + (locked ? ' locked' : '');
    b.innerHTML = `<div class="sw" style="background:linear-gradient(${Z.sky[3]},${Z.sky[1]} 60%,${Z.ground[2]} 60%)"></div><div class="zt">${zoneName(zi)}<small>${locked ? '🔒 Победи босса предыдущей земли' : (zi === S.zone ? 'Ты здесь' : 'Волны ' + (zi * 10 + 1) + '–' + (zi * 10 + 10))}</small></div>`;
    if (!locked && zi !== S.zone) b.addEventListener('click', () => travel(zi));
    list.appendChild(b);
  }
  // altar
  const alt = $('altar');
  const gain = soulsFor();
  if (S.maxZone >= 4) {
    alt.innerHTML = `<div class="alt-t">🕯 Алтарь душ</div><div class="alt-d">Переродись: начни путь заново, но с силой душ. Каждая душа — <b>+10%</b> урона и золота навсегда. Реликвии сохраняются.</div>`;
    const btn = document.createElement('button');
    btn.className = 'big';
    btn.textContent = gain > 0 ? `Переродиться (+${gain} душ)` : 'Пройди дальше, чтобы получить души';
    btn.disabled = gain <= 0;
    btn.addEventListener('click', rebirth);
    alt.appendChild(btn);
  } else {
    alt.innerHTML = `<div class="alt-t">🕯 Алтарь душ <span class="lock">🔒</span></div><div class="alt-d">Откроется после победы над Королём Без Солнца (4-й босс).</div>`;
  }
  // relics
  const rel = $('relicList');
  const owned = Object.keys(S.relics).filter((k) => S.relics[k] > 0 && RELICS[k]);
  rel.innerHTML = owned.length
    ? owned.map((k) => `<div class="rel" title="${RELICS[k].desc}"><span>${RELICS[k].ico}</span><small>${RELICS[k].name} ×${S.relics[k]}</small><em>${RELICS[k].desc}</em></div>`).join('')
    : '<div class="muted">Пока пусто. Реликвии выпадают из сундуков элитных врагов и боссов.</div>';
  $('stats').innerHTML = `Убито врагов: ${S.kills} · Элитных: ${S.elites}<br>Боссов: ${S.bosses} · Перерождений: ${S.rebirths}<br>Парирований: ${S.parries} · Уклонений: ${S.dodges}<br>Лучшее комбо: ${S.bestCombo} · Рекорд волны: ${S.bestWave}<br>Смертей: ${S.deaths}`;
  renderDiff($('mapDiff'));
  $('muteBtn').textContent = S.muted ? '🔇 Звук: выкл' : '🔊 Звук: вкл';
  openSheet('map');
}
function travel(zi) {
  S.zone = zi; S.wave = 1;
  enemy = null; spawnTimer = 0.8;
  hp = pMaxHp();
  bgCanvas = drawBackground(zi); weather = [];
  $('enemyBox').classList.add('hidden');
  save(); updateHud(); closeSheets();
  showBanner(zoneName(zi));
}

let openSheetId = null;
function openSheet(id) { closeSheets(); $(id).classList.add('on'); openSheetId = id; paused = true; }
function closeSheets() {
  document.querySelectorAll('.sheet').forEach((s) => s.classList.remove('on'));
  if (openSheetId) { openSheetId = null; if ($('hint').classList.contains('hidden') && $('chest').classList.contains('hidden')) paused = false; }
}
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheets));

// =========================================================
// AUDIO
// =========================================================
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur, type, vol, slide) {
  const a = audio(); if (!a || S.muted) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + dur);
}
function noise(dur, vol, hpf, lp) {
  const a = audio(); if (!a || S.muted) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = lp ? 'lowpass' : 'highpass'; f.frequency.value = hpf || 800;
  const g = a.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}
function sfx(n) {
  switch (n) {
    case 'swing': noise(0.06, 0.08, 2500); break;
    case 'hit': noise(0.07, 0.25, 600); tone(140, 0.08, 'square', 0.06, 0.5); break;
    case 'crit': noise(0.1, 0.3, 400); tone(220, 0.15, 'square', 0.08, 0.4); break;
    case 'block': tone(520, 0.12, 'triangle', 0.12, 0.7); noise(0.05, 0.15, 3000); break;
    case 'parry': tone(1200, 0.25, 'triangle', 0.15, 0.6); tone(1800, 0.2, 'sine', 0.08, 0.9); break;
    case 'dodge': noise(0.15, 0.12, 1500); tone(600, 0.15, 'sine', 0.06, 1.5); break;
    case 'windup': tone(90, 0.3, 'sawtooth', 0.05, 1.6); break;
    case 'heavy': tone(60, 0.6, 'sawtooth', 0.09, 2.2); tone(63, 0.6, 'square', 0.04, 2.2); break;
    case 'hurt': tone(110, 0.2, 'sawtooth', 0.12, 0.5); noise(0.12, 0.2, 300); break;
    case 'kill': tone(330, 0.08, 'square', 0.06); setTimeout(() => tone(660, 0.12, 'square', 0.06), 70); break;
    case 'level': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'square', 0.07), i * 90)); break;
    case 'buy': tone(880, 0.06, 'square', 0.06); setTimeout(() => tone(1320, 0.1, 'square', 0.06), 60); break;
    case 'potion': tone(300, 0.3, 'sine', 0.1, 2.5); break;
    case 'death': tone(220, 1.0, 'sawtooth', 0.12, 0.25); break;
    case 'fire': noise(0.3, 0.15, 500); tone(200, 0.3, 'sawtooth', 0.06, 2); break;
    case 'boom': noise(0.5, 0.4, 900, true); tone(80, 0.4, 'square', 0.12, 0.3); break;
    case 'rage': tone(110, 0.5, 'sawtooth', 0.1, 0.5); tone(165, 0.5, 'sawtooth', 0.06, 0.5); break;
    case 'boss': tone(55, 1.2, 'sawtooth', 0.1, 0.8); tone(82, 1.2, 'sawtooth', 0.06, 0.8); break;
    case 'chest': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'triangle', 0.08), i * 80)); break;
    case 'thunder': noise(1.2, 0.25, 300, true); break;
  }
}

// =========================================================
// INPUT: tap = attack, horizontal swipe = dodge
// =========================================================
const touches = {};
cv.addEventListener('pointerdown', (e) => {
  e.preventDefault(); audio();
  touches[e.pointerId] = { x: e.clientX, y: e.clientY, t: performance.now(), swiped: false };
  attack();
});
cv.addEventListener('pointermove', (e) => {
  const t = touches[e.pointerId];
  if (!t || t.swiped) return;
  const dx = e.clientX - t.x, dy = e.clientY - t.y;
  if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.3) { t.swiped = true; dodge(dx > 0 ? -1 : 1); }
});
const endTouch = (e) => { delete touches[e.pointerId]; };
cv.addEventListener('pointerup', endTouch);
cv.addEventListener('pointercancel', endTouch);
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space') attack();
  else if (e.code === 'KeyS' || e.code === 'ArrowDown') block();
  else if (e.code === 'KeyA' || e.code === 'ArrowLeft') dodge(1);
  else if (e.code === 'KeyD' || e.code === 'ArrowRight') dodge(-1);
  else if (e.code === 'Digit1') useSkill('fire');
  else if (e.code === 'Digit2') useSkill('rage');
});
$('blockBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); block(); });
$('fireBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); useSkill('fire'); });
$('rageBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); useSkill('rage'); });
$('potionBtn').addEventListener('click', drinkPotion);
$('shopBtn').addEventListener('click', openShop);
$('mapBtn').addEventListener('click', openMap);
$('muteBtn').addEventListener('click', () => { S.muted = !S.muted; save(); $('muteBtn').textContent = S.muted ? '🔇 Звук: выкл' : '🔊 Звук: вкл'; });
$('startBtn').addEventListener('click', () => { audio(); S.seenHint = true; S.seenV2 = true; save(); $('hint').classList.add('hidden'); paused = false; });
$('reviveBtn').addEventListener('click', revive);
$('deathShopBtn').addEventListener('click', () => { revive(); openShop(); });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// =========================================================
// LOOP
// =========================================================
let last = performance.now();
function loop(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  if (hitStop > 0) { hitStop -= dt; dt *= 0.1; }
  if (!paused && !dead) {
    attackCd = Math.max(0, attackCd - dt);
    blockT = Math.max(0, blockT - dt);
    dodgeT = Math.max(0, dodgeT - dt);
    dodgeCd = Math.max(0, dodgeCd - dt);
    berserkT = Math.max(0, berserkT - dt);
    for (const k in skillCd) skillCd[k] = Math.max(0, skillCd[k] - dt);
    if (blockCd > 0) { blockCd -= dt; if (blockCd <= 0) $('blockBtn').classList.remove('cd'); }
    if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo = 0; }
    updateEnemy(dt);
    if (enemy) $('ehpFill').style.width = clamp(enemy.hp / enemy.maxHp * 100, 0, 100) + '%';
    updateSkillsHud();
  }
  swing = Math.max(0, swing - dt * 7);
  shake = Math.max(0, shake - dt);
  updateParticles(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------- Init ----------
resize();
hp = pMaxHp();
$('enemyBox').classList.add('hidden');
if (S.kills > 0) $('startBtn').textContent = 'Продолжить';  // start menu shows on every launch
// gold earned while away (up to 8 hours)
if (S.lastSeen && S.kills > 0) {
  const mins = Math.min(480, (Date.now() - S.lastSeen) / 60000);
  if (mins >= 2) {
    const g = Math.round(mins * goldPerKill(Math.max(1, gw() - 3)) * 0.8);
    S.gold += g; save();
    setTimeout(() => showBanner('ПОКА ТЕБЯ НЕ БЫЛО', `+${nf(g)} золота`, 3200), 600);
  }
}
renderDiff($('hintDiff'));
updateHud();
updateSkillsHud();
requestAnimationFrame(loop);
