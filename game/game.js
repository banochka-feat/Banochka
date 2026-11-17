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
const SAVE_KEY = 'darkpath-v1';

// ---------- Number formatting (1.2K, 3.4M ...) ----------
function nf(n) {
  n = Math.floor(n);
  if (n < 10000) return String(n);
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n.toFixed(1)) + u[i];
}

// ---------- Seeded RNG ----------
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// =========================================================
// ZONES
// =========================================================
const ZONES = [
  {
    name: 'Проклятый лес',
    sky: ['#1a0b2e', '#3b1a5c', '#6b2f7a', '#b4528a'],
    mount: ['#2a1745', '#1d1033'], ground: ['#1f3d1c', '#2b5226', '#386b2e', '#4b8238'],
    path: ['#6e5a3a', '#8a7349', '#a38c5c'], tree: '#0d1a12', castle: '#2b2140', fog: 'rgba(170,140,220,',
    enemies: ['wolf', 'skeleton', 'bat'], boss: 'wolfking', extra: 'rocks',
  },
  {
    name: 'Безмолвное кладбище',
    sky: ['#081418', '#13303a', '#24525a', '#5f8f86'],
    mount: ['#16303a', '#0e2228'], ground: ['#26302c', '#323f39', '#3f4f47', '#4f6158'],
    path: ['#4f4a44', '#655f57', '#7c756b'], tree: '#0a1214', castle: '#1c2a30', fog: 'rgba(160,220,210,',
    enemies: ['skeleton', 'ghoul', 'bat'], boss: 'lich', extra: 'graves',
  },
  {
    name: 'Пепельные руины',
    sky: ['#1a0505', '#4a0f0a', '#8f2a12', '#e0702a'],
    mount: ['#3a0f0c', '#260807'], ground: ['#2a1a14', '#3a241a', '#4a2f20', '#5c3a26'],
    path: ['#5a4434', '#735743', '#8c6a52'], tree: '#140806', castle: '#2a100c', fog: 'rgba(255,140,80,',
    enemies: ['ghoul', 'imp', 'knight'], boss: 'demon', extra: 'pillars',
  },
  {
    name: 'Цитадель Тьмы',
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
// ENEMY SPRITES (pixel maps)
// =========================================================
const SPRITES = {
  skeleton: { name: 'Скелет', hp: 1, dmg: 1, spd: 1, scale: 5, pal: { w: '#e8e2cf', s: '#a8a08a', k: '#2a2420', r: '#ff3b2f' }, map: [
    '....wwww....',
    '...wwwwww...',
    '...wrwwrw...',
    '...wwwwww...',
    '....wkkw....',
    '.....ww.....',
    '...swwwws...',
    '..w.wkkw.w..',
    '..w.wwww.w..',
    '..w.wkkw.w..',
    '.w..wwww..w.',
    '.s..wkkw..s.',
    '.....ww.....',
    '....w..w....',
    '....w..w....',
    '....s..s....',
    '....w..w....',
    '...ww..ww...',
  ] },
  wolf: { name: 'Чёрный волк', hp: 0.8, dmg: 1.1, spd: 0.8, scale: 5, pal: { k: '#1b1722', g: '#3a3348', l: '#5a5070', r: '#ffd23b', w: '#e8e2cf' }, map: [
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
  bat: { name: 'Кровавая мышь', hp: 0.6, dmg: 0.9, spd: 0.7, scale: 5, fly: 1, pal: { k: '#1e1024', p: '#4a1f4f', r: '#ff3b2f', w: '#f0e6e0' }, map: [
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
  ghoul: { name: 'Упырь', hp: 1.3, dmg: 1, spd: 1.15, scale: 5, pal: { g: '#7f9a6a', d: '#566b48', c: '#4a3a5c', k: '#1a1420', r: '#ffe14d' }, map: [
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
  imp: { name: 'Бес', hp: 0.9, dmg: 1.2, spd: 0.75, scale: 5, pal: { r: '#c2362b', d: '#7a1d17', k: '#1a0a08', y: '#ffe14d', h: '#e8d8b0' }, map: [
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
  knight: { name: 'Павший рыцарь', hp: 1.6, dmg: 1.25, spd: 1.25, scale: 5, pal: { m: '#6d6a7a', l: '#9a97a8', r: '#ff3b2f', p: '#4a1f3a', k: '#151219' }, map: [
    '.....mmmm.....',
    '....mllllm....',
    '...mmmmmmmm...',
    '...mrrrrrrm...',
    '...mmmmmmmm...',
    '....mmmmmm....',
    '..pplllllllp..',
    '.ppmmmmmmmmpp.',
    'pp.mmllllmm.pp',
    'p..mmmmmmmm..p',
    'm..mmmmmmmm..m',
    'l..kkkkkkkk..l',
    '...pppppppp...',
    '..pppppppppp..',
    '..pppp..pppp..',
    '..mmm....mmm..',
    '.mmmm....mmmm.',
  ] },
  wraith: { name: 'Призрак', hp: 1.1, dmg: 1.4, spd: 0.9, scale: 5, fly: 1, pal: { b: '#2c2a52', v: '#5a4fa0', c: '#9fe8ff', k: '#0c0a18' }, map: [
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
  lich: { base: 'skeleton', name: 'Лич Безгласный', tint: { w: '#b8f0e0', s: '#5fa898', r: '#9fe8ff', k: '#123' } },
  demon: { base: 'imp', name: 'Пепельный Владыка', tint: { r: '#7a1d17', d: '#3a0a08', y: '#ff8b3d' } },
  darklord: { base: 'knight', name: 'Король Без Солнца', tint: { m: '#2a2236', l: '#4a3a66', r: '#ff2fd0', p: '#5a0f2a' } },
};

// Cache sprite canvases: normal, white (hit flash), red (windup)
const spriteCache = {};
function getSprite(key, tint, mode) {
  const id = key + JSON.stringify(tint || {}) + mode;
  if (spriteCache[id]) return spriteCache[id];
  const s = SPRITES[key];
  const pal = Object.assign({}, s.pal, tint || {});
  const h = s.map.length, w = s.map[0].length;
  const c = document.createElement('canvas');
  c.width = w + 2; c.height = h + 2;
  const g = c.getContext('2d');
  // outline pass
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (s.map[y][x] === '.') continue;
    g.fillStyle = mode === 'white' ? '#ffffff' : '#000000';
    g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y, 1, 3);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = s.map[y][x];
    if (ch === '.') continue;
    let col = pal[ch] || '#f0f';
    if (mode === 'white') col = '#ffffff';
    if (mode === 'red') col = mixHex(col, '#ff2a1a', 0.55);
    g.fillStyle = col;
    g.fillRect(x + 1, y + 1, 1, 1);
  }
  spriteCache[id] = c;
  return c;
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

// =========================================================
// SAVE STATE
// =========================================================
const DEFAULT = {
  lvl: 1, xp: 0, gold: 0, zone: 0, wave: 1, maxZone: 0, potions: 1,
  up: { sword: 0, armor: 0, crit: 0, torch: 0, leech: 0 },
  kills: 0, bosses: 0, deaths: 0, parries: 0, bestWave: 1, muted: false, seenHint: false,
};
let S = load();
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return Object.assign({}, DEFAULT, d, { up: Object.assign({}, DEFAULT.up, d.up || {}) });
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT));
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

// =========================================================
// STATS & ECONOMY
// =========================================================
const gw = () => S.zone * 10 + S.wave;            // global wave index (1..)
const pDmg = () => (5 * Math.pow(1.3, S.up.sword) + (S.lvl - 1) * 0.6);
const pMaxHp = () => Math.round((50 + (S.lvl - 1) * 8) * Math.pow(1.22, S.up.armor));
const pCrit = () => Math.min(0.65, 0.05 + S.up.crit * 0.04);
const pCritMul = () => 2 + S.up.crit * 0.1;
const pBurn = () => S.up.torch * 0.4;              // fraction of dmg per second
const pLeech = () => S.up.leech * 0.012;
const xpNeed = () => Math.round(20 * Math.pow(1.32, S.lvl - 1));
const potionCost = () => Math.round(15 + gw() * 4 * Math.pow(1.04, gw()));

const UPGRADES = [
  { id: 'sword', ico: '⚔', name: 'Клинок', base: 12, grow: 1.4, max: 999,
    desc: () => `Урон ${nf(pDmg())} → <b>${nf(5 * Math.pow(1.3, S.up.sword + 1) + (S.lvl - 1) * 0.6)}</b>` },
  { id: 'armor', ico: '🛡', name: 'Доспех', base: 15, grow: 1.42, max: 999,
    desc: () => `Здоровье ${nf(pMaxHp())} → <b>${nf(Math.round((50 + (S.lvl - 1) * 8) * Math.pow(1.22, S.up.armor + 1)))}</b>` },
  { id: 'crit', ico: '🎯', name: 'Ярость', base: 30, grow: 1.55, max: 15,
    desc: () => `Крит ${Math.round(pCrit() * 100)}% ×${pCritMul().toFixed(1)} → <b>${Math.round(Math.min(0.65, 0.05 + (S.up.crit + 1) * 0.04) * 100)}% ×${(2 + (S.up.crit + 1) * 0.1).toFixed(1)}</b>` },
  { id: 'torch', ico: '🔥', name: 'Пламя факела', base: 50, grow: 1.6, max: 25,
    desc: () => `Жжёт врага: ${Math.round(pBurn() * 100)}% → <b>${Math.round((S.up.torch + 1) * 40)}%</b> урона в сек` },
  { id: 'leech', ico: '🩸', name: 'Кровавая жажда', base: 40, grow: 1.6, max: 20,
    desc: () => `Лечит ${(pLeech() * 100).toFixed(1)}% → <b>${((S.up.leech + 1) * 1.2).toFixed(1)}%</b> от урона` },
];
const upCost = (u) => Math.round(u.base * Math.pow(u.grow, S.up[u.id]));

// =========================================================
// RUNTIME
// =========================================================
let LW = 180, LH = 320;          // logical pixel resolution
let bgCanvas = null;
let hp = pMaxHp();
let enemy = null;
let spawnTimer = 0.6;
let swing = 0;                   // sword swing animation 0..1
let swingSide = 1;
let blockT = 0, blockCd = 0;
let attackCd = 0;
let shake = 0;
let time = 0;
let paused = true;
let dead = false;
let particles = [];
let embers = [];
let burnAcc = 0, burnTick = 0;

// ---------- Resize ----------
function resize() {
  const W = innerWidth, H = innerHeight;
  if (H >= W) { LW = 180; LH = Math.round(180 * H / W); }
  else { LH = 220; LW = Math.round(220 * W / H); }
  cv.width = LW; cv.height = LH;
  ctx.imageSmoothingEnabled = false;
  bgCanvas = drawBackground(S.zone);
}
addEventListener('resize', resize);

// =========================================================
// BACKGROUND (procedural pixel art, cached per zone)
// =========================================================
function drawBackground(zi) {
  const Z = zoneOf(zi);
  const R = rng(1000 + zi * 77);
  const c = document.createElement('canvas');
  c.width = LW; c.height = LH;
  const g = c.getContext('2d');
  const hz = Math.round(LH * 0.40);   // horizon

  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); };
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const tri = (cx, top, halfW, h, col) => {
    g.fillStyle = col;
    for (let i = 0; i < h; i++) { const w = Math.round((i / h) * halfW); g.fillRect((cx - w) | 0, (top + i) | 0, w * 2 + 1, 1); }
  };

  // sky: dithered bands
  const bands = Z.sky.length;
  for (let y = 0; y < hz + 4; y++) {
    const t = (y / (hz + 4)) * (bands - 1);
    const i = Math.min(bands - 2, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < LW; x++) {
      const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]][y & 3][x & 3] / 16;
      px(x, y, f > bayer ? Z.sky[i + 1] : Z.sky[i]);
    }
  }
  // stars
  for (let i = 0; i < LW * 0.5; i++) {
    const y = R() * hz * 0.6;
    px(R() * LW, y, R() < 0.2 ? '#ffffff' : 'rgba(255,255,255,.45)');
  }
  // moon
  const mx = LW * (0.72 + R() * 0.12), my = hz * 0.5, mr = 9;
  for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) {
    const d = x * x + y * y;
    if (d <= mr * mr) px(mx + x, my + y, d > (mr - 1.5) ** 2 ? '#d8cfe8' : (((x + 3) ** 2 + (y - 2) ** 2) < 9 ? '#bdb2d0' : '#f1ebff'));
    else if (d <= (mr + 4) ** 2 && ((x + y) & 1)) px(mx + x, my + y, 'rgba(255,240,255,.12)');
  }
  // clouds
  for (let k = 0; k < 4; k++) {
    const cy = hz * (0.25 + R() * 0.45), cx = R() * LW, len = 30 + R() * 50;
    for (let x = 0; x < len; x++) {
      const th = Math.round(1 + Math.sin(x / len * Math.PI) * 3);
      rect(cx + x - len / 2, cy - th / 2, 1, th, 'rgba(0,0,0,.18)');
    }
  }
  // mountains (2 layers)
  for (let L = 0; L < 2; L++) {
    const base = hz + 2 - L * 2, amp = L === 0 ? hz * 0.42 : hz * 0.26;
    let y = base - amp * 0.5;
    const col = Z.mount[L];
    for (let x = 0; x < LW; x++) {
      y += (R() - 0.5) * (L === 0 ? 4 : 3);
      y = clamp(y, base - amp, base - 4);
      if (x % 37 === 0) y -= R() * 10;
      rect(x, y, 1, LH, col);
    }
  }
  // hill + castle
  const cx = LW / 2;
  for (let x = -LW * 0.35; x < LW * 0.35; x++) {
    const hh = Math.cos((x / (LW * 0.35)) * Math.PI / 2) * hz * 0.12;
    rect(cx + x, hz - hh, 1, hh + 2, Z.ground[0]);
  }
  const ch = hz * 0.12;
  const cBase = hz - ch + 2;
  const castle = Z.castle;
  const towers = [[-18, 18, 5], [-9, 30, 6], [0, 40, 7], [9, 30, 6], [18, 18, 5]];
  rect(cx - 20, cBase - 14, 40, 14, castle);
  for (const [ox, h, w] of towers) {
    rect(cx + ox - w / 2, cBase - h, w, h, castle);
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
    for (let x = 0; x < LW; x++) {
      const n = R();
      if (n < 0.25 + depth * 0.2) px(x, y, Z.ground[Math.min(3, 1 + Math.floor(R() * (1 + depth * 2.5)))]);
    }
  }
  // grass tufts near camera
  for (let i = 0; i < LW * 1.4; i++) {
    const y = hz + 10 + R() * (LH - hz);
    const x = R() * LW;
    const s = 1 + Math.floor(((y - hz) / (LH - hz)) * 4);
    for (let k = 0; k < s; k++) px(x + (k % 2 ? 1 : -1) * (k >> 1), y - k, Z.ground[3]);
  }

  // path (winding to the castle)
  const pathX = (y) => {
    const t = (y - hz) / (LH - hz);
    return cx + Math.sin(t * 5.2 + 0.6) * (LW * 0.08) * (1 - t * 0.6) + (t * t) * LW * 0.04;
  };
  for (let y = cBase; y < LH; y++) {
    const t = Math.max(0, (y - hz) / (LH - hz));
    const w = 1.5 + t * t * LW * 0.42 + t * LW * 0.06;
    const xc = pathX(y);
    for (let x = Math.floor(xc - w); x <= xc + w; x++) {
      const edge = Math.abs(x - xc) > w - 1.5;
      if (edge && R() < 0.5) continue;
      px(x, y, Z.path[1]);
    }
    // cobbles
    if (t > 0.08) {
      const rowH = Math.max(2, Math.round(2 + t * 7));
      if ((y - hz) % rowH === 0) {
        for (let x = Math.floor(xc - w); x <= xc + w; x++) if (R() < 0.85) px(x, y, Z.path[0]);
      } else {
        const sw = Math.max(3, Math.round(3 + t * 12));
        for (let x = Math.floor(xc - w); x <= xc + w; x++) {
          if (((x + ((Math.floor((y - hz) / rowH) % 2) * sw / 2)) | 0) % sw === 0) px(x, y, Z.path[0]);
          else if (R() < 0.06) px(x, y, Z.path[2]);
        }
      }
    }
  }

  // zone extras
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
      rect(x - 0.5 * s, y - 5 * s, 1 * s, 3 * s, '#3a3e44'); rect(x - 1.5 * s, y - 4 * s, 3 * s, 1 * s, '#3a3e44');
    } else if (Z.extra === 'pillars') {
      const h = (6 + R() * 8) * s;
      rect(x - 2 * s, y - h, 4 * s, h, '#5a4038'); rect(x - 3 * s, y - h, 6 * s, 1.5 * s, '#6e5046');
      rect(x + s, y - h * 0.6, 1 * s, h * 0.5, '#3f2b25');
    } else {
      tri(x, y - 8 * s, 1.5 * s, 8 * s, '#2a1f33'); px(x, y - 8 * s, '#ff2fd0');
    }
  }

  // trees: far small + near big silhouettes on the edges
  for (let i = 0; i < 16; i++) {
    const x = R() * LW; if (Math.abs(x - cx) < 30) continue;
    const h = 10 + R() * 10;
    pine(g, x, hz + 2, h, Z.mount[1], tri);
  }
  const near = [[-6, 0.95], [16, 0.75], [LW - 14, 0.8], [LW + 6, 1.0], [32, 0.55], [LW - 34, 0.5]];
  for (const [x, k] of near) pine(g, x, LH * (0.55 + k * 0.25), LH * 0.75 * k, Z.tree, tri, true);

  return c;
}
function pine(g, x, baseY, h, col, tri, trunk) {
  if (trunk) { g.fillStyle = col; g.fillRect(x - h * 0.03, baseY - h * 0.3, h * 0.06, h * 0.3 + 40); }
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const top = baseY - h + i * h * 0.18;
    tri(x, top, h * (0.12 + i * 0.07), h * 0.32, col);
  }
}

// =========================================================
// ENEMIES
// =========================================================
function spawnEnemy() {
  const Z = zoneOf(S.zone);
  const isBoss = S.wave === 10;
  let key, tint = null, name;
  if (isBoss) {
    const b = BOSSES[Z.boss]; key = b.base; tint = b.tint; name = b.name;
  } else {
    key = Z.enemies[Math.floor(Math.random() * Z.enemies.length)];
    name = SPRITES[key].name;
  }
  const sp = SPRITES[key];
  const g = gw();
  const maxHp = 18 * Math.pow(1.21, g - 1) * sp.hp * (isBoss ? 6 : 1);
  enemy = {
    key, tint, name, boss: isBoss,
    hp: maxHp, maxHp,
    dmg: 4 * Math.pow(1.15, g - 1) * sp.dmg * (isBoss ? 1.5 : 1),
    phase: 'approach', t: 0, approachDur: 0.9,
    idle: rand(1.2, 2.0) * sp.spd + 0.6,
    windupDur: isBoss ? 0.62 : 0.78,
    flash: 0, stun: 0, dieT: 0, wobble: Math.random() * 6,
    scale: sp.scale * (isBoss ? 1.45 : 1),
  };
  $('enemyName').textContent = (isBoss ? '☠ ' : '') + name;
  $('enemyName').classList.toggle('boss', isBoss);
  $('enemyBox').classList.remove('hidden');
  updateHud();
  if (isBoss) showBanner('БОСС', name);
}

function enemyRect() {
  // returns logical draw rect for the enemy
  const sp = SPRITES[enemy.key];
  const img = getSprite(enemy.key, enemy.tint, 'n');
  const hz = LH * 0.40;
  let k = 1, yOff = 0;
  if (enemy.phase === 'approach') k = 0.18 + 0.82 * easeOut(enemy.t / enemy.approachDur);
  const scale = enemy.scale * k * (LW / 180);
  const w = img.width * scale, h = img.height * scale;
  const footY = hz + (LH * 0.70 - hz) * (enemy.phase === 'approach' ? easeOut(enemy.t / enemy.approachDur) : 1);
  if (sp.fly) yOff = -LH * 0.08 + Math.sin(time * 4 + enemy.wobble) * 4;
  else yOff = Math.sin(time * 2.4 + enemy.wobble) * 1.2;
  if (enemy.phase === 'windup') {
    const p = enemy.t / enemy.windupDur;
    yOff -= p * 6; // rear up
  }
  if (enemy.flinch > 0) yOff += 4 * (enemy.flinch / 0.14);
  return { x: LW / 2 - w / 2, y: footY - h + yOff, w, h };
}
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

function updateEnemy(dt) {
  if (!enemy) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) spawnEnemy();
    return;
  }
  enemy.flash = Math.max(0, enemy.flash - dt);
  enemy.flinch = Math.max(0, (enemy.flinch || 0) - dt);
  enemy.t += dt;

  if (enemy.phase === 'dying') {
    if (enemy.t > 0.5) { enemy = null; spawnTimer = 0.55; }
    return;
  }

  // torch burn
  if (enemy.phase !== 'approach' && pBurn() > 0) {
    const d = pDmg() * pBurn() * dt;
    burnAcc += d; burnTick += dt;
    enemy.hp -= d;
    if (burnTick >= 1) { floatNum('-' + nf(burnAcc), 'burn', 0.5 + rand(-0.12, 0.12), 0.42); burnAcc = 0; burnTick = 0; }
    if (enemy.hp <= 0) return killEnemy();
  }

  switch (enemy.phase) {
    case 'approach':
      if (enemy.t >= enemy.approachDur) setPhase('idle');
      break;
    case 'idle':
      if (enemy.t >= enemy.idle) setPhase('windup');
      break;
    case 'windup':
      if (enemy.t >= enemy.windupDur) enemyStrike();
      break;
    case 'stun':
      if (enemy.t >= enemy.stun) setPhase('idle', rand(0.6, 1.2));
      break;
  }
}
function setPhase(p, idle) {
  enemy.phase = p; enemy.t = 0;
  if (idle !== undefined) enemy.idle = idle;
  if (p === 'windup') sfx('windup');
}

