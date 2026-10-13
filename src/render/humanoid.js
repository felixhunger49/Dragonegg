import * as THREE from 'three';
import { game } from '../state.js';
import { clamp } from '../core/helpers.js';
import { Gp, M, aim, bm, bx, cap, capT, cone, cyl, geo, sph, tmF, tor } from './materials.js';

// ---------- humanoid rig ----------
const HC = .26,
  HR = .285;
function headDeform(v) {
  const t = v.y < 0 ? Math.min(1, -v.y / HR) : 0,
    e = t * t * (3 - 2 * t);
  v.x *= 0.9 * (1 - 0.46 * e);
  if (v.z > 0) v.z *= 0.95;
  v.z *= 1 - 0.1 * e;
  v.z += 0.055 * e * Math.max(0, v.z / HR);
  v.y *= 1 + 0.24 * e;
  return v;
}
function headGeo() {
  return geo('animehead', () => {
    const g2 = new THREE.SphereGeometry(HR, 22, 18);
    const p = g2.attributes.position,
      v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      headDeform(v);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g2.computeVertexNormals();
    return g2;
  });
}
// point on the face surface: x,y relative to head centre (undeformed sphere coords), pushed out by `out`
// point on the face surface: x,y relative to head centre (undeformed sphere coords), pushed out by `out`
function hp(x, y, out = 0) {
  const z = Math.sqrt(Math.max(0, HR * HR - x * x - y * y));
  const v = headDeform(new THREE.Vector3(x, y, z));
  v.z += out;
  v.y += HC;
  return v;
}

// adult proportions (after Felix' reference drawing): ~4.5 heads tall, long legs, broad shoulders, muscular arms, wide sash and baggy gi pants
// adult proportions (after Felix' reference drawing): ~4.5 heads tall, long legs, broad shoulders, muscular arms, wide sash and baggy gi pants
const TH = .4,
  SHN = .38,
  FOOT = .095,
  HIPY = TH + SHN + FOOT,
  GS = .84,
  HS = .66;
