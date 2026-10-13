import { game } from '../state.js';

// ================= PARTICLES (logic) =================
function part(x, y, vx, vy, life, c, s = 1, type = 'p', gr = 0, vz) {
  game.parts.push({
    x,
    y,
    z: 0,
    vx,
    vy,
    vz: vz === undefined ? (Math.random() - 0.5) * 1.6 : vz,
    life,
    max: life,
    c,
    s,
    type,
    gr
  });
  if (game.parts.length > 380) game.parts.shift();
}
function spark(x, y, c = '#fff8a0') {
  part(x, y, 0, 0, 9, '#ffffff', 7, 'flash', 0, 0);
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * 6.28,
      v = 1 + Math.random() * 2.2;
    part(x, y, Math.cos(a) * v, Math.sin(a) * v, 10 + Math.random() * 8, i & 1 ? c : '#ffffff', 1.2, 'p', 0.05);
  }
}
function boom(x, y, n = 14, big = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28,
      v = (0.5 + Math.random() * 2) * big;
    part(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.5, 18 + Math.random() * 16, ['#fff4a0', '#ffb020', '#f05010', '#8a8a8a'][i % 4], (1.2 + Math.random() * 1.5) * big, 'p', 0.03);
  }
  part(x, y, 0, 0, 16, '#ffd080', 5 * big, 'ring', 0, 0);
  game.lightFx.push({
    x,
    y,
    life: 14,
    c: 0xffa040,
    i: 3 * big
  });
}
function dust(x, y, n = 5) {
  for (let i = 0; i < n; i++) part(x + (Math.random() * 10 - 5), y - 1, (Math.random() - 0.5) * 1.2, -Math.random() * 0.7, 18, '#d8d0c0', 2.2, 'dust');
}
function updParts() {
  for (const p of game.parts) {
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    p.vy += p.gr;
    p.life--;
  }
  game.parts = game.parts.filter(p => p.life > 0);
  for (const l of game.lightFx) l.life--;
  game.lightFx = game.lightFx.filter(l => l.life > 0);
}
game.lightFx = [];
game.ghosts = [];
function ghost(o, look, f) {
  game.ghosts.push({
    x: o.x,
    y: o.y,
    f,
    look,
    life: 14,
    max: 14,
    src: o
  });
  if (game.ghosts.length > 8) game.ghosts.shift();
}
// ================= PLAYER =================

export { boom, dust, ghost, part, spark, updParts };
