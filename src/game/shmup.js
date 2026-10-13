import { game } from '../state.js';
import { W } from '../core/setup.js';
import { boxOf, clamp, overlap } from '../core/helpers.js';
import { playSong, sfx } from '../audio/audio.js';
import { STORY } from '../data/data.js';
import { hurtPlayer } from './player.js';
import { setTimeoutFrames } from './boss.js';
import { dlgStart } from './flow.js';

// ================= SHMUP =================
function spawnSh(type, y) {
  const hp = type === 'bird' ? 6 : type === 'plane' ? 10 : 16;
  game.enemies.push({
    type,
    d: {
      beh: 'sh',
      dmg: 8,
      score: type === 'jet' ? 150 : 80,
      hp
    },
    x: W + 14,
    y,
    vx: 0,
    vy: 0,
    w: type === 'jet' ? 12 : 14,
    h: type === 'jet' ? 24 : 10,
    f: -1,
    hp,
    maxhp: hp,
    t: 0,
    st: 0,
    flash: 0,
    lastHit: 0,
    dead: false,
    y0: y,
    hurtT: 0
  });
}
function updSh(e) {
  e.t++;
  if (e.flash > 0) e.flash--;
  e.hurtT = 0;
  if (e.type === 'bird') {
    e.x -= 1.6;
    e.y = e.y0 + Math.sin(e.t * 0.08 + e.y0) * 18;
  } else if (e.type === 'plane') {
    e.x -= 2.2;
    if (e.t === 40 || e.t === 90) {
      const a = Math.atan2(game.P.y - 14 - e.y, game.P.x - e.x);
      game.shots.push({
        x: e.x - 6,
        y: e.y,
        vx: Math.cos(a) * 2.2,
        vy: Math.sin(a) * 2.2,
        r: 1,
        owner: 'e',
        dmg: 8,
        type: 'bullet',
        life: 160
      });
    }
  } else {
    if (e.t < 50) e.x -= 1.8;else if (e.t < 200) {
      e.y += Math.sin(e.t * 0.05) * 0.6;
      if (e.t % 45 === 0) {
        const a = Math.atan2(game.P.y - 14 - e.y, game.P.x - e.x);
        game.shots.push({
          x: e.x - 6,
          y: e.y - 8,
          vx: Math.cos(a) * 2.4,
          vy: Math.sin(a) * 2.4,
          r: 2,
          owner: 'e',
          dmg: 9,
          type: 'eball',
          life: 160,
          col: ['#ff8040', '#a02010']
        });
        sfx.ki();
      }
    } else {
      e.x -= 2.2;
      e.y -= 0.6;
    }
  }
  if (e.x < -30) e.dead = true;
  if (!game.P.dead && overlap(boxOf(e), boxOf(game.P))) hurtPlayer(8, e.x);
}
function updShmup() {
  game.shT++;
  game.bgX += 1.5;
  if (!game.bossTriggered) {
    if (game.shT % 70 === 0 && game.shT < 3200) {
      const k = game.shRnd();
      const y = 40 + game.shRnd() * 100;
      if (k < 0.4) {
        for (let i = 0; i < 4; i++) setTimeoutFrames(i * 14, () => spawnSh('bird', y));
      } else if (k < 0.75) spawnSh('plane', y);else spawnSh('jet', clamp(y, 50, 140));
    }
    if (game.shT >= 3400 && game.enemies.length === 0) {
      game.bossTriggered = true;
      game.checkpointBoss = true;
      game.boss = {
        key: 'rostbart',
        x: W + 60,
        y: 72,
        w: 76,
        h: 30,
        hp: 300,
        maxhp: 300,
        t: 0,
        st: 0,
        flash: 0,
        lastHit: 0,
        active: false,
        dying: 0,
        sc: 1,
        state: '',
        d: {},
        gone: false
      };
      playSong('boss');
      setTimeoutFrames(90, () => dlgStart(STORY[2].boss, () => {
        game.boss.active = true;
      }));
    }
  }
  for (const e of game.enemies) updSh(e);
  game.enemies = game.enemies.filter(e => !e.dead);
}
// ================= FLOW =================

export { spawnSh, updShmup };