function enemyStrike() {
  let dmg = enemy.dmg * rand(0.9, 1.1);
  if (blockT > 0) {
    dmg *= 0.25;
    floatNum('БЛОК', 'word', 0.5, 0.62);
    sfx('block');
    spark(LW * 0.62, LH * 0.62, '#cfd6e6', 8);
  } else {
    shake = 0.25;
    flashRed();
    sfx('hurt');
    vibrate(30);
  }
  hp -= dmg;
  floatNum('-' + nf(dmg), 'hurt', 0.5 + rand(-0.15, 0.15), 0.78);
  enemy.phase = 'idle'; enemy.t = 0; enemy.idle = rand(1.0, 1.9) * SPRITES[enemy.key].spd;
  if (hp <= 0) die();
  updateHud();
}

function killEnemy() {
  const g = gw();
  const boss = enemy.boss;
  const gold = Math.round(4 * Math.pow(1.19, g - 1) * (boss ? 8 : 1) * rand(0.9, 1.15));
  const xp = Math.round(6 * Math.pow(1.16, g - 1) * (boss ? 5 : 1));
  S.gold += gold; S.kills++;
  addXp(xp);
  const r = enemyRect();
  floatNum('+' + nf(gold), 'gold', (r.x + r.w / 2) / LW, (r.y + r.h * 0.3) / LH);
  burst(r.x + r.w / 2, r.y + r.h / 2, boss ? 60 : 26);
  coins(r.x + r.w / 2, r.y + r.h * 0.6, boss ? 18 : 6);
  heal(pMaxHp() * 0.15, false);
  sfx('kill');
  enemy.phase = 'dying'; enemy.t = 0;
  $('enemyBox').classList.add('hidden');

  if (boss) {
    S.bosses++;
    S.zone++;
    S.wave = 1;
    if (S.zone > S.maxZone) S.maxZone = S.zone;
    if (Math.random() < 1) S.potions++;
    setTimeout(() => {
      showBanner('ПОБЕДА!', 'Новая земля: ' + zoneName(S.zone));
      bgCanvas = drawBackground(S.zone);
    }, 500);
    spawnTimer = 2.2;
  } else {
    S.wave++;
    if (Math.random() < 0.06) { S.potions++; floatNum('+🧪', 'heal', 0.5, 0.5); }
  }
  S.bestWave = Math.max(S.bestWave, gw());
  save();
  updateHud();
}

