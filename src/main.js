// Load every module in the original order so top-level setup runs as before
import './core/setup.js';
import './core/fullscreen.js';
import './core/helpers.js';
import './core/input.js';
import './audio/audio.js';
import './data/data.js';
import './game/defaults.js';
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
import { loadModels } from './render/models.js';
import { applyQuality, loadQualitySetting, watchFps } from './core/quality.js';
import { loadTheme } from './render/world.js';
import { CHAPTERS } from './data/data.js';
import { render3D } from './render/render.js';
import { renderOverlay } from './ui/hud.js';

// ================= LOOP =================
game.acc = 0;
game.last = performance.now();
game.glFailed = false;
function loop(now) {
  game.acc += Math.min(100, now - game.last);
  watchFps(now - game.last);
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
  if (game.qualityMsg && game.qualityMsg.t-- > 0) txt(game.qualityMsg.text, W - 4, 148, 9, '#ffe080', 'right');
  if (game.worldLoading) txt('LADE WELT ...', W / 2, 74, 12, '#ffffff', 'center');
  if (game.glFailed) {
    dc.fillStyle = 'rgba(0,0,0,.8)';
    dc.fillRect(0, 0, hudC.width, 90);
    txt('3D-Grafik konnte nicht starten.', W / 2, 6, 12, '#ff8080', 'center');
  }
  requestAnimationFrame(loop);
}
function start() {
  try {
    if (typeof THREE === 'undefined') throw new Error('no three');
    loadQualitySetting();
    initGL();
    applyQuality();
    loadTheme(CHAPTERS[0].theme).catch(() => {});
  } catch (e) {
    console.error(e);
    game.glFailed = true;
    game.renderer = null;
  }
  fit();
  requestAnimationFrame(loop);
}
if (document.fonts && document.fonts.load) {
  document.fonts.load('16px "Press Start 2P"').catch(() => {});
}
// Blender models: the heroes are loaded before the first 3D scene is built, enemies and bosses
// follow in the background (a chapter waits for them like it waits for its world)
loadModels(ORDER).then(start, start).then(() => loadModels());

// Handle for tests and debugging in the browser console: window.DE.game.P etc.
import { setupChapter } from './game/flow.js';
import { LOOKS, ORDER } from './data/data.js';
import { damageBoss } from './game/boss.js';
import { keys } from './core/input.js';
window.DE = { game, setupChapter, ORDER, LOOKS, damageBoss, pressed, keys };
