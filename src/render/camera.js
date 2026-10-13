import { game } from '../state.js';
import { W } from '../core/setup.js';
import { lerp } from '../core/helpers.js';
import { keys } from '../core/input.js';
import { wx, wy } from './world.js';

// ---------- camera ----------
const cam = {
  x: 7.5,
  y: 5,
  zoom: 1,
  lx: 0,
  fx: 0,
  fy: 0
};
function updCamera() {
  let cx,
    cy = 5,
    zoom = 1,
    fx = null,
    fy = null;
  if (game.mode === 'stage') cx = wx(game.camX + W / 2);else cx = 7.5;
  if (game.P) {
    if (game.P.castT > 0 && (game.P.castType === 'kame' || game.P.castType === 'max')) {
      zoom = 0.84;
      fx = wx(game.P.x + game.P.f * 30);
      fy = wy(game.P.y - 16);
    }
    if (game.P.kiHold > 12 && keys.ki) {
      zoom = 0.9;
      fx = wx(game.P.x);
      fy = wy(game.P.y - 16);
    }
    if (game.P.dead) {
      zoom = 0.8;
      fx = wx(game.P.x);
      fy = wy(game.P.y - 12);
    }
  }
  if (game.clash) {
    zoom = 0.8;
    fx = wx(game.clash.mx || cx * 16);
    fy = wy(game.clash.pb.y);
  }
  if (game.boss && (game.boss.dying || game.boss.state === 'grow' || game.boss.state === 'transform') && game.boss.key !== 'rostbart') {
    zoom = 0.75;
    fx = wx(game.boss.x);
    fy = wy(game.boss.y - 14 * game.boss.sc);
  }
  if (game.dlg && game.boss && !game.boss.active && !game.boss.gone && game.boss.key !== 'rostbart') {
    zoom = 0.86;
    fx = (wx(game.boss.x) + wx(game.P.x)) / 2;
    fy = 4.2;
  }
  zoom -= game.zoomPunch * 0.05;
  cam.zoom += (zoom - cam.zoom) * 0.08;
  const tx = fx === null ? cx : lerp(cx, fx, 0.6),
    ty = fy === null ? cy : lerp(cy, fy, 0.5);
  cam.fx += (tx - cam.fx) * 0.1;
  cam.fy += (ty - cam.fy) * 0.1;
  if (Math.abs(cam.fx - cx) > 20) {
    cam.fx = cx;
    cam.fy = cy;
  }
  cam.lx += ((game.P && game.mode === 'stage' ? game.P.vx * 0.35 : 0) - cam.lx) * 0.05;
  const sh = game.shake > 0 ? game.shake * 0.012 : 0;
  const dist = 14.3 * cam.zoom;
  game.camera.position.set(cam.fx + cam.lx + (Math.random() - 0.5) * sh, cam.fy + 2.4 * cam.zoom + (Math.random() - 0.5) * sh, dist);
  game.camera.lookAt(cam.fx, cam.fy - 0.45, 0);
  game.sun.position.set(cam.fx - 6, 16, 12);
  game.sun.target.position.set(cam.fx, 2, 0);
  if (game.worldExtra.follow) for (const f of game.worldExtra.follow) f.o.position.x = cam.fx * f.k + f.x;
  if (game.worldExtra.clouds) for (const c of game.worldExtra.clouds) {
    const span = 64;
    c.o.position.x = ((c.bx - game.bgX / 16 * c.spd) % span + span) % span - 24;
  }
  for (const a of game.staticAnim) {
    if (a.t === 'blink') {
      const on = ((game.frame >> 5) + Math.floor(a.ph)) % 2 === 0;
      a.o.visible = on;
      a.g.visible = on;
    } else {
      const s = 1 + Math.sin(game.frame * 0.4 + a.ph) * 0.15 + Math.random() * 0.1;
      a.o.scale.setScalar(1.4 * s);
      a.c.scale.set(1, s, 1);
    }
  }
}
// ---------- per-state 3D render ----------

export { updCamera };