function addXp(x) {
  S.xp += x;
  while (S.xp >= xpNeed()) {
    S.xp -= xpNeed();
    S.lvl++;
    hp = pMaxHp();
    setTimeout(() => showBanner('УРОВЕНЬ ' + S.lvl, 'Сила и здоровье выросли'), 250);
    sfx('level');
  }
}

// =========================================================
// PLAYER ACTIONS
// =========================================================
function attack(sx, sy) {
  if (paused || dead || attackCd > 0) return;
  attackCd = 0.11;
  swing = 1; swingSide = -swingSide;
  sfx('swing');
  if (!enemy || enemy.phase === 'dying' || enemy.phase === 'approach') return;

  const r = enemyRect();
  let dmg = pDmg() * rand(0.9, 1.1);
  let crit = Math.random() < pCrit();
  if (crit) dmg *= pCritMul();
  const stunned = enemy.phase === 'stun';
  if (stunned) dmg *= 1.6;
  enemy.hp -= dmg;
  enemy.flash = 0.08;
  if (pLeech() > 0) heal(dmg * pLeech(), false);
  const nx = (r.x + r.w * rand(0.3, 0.7)) / LW, ny = (r.y + r.h * rand(0.25, 0.55)) / LH;
  floatNum((crit ? '' : '') + nf(dmg), crit ? 'crit' : (stunned ? 'word' : ''), nx, ny);
  spark(nx * LW, ny * LH, crit ? '#ffd84d' : '#ffffff', crit ? 12 : 5);
  blood(nx * LW, ny * LH, crit ? 8 : 3);
  if (crit) { shake = Math.max(shake, 0.12); sfx('crit'); } else sfx('hit');
  enemy.flinch = 0.14;
  if (enemy.hp <= 0) killEnemy();
  updateHud();
}

