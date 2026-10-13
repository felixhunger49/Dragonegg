import { game } from '../state.js';
import { fit } from './setup.js';

// Graphics quality: 2 = hoch, 1 = mittel, 0 = niedrig.
// Starts high and steps down by itself when the game runs slowly.
// Manual choice: key G cycles the levels, or ?q=hoch|mittel|niedrig in the URL. A manual choice is remembered.
const LEVELS = [
  { name: 'NIEDRIG', pixelCap: 0.75, shadows: false, shadowSize: 512 },
  { name: 'MITTEL', pixelCap: 1.0, shadows: true, shadowSize: 512 },
  { name: 'HOCH', pixelCap: 1.75, shadows: true, shadowSize: 1024 }
];
const STORE = 'dragoneggs-quality';
const URL_NAMES = { niedrig: 0, low: 0, mittel: 1, mid: 1, hoch: 2, high: 2 };

game.quality = 2;
game.qualityAuto = true;
game.qualityMsg = null;

function loadQualitySetting() {
  const q = new URLSearchParams(location.search).get('q');
  if (q && q.toLowerCase() in URL_NAMES) {
    game.quality = URL_NAMES[q.toLowerCase()];
    game.qualityAuto = false;
    return;
  }
  try {
    const v = localStorage.getItem(STORE);
    if (v !== null && LEVELS[+v]) {
      game.quality = +v;
      game.qualityAuto = false;
    }
  } catch (e) {}
}

function pixelCap() {
  return LEVELS[game.quality].pixelCap;
}

// Apply the current level to the renderer (call after initGL)
function applyQuality() {
  const L = LEVELS[game.quality];
  if (!game.renderer) return;
  const sun = game.sun;
  sun.castShadow = L.shadows; // changing this makes three.js rebuild the shaders with/without shadows
  if (sun.shadow.mapSize.x !== L.shadowSize) {
    sun.shadow.mapSize.set(L.shadowSize, L.shadowSize);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  fit();
}

function setQuality(level, manual) {
  game.quality = Math.max(0, Math.min(2, level));
  if (manual) {
    game.qualityAuto = false;
    try {
      localStorage.setItem(STORE, String(game.quality));
    } catch (e) {}
  }
  game.qualityMsg = { text: 'GRAFIK: ' + LEVELS[game.quality].name + (manual ? '' : ' (AUTO)'), t: 150 };
  applyQuality();
}

// FPS watchdog: only measures while playing, ignores the first second (ms) after a state change
const meter = { state: null, skip: 1000, frames: 0, time: 0 };
function watchFps(dt) {
  if (!game.qualityAuto || game.quality === 0 || document.hidden) return;
  if (game.state !== 'play' || game.worldLoading || game.state !== meter.state) {
    meter.state = game.state;
    meter.skip = 1000;
    meter.frames = meter.time = 0;
    return;
  }
  if (meter.skip > 0) {
    meter.skip -= dt;
    return;
  }
  meter.frames++;
  meter.time += Math.min(dt, 250);
  if (meter.time >= 3000) {
    const fps = meter.frames * 1000 / meter.time;
    meter.frames = meter.time = 0;
    if (fps < 42) {
      meter.skip = 1500;
      setQuality(game.quality - 1, false);
    }
  }
}

addEventListener('keydown', e => {
  if (e.code === 'KeyG' && !e.repeat && game.renderer) setQuality((game.quality + 2) % 3, true);
});

export { applyQuality, loadQualitySetting, pixelCap, setQuality, watchFps };
