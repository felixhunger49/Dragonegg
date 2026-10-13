import { game } from '../state.js';
import { GRAV, ROWS, TS } from '../core/setup.js';

// ================= PHYSICS =================
function tileAt(px, py) {
  const c = Math.floor(px / TS),
    r = Math.floor(py / TS);
  if (!game.L) return 0;
  if (c < 0 || c >= game.L.cols) return 1;
  if (r < 0 || r >= ROWS) return 0;
  return game.L.grid[r][c];
}
function hitSolid(l, t, r, b) {
  const c0 = Math.floor(l / TS),
    c1 = Math.floor((r - 0.01) / TS),
    r0 = Math.floor(t / TS),
    r1 = Math.floor((b - 0.01) / TS);
  for (let row = r0; row <= r1; row++) for (let c = c0; c <= c1; c++) {
    if (c < 0 || c >= game.L.cols) return true;
    if (row < 0 || row >= ROWS) continue;
    if (game.L.grid[row][c] === 1) return true;
  }
  return false;
}
function physics(o, drop) {
  o.vy = Math.min(o.vy + GRAV, 6);
  let nx = o.x + o.vx;
  o.hitWall = false;
  if (o.vx !== 0 && hitSolid(nx - o.w / 2, o.y - o.h, nx + o.w / 2, o.y - 0.5)) {
    if (o.vx > 0) nx = Math.floor((nx + o.w / 2) / TS) * TS - o.w / 2 - 0.01;else nx = (Math.floor((nx - o.w / 2) / TS) + 1) * TS + o.w / 2 + 0.01;
    o.vx = 0;
    o.hitWall = true;
  }
  o.x = nx;
  let ny = o.y + o.vy;
  o.onG = false;
  if (o.vy > 0) {
    if (hitSolid(o.x - o.w / 2, o.y - o.h, o.x + o.w / 2, ny)) {
      ny = Math.floor(ny / TS) * TS;
      o.vy = 0;
      o.onG = true;
    } else if (!drop) {
      const tt = Math.floor(ny / TS) * TS;
      const row = tt / TS;
      if (o.y <= tt + 0.01 && ny >= tt && row >= 0 && row < ROWS) {
        const c0 = Math.floor((o.x - o.w / 2) / TS),
          c1 = Math.floor((o.x + o.w / 2 - 0.01) / TS);
        for (let c = c0; c <= c1; c++) if (c >= 0 && c < game.L.cols && game.L.grid[row][c] === 2) {
          ny = tt;
          o.vy = 0;
          o.onG = true;
          break;
        }
      }
    }
  } else if (o.vy < 0) {
    if (hitSolid(o.x - o.w / 2, ny - o.h, o.x + o.w / 2, o.y)) {
      ny = (Math.floor((ny - o.h) / TS) + 1) * TS + o.h;
      o.vy = 0;
    }
  }
  o.y = ny;
}
// ================= PARTICLES (logic) =================

export { physics, tileAt };