function block() {
  if (paused || dead || blockCd > 0) return;
  blockCd = 0.6;
  blockT = 0.32;
  $('blockBtn').classList.add('on', 'cd');
  setTimeout(() => $('blockBtn').classList.remove('on'), 120);
  if (enemy && enemy.phase === 'windup' && enemy.windupDur - enemy.t <= 0.42) {
    // PARRY
    S.parries++;
    enemy.phase = 'stun'; enemy.t = 0; enemy.stun = enemy.boss ? 1.1 : 1.5;
    blockT = 0; blockCd = 0.2;
    shake = 0.18;
    floatNum('ПАРИРОВАНО!', 'word', 0.5, 0.55);
    spark(LW * 0.55, LH * 0.6, '#9fe8ff', 22);
    sfx('parry');
    vibrate(20);
  }
}

function drinkPotion() {
  if (paused || dead) return;
  if (S.potions <= 0) { openShop(); return; }
  if (hp >= pMaxHp()) { floatNum('Здоров', 'heal', 0.5, 0.75); return; }
  S.potions--;
  heal(pMaxHp() * 0.5, true);
  sfx('potion');
  save(); updateHud();
}

function heal(n, show) {
  const before = hp;
  hp = Math.min(pMaxHp(), hp + n);
  if (show && hp > before) floatNum('+' + nf(hp - before), 'heal', 0.5, 0.75);
}

