// Load every module in the original order so top-level setup runs as before
import './core/setup.js';
import './core/fullscreen.js';
import './core/helpers.js';
import './core/input.js';
import './audio/audio.js';
import './data/data.js';
import './game/state.js';
import './game/level.js';
import './game/physics.js';
import './game/particles.js';
import './game/player.js';
import './game/enemies.js';
import './game/boss.js';
import './game/shots.js';
import './game/items.js';
import './game/shmup.js';
import './game/flow.js';
import './game/update.js';
import './render/materials.js';
import './render/humanoid.js';
import './render/poses.js';
import './render/rigs.js';
import './render/portraits.js';
import './render/dragon.js';
import './render/scene.js';
import './render/world.js';
import './render/decorate.js';
import './render/menus3d.js';
import './render/views.js';
import './render/camera.js';
import './render/render.js';
import './ui/hud.js';
import * as THREE from 'three';
import { game } from './state.js';
import { W, dc, fit, hudC } from './core/setup.js';
import { txt } from './core/helpers.js';
import { pressed, released } from './core/input.js';
import { update } from './game/update.js';
import { initGL } from './render/scene.js';
import { render3D } from './render/render.js';
import { renderOverlay } from './ui/hud.js';

// ================= LOOP =================
game.acc = 0;
game.last = performance.now();
game.glFailed = false;
function loop(now) {
  game.acc += Math.min(100, now - game.last);
  game.last = now;
  let n = 0;
  while (game.acc >= 1000 / 60 && n < 4) {
    update();
    for (const k in pressed) delete pressed[k];
    for (const k in released) delete released[k];
    if (n === 0) game.tap = null;
    game.acc -= 1000 / 60;
    n++;
  }
  try {
    if (game.renderer) render3D();
  } catch (e) {
    console.error(e);
  }
  renderOverlay();
  if (game.glFailed) {
    dc.fillStyle = 'rgba(0,0,0,.8)';
    dc.fillRect(0, 0, hudC.width, 90);
    txt('3D-Grafik konnte nicht starten.', W / 2, 6, 12, '#ff8080', 'center');
  }
  requestAnimationFrame(loop);
}
try {
  if (typeof THREE === 'undefined') throw new Error('no three');
  initGL();
} catch (e) {
  console.error(e);
  game.glFailed = true;
  game.renderer = null;
}
fit();
if (document.fonts && document.fonts.load) {
  document.fonts.load('16px "Press Start 2P"').catch(() => {});
}
requestAnimationFrame(loop);

// Handle for tests and debugging in the browser console: window.DE.game.P etc.
import { setupChapter } from './game/flow.js';
import { ORDER } from './data/data.js';
window.DE = { game, setupChapter, ORDER };
