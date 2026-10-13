import { game } from '../state.js';
import { H, W } from '../core/setup.js';
import { boxOf, clamp, overlap, sign } from '../core/helpers.js';
import { keys, pressed, released } from '../core/input.js';
import { playSong, sfx, tone } from '../audio/audio.js';
import { CH, LOOKS, NAMES } from '../data/data.js';
import { physics, tileAt } from './physics.js';
import { boom, dust, ghost, part, spark } from './particles.js';
import { bossBox, damageBoss } from './boss.js';

// ================= PLAYER =================
function newPlayer(c, x, y) {
  const d = CH[c];
  return {
    char: c,
    x,
    y,
    vx: 0,
    vy: 0,
    w: 10,
    h: 24,
    f: 1,
    onG: false,
    hp: d.hp,
    maxhp: d.hp,
    ki: 60,
    inv: 0,
    hurtT: 0,
    atkT: 0,
    atkLen: 0,
    atkType: '',
    atkId: 0,
    chain: 0,
    comboT: 0,
    queued: null,
    dashT: 0,
    dashCD: 0,
    kiHold: 0,
    castT: 0,
    castLen: 0,
    castType: '',
    shotCD: 0,
    airJ: 0,
    safeX: x,
    safeY: y,
    dead: 0,
    t: 0,
    fireT: 0,
    spreadT: 0,
    crouch: false,
    hits: 0,
    hitT: 0,
    land: 0,
    sup: 0
  };
}
function hurtPlayer(dmg, fromX) {
  const p = game.P;
  if (!p || p.inv > 0 || p.dead || p.dashT > 0 || p.castType === 'wolf' && p.castT > 0) return;
  p.hp -= dmg;
  p.inv = 70;
  p.hurtT = 18;
  p.atkT = 0;
  p.castT = 0;
  p.castType = '';
  p.kiHold = 0;
  p.queued = null;
  p.vx = sign(p.x - fromX) * 2;
  p.vy = game.mode === 'shmup' ? 0 : -2.4;
  game.shake = 7;
  sfx.hurt();
  p.crouch = false;
  p.h = 24;
  spark(p.x, p.y - 14, '#ff6060');
  for (const b of game.beams) if (b.owner === 'p') b.life = 0;
  if (p.hp <= 0) {
    p.hp = 0;
    p.dead = 1;
    sfx.boom();
    game.slowmo = 40;
  }
}
function hitTargets(box, dmg, kbx, kby, id, melee) {
  let hit = false;
  if (game.P && game.P.sup > 0) dmg = Math.round(dmg * 1.5);
  for (const e of game.enemies) {
    if (e.dead || e.lastHit === id) continue;
    if (overlap(box, boxOf(e))) {
      e.lastHit = id;
      damageEnemy(e, dmg, kbx, kby);
      hit = true;
    }
  }
  if (game.boss && game.boss.active && !game.boss.dying && !game.boss.gone && game.boss.lastHit !== id && overlap(box, bossBox())) {
    game.boss.lastHit = id;
    damageBoss(dmg, kbx, kby, melee);
    hit = true;
  }
  if (hit) {
    if (melee) {
      game.hitstop = Math.abs(kby) > 2 || Math.abs(kbx) > 2.4 ? 6 : 3;
      if (game.hitstop > 3) {
        sfx.big();
        game.shake = 6;
        game.zoomPunch = 1;
      } else sfx.hit();
    }
    if (game.P) {
      game.P.hits = game.P.hitT > 0 ? game.P.hits + 1 : 1;
      game.P.hitT = 80;
    }
  }
  return hit;
}
function damageEnemy(e, dmg, kbx, kby) {
  e.hp -= dmg;
  e.flash = 8;
  spark(e.x, e.y - e.h / 2);
  game.score += 10;
  const fly = e.d.beh === 'flyer' || e.d.beh === 'sh';
  if (fly) {
    if (e.d.beh === 'flyer') {
      e.vx = kbx;
      e.hurtT = 14;
      e.state = 'return';
    }
  } else if (e.air) {
    e.vy = Math.min(e.vy, -2);
    e.vx = kbx * 0.4;
  } else if (kby < -1.5 && (!e.d.armor || Math.abs(kbx) > 2)) {
    e.air = true;
    e.bounce = 0;
    e.vy = kby;
    e.vx = kbx * 0.7;
    e.atkT = 0;
    e.onG = false;
    e.y -= 1;
  } else if (!e.d.armor || Math.abs(kbx) > 2.4) {
    e.vx = kbx;
    e.hurtT = 16;
    e.atkT = 0;
  }
  if (e.hp <= 0) {
    e.dead = true;
    boom(e.x, e.y - e.h / 2, 14);
    sfx.boom();
    game.score += e.d.score;
    const r = Math.random();
    if (game.mode === 'stage') {
      if (r < 0.12) game.items.push({
        type: 'food',
        x: e.x,
        y: e.y - 10,
        vy: -2
      });else if (r < 0.42) game.items.push({
        type: 'orb',
        x: e.x,
        y: e.y - 10,
        vy: -2
      });
    } else if (r < 0.2) game.items.push({
      type: r < 0.07 ? 'food' : 'orb',
      x: e.x,
      y: e.y - 6,
      vx: -0.6
    });
  }
}
function kiCost() {
  return game.P.char === 'wulma' ? 3 : 8;
}
const ATK = {
  p1: {
    len: 11,
    a: 2,
    b: 5,
    ox: 4,
    w: 14,
    oy: 12,
    h: 9,
    dmg: 1,
    kb: 0.6,
    kby: 0,
    pose: 'jab',
    snd: 'punch'
  },
  p2: {
    len: 12,
    a: 3,
    b: 6,
    ox: 4,
    w: 14,
    oy: 12,
    h: 9,
    dmg: 1.1,
    kb: 0.8,
    kby: 0,
    pose: 'cross',
    snd: 'punch'
  },
  hook: {
    len: 18,
    a: 5,
    b: 9,
    ox: 4,
    w: 16,
    oy: 10,
    h: 14,
    dmg: 1.6,
    kb: 2,
    kby: -3.6,
    pose: 'upper',
    snd: 'kick'
  },
  staff: {
    len: 24,
    a: 5,
    b: 15,
    ox: 6,
    w: 40,
    oy: 12,
    h: 7,
    dmg: 1.5,
    kb: 2.8,
    kby: -1.8,
    pose: 'staff',
    snd: 'kick'
  },
  upper: {
    len: 18,
    a: 4,
    b: 9,
    ox: 2,
    w: 14,
    oy: 12,
    h: 18,
    dmg: 1.4,
    kb: 1,
    kby: -4.6,
    pose: 'upper',
    rise: true,
    snd: 'kick'
  },
  lowp: {
    len: 10,
    a: 2,
    b: 5,
    ox: 4,
    w: 14,
    oy: 1,
    h: 9,
    dmg: 0.9,
    kb: 0.6,
    kby: 0,
    pose: 'lowp',
    snd: 'punch'
  },
  k1: {
    len: 14,
    a: 4,
    b: 8,
    ox: 4,
    w: 16,
    oy: 5,
    h: 11,
    dmg: 1.2,
    kb: 1,
    kby: 0,
    pose: 'kick',
    snd: 'kick'
  },
  k2: {
    len: 18,
    a: 5,
    b: 11,
    ox: -2,
    w: 24,
    oy: 6,
    h: 12,
    dmg: 1.4,
    kb: 1.6,
    kby: 0,
    pose: 'round',
    snd: 'kick'
  },
  k3: {
    len: 20,
    a: 5,
    b: 10,
    ox: 4,
    w: 16,
    oy: 10,
    h: 16,
    dmg: 1.8,
    kb: 2.5,
    kby: -4,
    pose: 'highk',
    snd: 'kick'
  },
  sweep: {
    len: 18,
    a: 4,
    b: 10,
    ox: 2,
    w: 22,
    oy: 0,
    h: 7,
    dmg: 1.2,
    kb: 1,
    kby: -2.2,
    pose: 'sweep',
    snd: 'kick'
  },
  airp: {
    len: 14,
    a: 3,
    b: 8,
    ox: 4,
    w: 14,
    oy: 12,
    h: 10,
    dmg: 1,
    kb: 1,
    kby: -1,
    pose: 'jab',
    snd: 'punch'
  },
  airk: {
    len: 18,
    a: 3,
    b: 14,
    ox: 2,
    w: 16,
    oy: 2,
    h: 14,
    dmg: 1.2,
    kb: 2,
    kby: -1,
    pose: 'airk',
    snd: 'kick'
  },
  dive: {
    len: 40,
    a: 2,
    b: 38,
    ox: 2,
    w: 14,
    oy: -2,
    h: 10,
    dmg: 1.5,
    kb: 2,
    kby: -2.6,
    pose: 'dive',
    dive: true,
    snd: 'kick'
  }
};
function updPlayer() {
  const p = game.P,
    ch = CH[p.char];
  p.t++;
  if (p.hitT > 0) p.hitT--;
  if (p.land > 0) p.land--;
  if (p.dead) {
    p.dead++;
    p.vx *= 0.9;
    if (game.mode === 'stage') physics(p);
    if (p.dead > 100) {
      game.state = 'gameover';
      game.goT = 0;
      playSong(null);
    }
    return;
  }
  if (p.inv > 0) p.inv--;
  if (p.dashCD > 0) p.dashCD--;
  if (p.shotCD > 0) p.shotCD--;
  if (p.comboT > 0) p.comboT--;else p.chain = 0;
  if (p.sup > 0) {
    p.sup++;
    p.ki -= 0.14;
    if (p.ki <= 0) {
      p.ki = 0;
      p.sup = 0;
      game.banner = {
        text: 'SUPER VORBEI',
        t: 50
      };
      tone(500, 0.4, 'sawtooth', 0.05, 120);
    }
  } else p.ki = Math.min(100, p.ki + 0.04);
  if (p.hurtT > 0) {
    p.hurtT--;
    p.vx *= 0.9;
    if (game.mode === 'stage') physics(p);else {
      p.x = clamp(p.x + p.vx, 10, W - 14);
    }
    return;
  }
  let mv = (keys.left ? -1 : 0) + (keys.right ? 1 : 0),
    vmv = (keys.up ? -1 : 0) + (keys.down ? 1 : 0);
  const busy = p.atkT > 0 || p.castT > 0;
  if (keys.ki && !busy && p.dashT <= 0) p.kiHold++;
  const charging = p.kiHold > 12 && keys.ki;
  if (pressed.super && p.sup <= 0 && !busy && p.dashT <= 0) {
    if (p.ki >= 100) {
      p.castT = p.castLen = 48;
      p.castType = 'super';
      p.inv = Math.max(p.inv, 60);
      p.vx = 0;
      p.kiHold = 0;
      p.atkT = 0;
      sfx.charge();
    } else if (!game.banner) game.banner = {
      text: 'KI MUSS VOLL SEIN!',
      t: 45
    };
  }
  if (charging) {
    p.ki = Math.min(100, p.ki + (p.sup > 0 ? 0 : 0.6));
    if (p.t % 10 === 0) sfx.charge();
    if (p.t % 2 === 0) {
      const a = Math.random() * 6.28;
      part(p.x + Math.cos(a) * 12, p.y - 12 + Math.sin(a) * 16, -Math.cos(a) * 0.7, -Math.sin(a) * 0.7 - 0.4, 14, p.ki >= 50 ? '#ffe060' : '#a0e0ff', 1.4, 'p', 0, (Math.random() - 0.5) * 0.6);
    }
  }
  if (released.ki && !busy) {
    if (p.kiHold <= 12 && p.kiHold > 0) kiShot();else if (p.kiHold > 12 && p.ki >= 50) special();
    p.kiHold = 0;
  }
  if (!keys.ki && !released.ki) p.kiHold = 0;
  if (pressed.dash && p.dashCD <= 0 && p.castT <= 0) {
    p.dashT = 12;
    p.dashCD = 34;
    p.atkT = 0;
    sfx.dash();
    if (mv) p.f = mv;
    p.crouch = false;
  }
  if (p.dashT > 0) {
    p.dashT--;
    if (p.t % 2 === 0) ghost(p, LOOKS[p.char], p.f);
    if (game.mode === 'stage') {
      p.vx = p.f * 4.2;
      p.vy = Math.min(p.vy, 0.5);
      physics(p);
    } else {
      p.x = clamp(p.x + p.f * 4, 10, W - 14);
    }
    clampPlayer();
    return;
  }
  // crouch
  p.crouch = game.mode === 'stage' && p.onG && keys.down && p.castT <= 0 && !charging;
  p.h = p.crouch ? 14 : 24;
  // attacks
  const ap = pressed.atk ? 'P' : pressed.kick ? 'K' : null;
  if (ap && p.castT <= 0 && !charging && game.mode === 'stage') {
    if (p.atkT > 0) {
      if (p.atkT < p.atkLen - 3) p.queued = ap;
    } else startAtk(ap);
  }
  if (p.atkT > 0) {
    p.atkT--;
    const el = p.atkLen - p.atkT;
    const A = ATK[p.atkType];
    if (A.dive && el >= 2) {
      p.vx = p.f * 3.2;
      p.vy = 3.6;
      if (p.t % 3 === 0) ghost(p, LOOKS[p.char], p.f);
    }
    if (A.rise && el === A.a) {
      p.vy = -2.6;
    }
    if (el >= A.a && el <= A.b) {
      const bx = p.x + p.f * (A.ox + A.w / 2);
      const box = {
        l: bx - A.w / 2,
        r: bx + A.w / 2,
        t: p.y - A.oy - A.h,
        b: p.y - A.oy
      };
      if (hitTargets(box, Math.round(ch.dmg * A.dmg), p.f * A.kb, A.kby, p.atkId, true)) {
        spark(bx + p.f * A.w / 3, p.y - A.oy - A.h / 2);
        if (A.dive) {
          p.vy = -3.6;
          p.vx = -p.f * 1;
          p.atkT = 0;
        }
      }
    }
    if (el === A.a) sfx[A.snd]();
    if (A.dive && p.onG && el > 3) {
      p.atkT = 0;
      dust(p.x, p.y, 8);
      game.shake = 4;
    }
    if (p.atkT === 0) {
      p.comboT = 16;
      if (p.queued) {
        const q = p.queued;
        p.queued = null;
        startAtk(q);
      }
    }
  }
  if (p.castT > 0) {
    if (p.castType === 'super') updSuperCast();else updCast();
  }
  if (p.sup > 0 && Math.abs(p.vx) > 1 && p.t % 5 === 0) ghost(p, LOOKS[p.char], p.f);
  if (game.mode === 'stage') {
    const lock = p.atkT > 0 && p.onG || p.castT > 0 || charging || p.crouch;
    if (!lock) {
      const tv = mv * ch.spd * (p.sup > 0 ? 1.25 : 1);
      p.vx += (tv - p.vx) * 0.35;
      if (Math.abs(p.vx) < 0.05) p.vx = 0;
      if (mv) p.f = mv;
    } else {
      p.vx *= 0.6;
      if (p.crouch && mv) p.f = mv;
    }
    if ((pressed.jump || pressed.up) && !charging && p.castT <= 0 && (p.atkT <= 0 || !p.onG)) {
      if (keys.down && p.onG && tileAt(p.x, p.y + 2) === 2) {
        p.drop = 10;
      } else if (p.onG) {
        p.vy = -ch.jmp;
        p.airJ = 0;
        sfx.jump();
        dust(p.x, p.y, 4);
        p.crouch = false;
        p.h = 24;
      } else if (p.airJ < 1) {
        p.vy = -ch.jmp * 0.85;
        p.airJ++;
        sfx.jump();
        part(p.x, p.y, 0, 0, 12, '#ffffff', 4, 'ring', 0, 0);
      }
    }
    if (!keys.jump && !keys.up && p.vy < -2 && !(p.atkT > 0 && ATK[p.atkType].rise)) p.vy = -2;
    if (p.drop > 0) p.drop--;
    const wasG = p.onG;
    const vyb = p.vy;
    physics(p, p.drop > 0);
    if (p.onG && !wasG) {
      dust(p.x, p.y, vyb > 4 ? 7 : 3);
      p.land = 8;
    }
    if (p.onG) {
      p.airJ = 0;
      const l = tileAt(p.x - 6, p.y + 2),
        r = tileAt(p.x + 6, p.y + 2);
      if (l && r && !game.bossTriggered) {
        p.safeX = p.x;
        p.safeY = p.y;
      }
    }
    if (p.y > H + 40) hurtFall();
  } else {
    const sp = charging || p.castT > 0 ? 0.8 : 2.2;
    p.x = clamp(p.x + mv * sp, 10, W - 14);
    p.y = clamp(p.y + vmv * sp, 34, H - 6);
    p.f = 1;
    p.vx = mv * sp;
    if (keys.atk && p.castT <= 0 && !charging) {
      if (p.fireT <= 0) {
        p.fireT = 8;
        shotsPlayer(p.char === 'wulma' ? 'bullet' : 'ki', true);
      }
    }
    if (p.fireT > 0) p.fireT--;
    if (keys.kick && p.castT <= 0 && !charging) {
      if (p.spreadT <= 0) {
        p.spreadT = 16;
        for (const a of [-0.35, 0, 0.35]) game.shots.push({
          x: p.x + 12,
          y: p.y - 14,
          vx: Math.cos(a) * 4,
          vy: Math.sin(a) * 4,
          r: 2,
          owner: 'p',
          dmg: 3,
          type: 'ki',
          life: 70,
          id: ++game.atkId
        });
        tone(900, 0.05, 'square', 0.02, 500);
      }
    }
    if (p.spreadT > 0) p.spreadT--;
  }
  clampPlayer();
}
function updSuperCast() {
  const p = game.P;
  p.castT--;
  const el = p.castLen - p.castT;
  p.vx = 0;
  game.shake = Math.max(game.shake, el > 30 ? 4 : 2);
  if (p.t % 2 === 0) for (let i = 0; i < 2; i++) {
    const a = Math.random() * 6.28;
    part(p.x + Math.cos(a) * 14, p.y - 4 - Math.random() * 10, 0, -1.2 - Math.random(), 20, Math.random() < 0.5 ? '#ffe060' : '#fff4b0', 1.6, 'p', 0, (Math.random() - 0.5) * 0.4);
  }
  if (el % 12 === 0) tone(200 + el * 12, 0.15, 'sawtooth', 0.04, 400 + el * 20);
  if (p.castT <= 0) {
    p.sup = 1;
    game.flashT = 10;
    game.shake = 12;
    game.zoomPunch = 1;
    sfx.big();
    game.banner = {
      text: 'SUPER ' + NAMES[p.char].toUpperCase() + '!',
      t: 80
    };
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * 6.28;
      part(p.x, p.y - 12, Math.cos(a) * 3, Math.sin(a) * 3, 26, '#ffd040', 2, 'p', 0, 0);
    }
    part(p.x, p.y - 12, 0, 0, 16, '#ffffff', 6, 'ring', 0, 0);
  }
}
function startAtk(kind) {
  const p = game.P;
  let type;
  if (!p.onG) type = kind === 'K' ? keys.down ? 'dive' : 'airk' : 'airp';else if (p.crouch) type = kind === 'K' ? 'sweep' : 'lowp';else if (keys.up && kind === 'P') type = 'upper';else {
    p.chain = p.comboT > 0 ? p.chain + 1 : 1;
    if (p.chain > 3) p.chain = 1;
    const i = p.chain - 1;
    type = kind === 'P' ? ['p1', 'p2', p.char === 'goki' ? 'staff' : 'hook'][i] : ['k1', 'k2', 'k3'][i];
  }
  p.atkType = type;
  p.atkLen = ATK[type].len;
  p.atkT = p.atkLen;
  p.atkId = ++game.atkId;
  p.comboT = 0;
  if (p.onG) p.vx = p.f * 0.8;
}
function hurtFall() {
  const p = game.P;
  p.hp -= 15;
  sfx.hurt();
  if (p.hp <= 0) {
    p.hp = 0;
    p.dead = 1;
    p.y = H + 50;
    return;
  }
  p.x = p.safeX;
  p.y = p.safeY - 4;
  p.vx = 0;
  p.vy = 0;
  p.inv = 80;
}
function clampPlayer() {
  const p = game.P;
  if (game.mode === 'stage') {
    if (game.camLock) p.x = clamp(p.x, game.arenaL + 8, game.arenaL + W - 8);else p.x = clamp(p.x, 6, game.L.w - 6);
  }
}
function shotsPlayer(kind, free) {
  const p = game.P;
  const hy = p.y - (p.crouch ? 8 : 14);
  if (kind === 'bullet') {
    game.shots.push({
      x: p.x + p.f * 12,
      y: hy,
      vx: p.f * 5.5,
      vy: 0,
      r: 1,
      owner: 'p',
      dmg: free ? 4 : 6,
      type: 'bullet',
      life: 60,
      id: ++game.atkId
    });
    sfx.gun();
  } else {
    game.shots.push({
      x: p.x + p.f * 12,
      y: hy,
      vx: p.f * 4.2,
      vy: 0,
      r: 3,
      owner: 'p',
      dmg: free ? 3 : 7,
      type: 'ki',
      life: 70,
      id: ++game.atkId
    });
    if (!free) sfx.ki();else tone(1200, 0.05, 'square', 0.02, 600);
  }
}
function kiShot() {
  const p = game.P;
  if (p.ki < kiCost() || p.shotCD > 0) return;
  p.ki -= kiCost();
  p.shotCD = 10;
  p.castT = 12;
  p.castLen = 12;
  p.castType = 'shot';
  shotsPlayer(p.char === 'wulma' ? 'bullet' : 'ki', false);
  if (game.mode === 'shmup') {
    game.shots[game.shots.length - 1].dmg = 12;
    game.shots[game.shots.length - 1].r = 5;
  }
}
function special() {
  const p = game.P;
  p.ki -= 50;
  p.vx = 0;
  const c = p.char;
  if (c === 'goki') {
    p.castType = 'kame';
    p.castLen = 24 + 40;
  } else if (c === 'joshi') {
    p.castType = 'max';
    p.castLen = 34 + 48;
  } else if (c === 'kurikin') {
    p.castType = 'kien';
    p.castLen = 28;
  } else if (c === 'tjamtschu') {
    p.castType = 'wolf';
    p.castLen = 36;
  } else {
    p.castType = 'bomb';
    p.castLen = 22;
  }
  p.castT = p.castLen;
  game.banner = {
    text: CH[c].sp + '!',
    t: 70
  };
}
function updCast() {
  const p = game.P;
  p.castT--;
  const el = p.castLen - p.castT;
  const t = p.castType;
  if (t === 'kame' || t === 'max') {
    const ct = t === 'kame' ? 24 : 34;
    if (el < ct) {
      if (el % 6 === 0) sfx.charge();
    }
    if (el === ct) {
      sfx.beam();
      game.shake = 9;
      game.flashT = 6;
      game.beams.push({
        owner: 'p',
        x: p.x + p.f * 12,
        y: p.y - 13,
        f: p.f,
        len: 0,
        max: 250,
        thick: t === 'kame' ? 7 : 12,
        life: t === 'kame' ? 40 : 48,
        dmg: t === 'kame' ? 5 : 7,
        tick: 0,
        col: ['#3a7af8', '#9ad8ff']
      });
    }
  } else if (t === 'kien') {
    if (el === 12) {
      game.shots.push({
        x: p.x + p.f * 4,
        y: p.y - 30,
        vx: p.f * 4.5,
        vy: 0.6,
        r: 5,
        owner: 'p',
        dmg: 28,
        type: 'disc',
        life: 90,
        id: ++game.atkId,
        pierce: true
      });
      sfx.ki();
    }
  } else if (t === 'bomb') {
    if (el === 8) {
      game.shots.push({
        x: p.x + p.f * 6,
        y: p.y - 26,
        vx: p.f * 2.8,
        vy: game.mode === 'shmup' ? 0 : -3.2,
        r: 3,
        owner: 'p',
        dmg: 40,
        type: 'bomb',
        life: 120,
        id: ++game.atkId,
        grav: game.mode === 'shmup' ? 0 : 0.18
      });
      sfx.dash();
    }
  } else if (t === 'wolf') {
    if (el > 4 && el < 30) {
      if (game.mode === 'stage') {
        p.vx = p.f * 3.6;
        physics(p);
      } else p.x = clamp(p.x + p.f * 3, 10, W - 14);
      if (el % 5 === 0) {
        p.atkId = ++game.atkId;
        sfx.punch();
      }
      const box = {
        l: p.x + (p.f > 0 ? -2 : -16),
        r: p.x + (p.f > 0 ? 16 : 2),
        t: p.y - 22,
        b: p.y - 2
      };
      if (hitTargets(box, 7, p.f * 1, 0, p.atkId, true)) spark(p.x + p.f * 12, p.y - 14, '#c0ffc0');
      if (p.t % 2 === 0) ghost(p, LOOKS[p.char], p.f);
    }
    if (el === 31) {
      p.atkId = ++game.atkId;
      const box = {
        l: p.x + (p.f > 0 ? 0 : -20),
        r: p.x + (p.f > 0 ? 20 : 0),
        t: p.y - 24,
        b: p.y
      };
      if (hitTargets(box, 14, p.f * 3.5, -3, p.atkId, true)) game.shake = 8;
    }
  }
  if (p.castT === 0) p.castType = '';
}
// ================= ENEMIES =================

export { ATK, hitTargets, hurtPlayer, newPlayer, updPlayer };