function die() {
  dead = true; hp = 0; S.deaths++;
  $('deathText').textContent = `Тьма поглотила тебя: ${zoneName(S.zone)}, волна ${S.wave}.`;
  setTimeout(() => $('death').classList.remove('hidden'), 700);
  sfx('death');
  save();
}
function revive() {
  dead = false;
  S.wave = 1;
  hp = pMaxHp();
  enemy = null; spawnTimer = 0.8;
  $('death').classList.add('hidden');
  $('enemyBox').classList.add('hidden');
  save(); updateHud();
}

// =========================================================
// PARTICLES & FX
// =========================================================
function spark(x, y, col, n) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-60, 60), vy: rand(-80, 20), g: 120, life: rand(0.2, 0.45), col, s: 1 });
}
function blood(x, y, n) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-40, 40), vy: rand(-50, 10), g: 200, life: rand(0.3, 0.6), col: Math.random() < 0.5 ? '#8a1010' : '#c21d1d', s: 1 + (Math.random() < 0.3) });
}
function burst(x, y, n) {
  const cols = ['#2a1f3d', '#4a3870', '#000000', '#7a5cc8'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(20, 90);
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, g: 30, life: rand(0.4, 0.9), col: cols[i % 4], s: 2 });
  }
}
function coins(x, y, n) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-50, 50), vy: rand(-110, -50), g: 260, life: rand(0.6, 0.9), col: '#ffcc4d', s: 2, coin: 1 });
}
function updateParticles(dt) {
  for (const p of particles) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  particles = particles.filter((p) => p.life > 0);
  // torch embers
  if (Math.random() < dt * 14) embers.push({ x: torchPos().x + rand(-3, 3), y: torchPos().y - 6, vx: rand(-6, 10), vy: rand(-30, -14), life: rand(0.5, 1.2) });
  for (const e of embers) { e.life -= dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vx += rand(-20, 20) * dt; }
  embers = embers.filter((e) => e.life > 0);
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
function showBanner(t, sub) {
  const b = $('banner');
  b.innerHTML = '';
  b.append(t);
  if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
  b.classList.add('on');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('on'), 1800);
}
function flashRed() {
  const f = $('flash');
  f.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
}
function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } }

