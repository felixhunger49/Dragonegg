import * as THREE from 'three';
import { game } from '../state.js';
import { Gp, M, bm, bx, cone, cyl, sph, spr } from '../render/materials.js';
import { clamp, hsh } from '../core/helpers.js';
import { noiseTex, wy } from '../render/world.js';

// Theme: Schloss (Kapitel 4). Loaded on demand when a chapter with this theme starts.

// Wooden posts under floating platforms
export const posts = false;
// Wide ground plane far behind the level
export const farGround = true;
// Instanced grass blades, flowers and pebbles along the ground
export const ground = {
  bl: ['#3a5a3a', '#2e4a30', '#4a6a40'],
  dens: 0.6,
  fl: ['#c0a0ff'],
  flp: .05,
  pb: ['#5a5470', '#4a4460', '#6a6480']
};

// Pixel textures for terrain (top, side, lip, platforms)
export function textures() {
  return {
  top: noiseTex('cg', '#8a82a2', [['#6a6290', 14]]),
  side: noiseTex('cd', '#5a5272', [], x => {
    x.fillStyle = '#3e3854';
    x.fillRect(0, 7, 16, 1);
    x.fillRect(0, 15, 16, 1);
    x.fillRect(4, 0, 1, 7);
    x.fillRect(12, 8, 1, 7);
    x.fillStyle = '#726a8c';
    x.fillRect(1, 1, 6, 1);
    x.fillRect(9, 9, 6, 1);
  }),
  lip: noiseTex('cl', '#8a82a2', [['#6a6290', 8]]),
  plat: noiseTex('cp', '#7a7294', [['#3e3854', 10]])
};
}

// Small props placed along the level (after the grass)
export function details({ lv, r, topY }) {
// candles on the back edge, hanging banners between the pillars
for (let x = 3.5; x < lv.cols; x += 7) {
  const c = Math.floor(x),
    y = topY(c);
  if (y === null) continue;
  for (let k = 0; k < 3; k++) {
    const h = .18 + k * .08;
    M(cyl(.045, .05, h, 8), '#efe6d0', game.worldG, x + k * .16, y + h / 2, -2.0 + k * .05, false);
    const fl = new THREE.Mesh(cone(.03, .09, 6), bm('#ffd060'));
    fl.position.set(x + k * .16, y + h + .05, -2.0 + k * .05);
    game.worldG.add(fl);
    const g3 = spr(game.GLOW, 0xff9030, .5, true, .7);
    g3.position.copy(fl.position);
    game.worldG.add(g3);
  }
}
for (let x = 5.5; x < lv.cols + 10; x += 7) {
  const bn = Gp(game.worldG, x, 5.4, -2.5);
  M(cyl(.03, .03, 1.3, 6), '#3a2a20', bn, 0, .62, 0, false).rotation.z = Math.PI / 2;
  M(bx(1, 1.5, .03), '#801828', bn, 0, -.15, 0, false);
  M(bx(.86, .06, .035), '#d8a830', bn, 0, .45, 0, false);
  M(bx(.86, .06, .035), '#d8a830', bn, 0, -.75, 0, false);
  const em = M(cone(.22, .4, 3), '#d8a830', bn, 0, -.2, .01, false);
  em.rotation.z = Math.PI;
  em.scale.z = .1;
  for (const sx of [-.35, 0, .35]) {
    const t = M(cone(.15, .25, 3), '#801828', bn, sx, -1.02, 0, false);
    t.rotation.z = Math.PI;
    t.scale.z = .1;
  }
}
}

// Background scenery
export function backdrop({ lv, len, r, T, tx }) {
const moon = new THREE.Mesh(sph(4, 20, 14), bm('#f0e8c0'));
moon.position.set(0, 22, -110);
game.worldG.add(moon);
const mg = spr(game.GLOW, 0xf0e8c0, 22, true, .35);
mg.position.copy(moon.position);
game.worldG.add(mg);
const stars = new THREE.BufferGeometry();
const pts = [];
for (let i = 0; i < 300; i++) pts.push((hsh(i) - 0.5) * 260, 8 + hsh(i + 5) * 60, -140);
stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
const st = new THREE.Points(stars, new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.5,
  fog: false
}));
game.worldG.add(st);
game.worldExtra.follow = [{
  o: moon,
  k: 0.92,
  x: 14
}, {
  o: mg,
  k: 0.92,
  x: 14
}, {
  o: st,
  k: 0.95,
  x: 0
}];
for (let x = -20; x < len + 30; x += 10 + r() * 12) {
  const z = -28 - r() * 18,
    h = 8 + r() * 10,
    rad = 1.2 + r() * 1.4;
  M(cyl(rad, rad * 1.1, h, 10), '#241638', game.worldG, x, 1.6 + h / 2, z, false);
  const roof = M(cone(rad * 1.3, h * 0.4, 10), '#3a1a4a', game.worldG, x, 1.6 + h + h * 0.2, z, false);
  for (let k = 0; k < 3; k++) {
    const wd = new THREE.Mesh(bx(.3, .5, .05), bm(r() < .7 ? '#f8c040' : '#4a3010'));
    wd.position.set(x + (k - 1) * rad * 0.45, 1.6 + h * 0.4 + k * 1.6, z + rad + 0.02);
    game.worldG.add(wd);
  }
}
for (let x = 2; x < len + 10; x += 7) {
  const pil = Gp(game.worldG, x, 2, -2.2);
  M(cyl(.3, .35, 4, 8), '#4a4262', pil, 0, 2, 0, false);
  M(cyl(.45, .3, .4, 8), '#5a4a30', pil, 0, 4.2, 0, false);
  const fl = spr(game.GLOW, 0xff8020, 1.4, true, .9);
  fl.position.set(0, 4.7, 0);
  pil.add(fl);
  const fc = new THREE.Mesh(cone(.18, .5, 6), bm('#ffd060'));
  fc.position.set(0, 4.65, 0);
  pil.add(fc);
  game.staticAnim.push({
    t: 'flame',
    o: fl,
    c: fc,
    ph: x
  });
}
for (let x = 6; x < len; x += 9 + r() * 8) {
  if (lv && lv.top[Math.floor(x)] === 99) continue;
  const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
  M(bx(.5, .7, .15), '#6a6a7a', game.worldG, x, yy + .35, -1.7, false);
  M(cyl(.25, .25, .15, 10), '#6a6a7a', game.worldG, x, yy + .7, -1.7, false).rotation.x = Math.PI / 2;
}
}