function makeHumanoid(L, opts) {
  opts = opts || {};
  const root = new THREE.Group(),
    inner = Gp(root);
  const s = GS * (L.short ? 0.9 : 1) * (L.size || 1);
  inner.scale.setScalar(s);
  const body = Gp(inner, 0, HIPY, 0),
    torso = Gp(body);
  const giM = L.metal ? L.gi : tmF(L.gi),
    dk = shadeHex(L.gi, .72);
  if (L.metal) {
    M(bx(.5, .5, .34), L.gi, torso, 0, .42, 0);
    M(bx(.36, .26, .3), L.gi, torso, 0, .14, 0);
    M(bx(.32, .14, .35), '#e8c020', torso, 0, .48, .01, false);
  } else {
    const ch = M(cap(.19, .14), giM, torso, 0, .44, 0, true, [1.3, 1, 0.78]);
    torso.userData.chest = ch;
    M(cyl(.155, .14, .26, 14), giM, torso, 0, .15, 0, true, [1, 1, 0.84]);
    if (!L.dress) {
      const vee = M(cone(.09, .24, 3), L.under || L.skin, torso, 0, .55, .135, false);
      vee.rotation.set(Math.PI, 0, 0);
      vee.scale.set(1, 1, .35);
      for (const sx of [-1, 1]) {
        const lp = M(bx(.05, .38, .03), dk, torso, sx * .075, .47, .15, false);
        lp.rotation.z = sx * .38;
        lp.rotation.x = -.1;
      }
      for (const zz of [.13, -.13]) {
        const fl = M(bx(.34, .22, .035), giM, torso, 0, .04, zz);
        fl.rotation.x = zz > 0 ? -.14 : .14;
      }
      // wide wrapped sash, knotted at the side with long hanging ends
      M(cyl(.168, .168, .12, 16), L.belt, torso, 0, .2, 0, true, [1.03, 1, .88]);
      M(tor(.168, .012), shadeHex(L.belt, .75), torso, 0, .2, 0, false, [1.03, .88, 1]).rotation.x = Math.PI / 2;
      M(sph(.05, 8, 6), L.belt, torso, .15, .19, .09, false);
      const e1 = M(bx(.05, .22, .025), L.belt, torso, .15, .06, .1, false);
      e1.rotation.z = .12;
      const e2 = M(bx(.045, .18, .025), L.belt, torso, .18, .08, .07, false);
      e2.rotation.z = -.15;
      torso.userData.beltEnds = [e1, e2];
    }
    M(cyl(.07, .082, .14, 10), L.skin, torso, 0, .72, 0, false);
  }
  if (L.dress) M(cyl(.17, .34, .52, 14), tmF(L.gi), torso, 0, -.1, 0);
  if (L.metal || L.dress) M(cyl(.16, .16, .07, 14), L.belt, torso, 0, .2, 0, false, [1.04, 1, 0.86]);
  if (L.sym) {
    const sy = M(cyl(.065, .065, .02, 14), '#f8f0e0', torso, .12, .52, .17, false);
    sy.rotation.x = Math.PI / 2 - .2;
    M(bx(.045, .055, .01), '#202020', sy, 0, .012, 0, false).rotation.x = -Math.PI / 2;
  }
  if (L.shell) {
    M(sph(.34, 14, 10), '#3a9a3a', torso, 0, .42, -.24, true, [1.05, 1.2, .55]);
    const tr = M(tor(.34, .035), '#e0c070', torso, 0, .42, -.24, false);
    tr.scale.set(1.05, 1.2, .5);
  }
  if (L.staff) {
    const st = M(cyl(.035, .035, 1.25, 8), '#c81818', torso, 0, .45, -.24, true);
    st.rotation.z = 0.8;
  }
  if (L.cape) {
    const cp = M(bx(.7, 1.25, .04), L.cape, torso, 0, .12, -.24, true);
    cp.rotation.x = 0.18;
    root.userData.cape = cp;
  }
  if (L.stinger) {
    const segs = [[0, .2, -.3], [0, .42, -.44], [0, .66, -.47], [0, .88, -.38], [0, 1.02, -.2], [0, 1.06, .04]];
    segs.forEach((p, i) => M(sph(.1 - i * .008, 10, 8), '#a03838', torso, p[0], p[1], p[2]));
    const tip = M(cone(.06, .2, 8), '#f0e040', torso, 0, 1.0, .18);
    tip.rotation.x = 2.2;
  }
  const head = Gp(torso, 0, .76, 0);
  head.scale.setScalar(HS);
  if (L.metal) M(bx(.5, .44, .46), L.skin, head, 0, .24, 0);else M(headGeo(), L.skin, head, 0, HC, 0);
  face(head, L);
  hair(head, L, root);
  const arm = side => {
    const sh = Gp(torso, side * .31, .6, 0);
    const big = L.bigArm && side < 0;
    const sk = L.metal ? L.gi : L.skin;
    if (!L.metal && !L.dress) {
      M(sph(.088, 10, 8), giM, sh, 0, .0, 0, true, [1.1, .85, .95]);
      M(cyl(.085, .1, .18, 12, true), giM, sh, 0, -.1, 0, true);
      M(tor(.096, .012), dk, sh, 0, -.19, 0, false).rotation.x = Math.PI / 2;
    } else if (L.dress) M(sph(.09, 10, 8), L.gi, sh, 0, -.02, 0);
    M(cap(.072, .2), sk, sh, 0, -.16, 0, true, [1, 1, .92]);
    if (!L.metal) M(sph(.07, 8, 6), sk, sh, 0, -.17, .035, false, [1, 1.3, 1]);
    const el = Gp(sh, 0, -.32, 0);
    M(sph(.062, 8, 6), sk, el, 0, 0, 0, false);
    M(cap(big ? .11 : .066, .17), big ? '#8a929e' : sk, el, 0, -.13, 0, true, [1, 1, .88]);
    if (L.wrist) M(cyl(.078, .078, .09, 10), L.wrist, el, 0, -.24, 0, false);
    const hc2 = big ? '#8a929e' : L.metal ? '#8a929e' : L.skin;
    const hand = M(sph(big ? .16 : .078, 10, 8), hc2, el, 0, -.33, 0, true, big ? null : [.88, 1.12, .78]);
    if (!big) M(cap(.025, .045), hc2, hand, 0, .01, .06, false).rotation.x = 0.9;
    if (L.claws) for (const cx of [-.04, 0, .04]) {
      const c = M(cone(.02, .08, 5), '#f0f0f0', hand, cx, -.08, .04, false);
      c.rotation.x = Math.PI;
    }
    let staff = null,
      gun = null;
    if (L.staff) {
      staff = M(cyl(.035, .035, 1, 8), '#d02020', el, 0, -.33, 0, true);
      staff.visible = false;
    }
    if (L.gun) {
      gun = Gp(el, 0, -.33, 0);
      M(bx(.07, .07, .24), '#30303a', gun, 0, 0, .08, false);
      M(bx(.06, .12, .06), '#30303a', gun, 0, -.06, -.02, false);
      gun.visible = false;
    }
    return {
      sh,
      el,
      hand,
      staff,
      gun
    };
  };
  const aL = arm(1),
    aR = arm(-1);
  const leg = side => {
    const pm = L.metal ? L.pants : tmF(L.pants);
    const hip = Gp(body, side * .11, 0, 0);
    M(cap(L.metal ? .085 : .115, .24), pm, hip, 0, -.19, 0, true, [1, 1, .95]);
    const kn = Gp(hip, 0, -TH, 0);
    M(cap(L.metal ? .072 : .1, .2), pm, kn, 0, -.15, 0, true, [1, 1, .95]);
    const ft = Gp(kn, 0, -SHN, 0);
    const bt = L.boots,
      bd = shadeHex(bt, .62),
      bl = shadeHex(bt, 1.25);
    M(cyl(.08, .088, .17, 10), bt, ft, 0, .05, 0, false);
    M(tor(.084, .016), bl, ft, 0, .135, 0, false).rotation.x = Math.PI / 2;
    M(bx(.14, .09, .28), bt, ft, 0, -.03, .05);
    M(bx(.135, .035, .28), bd, ft, 0, -.078, .05, false);
    for (const zz of [.09, .15]) {
      const st = M(bx(.146, .02, .03), bd, ft, 0, -.005 + (zz - .09) * .3, zz, false);
      st.rotation.x = -.5;
    }
    return {
      hip,
      kn,
      ft
    };
  };
  const lL = leg(1),
    lR = leg(-1);
  let tail = null;
  if (L.tail) {
    tail = Gp(body, 0, .12, -.17);
    const t1 = M(cap(.05, .16), '#8a5a30', tail, 0, -.05, -.08);
    t1.rotation.x = 1.1;
    const t2 = Gp(tail, 0, -.1, -.2);
    M(cap(.045, .14), '#8a5a30', t2, 0, .06, -.02).rotation.x = -0.6;
    tail.userData.t2 = t2;
  }
  const keep = new Set([torso.userData.chest, ...(torso.userData.beltEnds || []), root.userData.cape, root.userData.scarf, aL.staff, aR.staff, aL.gun, aR.gun].filter(Boolean));
  bakeRig(root, keep);
  return {
    type: 'hum',
    root,
    inner,
    body,
    torso,
    head,
    aL,
    aR,
    lL,
    lR,
    tail,
    cur: {},
    vel: {},
    hipY: HIPY,
    L,
    ph: 0,
    sq: 1
  };
}
// merge every bone's static pieces (and their outlines) into one mesh per material: same look, far fewer draw calls
// merge every bone's static pieces (and their outlines) into one mesh per material: same look, far fewer draw calls
function mergeGeos(list) {
  const parts = list.map(o => {
    const g2 = o.geo.index ? o.geo.toNonIndexed() : o.geo.clone();
    g2.applyMatrix4(o.mtx);
    return g2;
  });
  let n = 0;
  for (const g2 of parts) n += g2.attributes.position.count;
  const pos = new Float32Array(n * 3),
    nor = new Float32Array(n * 3),
    uv = new Float32Array(n * 2);
  let o = 0;
  for (const g2 of parts) {
    const c = g2.attributes.position.count;
    pos.set(g2.attributes.position.array, o * 3);
    if (g2.attributes.normal) nor.set(g2.attributes.normal.array, o * 3);
    if (g2.attributes.uv) uv.set(g2.attributes.uv.array, o * 2);
    o += c;
    g2.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}
function bakeRig(root, keep) {
  const groups = [];
  root.traverse(x => {
    if (!x.isMesh) groups.push(x);
  });
  for (const g2 of groups) {
    const meshes = g2.children.filter(c => c.isMesh && !keep.has(c));
    if (meshes.length < 2) continue;
    const byMat = new Map();
    const add = (geo, mat, mtx) => {
      if (!byMat.has(mat)) byMat.set(mat, []);
      byMat.get(mat).push({
        geo,
        mtx
      });
    };
    const walk = (m, parentM) => {
      m.updateMatrix();
      const mt = parentM ? parentM.clone().multiply(m.matrix) : m.matrix.clone();
      add(m.geometry, m.material, mt);
      for (const c of m.children) if (c.isMesh) walk(c, mt);
    };
    for (const m of meshes) {
      walk(m, null);
      g2.remove(m);
    }
    for (const [mat, list] of byMat) {
      const mm = new THREE.Mesh(mergeGeos(list), mat);
      mm.castShadow = mat !== game.OUT && !mat.isMeshBasicMaterial;
      g2.add(mm);
    }
  }
}
function face(head, L) {
  if (L.metal) {
    M(bx(.42, .1, .04), bm(L.eye || '#ff3030'), head, 0, .28, .235, false);
    return;
  }
  const at = (m, v) => {
    m.position.copy(v);
    head.add(m);
    return m;
  };
  if (!L.glasses) for (const sx of [-1, 1]) {
    const p = hp(sx * .1, -.005, -.012);
    const e = at(new THREE.Mesh(sph(.075, 12, 10), bm('#ffffff')), p);
    e.scale.set(.8, L.lashes ? 1.3 : 1.02, .42);
    e.rotation.y = sx * .35;
    const ir = at(new THREE.Mesh(sph(.05, 10, 8), bm(L.eye || '#2a1c30')), hp(sx * .095, -.012, .004));
    ir.scale.set(.62, .98, .32);
    ir.rotation.y = sx * .35;
    const pu = at(new THREE.Mesh(sph(.026, 8, 6), bm('#08060c')), hp(sx * .093, -.012, .012));
    pu.scale.set(.62, 1.1, .3);
    at(new THREE.Mesh(sph(.014, 6, 4), bm('#ffffff')), hp(sx * .093 + .018, .014, .018));
    const lid = at(new THREE.Mesh(bx(.11, .016, .03), bm('#140c16')), hp(sx * .1, .06, .004));
    lid.rotation.z = -sx * .12;
    lid.rotation.y = sx * .35;
    const br = at(new THREE.Mesh(bx(.1, .022, .03), bm(L.hc && L.hair !== 'bald' ? shadeHex(L.hc, .8) : '#3a2418')), hp(sx * .105, .115, .004));
    br.rotation.z = sx * 0.3;
    br.rotation.y = sx * .35;
    if (L.lashes) {
      const la = at(new THREE.Mesh(bx(.035, .016, .02), bm('#140c16')), hp(sx * .15, .055, .004));
      la.rotation.z = -sx * 0.7;
    }
  }
  // nose: small wedge, mouth: slight smirk, cheek line
  const n = M(cone(.022, .06, 4), shadeHex(L.skin, .9), head, 0, 0, 0, false);
  n.position.copy(hp(0, -.085, .008));
  n.rotation.x = -1.2;
  const mo = at(new THREE.Mesh(bx(.075, .014, .02), bm('#6a2424')), hp(.006, -.155, .004));
  mo.rotation.z = -.08;
  for (const sx of [-1, 1]) {
    const ea = M(sph(.055, 8, 6), L.skin, head, sx * .245, HC - .01, -.02, false, [.45, 1, .8]);
  }
}
function surf(x, y, z, r = .3) {
  const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(r);
  v.y += .25;
  return v;
}
function spikes(head, col, list, r, h) {
  for (const d of list) {
    const v = new THREE.Vector3(d[0], d[1], d[2]).normalize();
    const m = M(cone(d[3] || r, d[4] || h, 6), col, head, v.x * .24 + v.x * (d[4] || h) * .35, .25 + v.y * .24 + v.y * (d[4] || h) * .35, v.z * .24 + v.z * (d[4] || h) * .35);
    aim(m, v.x, v.y, v.z);
  }
}
function hair(head, L, root) {
  const hc = L.hc;
  const capM = (col, tilt = -.35, sc = 1.04) => {
    const c = M(capT(.3 * sc, 16), col, head, 0, .26, -.02);
    c.rotation.x = tilt;
    return c;
  };
  switch (L.hair) {
    case 'goki':
      capM(hc, -.4, 1.08);
      spikes(head, hc, [[0, 1, .15, .13, .42], [.5, .85, 0, .12, .4], [-.5, .85, 0, .12, .4], [.85, .45, -.15, .11, .36], [-.85, .45, -.15, .11, .36], [0, .6, -.8, .13, .44], [.55, .3, -.8, .12, .4], [-.55, .3, -.8, .12, .4], [.3, -.15, -.95, .11, .34], [-.3, -.15, -.95, .11, .34], [.7, .75, -.5, .11, .36], [-.7, .75, -.5, .11, .36]], .12, .4);
      for (const b of [[-.12, .48, .2], [.02, .5, .23], [.15, .47, .2]]) {
        const m = M(cone(.07, .2, 5), hc, head, b[0], b[1], b[2]);
        aim(m, b[0] * .5, -.7, 1);
      }
      spikes(head, hc, [[.3, 1, -.3, .09, .3], [-.3, 1, -.3, .09, .3], [.95, .15, .1, .08, .26], [-.95, .15, .1, .08, .26], [.15, .35, -1, .09, .32], [-.15, .35, -1, .09, .32], [0, -.4, -1, .09, .26]], .09, .3);
      for (const sx of [-1, 1]) {
        const sb = M(cone(.05, .16, 5), hc, head, sx * .24, .3, .12);
        aim(sb, sx * .3, -1, .3);
      }
      break;
    case 'bald':
      M(sph(.04, 6, 4), '#fff4dc', head, .08, .5, .12, false);
      [[-.07, .86, .5], [0, .88, .48], [.07, .86, .5], [-.07, .8, .6], [0, .82, .58], [.07, .8, .6]].forEach(p => {
        const v = surf(p[0], p[1], p[2], .302);
        M(sph(.016, 6, 4), '#8a4020', head, v.x, v.y, v.z, false);
      });
      break;
    case 'joshi':
      M(sph(.04, 6, 4), '#fff4dc', head, .08, .5, .12, false);
      for (const sx of [-1, 1]) M(sph(.1, 8, 6), '#f0f0f0', head, sx * .25, .24, -.12);
      {
        const b = M(cone(.17, .4, 10), '#f4f4f4', head, 0, -.05, .18);
        b.rotation.x = Math.PI + .3;
      }
      for (const sx of [-1, 1]) {
        const m = M(cap(.03, .1), '#e0e0e0', head, sx * .08, .12, .29, false);
        m.rotation.z = sx * 1.2;
      }
      M(bx(.28, .075, .04), bm('#101010'), head, 0, .27, .29, false);
      M(bx(.04, .03, .2), bm('#101010'), head, .15, .27, .2, false);
      M(bx(.04, .03, .2), bm('#101010'), head, -.15, .27, .2, false);
      break;
    case 'long':
      capM(hc, -.3, 1.06);
      M(bx(.5, .6, .16), hc, head, 0, .05, -.2);
      spikes(head, hc, [[0, -.5, -1, .1, .3], [.4, -.4, -.9, .09, .28], [-.4, -.4, -.9, .09, .28]], .1, .3);
      for (const b of [[-.1, .47, .2], [.08, .48, .22]]) {
        const m = M(cone(.07, .18, 5), hc, head, b[0], b[1], b[2]);
        aim(m, 0, -.7, 1);
      }
      M(bx(.015, .08, .02), bm('#b03030'), head, -.17, .2, .24, false);
      break;
    case 'wulma':
      capM(hc, -.3, 1.06);
      for (const sx of [-1, 1]) M(cap(.07, .15), hc, head, sx * .24, .16, .08);
      {
        const pt = M(cap(.1, .32), hc, head, 0, .32, -.38);
        pt.rotation.x = -0.9;
      }
      M(bx(.18, .08, .06), '#e83838', head, 0, .52, -.18, false);
      break;
    case 'band':
      capM(hc, -.3, 1.04);
      {
        const t = M(tor(.3, .04), '#c03030', head, 0, .38, 0, false);
        t.rotation.x = Math.PI / 2;
      }
      M(bx(.04, .18, .03), '#c03030', head, -.05, .3, -.3, false);
      break;
    case 'helmet':
      {
        const h = M(capT(.34, 16), hc, head, 0, .26, 0);
        h.rotation.x = -.1;
        M(bx(.3, .03, .16), shadeHex(hc, .7), head, 0, .34, .28, false);
      }
      break;
    case 'mask':
      M(sph(.31, 16, 12), hc, head, 0, .25, -.01);
      M(bx(.36, .1, .06), L.skin, head, 0, .27, .27, false);
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(sph(.04, 8, 6), bm('#140c16'));
        e.position.set(sx * .09, .27, .3);
        head.add(e);
      }
      {
        const sc = M(bx(.06, .04, .35), '#c02040', head, 0, .25, -.45, false);
        root.userData.scarf = sc;
      }
      break;
    case 'robo':
      M(cyl(.015, .015, .2, 6), '#8a929e', head, .12, .55, 0, false);
      {
        const t = new THREE.Mesh(sph(.04, 8, 6), bm('#ff3030'));
        t.position.set(.12, .66, 0);
        head.add(t);
      }
      break;
    case 'wolf':
      capM(hc, -.4, 1.06);
      spikes(head, hc, [[0, .2, -1, .12, .3], [.5, .1, -.9, .1, .28], [-.5, .1, -.9, .1, .28], [0, -.4, -1, .12, .3]], .1, .3);
      for (const sx of [-1, 1]) {
        const e = M(cone(.08, .22, 6), hc, head, sx * .16, .56, -.02);
        e.rotation.z = -sx * .25;
      }
      M(bx(.2, .15, .24), L.skin, head, 0, .17, .33);
      M(sph(.045, 8, 6), '#111', head, 0, .23, .46, false);
      M(bx(.14, .03, .02), bm('#ffffff'), head, 0, .1, .45, false);
      break;
    case 'turban':
      {
        const t = M(tor(.27, .09), '#e8e0d0', head, 0, .42, 0);
        t.rotation.x = Math.PI / 2;
      }
      M(sph(.24, 12, 8), '#e8e0d0', head, 0, .52, -.02);
      M(sph(.05, 8, 6), '#e83030', head, 0, .45, .3, false);
      for (const sx of [-1, 1]) {
        const m = M(cap(.025, .12), '#3a2010', head, sx * .08, .13, .29, false);
        m.rotation.z = sx * 1.3;
      }
      break;
    case 'captain':
      M(cyl(.38, .38, .06, 16), '#1a1a24', head, 0, .48, 0);
      M(cyl(.25, .3, .2, 14), '#1a1a24', head, 0, .6, 0);
      M(sph(.06, 8, 6), '#f0f0f0', head, 0, .6, .27, false);
      M(sph(.2, 12, 8), hc, head, 0, .04, .16, true, [1, .9, .8]);
      M(cyl(.07, .07, .02, 10), bm('#101010'), head, .11, .27, .27, false).rotation.x = Math.PI / 2;
      break;
    case 'cyborg':
      M(bx(.22, .3, .3), '#606870', head, -.13, .27, .12);
      {
        const e = new THREE.Mesh(sph(.05, 8, 6), bm('#ff2020'));
        e.position.set(-.12, .28, .28);
        head.add(e);
      }
      for (let i = 0; i < 4; i++) M(bx(.06, .12, .08), hc, head, 0, .55 - i * .02, .15 - i * .12);
      break;
    case 'horns':
      for (const sx of [-1, 1]) {
        const h1 = M(cone(.07, .25, 6), '#e8e0c8', head, sx * .17, .55, 0);
        h1.rotation.z = -sx * .5;
        const h2 = M(cone(.04, .16, 6), '#e8e0c8', head, sx * .27, .72, 0);
        h2.rotation.z = -sx * .1;
        const ea = M(cone(.05, .2, 5), L.skin, head, sx * .33, .3, -.03);
        ea.rotation.z = -sx * 1.4;
      }
      break;
  }
}
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16 & 255,
    gg = n >> 8 & 255,
    b = n & 255;
  r = clamp(Math.round(r * k), 0, 255);
  gg = clamp(Math.round(gg * k), 0, 255);
  b = clamp(Math.round(b * k), 0, 255);
  return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
}
// ---------- poses ----------

export { FOOT, SHN, TH, makeHumanoid };