// =========================================================
// RENDER
// =========================================================
const torchPos = () => ({ x: LW * 0.17, y: LH - LH * 0.24 });

function render() {
  ctx.save();
  if (shake > 0) ctx.translate(Math.round(rand(-2, 2) * shake * 10), Math.round(rand(-2, 2) * shake * 10));
  ctx.drawImage(bgCanvas, 0, 0);

  // drifting fog
  const Z = zoneOf(S.zone);
  const hz = LH * 0.40;
  for (let i = 0; i < 3; i++) {
    const y = hz + 6 + i * 10;
    const off = (time * (4 + i * 3)) % LW;
    ctx.fillStyle = Z.fog + (0.035 + i * 0.012) + ')';
    for (let x = -LW; x < LW * 2; x += 40) {
      const w = 30 + Math.sin((x + i * 50) * 0.1) * 8;
      ctx.fillRect(Math.round(x + off - LW / 2), Math.round(y + Math.sin(time + x) * 1.5), Math.round(w), 3 + i);
    }
  }

  // enemy
  if (enemy) drawEnemy();

  // particles
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life * 3, 0, 1);
    ctx.fillStyle = p.col;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    if (p.coin) { ctx.fillStyle = '#c7871b'; ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1); }
  }
  ctx.globalAlpha = 1;

  // darkness + torch light
  const tp = torchPos();
  const flick = Math.sin(time * 11) * 4 + Math.sin(time * 23) * 2;
  const grad = ctx.createRadialGradient(tp.x + 20, tp.y - 20, 10, LW * 0.5, LH * 0.55, LH * 0.75 + flick);
  grad.addColorStop(0, 'rgba(255,160,60,0.10)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,10,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LW, LH);

  drawTorch();
  drawSword();
  ctx.restore();
}

function drawEnemy() {
  const r = enemyRect();
  let mode = 'n';
  if (enemy.flash > 0) mode = 'white';
  else if (enemy.phase === 'windup') mode = (Math.floor(enemy.t * 14) % 2 === 0 || enemy.t > enemy.windupDur * 0.6) ? 'red' : 'n';
  const img = getSprite(enemy.key, enemy.tint, mode);

  // shadow
  if (enemy.phase !== 'dying') {
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    const sw = r.w * 0.7, foot = LH * 0.70;
    const fy = enemy.phase === 'approach' ? r.y + r.h : foot;
    ctx.fillRect(Math.round(LW / 2 - sw / 2), Math.round(fy - 1), Math.round(sw), 3);
  }
  // boss aura
  if (enemy.boss && enemy.phase !== 'dying') {
    ctx.globalAlpha = 0.25 + Math.sin(time * 5) * 0.1;
    ctx.drawImage(getSprite(enemy.key, enemy.tint, 'red'), Math.round(r.x - 3), Math.round(r.y - 3), Math.round(r.w + 6), Math.round(r.h + 6));
    ctx.globalAlpha = 1;
  }
  if (enemy.phase === 'dying') {
    ctx.globalAlpha = clamp(1 - enemy.t / 0.5, 0, 1);
    ctx.drawImage(img, Math.round(r.x), Math.round(r.y + enemy.t * 30), Math.round(r.w), Math.round(r.h * (1 - enemy.t)));
    ctx.globalAlpha = 1;
    return;
  }
  ctx.drawImage(img, Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));

  // windup "!" telegraph
  if (enemy.phase === 'windup') {
    const perfect = enemy.windupDur - enemy.t <= 0.42;
    const x = Math.round(LW / 2), y = Math.round(r.y - 14);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 1, 7, 13);
    ctx.fillStyle = perfect ? '#9fe8ff' : '#ff3b2f';
    ctx.fillRect(x - 2, y, 5, 7); ctx.fillRect(x - 2, y + 8, 5, 3);
  }
  // stun stars
  if (enemy.phase === 'stun') {
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + i * 2.1;
      const sx = LW / 2 + Math.cos(a) * r.w * 0.3, sy = r.y - 4 + Math.sin(a) * 3;
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1); ctx.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3);
    }
  }
}

