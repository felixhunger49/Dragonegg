import * as THREE from 'three';
import { game } from '../state.js';
import { Gp, M, bm, bx, cap, cyl, ico, sph } from '../render/materials.js';
import { clamp } from '../core/helpers.js';
import { noiseTex, wy } from '../render/world.js';

// Theme: Wüste (Kapitel 2). Loaded on demand when a chapter with this theme starts.

// Wooden posts under floating platforms
export const posts = true;
// Wide ground plane far behind the level
export const farGround = true;
// Instanced grass blades, flowers and pebbles along the ground
export const ground = {
  bl: ['#c8a050', '#b08840', '#d8b868'],
  dens: 0.45,
  fl: [],
  flp: 0,
  pb: ['#c09060', '#a87850', '#d8a878', '#8a6040']
};

// Pixel textures for terrain (top, side, lip, platforms)
export function textures() {
  return {
  top: noiseTex('dg', '#f8d088', [['#e0b060', 18], ['#fff0c0', 8]]),
  side: noiseTex('dd', '#d09850', [['#b07838', 20], ['#e0b070', 10]], x => {
    x.fillStyle = '#c08848';
    x.fillRect(0, 5, 16, 1);
    x.fillRect(0, 12, 16, 1);
  }),
  lip: noiseTex('dl', '#f8d088', [['#e0b060', 10]], x => {
    x.fillStyle = '#d09850';
    x.fillRect(0, 11, 16, 5);
  }),
  plat: noiseTex('dp', '#c88850', [['#8a5830', 14]])
};
}

// Small props placed along the level (after the grass)
export function details({ lv, r, topY }) {
// bleached bones and dry shrubs
for (let x = 8; x < lv.cols; x += 14 + r() * 14) {
  const c = Math.floor(x),
    y = topY(c);
  if (y === null) continue;
  const g2 = Gp(game.worldG, x, y + .06, -1.8);
  g2.rotation.y = r() * 3;
  const bo = M(cyl(.035, .035, .5, 6), '#f0e8d0', g2, 0, 0, 0, false);
  bo.rotation.z = Math.PI / 2;
  for (const sx of [-.25, .25]) for (const dz of [-.04, .04]) M(sph(.05, 6, 4), '#f0e8d0', g2, sx, 0, dz, false);
  if (r() < .5) {
    const sk = M(sph(.14, 10, 8), '#f0e8d0', g2, .5, .08, .1, false, [1, .85, 1.1]);
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(sph(.035, 6, 4), bm('#2a1a10'));
      e.position.set(.5 + sx * .05, .1, .24);
      g2.add(e);
    }
  }
}
}

// Background scenery
export function backdrop({ lv, len, r, T, tx }) {
for (let x = -30; x < len + 40; x += 10 + r() * 10) {
  const h = 6 + r() * 8,
    w = 5 + r() * 8;
  const z = -50 - r() * 25;
  M(bx(w, h, 6), '#b85838', game.worldG, x, 1.6 + h / 2, z, false);
  M(bx(w + .4, .8, 6.4), '#d87850', game.worldG, x, 1.6 + h, z, false);
}
for (let x = -20; x < len + 30; x += 8 + r() * 6) M(sph(5 + r() * 4, 12, 8), '#e8b868', game.worldG, x, 1, -22 - r() * 8, false, [1.6, .4, 1]);
for (let x = 0; x < len + 10; x += 4 + r() * 6) {
  const z = -3 - r() * 4,
    s = 0.8 + r() * 0.6;
  const c = Gp(game.worldG, x, 2, z);
  c.scale.setScalar(s);
  M(cap(.2, 1.3), '#4a9a40', c, 0, .85, 0);
  const a1 = Gp(c, .2, .9, 0);
  M(cap(.12, .4), '#4a9a40', a1, .2, 0, 0).rotation.z = Math.PI / 2;
  M(cap(.12, .35), '#4a9a40', a1, .38, .25, 0);
  if (r() < .6) {
    const a2 = Gp(c, -.2, .6, 0);
    M(cap(.11, .3), '#4a9a40', a2, -.18, 0, 0).rotation.z = Math.PI / 2;
    M(cap(.11, .3), '#4a9a40', a2, -.34, .2, 0);
  }
}
for (let x = 2; x < len; x += 5 + r() * 6) {
  if (lv && lv.top[Math.floor(x)] === 99) continue;
  const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
  M(ico(.22 + r() * .2, 0), '#c09060', game.worldG, x, yy + .05, -1.5 - r() * 0.8, false);
}
const sunM = new THREE.Mesh(sph(5, 20, 14), bm('#fff0c0'));
sunM.position.set(0, 24, -120);
game.worldG.add(sunM);
game.worldExtra.follow = [{
  o: sunM,
  k: 0.9,
  x: 12
}];
}
