import { fit, stageEl } from './setup.js';

// Vollbild: echte Fullscreen-API, sonst (z.B. iPhone) ein CSS-Vollbild
const fsBtn = document.getElementById('fsBtn');
function isFs() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function syncFs() {
  const on = isFs() || document.body.classList.contains('fsfake');
  document.body.classList.toggle('fs', on);
  fsBtn.textContent = on ? '✕ VOLLBILD' : '⛶ VOLLBILD';
  fit();
}
function toggleFs() {
  const el = document.documentElement;
  if (isFs()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  if (document.body.classList.contains('fsfake')) {
    document.body.classList.remove('fsfake');
    syncFs();
    return;
  }
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) {
    try {
      const r = req.call(el, {
        navigationUI: 'hide'
      });
      if (r && r.catch) r.catch(() => {
        document.body.classList.add('fsfake');
        syncFs();
      });
    } catch (e) {
      document.body.classList.add('fsfake');
      syncFs();
    }
  } else {
    document.body.classList.add('fsfake');
    syncFs();
  }
}
fsBtn.addEventListener('click', e => {
  e.stopPropagation();
  toggleFs();
  fsBtn.blur();
});
['pointerdown', 'touchstart', 'mousedown'].forEach(t => fsBtn.addEventListener(t, e => e.stopPropagation(), {
  passive: true
}));
document.addEventListener('fullscreenchange', syncFs);
document.addEventListener('webkitfullscreenchange', syncFs);
stageEl.addEventListener('dblclick', toggleFs);
addEventListener('resize', fit);
// ================= HELPERS =================

export { toggleFs };