function drawTorch() {
  const { x, y } = torchPos();
  const bob = Math.sin(time * 2) * 1.5 + (blockT > 0 ? 6 : 0);
  // stick
  for (let i = 0; i < 60; i++) {
    const px = x - 10 + i * 0.12, py = y + bob + i * 1.0;
    ctx.fillStyle = i % 7 === 0 ? '#3a2214' : '#5a3620';
    ctx.fillRect(Math.round(px) - 3, Math.round(py), 6, 1);
    ctx.fillStyle = '#2a170c'; ctx.fillRect(Math.round(px) + 3, Math.round(py), 1, 1);
  }
  // wrap
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(Math.round(x - 14), Math.round(y + bob - 2), 9, 6);
  // gauntlet
  ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x - 17), Math.round(y + bob + 26), 15, 16);
  ctx.fillStyle = '#4b4d5c'; ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 27), 13, 14);
  ctx.fillStyle = '#6f7286'; ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 27), 13, 3);
  ctx.fillStyle = '#34353f'; ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 33), 13, 1); ctx.fillRect(Math.round(x - 16), Math.round(y + bob + 37), 13, 1);
  // flame
  const fx = Math.round(x - 10), fy = Math.round(y + bob - 4);
  const f = (time * 12) | 0;
  const layers = [['#b8261a', 7, 13], ['#ff7a1a', 5, 10], ['#ffd24a', 3, 7], ['#fff6c8', 1, 4]];
  for (const [col, w, h] of layers) {
    ctx.fillStyle = col;
    for (let i = 0; i < h; i++) {
      const ww = Math.max(1, Math.round(w * (1 - i / h) + ((f + i) % 3 === 0 ? 1 : 0)));
      const sway = Math.round(Math.sin(time * 9 + i * 0.6) * (i / h) * 2);
      ctx.fillRect(fx - ww + sway, fy - i, ww * 2, 1);
    }
  }
  for (const e of embers) {
    ctx.fillStyle = e.life > 0.5 ? '#ffd24a' : '#ff7a1a';
    ctx.fillRect(Math.round(e.x), Math.round(e.y + bob), 1, 1);
  }
}

function drawSword() {
  const baseX = LW * 0.80, baseY = LH - LH * 0.13;
  const s = swing;
  // swing: rotate from idle to across the screen
  const p = s > 0 ? Math.sin((1 - s) * Math.PI) : 0;
  const idleA = -0.42 + Math.sin(time * 2) * 0.02;
  const a = idleA - p * 1.1;
  const tx = -p * LW * 0.28, ty = -p * LH * 0.06;
  const blockShift = blockT > 0 ? 1 : 0;

  ctx.save();
  ctx.translate(Math.round(baseX + tx - blockShift * LW * 0.18), Math.round(baseY + ty - blockShift * 10));
  ctx.rotate(blockShift ? -1.35 : a);
  const L = LH * 0.36;
  // blade
  ctx.fillStyle = '#000'; ctx.fillRect(-4, -L - 4, 8, L + 2);
  ctx.fillStyle = '#9aa0b4'; ctx.fillRect(-3, -L, 6, L);
  ctx.fillStyle = '#d8dcea'; ctx.fillRect(-3, -L, 2, L);
  ctx.fillStyle = '#6a6f82'; ctx.fillRect(2, -L, 1, L);
  ctx.fillStyle = '#c4c9da'; ctx.fillRect(-1, -L - 3, 2, 3);
  ctx.fillStyle = '#7b7f92'; ctx.fillRect(-1, -L * 0.85, 1, L * 0.75);
  if (s > 0.2) { ctx.globalAlpha = s * 0.5; ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, -L, 6, L); ctx.globalAlpha = 1; }
  // crossguard
  ctx.fillStyle = '#000'; ctx.fillRect(-12, -2, 24, 6);
  ctx.fillStyle = '#b08a3a'; ctx.fillRect(-11, -1, 22, 4);
  ctx.fillStyle = '#e0c060'; ctx.fillRect(-11, -1, 22, 1);
  // grip + gauntlet
  ctx.fillStyle = '#3a1f14'; ctx.fillRect(-2, 3, 4, 14);
  ctx.fillStyle = '#000'; ctx.fillRect(-9, 5, 18, 16);
  ctx.fillStyle = '#4b4d5c'; ctx.fillRect(-8, 6, 16, 14);
  ctx.fillStyle = '#6f7286'; ctx.fillRect(-8, 6, 16, 3);
  ctx.fillStyle = '#34353f'; ctx.fillRect(-8, 12, 16, 1); ctx.fillRect(-8, 16, 16, 1);
  // pommel
  ctx.fillStyle = '#b08a3a'; ctx.fillRect(-3, 21, 6, 4);
  ctx.restore();
}

// =========================================================
// HUD
// =========================================================
function updateHud() {
  const max = pMaxHp();
  hp = Math.min(hp, max);
  $('hpFill').style.width = (hp / max * 100) + '%';
  $('hpText').textContent = nf(Math.max(0, hp)) + '/' + nf(max);
  $('xpFill').style.width = (S.xp / xpNeed() * 100) + '%';
  $('lvl').textContent = S.lvl;
  $('gold').textContent = nf(S.gold);
  $('zoneName').textContent = zoneName(S.zone);
  $('wave').textContent = S.wave === 10 ? 'БОСС' : `Волна ${S.wave}/10`;
  $('potionCount').textContent = S.potions;
  $('potionBtn').classList.toggle('empty', S.potions <= 0);
  $('potionBtn').classList.toggle('pulse', S.potions > 0 && hp < max * 0.3);
  if (enemy) $('ehpFill').style.width = clamp(enemy.hp / enemy.maxHp * 100, 0, 100) + '%';
  const canBuy = UPGRADES.some((u) => S.up[u.id] < u.max && S.gold >= upCost(u));
  $('shopBtn').classList.toggle('pulse', canBuy);
}

