import { game } from '../state.js';
import { H, W } from '../core/setup.js';
import { boxOf, clamp, lerp, overlap, sign } from '../core/helpers.js';
import { pressed } from '../core/input.js';
import { sfx } from '../audio/audio.js';
import { tileAt } from './physics.js';
import { boom, spark } from './particles.js';
import { hitTargets, hurtPlayer } from './player.js';
import { bossToIdle, damageBoss } from './boss.js';

// ================= SHOTS & BEAMS =================
function updShots() {
  for (const s of game.shots) {
    s.x += s.vx;
    s.y += s.vy;
    if (s.grav) s.vy += s.grav;
    s.life--;
    s.t = (s.t || 0) + 1;
    if (game.mode === 'stage') {
      if (s.type === 'wave') {
        if (tileAt(s.x + sign(s.vx) * 4, s.y) === 1) s.life = 0;
      } else if (s.type !== 'disc' && tileAt(s.x, s.y) === 1) {
        if (s.type === 'bomb') explode(s);else spark(s.x, s.y);
        s.life = 0;
        continue;
      }
    } else if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) s.life = 0;
    if (s.type === 'bomb' && s.life <= 0) {
      explode(s);
      continue;
    }
    const box = {
      l: s.x - s.r - 1,
      r: s.x + s.r + 1,
      t: s.y - s.r - 1,
      b: s.y + s.r + 1
    };
    if (s.owner === 'p') {
      if (hitTargets(box, s.dmg, sign(s.vx) * (s.type === 'disc' ? 1 : 1.4), 0, s.id, false)) {
        if (s.type === 'bomb') {
          explode(s);
          s.life = 0;
        } else if (!s.pierce) {
          s.life = 0;
          spark(s.x, s.y);
          sfx.hit();
        }
      }
    } else if (!game.P.dead) {
      const pb = boxOf(game.P);
      if (game.mode === 'shmup') {
        pb.l += 2;
        pb.r -= 2;
        pb.t += 6;
      }
      if (overlap(box, pb)) {
        hurtPlayer(s.dmg, s.x - s.vx * 4);
        if (s.type !== 'wave') s.life = 0;
      }
    }
  }
  game.shots = game.shots.filter(s => s.life > 0);
}
function explode(s) {
  boom(s.x, s.y, 24, 1.6);
  sfx.boom();
  game.shake = 9;
  const id = ++game.atkId;
  hitTargets({
    l: s.x - 30,
    r: s.x + 30,
    t: s.y - 30,
    b: s.y + 30
  }, s.dmg, sign(s.vx) * 3, -3, id, false);
}
function updBeams() {
  const pb = game.beams.find(b => b.owner === 'p' && b.life > 0),
    eb = game.beams.find(b => b.owner === 'e' && b.life > 0);
  if (pb && eb && !game.clash && pb.f === -eb.f && Math.abs(pb.y - eb.y) < 18) {
    const pt = pb.x + pb.f * pb.len,
      et = eb.x + eb.f * eb.len;
    if (pb.f > 0 && pt >= et || pb.f < 0 && pt <= et) {
      game.clash = {
        v: 50,
        t: 0,
        pb,
        eb
      };
      sfx.beam();
    }
  }
  if (game.clash) {
    game.clash.t++;
    if (pressed.ki || pressed.atk || pressed.jump || pressed.kick) {
      game.clash.v += 7;
      sfx.charge();
    }
    game.clash.v -= 0.2 + game.chapter * 0.04;
    game.shake = 3;
    const {
      pb: a,
      eb: b
    } = game.clash;
    a.life = b.life = 20;
    const mx = lerp(a.x, b.x, clamp(game.clash.v, 0, 100) / 100);
    a.len = Math.abs(mx - a.x);
    b.len = Math.abs(b.x - mx);
    game.clash.mx = mx;
    if (game.frame % 2 === 0) spark(mx, (a.y + b.y) / 2, '#ffffff');
    if (game.clash.v >= 100) {
      game.clash = null;
      a.life = b.life = 0;
      game.banner = {
        text: 'GEWONNEN!',
        t: 60
      };
      boom(game.boss.x, game.boss.y - 20, 26, 1.8);
      damageBoss(55, 0, 0);
      sfx.boom();
      game.flashT = 6;
      if (game.boss.state === 'beam') bossToIdle(70);
    } else if (game.clash.v <= 0) {
      game.clash = null;
      a.life = b.life = 0;
      game.P.inv = 0;
      hurtPlayer(25, game.boss.x);
      if (game.boss.state === 'beam') bossToIdle(70);
    }
    return;
  }
  for (const b of game.beams) {
    b.life--;
    if (b.len < b.max) b.len = Math.min(b.max, b.len + 12);
    b.tick++;
    if (b.owner === 'p') {
      const p = game.P;
      b.x = p.x + p.f * 12;
      b.y = (game.mode === 'shmup' ? p.y - 3 : p.y) - 13;
    } else if (game.boss && game.boss.key !== 'rostbart') {
      b.x = game.boss.x + b.f * 12 * game.boss.sc;
    }
    const box = {
      l: Math.min(b.x, b.x + b.f * b.len),
      r: Math.max(b.x, b.x + b.f * b.len),
      t: b.y - b.thick / 2,
      b: b.y + b.thick / 2
    };
    if (b.owner === 'p') {
      if (b.tick % 5 === 0) hitTargets(box, b.dmg, b.f * 1.5, -0.5, ++game.atkId, false);
    } else if (!game.P.dead && overlap(box, boxOf(game.P))) hurtPlayer(b.dmg, b.x);
  }
  game.beams = game.beams.filter(b => b.life > 0);
}
// ================= ITEMS =================

export { updBeams, updShots };
