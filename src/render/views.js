import * as THREE from 'three';
import { game } from '../state.js';
import { clamp, lerp } from '../core/helpers.js';
import { keys } from '../core/input.js';
import { LOOKS } from '../data/data.js';
import { part } from '../game/particles.js';
import { ATK } from '../game/player.js';
import { Gp, M, bm, bx, cap, cone, cyl, sph, spr, tm } from './materials.js';
import { makeHumanoid } from './humanoid.js';
import { applyRig, poseHum } from './poses.js';
import { makeAirship, makeEgg, makeFlyer, makePlane, makeScorp, makeWolf } from './rigs.js';
import { wx, wy } from './world.js';

// ---------- views ----------
function getView(o, factory) {
  if (!o._v) {
    o._v = factory();
    game.dynG.add(o._v.root);
    game.views.push(o);
  }
  o._v.seen = game.frameId;
  return o._v;
}
function playerPoseName(p) {
  if (p.dead) return p.onG || game.mode === 'shmup' ? 'down' : 'hurt';
  if (p.hurtT > 0) return 'hurt';
  if (p.dashT > 0) return 'dash';
  if (p.castT > 0) {
    const t = p.castType,
      el = p.castLen - p.castT;
    if (t === 'shot') return p.char === 'wulma' ? 'gun' : 'jab';
    if (t === 'kame') return el < 24 ? 'beamcharge' : 'beam';
    if (t === 'max') return el < 34 ? 'beamcharge' : 'beam';
    if (t === 'kien' || t === 'bomb') return el < 6 ? 'charge' : 'throw';
    if (t === 'super') return 'charge';
    if (t === 'wolf') return el >> 2 & 1 ? 'jab' : 'cross';
  }
  if (p.atkT > 0) return ATK[p.atkType].pose;
  if (p.kiHold > 12 && keys.ki) return 'charge';
  if (game.mode === 'shmup') return 'fly';
  if (!p.onG) return p.vy < 0 ? 'jump' : 'fall';
  if (p.crouch) return 'crouch';
  if (Math.abs(p.vx) > 0.2) return 'walk';
  return 'idle';
}
function syncHum(r, o, pose, k, x) {
  r.ph += Math.abs(o.vx || 0) * 0.28;
  const T = poseHum(pose, game.frame, Object.assign({
    ph: r.ph
  }, x));
  applyRig(r, o.f, T, k);
}
function syncPlayer() {
  const p = game.P;
  const r = getView(p, () => {
    const v = makeHumanoid(LOOKS[p.char]);
    v.cloud = Gp(v.root);
    for (const q of [[0, 0, 0, .42], [.35, .05, .1, .3], [-.38, .04, -.05, .32], [.1, .12, .25, .26], [-.6, .08, 0, .2]]) M(sph(q[3], 12, 8), '#f8c838', v.cloud, q[0], q[1], q[2], false, [1.3, .5, 1]);
    v.cloud.visible = false;
    return v;
  });
  const pose = playerPoseName(p);
  const A = p.atkT > 0 ? ATK[p.atkType] : null;
  const prog = p.atkT > 0 ? (p.atkLen - p.atkT) / p.atkLen : p.castT > 0 ? (p.castLen - p.castT) / p.castLen : 0;
  r.root.position.set(wx(p.x), wy(game.mode === 'shmup' ? p.y - 4 : p.y), 0);
  syncHum(r, p, pose, p.atkT > 0 || p.castT > 0 || p.dashT > 0 ? 0.6 : 0.3, {
    p: prog
  });
  if (game.mode === 'shmup') {
    r.cloud.visible = true;
    r.cloud.position.set(0, -0.02 + Math.sin(game.frame * 0.2) * 0.03, 0);
    r.cloud.rotation.y = -r.root.rotation.y;
  } else r.cloud.visible = false;
  // squash on land
  const sq = p.land > 0 ? 1 - p.land * 0.025 : !p.onG && game.mode === 'stage' && p.vy < -2 ? 1.06 : 1;
  r.sq += (sq - r.sq) * 0.4;
  r.inner.scale.set((2 - r.sq) * (LOOKS[p.char].short ? 0.9 : 1), r.sq * (LOOKS[p.char].short ? 0.9 : 1), (2 - r.sq) * (LOOKS[p.char].short ? 0.9 : 1));
  r.root.visible = !(p.inv > 0 && !p.dead && p.inv >> 2 & 1);
  const near = p.f > 0 ? r.aR : r.aL,
    far = p.f > 0 ? r.aL : r.aR;
  if (near.staff) {
    near.staff.visible = pose === 'staff';
    far.staff.visible = false;
    if (pose === 'staff') {
      const el = p.atkLen - p.atkT;
      const len = clamp(el < 12 ? el * 0.26 : (24 - el) * 0.26, 0.4, 2.6);
      near.staff.scale.set(1, len, 1);
      near.staff.position.set(0, -0.22 - len / 2, 0);
    }
  }
  if (near.gun) {
    near.gun.visible = pose === 'gun';
    far.gun.visible = false;
  }
  if (p.kiHold > 12 && keys.ki) {
    game.auraMesh.visible = true;
    game.auraMesh.position.set(wx(p.x), wy(p.y - 13), 0);
    const s = 1 + Math.sin(game.frame * 0.8) * 0.06;
    game.auraMesh.scale.set(s * 1.1, s * 1.6, s * 1.1);
    game.auraMesh.material.color.set(p.ki >= 50 ? '#ffd040' : '#80c8ff');
    game.auraMesh.material.opacity = 0.22 + Math.sin(game.frame * 0.5) * 0.08;
    game.lightReq.push({
      x: p.x,
      y: p.y - 14,
      c: p.ki >= 50 ? 0xffd040 : 0x80c8ff,
      i: 2
    });
  } else game.auraMesh.visible = false;
  const supFx = p.sup > 0 || p.castType === 'super' && p.castT > 0;
  if (supFx && !game.auraMesh.visible) {
    game.auraMesh.visible = true;
    game.auraMesh.position.set(wx(p.x), wy((game.mode === 'shmup' ? p.y - 4 : p.y) - 13), 0);
    const s = 1 + Math.sin(game.frame * 0.9) * 0.08 + (p.castT > 0 ? 0.25 : 0);
    game.auraMesh.scale.set(s * 1.05, s * 1.75, s * 1.05);
    game.auraMesh.material.color.set('#ffd030');
    game.auraMesh.material.opacity = 0.2 + Math.sin(game.frame * 0.7) * 0.08;
    game.lightReq.push({
      x: p.x,
      y: p.y - 14,
      c: 0xffd040,
      i: p.castT > 0 ? 3 : 1.6
    });
  }
  const gold = p.sup > 0 || p.castType === 'super' && p.castT > 0 && p.castLen - p.castT > 24 && game.frame >> 1 & 1;
  if (r.goldOn !== gold) {
    const hc = tm(LOOKS[p.char].hc || '#000001'),
      gd = tm('#ffd830');
    const from = gold ? hc : gd,
      to = gold ? gd : hc;
    r.root.traverse(o => {
      if (o.isMesh && o.material === from) o.material = to;
    });
    r.goldOn = gold;
  }
  const kc = p.castType === 'kame' || p.castType === 'max';
  const el = p.castLen - p.castT,
    ct = p.castType === 'kame' ? 24 : 34;
  if (kc && el < ct) {
    game.kameBall.visible = true;
    const s = 0.5 + el / ct * 1.4 + Math.sin(game.frame * 0.9) * 0.1;
    game.kameBall.scale.setScalar(s);
    game.kameBall.position.set(wx(p.x - p.f * 7), wy((game.mode === 'shmup' ? p.y - 4 : p.y) - 11), 0.25);
    game.lightReq.push({
      x: p.x - p.f * 7,
      y: p.y - 12,
      c: 0x60a0ff,
      i: 3
    });
  } else game.kameBall.visible = false;
  if (p.castType === 'kien' && el < 12) {
    /* disc charging over head */const fx = getView(game.P.kienFx || (game.P.kienFx = {}), () => {
      const g2 = new THREE.Group();
      const d = new THREE.Mesh(cyl(.4, .4, .03, 20), bm('#ffe060', 0.9, true));
      g2.add(d);
      g2.add(spr(game.GLOW, 0xffe060, 1.4));
      return {
        root: g2,
        d
      };
    });
    fx.root.position.set(wx(p.x), wy(p.y - 34), 0.2);
    fx.d.rotation.y = game.frame * 0.6;
    fx.root.scale.setScalar(0.4 + el / 12 * 0.6);
  }
}
const ENEMY_FACTORY = {
  walker: e => makeHumanoid(LOOKS[e.d.look]),
  wolf: e => makeWolf(e.d),
  flyer: e => makeFlyer(e.d),
  crawler: e => makeScorp(e.d)
};
function syncEnemy(e) {
  const d = e.d;
  if (d.beh === 'sh') {
    const v = getView(e, () => e.type === 'plane' ? makePlane() : e.type === 'bird' ? makeFlyer({
      col: ['#4870c8', '#e8e8f0'],
      kind: 'bird'
    }) : (() => {
      const h = makeHumanoid(LOOKS.soldier);
      M(bx(.3, .4, .2), '#5a5a64', h.torso, 0, .25, -.22);
      const fl = spr(game.GLOW, 0xffa020, 0.8);
      fl.position.set(0, -.05, -.25);
      h.torso.add(fl);
      h.flame = fl;
      return h;
    })());
    v.root.position.set(wx(e.x), wy(e.y - (e.type === 'jet' ? 0 : 5)), 0);
    if (e.type === 'plane') {
      v.root.rotation.y = -Math.PI / 2;
      v.prop.rotation.z = game.frame * 0.9;
    } else if (e.type === 'bird') {
      v.root.rotation.y = -1.2;
      const f = Math.sin(game.frame * 0.35 + e.y0);
      v.wl.rotation.z = f * 0.8;
      v.wr.rotation.z = -f * 0.8;
    } else {
      syncHum(v, e, e.t % 45 < 10 && e.t > 50 ? 'gun' : 'fly', 0.4);
      v.flame.scale.setScalar(0.6 + Math.random() * 0.4);
    }
    hitPop(v, e);
    return;
  }
  const v = getView(e, () => ENEMY_FACTORY[d.beh](e));
  v.root.position.set(wx(e.x), wy(e.y), 0);
  if (d.beh === 'walker') {
    let pose = e.downT > 0 ? e.downT < 10 ? 'crouch' : 'down' : e.air ? 'hurt' : e.hurtT > 0 ? 'hurt' : e.atkT > 0 ? e.atkT > 12 ? 'charge' : 'jab' : e.shoot > 0 ? 'gun' : Math.abs(e.vx) > 0.1 ? 'walk' : 'idle';
    syncHum(v, e, pose, 0.35);
    if (e.air) v.inner.rotation.x -= e.t * 0.25;
    const near = e.f > 0 ? v.aR : v.aL,
      far = e.f > 0 ? v.aL : v.aR;
    if (near.gun) {
      near.gun.visible = d.gun;
      far.gun.visible = false;
    }
  } else if (d.beh === 'wolf') {
    const c = v.cur;
    const run = e.state === 'leap' || Math.abs(e.vx) > 0.3;
    c.face = lerp(c.face === undefined ? e.f * 1.3 : c.face, e.f * 1.3, 0.3);
    v.root.rotation.y = c.face;
    const ph = game.frame * 0.45;
    v.legs.forEach((lg, i) => {
      lg.rotation.x = run ? Math.sin(ph + (i < 2 ? 0 : Math.PI) + i % 2 * 0.6) * 0.8 : e.state === 'leap' ? i < 2 ? -1 : 1 : 0;
    });
    const cr = e.state === 'crouch' ? -0.12 : 0;
    v.body.position.y = 0.36 + cr;
    v.body.rotation.x = e.state === 'leap' ? -0.3 : cr * 1.5;
    v.tail.rotation.x = Math.sin(game.frame * 0.3) * 0.3;
    v.inner.rotation.x = e.air ? -e.t * 0.3 : 0;
    v.inner.rotation.z = e.downT > 0 ? 1.5 : 0;
    v.inner.position.y = e.downT > 0 ? 0.15 : 0;
  } else if (d.beh === 'flyer') {
    v.root.rotation.y = e.f * 1.2;
    if (v.wl) {
      const f = Math.sin(game.frame * 0.5 + e.hx);
      v.wl.rotation.z = f * 0.9;
      v.wr.rotation.z = -f * 0.9;
    }
    v.rotors.forEach(r2 => r2.rotation.y = game.frame * 0.8);
    v.root.rotation.z = e.state === 'swoop' ? -0.4 * e.f : 0;
  } else if (d.beh === 'crawler') {
    v.root.rotation.y = e.f * 1.25;
    v.tail.rotation.x = Math.sin(game.frame * 0.15) * 0.2;
    v.body.position.y = 0.16 + (e.onG ? 0 : 0.05);
    v.inner.rotation.x = e.air ? -e.t * 0.3 : 0;
    v.inner.rotation.z = e.downT > 0 ? Math.PI : 0;
    v.inner.position.y = e.downT > 0 ? 0.3 : 0;
  }
  hitPop(v, e);
}
function hitPop(v, e) {
  const k = e.flash > 0 ? 1 + e.flash * 0.03 : 1;
  v.root.scale.setScalar(k);
}
function syncBoss() {
  const b = game.boss;
  if (!b || b.gone) return;
  if (b.key === 'rostbart') {
    const v = getView(b, makeAirship);
    v.root.position.set(wx(b.x), wy(b.y), -0.5);
    v.prop.rotation.x = game.frame * 0.6;
    v.root.rotation.z = Math.sin(game.frame * 0.03) * 0.04 + (b.dying ? 0.2 : 0);
    v.root.rotation.y = -0.25;
    applyRig(v.capt, -1, poseHum(b.st % 85 < 20 && b.active ? 'jab' : 'stand', game.frame), 0.3);
    v.root.scale.setScalar(b.flash > 0 ? 1.03 : 1);
    if (b.dying) v.root.visible = !(b.dying >> 2 & 1);
    return;
  }
  const v = getView(b, () => makeHumanoid(LOOKS[b.d.look]));
  const s = b.state,
    el = b.st;
  let pose = 'idle';
  if (s === 'melee') pose = 'walk';else if (s === 'strike') pose = el < 8 ? 'charge' : b.kick ? 'kick' : 'jab';else if (s === 'shot') pose = el % 16 < 8 ? 'charge' : 'jab';else if (s === 'dash') pose = el < 26 ? 'charge' : 'dash';else if (s === 'jump') pose = b.onG ? 'crouch' : b.vy < 0 ? 'jump' : 'fall';else if (s === 'beam') pose = el < 52 ? 'beamcharge' : 'beam';else if (s === 'burst' || s === 'transform' || s === 'grow') pose = 'charge';else if (s === 'wait') pose = 'stand';else if (s === 'idle' && Math.abs(b.vx) > 0.1) pose = 'walk';
  if (b.dying) pose = 'hurt';
  v.root.position.set(wx(b.x), wy(b.y), 0);
  syncHum(v, b, pose, 0.35);
  const base = (LOOKS[b.d.look].size || 1) * (b.sc > 1 ? 2 : b.state === 'grow' ? 1 + (b.grow || 0) : 1);
  v.inner.scale.setScalar(base * (b.flash > 0 ? 1.04 : 1));
  if (b.dying) v.root.visible = !(b.dying >> 2 & 1);else v.root.visible = true;
  if (s === 'burst' || s === 'grow' || s === 'beam' && el < 52 || s === 'dash' && el < 26) {
    const fx = getView(b.aura || (b.aura = {}), () => {
      const m = new THREE.Mesh(sph(.7, 16, 12), bm('#ffffff', 0.3, true));
      return {
        root: m
      };
    });
    fx.root.position.set(wx(b.x), wy(b.y - 13 * b.sc), 0);
    fx.root.scale.set(b.sc * 1.1, b.sc * 1.7, b.sc * 1.1);
    fx.root.material.color.set(s === 'beam' ? (b.d.beam || ['#f33'])[0] : s === 'dash' ? '#ff4040' : '#ffffff');
    fx.root.material.opacity = 0.2 + Math.sin(game.frame * 0.7) * 0.1;
  }
  if (s === 'beam' && el < 52) {
    const fx = getView(b.ball || (b.ball = {}), () => {
      const g2 = new THREE.Group();
      g2.add(new THREE.Mesh(sph(.14, 10, 8), bm('#ffffff')));
      const sp2 = spr(game.GLOW, 0xff4040, 1.2);
      g2.add(sp2);
      return {
        root: g2,
        sp: sp2
      };
    });
    fx.root.position.set(wx(b.x - b.f * 7 * b.sc), wy(b.y - 12 * b.sc), 0.3);
    fx.root.scale.setScalar(0.5 + el / 52 * 1.5);
    fx.sp.material.color.set((b.d.beam || ['#f33'])[0]);
    game.lightReq.push({
      x: b.x,
      y: b.y - 12,
      c: 0xff4040,
      i: 2.5
    });
  }
}
function syncItems() {
  for (const it of game.items) {
    const v = getView(it, () => {
      if (it.type === 'egg') {
        const e = makeEgg(it.stars || 1, 0.9);
        return e;
      }
      if (it.type === 'food') {
        const g2 = new THREE.Group();
        M(sph(.2, 10, 8), '#a85020', g2, -.06, 0, 0, true, [1.2, .9, .9]);
        M(cyl(.04, .04, .3, 6), '#f8f0e0', g2, .15, 0, 0, false).rotation.z = Math.PI / 2;
        M(sph(.06, 6, 4), '#f8f0e0', g2, .3, .04, 0, false);
        M(sph(.06, 6, 4), '#f8f0e0', g2, .3, -.04, 0, false);
        return {
          root: g2
        };
      }
      const g2 = new THREE.Group();
      g2.add(new THREE.Mesh(sph(.16, 12, 8), bm('#60b0ff')));
      g2.add(spr(game.GLOW, 0x3080ff, 0.9));
      return {
        root: g2
      };
    });
    const bob = Math.sin((it.t || 0) * 0.08) * 0.12;
    v.root.position.set(wx(it.x), wy(it.y) + bob + (it.type === 'egg' ? 0.05 : 0), 0.1);
    v.root.rotation.y = (it.t || 0) * 0.04;
    if (it.type === 'egg') {
      v.glow.material.opacity = 0.45 + Math.sin(game.frame * 0.15) * 0.15;
      game.lightReq.push({
        x: it.x,
        y: it.y,
        c: 0xffb040,
        i: 1.2
      });
    }
  }
}
function syncShots() {
  for (const s of game.shots) {
    const v = getView(s, () => {
      const g2 = new THREE.Group();
      const mats = [];
      const add = o => {
        g2.add(o);
        if (o.material) mats.push(o.material);
        return o;
      };
      let core = null,
        glow = null;
      if (s.type === 'ki') {
        core = add(new THREE.Mesh(sph(.12, 10, 8), bm('#fffbe0')));
        glow = add(spr(game.GLOW, 0xffc020, s.r > 3 ? 1.3 : 0.8));
      } else if (s.type === 'bullet') {
        core = add(new THREE.Mesh(cap(.035, .18), bm(s.owner === 'p' ? '#ffe060' : '#ff9040')));
        core.rotation.z = Math.PI / 2;
        glow = add(spr(game.GLOW, s.owner === 'p' ? 0xffe060 : 0xff8040, 0.4));
      } else if (s.type === 'disc') {
        core = add(new THREE.Mesh(cyl(.42, .42, .03, 20), bm('#ffe060', 0.95, true)));
        glow = add(spr(game.GLOW, 0xffe060, 1.5));
      } else if (s.type === 'bomb') {
        core = new THREE.Group();
        g2.add(core);
        M(cap(.1, .12), '#f0f0f0', core, 0, 0, 0).rotation.z = Math.PI / 2;
        M(cyl(.105, .105, .06, 10), '#d03030', core, 0, 0, 0, false).rotation.z = Math.PI / 2;
      } else if (s.type === 'eball') {
        const c = s.col || ['#ff6040', '#a02010'];
        core = add(new THREE.Mesh(sph(.12, 10, 8), bm('#ffffff')));
        glow = add(spr(game.GLOW, new THREE.Color(c[0]), s.r > 2 ? 1.2 : 0.9));
      } else if (s.type === 'wave') {
        core = add(new THREE.Mesh(cone(.25, .9, 8, true), bm('#ffa020', 0.85, true)));
        core.position.y = .45;
        glow = add(spr(game.GLOW, 0xff8020, 1.3));
        glow.position.y = .3;
      }
      return {
        root: g2,
        core,
        glow,
        mats
      };
    });
    v.root.position.set(wx(s.x), wy(s.y), 0.15);
    if (s.type === 'disc') v.core.rotation.y = game.frame * 0.7;
    if (s.type === 'bomb') v.core.rotation.z = game.frame * 0.3;
    if (s.type === 'wave') {
      v.root.position.y = wy(s.y + 5);
      v.core.scale.y = 0.8 + Math.random() * 0.4;
    }
    if (s.type === 'ki' && s.owner === 'p' && game.mode === 'stage' && game.frame % 2 === 0) part(s.x - s.vx * 2, s.y, 0, 0, 8, '#ffd040', 1.2, 'p', 0, 0);
  }
}
function syncBeams() {
  for (const b of game.beams) {
    const v = getView(b, () => {
      const g2 = new THREE.Group();
      const mats = [];
      const mk = (r, col, op) => {
        const m = new THREE.Mesh(cyl(r, r, 1, 16, true), new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: op,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        }));
        m.rotation.z = Math.PI / 2;
        mats.push(m.material);
        g2.add(m);
        return m;
      };
      const outer = mk(1, b.col[0], 0.45),
        mid = mk(.7, b.col[1], 0.7),
        core = mk(.38, '#ffffff', 1);
      const tip = spr(game.GLOW, new THREE.Color(b.col[1]), 1);
      const org = spr(game.GLOW, new THREE.Color(b.col[1]), 1);
      mats.push(tip.material, org.material);
      g2.add(tip);
      g2.add(org);
      const tipC = new THREE.Mesh(sph(1, 14, 10), new THREE.MeshBasicMaterial({
        color: '#ffffff'
      }));
      mats.push(tipC.material);
      g2.add(tipC);
      return {
        root: g2,
        outer,
        mid,
        core,
        tip,
        org,
        tipC,
        mats
      };
    });
    const th = b.thick / 16 * (1 + Math.sin(game.frame * 1.3) * 0.08);
    const L2 = Math.max(0.01, b.len / 16);
    const x0 = wx(b.x),
      y0 = wy(b.y);
    for (const [m, k] of [[v.outer, 0.62], [v.mid, 0.46], [v.core, 0.28]]) {
      m.scale.set(th * k * 1.6, L2, th * k * 1.6);
      m.position.set(x0 + b.f * L2 / 2, y0, 0.1);
    }
    v.tip.position.set(x0 + b.f * L2, y0, 0.15);
    v.tip.scale.setScalar(th * 3.2);
    v.tipC.position.copy(v.tip.position);
    v.tipC.scale.setScalar(th * 0.5);
    v.org.position.set(x0, y0, 0.15);
    v.org.scale.setScalar(th * 2.6);
    game.lightReq.push({
      x: b.x + b.f * b.len,
      y: b.y,
      c: new THREE.Color(b.col[0]).getHex(),
      i: 4
    });
    if (game.frame % 2 === 0) part(b.x + b.f * b.len, b.y + (Math.random() - 0.5) * b.thick, b.f * (1 + Math.random() * 2), (Math.random() - 0.5) * 2, 10, b.col[1], 1.4, 'p', 0);
  }
}
function syncParticles() {
  let i = 0;
  for (const p of game.parts) {
    if (i >= game.particlesPool.length) break;
    const s = game.particlesPool[i++];
    s.visible = true;
    const k = p.life / p.max;
    const m = s.material;
    s.position.set(wx(p.x), wy(p.y), 0.4 + p.z / 16);
    if (p.type === 'flash') {
      m.map = game.STAR;
      m.blending = THREE.AdditiveBlending;
      const sz = p.s / 16 * (0.6 + k) * 1.6;
      s.scale.set(sz, sz, 1);
      m.opacity = k;
      m.color.set(p.c);
    } else if (p.type === 'ring') {
      m.map = game.RING;
      m.blending = THREE.AdditiveBlending;
      const sz = (1 - k) * p.s * 0.35 + 0.2;
      s.scale.set(sz, sz, 1);
      m.opacity = k;
      m.color.set(p.c);
    } else if (p.type === 'dust') {
      m.map = game.GLOW;
      m.blending = THREE.NormalBlending;
      const sz = p.s / 16 * (1.6 - k) * 1.2;
      s.scale.set(sz, sz, 1);
      m.opacity = k * 0.6;
      m.color.set(p.c);
    } else {
      m.map = game.GLOW;
      m.blending = THREE.AdditiveBlending;
      const sz = p.s / 16 * 1.5 * (0.4 + k * 0.6);
      s.scale.set(sz, sz, 1);
      m.opacity = Math.min(1, k * 1.5);
      m.color.set(p.c);
    }
  }
  for (; i < game.particlesPool.length; i++) {
    if (!game.particlesPool[i].visible) break;
    game.particlesPool[i].visible = false;
  }
}
function syncGhosts() {
  for (const gh of game.ghosts) {
    const key = gh.look === LOOKS[game.P && game.P.char] ? 'p' : 'b';
    const v = getView(gh, () => {
      const pool = game.ghostPool[gh.look.hair] || (game.ghostPool[gh.look.hair] = []);
      let r2 = pool.pop();
      if (!r2) {
        game.MAT_OVERRIDE = new THREE.MeshBasicMaterial({
          color: 0x80c8ff,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        r2 = makeHumanoid(gh.look);
        r2.mat = game.MAT_OVERRIDE;
        game.MAT_OVERRIDE = null;
      }
      r2.cur = {};
      r2.release = () => pool.push(r2);
      return r2;
    });
    if (!v.init) {
      v.init = true;
      const src = gh.src._v;
      if (src) {
        Object.assign(v.cur, src.cur);
        applyRig(v, gh.f, poseHum('dash', 0), 0);
        v.root.rotation.y = src.root.rotation.y;
        v.inner.scale.copy(src.inner.scale);
        v.body.position.copy(src.body.position);
        v.torso.rotation.copy(src.torso.rotation);
        for (const k of ['aL', 'aR']) {
          v[k].sh.rotation.copy(src[k].sh.rotation);
          v[k].el.rotation.copy(src[k].el.rotation);
        }
        for (const k of ['lL', 'lR']) {
          v[k].hip.rotation.copy(src[k].hip.rotation);
          v[k].kn.rotation.copy(src[k].kn.rotation);
        }
      }
      v.root.position.set(wx(gh.x), wy(game.mode === 'shmup' ? gh.y - 4 : gh.y), -0.1);
    }
    v.mat.opacity = gh.life / gh.max * 0.4;
  }
}
// ghost views need release instead of dispose
// ghost views need release instead of dispose

function cleanupViews() {
  game.views = game.views.filter(o => {
    if (!o._v) return false;
    if (o._v.seen !== game.frameId) {
      game.dynG.remove(o._v.root);
      if (o._v.release) {
        o._v.init = false;
        o._v.release();
      } else if (o._v.mats) o._v.mats.forEach(m => m.dispose());
      o._v = null;
      return false;
    }
    return true;
  });
}
game.lightReq = [];
function syncLights() {
  for (const l of game.lightFx) game.lightReq.push({
    x: l.x,
    y: l.y,
    c: l.c,
    i: l.i * (l.life / 14)
  });
  game.lightReq.sort((a, b) => b.i - a.i);
  game.lightsPool.forEach((l, i) => {
    const q = game.lightReq[i];
    if (q) {
      l.intensity = q.i * 0.6;
      l.color.set(q.c);
      l.position.set(wx(q.x), wy(q.y), 1.2);
    } else l.intensity = 0;
  });
  game.lightReq = [];
}
// ---------- camera ----------

export { cleanupViews, syncBeams, syncBoss, syncEnemy, syncGhosts, syncItems, syncLights, syncParticles, syncPlayer, syncShots };
