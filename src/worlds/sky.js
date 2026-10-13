import { game } from '../state.js';
import { M, bx, cone } from '../render/materials.js';
import { cloud } from '../render/world.js';

// Theme: Himmel (Flugstufe). Loaded on demand when a chapter with this theme starts.

// Wooden posts under floating platforms
export const posts = false;
// Wide ground plane far behind the level
export const farGround = false;

// Background scenery
export function backdrop({ lv, len, r, T, tx }) {
game.worldExtra.clouds = [];
for (let i = 0; i < 26; i++) {
  const layer = i % 3;
  const z = [-4, -18, -40][layer];
  const s = [1.6, 2.4, 3.5][layer];
  const c = cloud(game.worldG, 0, [0.2, 2, 4][layer] + r() * [2, 6, 10][layer], z, s * (0.7 + r() * 0.6), layer ? '#eef6ff' : '#ffffff');
  game.worldExtra.clouds.push({
    o: c,
    bx: r() * 60,
    spd: [1, 0.45, 0.2][layer]
  });
}
for (let x = -60; x < 80; x += 9) M(cone(6 + r() * 4, 10 + r() * 8, 6), '#6a88c8', game.worldG, x, -12, -90 - r() * 20, false);
}
