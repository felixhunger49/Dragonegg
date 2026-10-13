import { game } from '../state.js';
import { H } from '../core/setup.js';
import { boxOf, overlap, sign } from '../core/helpers.js';
import { sfx } from '../audio/audio.js';
import { physics, tileAt } from './physics.js';
import { dust } from './particles.js';
import { hurtPlayer } from './player.js';

// ================= ENEMIES =================
function updEnemy(e) {
  e.t++;
  if (e.flash > 0) e.flash--;
  const p = game.P;
  const dx = p.x - e.x,
    adx = Math.abs(dx),
    ady = Math.abs(p.y - e.y);
  const d = e.d;
  const touch = () => {
    if (!p.dead && overlap(boxOf(e), boxOf(p))) hurtPlayer(d.dmg, e.x);
  };
  if (d.beh !== 'flyer') {
    if (e.air) {
      physics(e);
      if (e.onG) {
        if (e.bounce < 1) {
          e.vy = -1.8;
          e.bounce++;
          e.onG = false;
          dust(e.x, e.y, 4);
          game.shake = Math.max(game.shake, 2);
        } else {
          e.air = false;
          e.downT = 46;
          dust(e.x, e.y, 6);
        }
      }
      if (e.y > H + 30) e.dead = true;
      return;
    }
    if (e.downT > 0) {
      e.downT--;
      e.vx *= 0.8;
      physics(e);
      return;
    }
  }
  if (e.hurtT > 0) {
    e.hurtT--;
    e.vx *= 0.85;
    if (d.beh === 'flyer') {
      e.x += e.vx;
    } else physics(e);
    if (e.y > H + 30) e.dead = true;
    return;
  }
  if (d.beh === 'walker') {
    if (e.atkT > 0) {
      e.atkT--;
      e.vx = 0;
      const el = 20 - e.atkT;
      if (el >= 8 && el <= 12) {
        const bx = e.x + e.f * 12;
        if (overlap({
          l: bx - 8,
          r: bx + 8,
          t: e.y - 22,
          b: e.y - 14
        }, boxOf(p))) hurtPlayer(d.dmg, e.x);
      }
    } else if (d.gun && adx < 150 && ady < 40) {
      e.f = sign(dx);
      e.vx = adx < 56 ? -e.f * 0.6 : adx > 110 ? e.f * 0.6 : 0;
      if (--e.cd <= 0) {
        e.cd = 100;
        e.shoot = 14;
        game.shots.push({
          x: e.x + e.f * 12,
          y: e.y - 18,
          vx: e.f * 2.4,
          vy: 0,
          r: 1,
          owner: 'e',
          dmg: d.dmg,
          type: 'bullet',
          life: 120
        });
        sfx.gun();
      }
    } else if (adx < 130 && ady < 40) {
      e.f = sign(dx);
      if (adx > 18) e.vx = e.f * d.spd;else {
        e.vx = 0;
        if (--e.cd <= 0) {
          e.atkT = 20;
          e.cd = 45;
        }
      }
    } else {
      e.vx = e.f * 0.4;
      if (e.hitWall) e.f *= -1;
    }
    if (e.shoot > 0) e.shoot--;
    if (e.onG && e.vx !== 0 && !tileAt(e.x + sign(e.vx) * 8, e.y + 4)) {
      e.vx = 0;
      if (adx >= 130) e.f *= -1;
    }
    physics(e);
    if (adx < 10 && ady < 20 && d.armor) touch();
  } else if (d.beh === 'wolf') {
    e.st++;
    if (e.state === 'idle') {
      e.vx = e.f * 0.5;
      if (e.hitWall || e.onG && !tileAt(e.x + e.f * 10, e.y + 4)) e.f *= -1;
      if (adx < 100 && ady < 30) {
        e.state = 'crouch';
        e.st = 0;
        e.f = sign(dx);
      }
    } else if (e.state === 'crouch') {
      e.vx = 0;
      if (e.st > 22) {
        e.vy = -3.2;
        e.vx = e.f * 3;
        e.state = 'leap';
        e.st = 0;
      }
    } else if (e.state === 'leap') {
      if (e.onG && e.st > 4) {
        e.state = 'rest';
        e.st = 0;
      }
    } else if (e.state === 'rest') {
      e.vx *= 0.8;
      if (e.st > 40) e.state = 'idle';
    }
    physics(e);
    touch();
    if (e.y > H + 30) e.dead = true;
  } else if (d.beh === 'flyer') {
    e.st++;
    if (e.state === 'idle') {
      e.x = e.hx + Math.sin(e.t * 0.03) * 20;
      e.y = e.hy + Math.sin(e.t * 0.07) * 6;
      e.f = sign(dx);
      if (e.cd > 0) e.cd--;
      if (adx < 90 && e.cd <= 0 && !d.shoots) {
        e.state = 'swoop';
        e.st = 0;
        const a = Math.atan2(p.y - 14 - e.y, dx);
        e.vx = Math.cos(a) * 2;
        e.vy = Math.sin(a) * 2;
      }
      if (d.shoots && adx < 130 && e.cd <= 0) {
        e.cd = 110;
        const a = Math.atan2(p.y - 14 - e.y, dx);
        game.shots.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * 1.8,
          vy: Math.sin(a) * 1.8,
          r: 2,
          owner: 'e',
          dmg: d.dmg,
          type: 'eball',
          life: 150,
          col: d.col
        });
        sfx.ki();
      }
    } else if (e.state === 'swoop') {
      e.x += e.vx;
      e.y += e.vy;
      if (e.st > 45) {
        e.state = 'return';
      }
    } else if (e.state === 'return') {
      const tx = e.hx + Math.sin(e.t * 0.03) * 20,
        ty = e.hy;
      const a = Math.atan2(ty - e.y, tx - e.x);
      e.x += Math.cos(a) * 1.2;
      e.y += Math.sin(a) * 1.2;
      if (Math.hypot(tx - e.x, ty - e.y) < 3) {
        e.state = 'idle';
        e.cd = 80;
      }
    }
    touch();
  } else if (d.beh === 'crawler') {
    e.vx = e.f * 0.6;
    if (e.hitWall || e.onG && !tileAt(e.x + e.f * 10, e.y + 4)) e.f *= -1;
    if (adx < 60 && ady < 20 && e.onG && --e.cd <= 0) {
      e.cd = 90;
      e.vy = -2.5;
      e.f = sign(dx);
      e.vx = e.f * 1.6;
    }
    physics(e);
    touch();
    if (e.y > H + 30) e.dead = true;
  }
}
// ================= BOSS =================

export { updEnemy };
