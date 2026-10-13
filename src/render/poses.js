import { game } from '../state.js';
import { clamp } from '../core/helpers.js';
import { FACE } from './materials.js';
import { FOOT, SHN, TH } from './humanoid.js';

// ---------- poses ----------
function poseHum(name, t, x) {
  x = x || {};
  let by = 0,
    lean = 0,
    tw = 0,
    hd = 0,
    aN = [-.1, .15, -.25],
    aF = [-.1, .15, -.25],
    lN = [-.05, .04, .08],
    lF = [.05, .04, .08],
    spin = 0,
    lie = 0,
    sway = 0,
    br = 0,
    air = false;
  const s = Math.sin;
  const p = x.p || 0;
  switch (name) {
    case 'idle':
      {
        const b = s(t * 0.07);
        by = -0.06 + b * 0.014;
        br = b * 0.03;
        sway = s(t * 0.031) * 0.035;
        lean = .12 + s(t * 0.031) * 0.03;
        tw = .35 + s(t * 0.023) * 0.05;
        hd = -.05 - b * 0.03;
        aN = [-0.5 - b * 0.06, 0.25, -1.9 + b * 0.08];
        aF = [-0.75 - b * 0.05, 0.15, -1.95 + b * 0.06];
        lN = [-0.45, 0.08, 0.6];
        lF = [0.3, 0.08, 0.45];
        break;
      }
    case 'stand':
      {
        const b = s(t * 0.06);
        by = b * 0.008;
        br = b * 0.025;
        sway = s(t * 0.025) * 0.03;
        hd = -b * 0.02;
        aN = [0.05, .12 + b * 0.02, -.25];
        aF = [0.08, .12 + b * 0.02, -.3];
        lN = [0.02, .04, .06];
        lF = [-0.02, .04, .04];
        tw = .2;
        break;
      }
    case 'walk':
      {
        const ph = x.ph || t * 0.3;
        const sp = s(ph),
          c2 = Math.cos(2 * ph);
        by = -0.035 + c2 * 0.03;
        sway = sp * 0.07;
        lean = .26 + c2 * 0.03;
        tw = .1 + sp * 0.22;
        hd = -.08;
        lN = [sp * 0.9, 0.03, Math.max(0, -s(ph - 0.5)) * 1.35 + 0.2];
        lF = [-sp * 0.9, 0.03, Math.max(0, s(ph - 0.5)) * 1.35 + 0.2];
        aN = [-sp * 0.95 - 0.25, 0.14, -1.2 - Math.max(0, -sp) * 0.45];
        aF = [sp * 0.95 - 0.25, 0.14, -1.2 - Math.max(0, sp) * 0.45];
        break;
      }
    case 'jump':
      {
        air = true;
        lean = .05;
        lN = [-1.3, 0.05, 1.7];
        lF = [-0.2, 0.05, 0.9];
        aN = [-2.7, 0.25, -0.3];
        aF = [0.5, 0.35, -0.6];
        break;
      }
    case 'fall':
      {
        air = true;
        lean = .1;
        lN = [-0.7, 0.1, 0.7];
        lF = [0.25, 0.1, 0.6];
        aN = [-0.5, 1.0, -0.6];
        aF = [-0.5, 1.0, -0.6];
        break;
      }
    case 'crouch':
      {
        by = -0.22;
        lean = .45;
        tw = .3;
        lN = [-1.6, 0.12, 2.3];
        lF = [-0.3, 0.12, 2.2];
        aN = [-0.7, 0.2, -1.9];
        aF = [-0.9, 0.15, -1.9];
        hd = .15;
        break;
      }
    case 'jab':
      {
        lean = .3;
        tw = -.35;
        aN = [-1.6, 0.05, -0.05];
        aF = [-0.7, 0.15, -1.9];
        lN = [-0.55, 0.06, 0.4];
        lF = [0.45, 0.06, 0.25];
        break;
      }
    case 'cross':
      {
        lean = .35;
        tw = .55;
        aF = [-1.6, -0.15, -0.05];
        aN = [-0.5, 0.25, -1.9];
        lN = [-0.55, 0.06, 0.4];
        lF = [0.5, 0.06, 0.2];
        break;
      }
    case 'upper':
      {
        by = .04;
        lean = -.15;
        tw = -.3;
        aN = [-2.9, 0, -0.35];
        aF = [-0.3, 0.3, -1.2];
        lN = [-0.3, 0.05, 0.15];
        lF = [0.35, 0.05, 0.1];
        hd = .3;
        break;
      }
    case 'lowp':
      {
        by = -0.22;
        lean = .55;
        tw = -.3;
        lN = [-1.6, 0.12, 2.3];
        lF = [-0.3, 0.12, 2.2];
        aN = [-1.35, 0.05, -0.05];
        aF = [-0.9, 0.15, -1.9];
        break;
      }
    case 'kick':
      {
        lean = -.3;
        tw = .2;
        lN = [-1.6, 0, 0.05];
        lF = [0.15, 0.05, 0.2];
        aN = [-0.3, 0.6, -1.2];
        aF = [-0.6, 0.4, -1.6];
        break;
      }
    case 'round':
      {
        lean = -.2;
        spin = p * 6.283;
        lN = [-1.3, 0.25, 0.1];
        lF = [0.1, 0.05, 0.2];
        aN = [-0.2, 1.2, -0.3];
        aF = [-0.2, 1.2, -0.3];
        break;
      }
    case 'highk':
      {
        lean = -.5;
        tw = .2;
        lN = [-2.6, 0, 0];
        lF = [0.15, 0, 0.15];
        aN = [0.3, 0.7, -0.3];
        aF = [0.3, 0.7, -0.3];
        hd = .2;
        break;
      }
    case 'sweep':
      {
        by = -0.3;
        lean = .55;
        spin = p * 6.283;
        lN = [-1.45, 0.6, 0.05];
        lF = [-1.6, 0.15, 2.4];
        aN = [0.3, 0.9, -0.2];
        aF = [0.3, 0.9, -0.2];
        break;
      }
    case 'airk':
      {
        air = true;
        lean = -.3;
        lN = [-1.4, 0, 0];
        lF = [-0.4, 0.05, 1.7];
        aN = [-0.4, 0.8, -0.8];
        aF = [-0.6, 0.6, -1.2];
        break;
      }
    case 'dive':
      {
        air = true;
        lean = .7;
        lN = [-0.6, 0, 0];
        lF = [-1.2, 0.05, 2.0];
        aN = [0.5, 0.5, -0.5];
        aF = [0.5, 0.5, -0.5];
        break;
      }
    case 'staff':
      {
        lean = .25;
        tw = -.2;
        aN = [-1.6, 0, 0];
        aF = [-1.45, -0.35, -0.15];
        lN = [-0.6, 0.06, 0.4];
        lF = [0.5, 0.06, 0.2];
        break;
      }
    case 'dash':
      {
        by = -0.08;
        lean = .85;
        aN = [1.3, 0.25, -0.3];
        aF = [1.3, 0.25, -0.3];
        lN = [0.7, 0.05, 1.0];
        lF = [-0.5, 0.05, 0.4];
        break;
      }
    case 'hurt':
      {
        lean = -.5;
        hd = .35;
        aN = [-1.4, 1.2, -0.4];
        aF = [-1.4, 1.2, -0.4];
        lN = [-0.5, 0.05, 0.7];
        lF = [0.3, 0.05, 0.4];
        break;
      }
    case 'down':
      {
        lie = 1;
        aN = [-2.8, 0.4, -0.2];
        aF = [-2.8, 0.4, -0.2];
        lN = [-0.2, 0.1, 0.3];
        lF = [0, 0.1, 0.1];
        break;
      }
    case 'charge':
      {
        by = -0.12;
        lean = -.05;
        hd = .15;
        aN = [0.15, 0.6, -1.4];
        aF = [0.15, 0.6, -1.4];
        lN = [-0.5, 0.35, 0.8];
        lF = [0.35, 0.35, 0.7];
        break;
      }
    case 'beamcharge':
      {
        by = -0.12;
        tw = -0.9;
        lean = .1;
        aN = [0.6, 0.35, -1.7];
        aF = [0.6, 0.35, -1.7];
        lN = [-0.6, 0.3, 0.8];
        lF = [0.5, 0.3, 0.6];
        break;
      }
    case 'beam':
      {
        by = -0.08;
        tw = -0.25;
        lean = .15;
        aN = [-1.55, -0.3, -0.05];
        aF = [-1.55, -0.3, -0.05];
        lN = [-0.6, 0.3, 0.6];
        lF = [0.55, 0.3, 0.4];
        break;
      }
    case 'throw':
      {
        tw = .2;
        aN = p < 0.5 ? [-2.9, 0.1, -0.8] : [-1.3, 0.05, -0.1];
        aF = [-0.5, 0.3, -1.5];
        lN = [-0.5, 0.06, 0.4];
        lF = [0.4, 0.06, 0.25];
        lean = p < 0.5 ? -.2 : .35;
        break;
      }
    case 'gun':
      {
        tw = -.3;
        aN = [-1.57, 0.05, 0];
        aF = [-0.4, 0.3, -0.9];
        lN = [-0.3, 0.06, 0.2];
        lF = [0.3, 0.06, 0.2];
        break;
      }
    case 'win':
      {
        aN = [-3.0, 0.1, -0.1];
        aF = [0.1, 0.25, -0.3];
        hd = .2;
        break;
      }
    case 'fly':
      {
        air = true;
        lean = .35;
        tw = .2;
        aN = [-0.4, 0.3, -1.6];
        aF = [-0.6, 0.2, -1.7];
        lN = [-0.5, 0.05, 0.9];
        lF = [0.2, 0.05, 0.7];
        break;
      }
  }
  // attacks: anticipation -> snap with overshoot -> hold -> settle back towards fighting stance
  if (ATKPOSE[name] && x.p !== undefined) {
    const q = x.p,
      E = v => v * v * (3 - 2 * v);
    let m;
    if (q < 0.16) m = -0.28 * E(q / 0.16);else if (q < 0.38) {
      const u = (q - 0.16) / 0.22;
      m = -0.28 + 1.43 * (1 - Math.pow(1 - u, 3));
    } else if (q < 0.6) m = 1.15 - 0.15 * E((q - 0.38) / 0.22);else m = 1 - 0.55 * E((q - 0.6) / 0.4);
    const N = STANCE;
    const L2 = (a, b) => a + (b - a) * m,
      LA = (a, b) => [L2(a[0], b[0]), L2(a[1], b[1]), L2(a[2], b[2])];
    by = L2(N.by, by);
    lean = L2(N.lean, lean);
    tw = L2(N.tw, tw);
    hd = L2(N.hd, hd);
    aN = LA(N.aN, aN);
    aF = LA(N.aF, aF);
    if (!ATKPOSE[name].legs) {
      lN = LA(N.lN, lN);
      lF = LA(N.lF, lF);
    } else {
      const k2 = Math.max(0, Math.min(1, m));
      lN = [N.lN[0] + (lN[0] - N.lN[0]) * k2, N.lN[1] + (lN[1] - N.lN[1]) * k2, N.lN[2] + (lN[2] - N.lN[2]) * k2];
    }
  }
  return {
    by,
    lean,
    tw,
    hd,
    aN,
    aF,
    lN,
    lF,
    spin,
    lie,
    sway,
    br,
    air
  };
}
const ATKPOSE = {
  jab: {},
  cross: {},
  upper: {},
  lowp: {},
  kick: {
    legs: 1
  },
  highk: {
    legs: 1
  },
  airk: {
    legs: 1
  },
  staff: {}
};
const STANCE = {
  by: -0.06,
  lean: .12,
  tw: .35,
  hd: -.05,
  aN: [-0.5, 0.25, -1.9],
  aF: [-0.75, 0.15, -1.95],
  lN: [-0.45, 0.08, 0.6],
  lF: [0.3, 0.08, 0.45]
};
// joints are driven by damped springs (not plain lerps): limbs lag behind the torso, the head lags most, so motion overlaps and settles organically
// joints are driven by damped springs (not plain lerps): limbs lag behind the torso, the head lags most, so motion overlaps and settles organically
const JF = {
  by: 1.1,
  lean: .9,
  tw: .8,
  hd: .5,
  a0: .78,
  a1: .78,
  a2: .6,
  b0: .78,
  b1: .78,
  b2: .6,
  l0: 1.2,
  l1: 1.2,
  l2: 1.2,
  m0: 1.2,
  m1: 1.2,
  m2: 1.2,
  lie: 1,
  face: 1.1,
  sway: .7,
  br: 1
};
function applyRig(r, f, T, k) {
  const c = r.cur,
    vl = r.vel || (r.vel = {});
  const nr = f > 0;
  const AR = nr ? T.aN : T.aF,
    AL = nr ? T.aF : T.aN,
    LR = nr ? T.lN : T.lF,
    LL = nr ? T.lF : T.lN;
  const tg = {
    by: T.by,
    lean: T.lean,
    tw: T.tw * (nr ? -1 : 1),
    hd: T.hd,
    a0: AL[0],
    a1: AL[1],
    a2: AL[2],
    b0: AR[0],
    b1: -AR[1],
    b2: AR[2],
    l0: LL[0],
    l1: LL[1],
    l2: LL[2],
    m0: LR[0],
    m1: -LR[1],
    m2: LR[2],
    lie: T.lie,
    face: f * FACE,
    sway: (T.sway || 0) * (nr ? 1 : -1),
    br: T.br || 0
  };
  for (const key in tg) {
    if (c[key] === undefined || k >= 1) {
      c[key] = tg[key];
      vl[key] = 0;
    } else {
      const K = Math.min(0.9, k * 0.62 * (JF[key] || 1));
      vl[key] = (vl[key] || 0) * 0.58 + (tg[key] - c[key]) * K;
      c[key] += vl[key];
    }
  }
  const fy = (h, kn) => -(TH * Math.cos(h) + SHN * Math.cos(h + kn)) - FOOT;
  const tgY = T.air || c.lie > 0.3 ? r.hipY + c.by * 1.6 : -Math.min(fy(c.l0, c.l2), fy(c.m0, c.m2)) + Math.min(0, c.by) * 0.15;
  c.bY = c.bY === undefined || k >= 1 ? tgY : c.bY + (tgY - c.bY) * 0.45;
  r.body.position.y = c.bY;
  r.body.rotation.z = c.sway;
  r.torso.rotation.set(c.lean, c.tw, -c.sway * 1.6);
  r.head.rotation.set(-c.hd - c.lean * 0.3 - (vl.lean || 0) * 1.5, -c.tw * 0.4, c.sway * 0.8 - (vl.tw || 0) * 0.3);
  const be = r.torso.userData.beltEnds;
  if (be) {
    const fl = (vl.lean || 0) * 6 + Math.sin(game.frame * 0.2) * 0.05;
    be[0].rotation.x = -Math.abs(c.lean) * 0.5 - fl;
    be[1].rotation.x = -Math.abs(c.lean) * 0.5 - fl * 1.2;
  }
  const ch = r.torso.userData.chest;
  if (ch) ch.scale.set(1.22 * (1 + c.br * 0.5), 1 + c.br, 0.78 * (1 + c.br));
  for (const [lg, h, kn] of [[r.lL, c.l0, c.l2], [r.lR, c.m0, c.m2]]) if (lg.ft) lg.ft.rotation.x = clamp(-(h + kn), -0.7, 0.9) * 0.8;
  r.aL.sh.rotation.set(c.a0, 0, c.a1);
  r.aL.el.rotation.x = c.a2;
  r.aR.sh.rotation.set(c.b0, 0, c.b1);
  r.aR.el.rotation.x = c.b2;
  r.lL.hip.rotation.set(c.l0, 0, c.l1);
  r.lL.kn.rotation.x = c.l2;
  r.lR.hip.rotation.set(c.m0, 0, c.m1);
  r.lR.kn.rotation.x = c.m2;
  r.root.rotation.y = c.face + (T.spin || 0) * (nr ? 1 : -1);
  r.inner.rotation.x = -c.lie * 1.45;
  r.inner.rotation.z = 0;
  r.inner.position.y = c.lie * 0.16;
  if (r.tail) {
    r.tail.rotation.x = Math.sin(game.frame * 0.12) * 0.3;
    r.tail.rotation.z = Math.sin(game.frame * 0.09) * 0.4;
  }
  if (r.root.userData.cape) r.root.userData.cape.rotation.x = 0.18 + Math.abs(c.lean) * 0.4 + Math.sin(game.frame * 0.1) * 0.05;
}
// ---------- other rigs ----------

export { applyRig, poseHum };
