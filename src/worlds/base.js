import * as THREE from 'three';
import { game } from '../state.js';
import { M, bm, bx, cyl, sph, spr, tm, tor } from '../render/materials.js';
import { clamp } from '../core/helpers.js';
import { boxUV, noiseTex, texMat, wy } from '../render/world.js';
import { inst } from '../render/decorate.js';

// Theme: Basis der Schwarzen Krallen-Armee (Kapitel 3). Loaded on demand when a chapter with this theme starts.

// Wooden posts under floating platforms
export const posts = false;
// Wide ground plane far behind the level
export const farGround = false;
// Instanced grass blades, flowers and pebbles along the ground
export const ground = {
  bl: [],
  dens: 0,
  fl: [],
  flp: 0,
  pb: []
};

// Pixel textures for terrain (top, side, lip, platforms)
export function textures() {
  return {
  top: noiseTex('bg', '#9aa2b0', [['#7a828f', 10]], x => {
    for (let i = 0; i < 16; i += 8) {
      x.fillStyle = '#e8c020';
      x.fillRect(i, 0, 4, 16);
      x.fillStyle = '#2a2a2a';
      x.fillRect(i + 4, 0, 4, 16);
    }
  }),
  side: noiseTex('bd', '#5a6270', [['#40464f', 6]], x => {
    x.fillStyle = '#7a828f';
    x.fillRect(0, 0, 16, 1);
    x.fillRect(0, 0, 1, 16);
    x.fillStyle = '#40464f';
    x.fillRect(0, 15, 16, 1);
    x.fillRect(15, 0, 1, 16);
    x.fillStyle = '#30343c';
    [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(p => x.fillRect(p[0], p[1], 1, 1));
  }),
  lip: noiseTex('bl', '#9aa2b0', [['#7a828f', 6]]),
  plat: noiseTex('bp', '#8890a0', [], x => {
    x.fillStyle = '#40464f';
    for (let i = 1; i < 16; i += 3) x.fillRect(i, 2, 1, 12);
  }),
  wall: noiseTex('bw', '#3c4350', [['#363c48', 10]], x => {
    x.fillStyle = '#262a33';
    x.fillRect(0, 0, 16, 1);
    x.fillRect(0, 0, 1, 16);
    x.fillRect(3, 3, 1, 1);
    x.fillRect(12, 3, 1, 1);
  })
};
}

// Small props placed along the level (after the grass)
export function details({ lv, r, topY }) {
// rivets along the floor edge, vents and hanging cables on the wall
const riv = [];
for (let x = 0.25; x < lv.cols; x += 0.5) {
  const y = topY(Math.floor(x));
  if (y === null) continue;
  riv.push({
    x,
    y: y + .005,
    z: 1.05,
    s: 1,
    sy: .5
  });
  riv.push({
    x,
    y: y + .005,
    z: -2.2,
    s: 1,
    sy: .5
  });
}
inst(sph(.045, 8, 4), tm('#9aa2b2'), riv);
for (let x = 4; x < lv.cols + 10; x += 9) {
  const v = M(bx(1.2, .7, .08), '#2a2e38', game.worldG, x, 3.6, -2.66, false);
  for (let k = 0; k < 5; k++) M(bx(1.05, .05, .02), '#5a6272', game.worldG, x, 3.35 + k * .12, -2.6, false);
  const cab = M(tor(.9, .05), '#202228', game.worldG, x + 3, 7.6, -2.6, false);
  cab.scale.set(1.4, .6, 1);
  for (const yy of [2.6, 4.4]) {
    const pp = M(cyl(.09, .09, 1.8, 8), '#7a8292', game.worldG, x + 4.6, yy + .9, -2.55, false);
  }
  M(tor(.16, .04), '#c03030', game.worldG, x + 4.6, 3.4, -2.45, false);
}
}

// Background scenery
export function backdrop({ lv, len, r, T, tx }) {
const wm = texMat(tx.wall);
const wall = new THREE.Mesh(boxUV(len + 40, 14, .4), wm);
wall.position.set(len / 2, 5, -2.9);
wall.receiveShadow = true;
game.worldG.add(wall);
M(bx(len + 40, .6, 4), '#1a1e26', game.worldG, len / 2, 10.6, -1, false);
for (let x = 0; x < len + 10; x += 6) {
  M(bx(.8, 10, .8), '#4a5262', game.worldG, x, 6, -2.4, false);
  M(bx(1, .3, 1), '#5a6474', game.worldG, x, 2.1, -2.4, false);
  const lamp = new THREE.Mesh(sph(.18, 10, 8), bm('#ff3030'));
  lamp.position.set(x, 8.6, -1.95);
  game.worldG.add(lamp);
  const gl = spr(game.GLOW, 0xff3030, 1.6, true, .6);
  gl.position.copy(lamp.position);
  game.worldG.add(gl);
  game.staticAnim.push({
    t: 'blink',
    o: lamp,
    g: gl,
    ph: x
  });
}
for (const yy of [7.5, 8.0]) {
  const p = M(cyl(.14, .14, len + 40, 10), '#6a7282', game.worldG, len / 2, yy, -2.5, false);
  p.rotation.z = Math.PI / 2;
}
for (let x = 3; x < len; x += 12) {
  const sc = M(bx(1.6, 1.1, .1), '#22262e', game.worldG, x, 5, -2.65, false);
  const scr = new THREE.Mesh(bx(1.4, .9, .02), bm('#1a5a3a'));
  scr.position.set(x, 5, -2.58);
  game.worldG.add(scr);
  for (let i = 0; i < 4; i++) {
    const l = new THREE.Mesh(bx(.3 + i * 7 % 5 * .15, .08, .01), bm('#40e080'));
    l.position.set(x - .45 + (.15 + i * 7 % 5 * .075), 5.3 - i * .2, -2.56);
    game.worldG.add(l);
  }
}
for (let x = 5; x < len; x += 5 + r() * 7) {
  if (lv && lv.top[Math.floor(x)] === 99) continue;
  const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
  const cr = M(bx(.9, .9, .9), '#8a6a3a', game.worldG, x, yy + .45, -1.7, false);
  cr.castShadow = true;
  M(bx(.92, .1, .92), '#5a4020', game.worldG, x, yy + .45, -1.7, false);
  if (r() < .4) M(cyl(.3, .3, 1, 12), '#c03030', game.worldG, x + 1.1, yy + .5, -1.9, false);
}
}
