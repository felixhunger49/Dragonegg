import { game } from '../state.js';
import { H, W, fit, hudC } from './setup.js';
import { toggleFs } from './fullscreen.js';
import { ac } from '../audio/audio.js';

// ================= INPUT =================
const keys = {},
  pressed = {},
  released = {};
const KMAP = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Space: 'jump',
  KeyZ: 'jump',
  KeyY: 'jump',
  KeyX: 'atk',
  KeyJ: 'atk',
  KeyS: 'kick',
  KeyK: 'kick',
  KeyC: 'ki',
  KeyL: 'ki',
  KeyV: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  Enter: 'start',
  KeyP: 'start',
  Escape: 'start',
  KeyM: 'mute',
  KeyF: 'super',
  KeyO: 'super'
};
function press(k) {
  if (!keys[k]) {
    pressed[k] = true;
  }
  keys[k] = true;
  ac();
}
function rel(k) {
  if (keys[k]) released[k] = true;
  keys[k] = false;
}
addEventListener('keydown', e => {
  if (e.code === 'KeyB' && !e.repeat) {
    e.preventDefault();
    toggleFs();
    return;
  }
  const k = KMAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  press(k);
  if (k === 'mute') {
    game.muted = !game.muted;
    game.master && (game.master.gain.value = game.muted ? 0 : 0.6);
  }
});
addEventListener('keyup', e => {
  const k = KMAP[e.code];
  if (k) {
    e.preventDefault();
    rel(k);
  }
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (game.state === 'play') game.state = 'pause';
});
document.querySelectorAll('#pad .b[data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => {
    e.preventDefault();
    b.setPointerCapture && b.setPointerCapture(e.pointerId);
    b.classList.add('on');
    press(k);
  });
  const up = () => {
    b.classList.remove('on');
    rel(k);
  };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('lostpointercapture', up);
});
game.tap = null;
hudC.addEventListener('pointerdown', e => {
  ac();
  const r = hudC.getBoundingClientRect();
  game.tap = {
    x: (e.clientX - r.left) / r.width * W,
    y: (e.clientY - r.top) / r.height * H
  };
});
addEventListener('touchstart', () => {
  if (!document.body.classList.contains('touch')) {
    document.body.classList.add('touch');
    fit();
  }
}, {
  passive: true
});
if (matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
// ================= AUDIO =================

export { keys, pressed, released };
