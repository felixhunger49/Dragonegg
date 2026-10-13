import { game } from '../state.js';
import { TS, W } from '../core/setup.js';
import { boxOf, overlap } from '../core/helpers.js';
import { sfx } from '../audio/audio.js';
import { tileAt } from './physics.js';
import { part } from './particles.js';
import { setTimeoutFrames } from './boss.js';
import { chapterOutro } from './flow.js';

// ================= ITEMS =================
function updItems() {
  const pb = boxOf(game.P);
  for (const it of game.items) {
    it.t = (it.t || 0) + 1;
    if (it.vy !== undefined && game.mode === 'stage') {
      it.vy = Math.min(it.vy + 0.15, 3);
      it.y += it.vy;
      if (tileAt(it.x, it.y + 4)) {
        it.y = Math.floor((it.y + 4) / TS) * TS - 4;
        it.vy = 0;
      }
    }
    if (game.mode === 'shmup') {
      it.x += it.vx || -0.6;
      if (it.x < -10) {
        if (it.type === 'egg') it.x = W + 10;else it.gone = true;
      }
    }
    const ib = {
      l: it.x - 6,
      r: it.x + 6,
      t: it.y - 8,
      b: it.y + 8
    };
    if (!game.P.dead && overlap(ib, pb)) {
      it.gone = true;
      if (it.type === 'egg') {
        game.eggs++;
        sfx.egg();
        game.banner = {
          text: 'DRAGONEGG! ' + game.eggs + '/7',
          t: 100
        };
        game.score += 1000;
        game.flashT = 5;
        for (let i = 0; i < 24; i++) part(it.x, it.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 30, '#ffd060', 1.5);
        if (it.boss) setTimeoutFrames(70, chapterOutro);
      } else if (it.type === 'food') {
        game.P.hp = Math.min(game.P.maxhp, game.P.hp + 35);
        sfx.item();
        game.score += 100;
      } else {
        game.P.ki = Math.min(100, game.P.ki + 25);
        sfx.item();
        game.score += 50;
      }
    }
  }
  game.items = game.items.filter(i => !i.gone);
}
// ================= SHMUP =================

export { updItems };