// ---------- Shop ----------
function openShop() { renderShop(); openSheet('shop'); }
function renderShop() {
  $('shopGold').textContent = nf(S.gold);
  const list = $('shopList');
  list.innerHTML = '';
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
      S.gold -= cost; S.up[u.id]++;
      if (u.id === 'armor') hp += pMaxHp() - Math.round((50 + (S.lvl - 1) * 8) * Math.pow(1.22, S.up.armor - 1));
      sfx('buy'); save(); updateHud(); renderShop();
    });
    row.appendChild(b);
    list.appendChild(row);
  }
  // potion
  const pc = potionCost();
  const row = document.createElement('div');
  row.className = 'up';
  row.innerHTML = `<div class="up-ico">🧪</div><div class="up-main"><div class="up-name">Зелье <i>есть: ${S.potions}</i></div><div class="up-desc">Мгновенно лечит <b>50%</b> здоровья</div></div>`;
  const b = document.createElement('button');
  b.className = 'buy';
  b.innerHTML = `<i class="coin"></i>${nf(pc)}`;
  b.disabled = S.gold < pc;
  b.addEventListener('click', () => {
    if (S.gold < pc) return;
    S.gold -= pc; S.potions++;
    sfx('buy'); save(); updateHud(); renderShop();
  });
  row.appendChild(b);
  list.appendChild(row);
}

// ---------- Map ----------
function openMap() {
  const list = $('mapList');
  list.innerHTML = '';
  const shown = Math.max(S.maxZone + 2, 4);
  for (let zi = 0; zi < shown; zi++) {
    const Z = zoneOf(zi);
    const locked = zi > S.maxZone;
    const b = document.createElement('button');
    b.className = 'zone' + (zi === S.zone ? ' cur' : '') + (locked ? ' locked' : '');
    b.innerHTML = `<div class="sw" style="background:linear-gradient(${Z.sky[3]},${Z.sky[1]} 60%,${Z.ground[2]} 60%)"></div><div class="zt">${zoneName(zi)}<small>${locked ? '🔒 Победи босса предыдущей земли' : (zi === S.zone ? 'Ты здесь' : 'Волны ' + (zi * 10 + 1) + '–' + (zi * 10 + 10))}</small></div>`;
    if (!locked && zi !== S.zone) b.addEventListener('click', () => travel(zi));
    list.appendChild(b);
  }
  $('stats').innerHTML = `Убито врагов: ${S.kills}<br>Боссов повержено: ${S.bosses}<br>Парирований: ${S.parries}<br>Смертей: ${S.deaths}<br>Рекорд: волна ${S.bestWave}`;
  $('muteBtn').textContent = S.muted ? '🔇 Звук: выкл' : '🔊 Звук: вкл';
  openSheet('map');
}
function travel(zi) {
  S.zone = zi; S.wave = 1;
  enemy = null; spawnTimer = 0.8;
  hp = pMaxHp();
  bgCanvas = drawBackground(zi);
  $('enemyBox').classList.add('hidden');
  save(); updateHud(); closeSheets();
  showBanner(zoneName(zi));
}

let openSheetId = null;
function openSheet(id) { closeSheets(); $(id).classList.add('on'); openSheetId = id; paused = true; }
function closeSheets() {
  document.querySelectorAll('.sheet').forEach((s) => s.classList.remove('on'));
  if (openSheetId) { openSheetId = null; if ($('hint').classList.contains('hidden')) paused = false; }
}
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheets));

// =========================================================
// AUDIO (tiny synth)
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
function noise(dur, vol, hp) {
  const a = audio(); if (!a || S.muted) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
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
    case 'windup': tone(90, 0.3, 'sawtooth', 0.05, 1.6); break;
    case 'hurt': tone(110, 0.2, 'sawtooth', 0.12, 0.5); noise(0.12, 0.2, 300); break;
    case 'kill': tone(330, 0.08, 'square', 0.06); setTimeout(() => tone(660, 0.12, 'square', 0.06), 70); break;
    case 'level': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'square', 0.07), i * 90)); break;
    case 'buy': tone(880, 0.06, 'square', 0.06); setTimeout(() => tone(1320, 0.1, 'square', 0.06), 60); break;
    case 'potion': tone(300, 0.3, 'sine', 0.1, 2.5); break;
    case 'death': tone(220, 1.0, 'sawtooth', 0.12, 0.25); break;
  }
}

// =========================================================
// INPUT
// =========================================================
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); attack(e.clientX, e.clientY); });
$('fx').style.pointerEvents = 'none';
$('blockBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); block(); });
$('potionBtn').addEventListener('click', drinkPotion);
$('shopBtn').addEventListener('click', openShop);
$('mapBtn').addEventListener('click', openMap);
$('muteBtn').addEventListener('click', () => { S.muted = !S.muted; save(); $('muteBtn').textContent = S.muted ? '🔇 Звук: выкл' : '🔊 Звук: вкл'; });
$('startBtn').addEventListener('click', () => { audio(); S.seenHint = true; save(); $('hint').classList.add('hidden'); paused = false; });
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
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  if (!paused && !dead) {
    attackCd = Math.max(0, attackCd - dt);
    blockT = Math.max(0, blockT - dt);
    if (blockCd > 0) { blockCd -= dt; if (blockCd <= 0) $('blockBtn').classList.remove('cd'); }
    updateEnemy(dt);
    if (enemy) $('ehpFill').style.width = clamp(enemy.hp / enemy.maxHp * 100, 0, 100) + '%';
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
if (S.seenHint) { $('hint').classList.add('hidden'); paused = false; }
updateHud();
requestAnimationFrame(loop);
