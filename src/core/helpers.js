import { game } from '../state.js';
import { FONT, S, dc } from './setup.js';

// ================= HELPERS =================
const clamp = (v, a, b) => v < a ? a : v > b ? b : v,
  sign = v => v < 0 ? -1 : 1,
  lerp = (a, b, t) => a + (b - a) * t;
function rng(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hsh(n) {
  n = n * 374761393 | 0;
  n = (n ^ n >>> 13) * 1274126177 | 0;
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
function R(x, y, w, h, c) {
  game.g.fillStyle = c;
  game.g.fillRect(Math.round(x), Math.round(y), w, h);
}
function circ(cx, cy, r, c) {
  game.g.fillStyle = c;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6));
    game.g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
  }
}
const overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
const boxOf = o => ({
  l: o.x - o.w / 2,
  r: o.x + o.w / 2,
  t: o.y - o.h,
  b: o.y
});
function txt(s, x, y, size = 16, col = '#fff', align = 'left', sh = '#000') {
  dc.font = size + 'px ' + FONT;
  dc.textAlign = align;
  dc.textBaseline = 'top';
  if (sh) {
    dc.fillStyle = sh;
    dc.fillText(s, x * S + Math.max(2, size / 8), y * S + Math.max(2, size / 8));
  }
  dc.fillStyle = col;
  dc.fillText(s, x * S, y * S);
}
function wrapLines(s, maxW, size) {
  dc.font = size + 'px ' + FONT;
  const words = s.split(' ');
  const out = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (dc.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}
// ================= INPUT =================

export { R, boxOf, circ, clamp, hsh, lerp, overlap, rng, sign, txt, wrapLines };
