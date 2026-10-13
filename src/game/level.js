import { ROWS, TS } from '../core/setup.js';
import { clamp, rng } from '../core/helpers.js';
import { CHAPTERS, EN } from '../data/data.js';
import { EGGS_BEFORE } from './defaults.js';

// ================= LEVEL =================
function buildLevel(ch) {
  const r = rng(ch.seed);
  const cols = ch.cols;
  const top = new Array(cols).fill(8);
  const plats = [];
  let c = 14,
    h = 8;
  while (c < cols - 24) {
    const k = r();
    if (k < 0.2 && top[c - 1] !== 99) {
      const len = 2;
      for (let i = 0; i < len; i++) top[c + i] = 99;
      if (r() < 0.5) plats.push({
        c: c - 1,
        r: h - 3,
        len: 4
      });
      c += len;
      for (let i = 0; i < 3 && c < cols - 24; i++) top[c++] = h;
      continue;
    }
    if (k < 0.48) {
      h = clamp(h + (r() < 0.5 ? -1 : 1), 6, 8);
    }
    const len = 4 + Math.floor(r() * 6);
    for (let i = 0; i < len && c < cols - 24; i++) top[c++] = h;
    if (r() < 0.45) {
      const pl = 3 + Math.floor(r() * 2);
      plats.push({
        c: c - len + 1,
        r: h - 3 - (r() < 0.3 ? 1 : 0),
        len: pl
      });
    }
  }
  for (; c < cols; c++) top[c] = 8;
  const grid = [];
  for (let rr = 0; rr < ROWS; rr++) {
    grid.push(new Uint8Array(cols));
  }
  for (let cc = 0; cc < cols; cc++) for (let rr = 0; rr < ROWS; rr++) if (top[cc] !== 99 && rr >= top[cc]) grid[rr][cc] = 1;
  for (const p of plats) for (let i = 0; i < p.len; i++) {
    const cc = p.c + i;
    if (cc >= 0 && cc < cols && p.r >= 0 && grid[p.r][cc] === 0 && (top[cc] === 99 || p.r < top[cc] - 1)) grid[p.r][cc] = 2;
  }
  const lv = {
    cols,
    top,
    grid,
    w: cols * TS,
    seed: ch.seed
  };
  const es = [];
  let ec = 18;
  while (ec < cols - 26) {
    if (top[ec] !== 99) {
      const type = ch.enemies[Math.floor(r() * ch.enemies.length)];
      const d = EN[type];
      const y = top[ec] * TS;
      if (d.beh === 'flyer') es.push(makeEnemy(type, ec * TS + 8, y - 44 - r() * 16));else es.push(makeEnemy(type, ec * TS + 8, y));
      if (r() < 0.3 && ec > 40) {
        const t2 = ch.enemies[Math.floor(r() * ch.enemies.length)];
        if (EN[t2].beh !== 'flyer') es.push(makeEnemy(t2, ec * TS + 30, y));
      }
    }
    ec += 6 + Math.floor(r() * 5);
  }
  lv.enemies = es;
  const its = [];
  let mc = Math.floor(cols * 0.55);
  while (top[mc] === 99) mc++;
  its.push({
    type: 'egg',
    x: mc * TS + 8,
    y: top[mc] * TS - 14,
    stars: EGGS_BEFORE[CHAPTERS.indexOf(ch)] + 1
  });
  for (const p of plats) {
    if (r() < 0.35) its.push({
      type: r() < 0.5 ? 'food' : 'orb',
      x: (p.c + 1) * TS + 8,
      y: p.r * TS - 10
    });
  }
  for (let cc = 30; cc < cols - 30; cc += 28) {
    if (top[cc] !== 99 && r() < 0.6) its.push({
      type: 'orb',
      x: cc * TS + 8,
      y: top[cc] * TS - 12
    });
  }
  lv.items = its;
  return lv;
}
function makeEnemy(type, x, y) {
  const d = EN[type];
  return {
    type,
    d,
    x,
    y,
    vx: 0,
    vy: 0,
    w: d.beh === 'walker' ? 10 : d.beh === 'flyer' ? 12 : 14,
    h: d.beh === 'walker' ? 24 : 10,
    f: -1,
    hp: d.hp,
    maxhp: d.hp,
    t: Math.floor(Math.random() * 60),
    st: 0,
    state: 'idle',
    hurtT: 0,
    atkT: 0,
    cd: 30 + Math.floor(Math.random() * 60),
    flash: 0,
    onG: false,
    lastHit: 0,
    dead: false,
    hx: x,
    hy: y,
    air: false,
    downT: 0,
    bounce: 0,
    shoot: 0
  };
}
// ================= PHYSICS =================

export { buildLevel };
