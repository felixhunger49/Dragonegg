import { game } from '../state.js';

// ================= SETUP =================
const W = 240,
  H = 160,
  S = 4,
  TS = 16,
  ROWS = 10,
  GRAV = 0.25;
const stageEl = document.getElementById('stage');
const hudC = document.getElementById('hud');
const dc = hudC.getContext('2d');
dc.imageSmoothingEnabled = false;
const lo = document.createElement('canvas');
lo.width = W;
lo.height = H;
game.g = lo.getContext('2d');
const glC = document.getElementById('gl');
const FONT = '"Press Start 2P", monospace';
game.renderer = null;
game.scene = undefined;
game.camera = undefined;
game.GRAD = undefined;
game.hemi = undefined;
game.sun = undefined;
game.dynG = undefined;
game.worldG = undefined;
game.titleG = undefined;
game.selectG = undefined;
game.endG = undefined;
game.lightsPool = [];
function fit() {
  const touch = document.body.classList.contains('touch');
  const portrait = innerHeight > innerWidth;
  const fs = document.body.classList.contains('fs');
  let maxW = fs ? innerWidth : innerWidth - 32,
    maxH = innerHeight - (touch && portrait ? 240 : fs ? 0 : touch ? 16 : 60);
  let w = Math.min(maxW, maxH * 1.5);
  w = Math.max(200, Math.floor(w));
  const h = Math.floor(w / 1.5);
  stageEl.style.width = w + 'px';
  stageEl.style.height = h + 'px';
  if (game.renderer) {
    game.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75, 2400 / w));
    game.renderer.setSize(w, h, false);
  }
}
// Vollbild: echte Fullscreen-API, sonst (z.B. iPhone) ein CSS-Vollbild

export { FONT, GRAV, H, ROWS, S, TS, W, dc, fit, glC, hudC, lo, stageEl };
