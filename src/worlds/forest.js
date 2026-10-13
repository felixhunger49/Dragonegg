import { game } from '../state.js';
import { Gp, M, bx, capT, cone, cyl, ico, sph } from '../render/materials.js';
import { clamp } from '../core/helpers.js';
import { cloud, noiseTex, tree, wy } from '../render/world.js';

// Theme: Wald (Kapitel 1). Loaded on demand when a chapter with this theme starts.

// Wooden posts under floating platforms
export const posts = true;
// Wide ground plane far behind the level
export const farGround = true;
// Instanced grass blades, flowers and pebbles along the ground
export const ground = {
  bl: ['#3a9a3a', '#4cb848', '#2e8030', '#5ac850'],
  dens: 0.13,
  fl: ['#ffe040', '#ff6080', '#ffffff', '#b080ff', '#ff9030'],
  flp: .22,
  pb: ['#8a8a98', '#a0a0b0', '#6a6a7a']
};

// Pixel textures for terrain (top, side, lip, platforms)
export function textures() {
  return {
  top: noiseTex('fg', '#5cc048', [['#3a9030', 18], ['#8ad870', 10]]),
  side: noiseTex('fd', '#b07038', [['#865028', 22], ['#c88848', 12], ['#6a6a70', 3]]),
  lip: noiseTex('fl', '#5cc048', [['#3a9030', 14]], x => {
    x.fillStyle = '#b07038';
    x.fillRect(0, 9, 16, 7);
    x.fillStyle = '#4aa83a';
    for (let i = 0; i < 16; i += 2) x.fillRect(i, 9, 1, 2 + (i % 4 ? 0 : 2));
  }),
  plat: noiseTex('fw', '#a06830', [['#6a4018', 12]], x => {
    x.fillStyle = '#6a4018';
    x.fillRect(0, 7, 16, 1);
    x.fillRect(0, 15, 16, 1);
  })
};
}

// Small props placed along the level (after the grass)
export function details({ lv, r, topY }) {
// mushrooms and ferns near the back edge
for (let x = 3; x < lv.cols; x += 6 + r() * 9) {
  const c = Math.floor(x),
    y = topY(c);
  if (y === null) continue;
  const g2 = Gp(game.worldG, x, y, -1.9 - r() * .4);
  const s2 = .7 + r() * .6;
  g2.scale.setScalar(s2);
  if (r() < .5) {
    M(cyl(.05, .06, .18, 8), '#f4ecd8', g2, 0, .09, 0, false);
    M(capT(.13, 12), '#d83a2a', g2, 0, .16, 0, false);
    for (let k = 0; k < 4; k++) M(sph(.022, 6, 4), '#ffffff', g2, Math.cos(k * 1.6) * .08, .26, Math.sin(k * 1.6) * .08, false);
  } else for (let k = 0; k < 6; k++) {
    const fr = M(bx(.06, .5, .02), '#2e8a3e', g2, 0, .2, 0, false);
    fr.rotation.set(-.6, k * 1.05, 0);
    fr.geometry;
    fr.position.set(Math.sin(k * 1.05) * .12, .18, Math.cos(k * 1.05) * .12);
  }
}
}

// Background scenery
export function backdrop({ lv, len, r, T, tx }) {
for (let x = -30; x < len + 40; x += 8 + r() * 8) {
  const h = 9 + r() * 9,
    rad = 6 + r() * 5;
  const z = -60 - r() * 20;
  M(cone(rad, h, 7), '#6a7ab8', game.worldG, x, 1.6 + h / 2, z, false).castShadow = false;
  const sn = M(cone(rad * 0.32, h * 0.32, 7), '#eef4ff', game.worldG, x, 1.6 + h - h * 0.16 + 0.02, z, false);
}
for (let x = -20; x < len + 30; x += 7 + r() * 6) M(sph(5 + r() * 4, 12, 8), '#3a8a4a', game.worldG, x, 1, -26 - r() * 8, false, [1.4, .55, 1]);
for (let x = -10; x < len + 20; x += 2.5 + r() * 4) {
  const z = -3.4 - r() * 4;
  tree(game.worldG, x, 2, z, 0.8 + r() * 0.5, ['#2e8a3e', '#4cb050']);
}
for (let x = 4; x < len; x += 7 + r() * 9) {
  const b = Gp(game.worldG, x, 2.05, 1.5 + r() * 0.5);
  for (let i = 0; i < 3; i++) M(sph(.35 + r() * .2, 10, 8), i % 2 ? '#3a9a40' : '#2e8a3e', b, i * .35 - .35, 0, 0, false);
}
for (let x = 0; x < len; x += 3 + r() * 5) {
  if (lv && lv.top[Math.floor(x)] === 99) continue;
  const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
  M(ico(.18 + r() * .15, 0), '#8a8a98', game.worldG, x, yy + .05, -1.6 - r() * 0.6, false);
  for (let k = 0; k < 3; k++) M(sph(.05, 6, 4), ['#ffe040', '#ff6080', '#ffffff'][k], game.worldG, x + 0.6 + k * .15, yy + .05, -1.1 + r() * 0.3, false);
}
for (let x = -20; x < len + 30; x += 14 + r() * 14) cloud(game.worldG, x, 13 + r() * 6, -40 - r() * 20, 1.6 + r());
}
