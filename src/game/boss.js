import { game } from '../state.js';
import { W } from '../core/setup.js';
import { boxOf, clamp, lerp, overlap, sign } from '../core/helpers.js';
import { playSong, sfx } from '../audio/audio.js';
import { BOSS, LOOKS, STORY } from '../data/data.js';
import { physics } from './physics.js';
import { boom, dust, ghost, part, spark } from './particles.js';
import { hurtPlayer } from './player.js';
import { spawnSh } from './shmup.js';
import { bossDefeated, dlgStart } from './flow.js';

// ================= BOSS =================
function makeBoss(key) {
  const d = BOSS[key];
  return {
    key,
    d,
    x: game.arenaL + 190,
    y: 128,
    vx: 0,
    vy: 0,
    w: 14,
    h: 26,
    f: -1,
    hp: d.hp,
    maxhp: d.hp,
    spd: d.spd,
    state: 'wait',
    st: 0,
    t: 0,
    cd: 60,
    flash: 0,
    lastHit: 0,
    hitCount: 0,
    hitDecay: 0,
    active: false,
    dying: 0,
    sc: 1,
    phase: 1,
    onG: false,
    atks: d.atks.slice(),
    gone: false
  };
}
function bossBox() {
  const b = game.boss;
  if (b.key === 'rostbart') return {
    l: b.x - 38,
    r: b.x + 38,
    t: b.y - 14,
    b: b.y + 30
  };
  return {
    l: b.x - b.w / 2,
    r: b.x + b.w / 2,
    t: b.y - b.h,
    b: b.y
  };
}
function damageBoss(dmg, kbx, kby, melee) {
  const b = game.boss;
  if (b.state === 'transform' || b.state === 'grow') return;
  b.hp -= dmg;
  b.flash = 8;
  spark(b.x + (Math.random() * 10 - 5), b.y - (b.key === 'rostbart' ? 0 : b.h / 2));
  game.score += 15;
  if (melee) {
    b.hitCount++;
    b.hitDecay = 70;
    if (Math.abs(kbx) > 2 && b.key !== 'rostbart') b.vx = kbx * 0.5;
  }
  if (b.key !== 'rostbart' && b.hitCount >= 8 && b.state !== 'burst' && b.state !== 'beam') {
    b.state = 'burst';
    b.st = 0;
    b.hitCount = 0;
  }
  if (b.hp <= 0) {
    b.hp = 0;
    if (b.key === 'morgrak' && b.phase === 1) {
      b.state = 'transform';
      b.st = 0;
      for (const x of game.beams) x.life = 0;
      game.clash = null;
    } else {
      b.dying = 1;
      for (const x of game.beams) x.life = 0;
      game.clash = null;
      game.score += 2000;
      game.slowmo = 70;
      game.flashT = 8;
    }
  }
}
function bossToIdle(cd) {
  game.boss.state = 'idle';
  game.boss.st = 0;
  game.boss.cd = cd;
}
function updBoss() {
  const b = game.boss;
  if (b.gone) return;
  b.t++;
  if (b.flash > 0) b.flash--;
  if (b.hitDecay > 0 && --b.hitDecay === 0) b.hitCount = 0;
  if (b.key === 'rostbart') return updAirship();
  if (b.dying) {
    b.dying++;
    b.vx = 0;
    physics(b);
    if (b.dying % 8 === 0) {
      boom(b.x + (Math.random() * 20 - 10) * b.sc, b.y - Math.random() * b.h, 10);
      sfx.boom();
      game.shake = 5;
    }
    if (b.dying > 100) {
      b.active = false;
      b.dying = 0;
      b.gone = true;
      boom(b.x, b.y - b.h / 2, 30, 2);
      bossDefeated();
    }
    return;
  }
  if (!b.active) return;
  const p = game.P,
    sc = b.sc,
    dx = p.x - b.x,
    adx = Math.abs(dx);
  const face = () => {
    b.f = dx >= 0 ? 1 : -1;
  };
  b.st++;
  switch (b.state) {
    case 'transform':
      b.vx = 0;
      if (b.st === 1) {
        dlgStart(STORY[4].phase2, () => {
          b.state = 'grow';
          b.st = 0;
        });
      }
      break;
    case 'grow':
      if (b.st % 6 === 0) {
        boom(b.x, b.y - 20, 8);
        sfx.boom();
        game.shake = 7;
      }
      b.grow = b.st / 60;
      if (b.st > 60) {
        b.phase = 2;
        b.sc = 2;
        b.w = 24;
        b.h = 50;
        b.hp = b.maxhp = 240;
        b.spd = 1.1;
        b.atks = ['jump', 'beam', 'shot', 'melee', 'dash', 'melee'];
        b.d = Object.assign({}, b.d, {
          dmg: 16,
          shots: 5
        });
        bossToIdle(50);
        playSong('boss');
      }
      break;
    case 'idle':
      face();
      b.vx = adx > 34 * sc ? sign(dx) * b.spd : 0;
      if (b.st > b.cd) {
        const a = b.atks[Math.floor(Math.random() * b.atks.length)];
        b.state = a;
        b.st = 0;
        b.kick = Math.random() < 0.5;
        if (a === 'beam') sfx.warn();
      }
      break;
    case 'melee':
      face();
      b.vx = sign(dx) * b.spd * 2;
      if (adx <= 20 * sc || b.st > 70) {
        b.state = 'strike';
        b.st = 0;
        b.vx = 0;
      }
      break;
    case 'strike':
      b.vx = 0;
      if (b.st === 8) sfx.punch();
      if (b.st >= 8 && b.st <= 13) {
        const bx = b.x + b.f * 14 * sc;
        const lowK = b.kick;
        if (overlap({
          l: bx - 10 * sc,
          r: bx + 10 * sc,
          t: b.y - (lowK ? 10 : 20) * sc,
          b: b.y - (lowK ? 0 : 6) * sc
        }, boxOf(p))) hurtPlayer(b.d.dmg, b.x);
      }
      if (b.st > 26) bossToIdle(b.d.cd);
      break;
    case 'shot':
      b.vx = 0;
      face();
      {
        const n = b.d.shots || 2;
        if (b.st % 16 === 8 && b.st <= 8 + 16 * (n - 1)) {
          const a = Math.atan2(p.y - 12 - (b.y - 14 * sc), dx);
          game.shots.push({
            x: b.x + b.f * 10 * sc,
            y: b.y - 14 * sc,
            vx: Math.cos(a) * 2.6,
            vy: Math.sin(a) * 2.6,
            r: 3,
            owner: 'e',
            dmg: b.d.dmg - 2,
            type: 'eball',
            life: 120,
            col: b.d.shotCol || ['#ff8040', '#a02010']
          });
          sfx.ki();
        }
        if (b.st > 16 * n + 20) bossToIdle(b.d.cd);
      }
      break;
    case 'dash':
      if (b.st < 26) {
        b.vx = 0;
        face();
      } else if (b.st < 62) {
        b.vx = b.f * 4.2;
        if (b.t % 3 === 0 && sc === 1) ghost(b, LOOKS[b.d.look], b.f);
        if (overlap(bossBox(), boxOf(p))) hurtPlayer(b.d.dmg + 2, b.x);
      } else {
        b.vx *= 0.8;
        if (b.st > 76) bossToIdle(b.d.cd);
      }
      break;
    case 'jump':
      if (b.st === 1) {
        face();
        b.vy = -5.4;
        b.vx = clamp(dx / 42, -2.6, 2.6);
      }
      if (b.st > 6 && b.onG) {
        b.vx = 0;
        game.shake = 9;
        sfx.boom();
        dust(b.x, b.y, 10);
        for (const s of [-1, 1]) game.shots.push({
          x: b.x + s * 10 * sc,
          y: b.y - 5,
          vx: s * 2.4,
          vy: 0,
          r: 4,
          owner: 'e',
          dmg: b.d.dmg - 2,
          type: 'wave',
          life: 110
        });
        bossToIdle(b.d.cd + 10);
      }
      if (!b.onG && overlap(bossBox(), boxOf(p))) hurtPlayer(b.d.dmg, b.x);
      break;
    case 'beam':
      b.vx = 0;
      if (b.st === 1) face();
      if (b.st === 52) {
        sfx.beam();
        game.shake = 9;
        game.beams.push({
          owner: 'e',
          x: b.x + b.f * 12 * sc,
          y: b.y - (sc > 1 ? 20 : 18),
          f: b.f,
          len: 0,
          max: 260,
          thick: sc > 1 ? 12 : 8,
          life: 56,
          dmg: b.d.dmg,
          tick: 0,
          col: b.d.beam || ['#ff3818', '#ff9060']
        });
      }
      if (b.st > 52 + 60 && !game.clash) bossToIdle(b.d.cd + 20);
      break;
    case 'burst':
      b.vx = 0;
      if (b.st === 10) {
        part(b.x, b.y - 14 * sc, 0, 0, 20, '#ffffff', 10, 'ring', 0, 0);
        game.shake = 6;
        sfx.boom();
        if (adx < 56 * sc) {
          hurtPlayer(6, b.x);
          if (game.P.hurtT > 0) game.P.vx = sign(dx) * 3;
        }
      }
      if (b.st > 32) bossToIdle(30);
      break;
    case 'wait':
      b.vx = 0;
      break;
  }
  physics(b);
  b.x = clamp(b.x, game.arenaL + 10, game.arenaL + W - 10);
  if (b.state !== 'dash' && !p.dead && overlap(bossBox(), boxOf(p)) && p.onG) {
    p.x += sign(p.x - b.x) * 1.5;
  }
}
function updAirship() {
  const b = game.boss;
  if (b.dying) {
    b.dying++;
    b.y += 0.3;
    if (b.dying % 6 === 0) {
      boom(b.x + (Math.random() * 70 - 35), b.y + (Math.random() * 30 - 15), 10);
      sfx.boom();
      game.shake = 5;
    }
    if (b.dying > 120) {
      b.active = false;
      b.dying = 0;
      b.gone = true;
      bossDefeated();
    }
    return;
  }
  if (!b.active) {
    if (b.x > W - 60) b.x -= 0.8;
    return;
  }
  b.x = lerp(b.x, W - 60 + Math.sin(b.t * 0.013) * 16, 0.05);
  b.y = 72 + Math.sin(b.t * 0.021) * 34;
  b.st++;
  const rage = b.hp < b.maxhp * 0.45;
  const cyc = rage ? 60 : 85;
  if (b.st % cyc === 0) {
    const k = b.st / cyc % 3;
    if (k === 0) {
      const n = rage ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i - (n - 1) / 2) * 0.22;
        game.shots.push({
          x: b.x - 36,
          y: b.y + 4,
          vx: Math.cos(a) * 2.2,
          vy: Math.sin(a) * 2.2,
          r: 2,
          owner: 'e',
          dmg: 9,
          type: 'eball',
          life: 200,
          col: ['#ffb040', '#c04010']
        });
      }
      sfx.ki();
    } else if (k === 1) {
      for (let i = 0; i < 3; i++) setTimeoutFrames(i * 10, () => {
        if (!game.boss || game.boss.dying || game.boss.gone) return;
        const a = Math.atan2(game.P.y - 14 - (game.boss.y + 10), game.P.x - (game.boss.x - 20));
        game.shots.push({
          x: game.boss.x - 20,
          y: game.boss.y + 10,
          vx: Math.cos(a) * 2.8,
          vy: Math.sin(a) * 2.8,
          r: 2,
          owner: 'e',
          dmg: 9,
          type: 'bullet',
          life: 150
        });
        sfx.gun();
      });
    } else {
      spawnSh('plane', b.y - 20);
      spawnSh('plane', b.y + 30);
    }
  }
  if (!game.P.dead && overlap(bossBox(), boxOf(game.P))) hurtPlayer(10, game.P.x + 10);
}
game.timers = [];
function setTimeoutFrames(n, fn) {
  game.timers.push({
    n,
    fn
  });
}
function updTimers() {
  const t = game.timers;
  game.timers = [];
  for (const x of t) {
    x.n--;
    if (x.n <= 0) x.fn();else game.timers.push(x);
  }
}
// ================= SHOTS & BEAMS =================

export { bossBox, bossToIdle, damageBoss, makeBoss, setTimeoutFrames, updBoss, updTimers };
