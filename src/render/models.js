import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { game } from '../state.js';
import { LOOKS } from '../data/data.js';
import { Gp, M, bx, cyl, tm } from './materials.js';
import { GS, HIPY } from './humanoid.js';

// ---------- Blender models ----------
// Every src/models/<key>.glb replaces the built-in figure of LOOKS[<key>] (goki.glb -> Son Goki).
// The model needs an armature with these bone names; the game's own poses drive them, so no animations are needed.
// Rest pose: standing, facing front; arms may be down, in A-pose or T-pose (the difference is corrected here).
const BONES = {
  hips: 'body', torso: 'torso', head: 'head',
  upperarm_L: 'aL.sh', forearm_L: 'aL.el', upperarm_R: 'aR.sh', forearm_R: 'aR.el',
  thigh_L: 'lL.hip', shin_L: 'lL.kn', foot_L: 'lL.ft', thigh_R: 'lR.hip', shin_R: 'lR.kn', foot_R: 'lR.ft',
  tail: 'tail'
};
// small face details get no outline
const NO_OUTLINE = /^(eye|pupil|shine|brow|mouth|symbol|lid)/i;
const LIMB = new Set(['upperarm_L', 'forearm_L', 'upperarm_R', 'forearm_R', 'thigh_L', 'shin_L', 'thigh_R', 'shin_R']);
const FILES = import.meta.glob('../models/*.glb', { query: '?url', import: 'default', eager: true });
const MODELS = {}, PREP = {};

function loadModels() {
  const loader = new GLTFLoader();
  return Promise.all(Object.entries(FILES).map(([p, url]) => {
    const key = p.split('/').pop().replace(/\.glb$/, '');
    return loader.loadAsync(url).then(g => {
      g.scene.traverse(o => {
        if (o.geometry) o.geometry.userData.shared = true;
      });
      MODELS[key] = g.scene;
      if (LOOKS[key]) LOOKS[key].model = key;
    }, e => console.error('Modell konnte nicht geladen werden:', p, e));
  }));
}

// Measure a model once: scale, rest pose of every bone in rig space, joint offsets for the driver rig
function prepare(key) {
  if (PREP[key]) return PREP[key];
  const src = MODELS[key], holder = new THREE.Group(), cont = Gp(holder);
  const m = src.clone(); // plain clone is enough for measuring
  cont.add(m);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m);
  let hipsY = null;
  m.traverse(o => {
    if (o.isBone && o.name === 'hips') hipsY = o.getWorldPosition(new THREE.Vector3()).y;
  });
  // scale so the hips sit as high as on the built-in figures (any modelling scale works)
  const ns = hipsY === null ? 1 : HIPY / (hipsY - box.min.y);
  cont.scale.setScalar(ns);
  cont.position.set(0, -box.min.y * ns, 0);
  holder.updateMatrixWorld(true);
  const rest = {};
  m.traverse(o => {
    if (!o.isBone) return;
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    o.matrixWorld.decompose(p, q, s);
    rest[o.name] = { p, q };
  });
  const need = ['hips', 'torso', 'head', 'upperarm_L', 'forearm_L', 'hand_L', 'upperarm_R', 'forearm_R', 'hand_R', 'thigh_L', 'shin_L', 'foot_L', 'thigh_R', 'shin_R', 'foot_R'];
  const miss = need.filter(n => !rest[n]);
  if (miss.length) {
    console.error('Modell ' + key + ': Knochen fehlen: ' + miss.join(', '));
    return PREP[key] = null;
  }
  // rest correction: turn each limb from its modelled direction to hanging straight down (the game's rest pose)
  const corr = {};
  const down = new THREE.Vector3(0, -1, 0);
  const child = { upperarm_L: 'forearm_L', forearm_L: 'hand_L', upperarm_R: 'forearm_R', forearm_R: 'hand_R', thigh_L: 'shin_L', shin_L: 'foot_L', thigh_R: 'shin_R', shin_R: 'foot_R' };
  for (const n of LIMB) {
    const dir = rest[child[n]].p.clone().sub(rest[n].p).normalize();
    corr[n] = new THREE.Quaternion().setFromUnitVectors(dir, down);
  }
  const P = n => rest[n].p;
  return PREP[key] = {
    ns, pos: cont.position.clone(), rest, corr,
    TH: P('thigh_L').distanceTo(P('shin_L')), SHN: P('shin_L').distanceTo(P('foot_L')), FOOT: P('foot_L').y,
    legY: P('thigh_L').y - P('hips').y
  };
}

// Outline for skinned meshes: same inverted-hull look as the built-in figures, pushed out along the normal before skinning
const OUTS = {};
function outlineMat(th) {
  const k = th.toFixed(4);
  if (OUTS[k]) return OUTS[k];
  const m = new THREE.MeshBasicMaterial({ color: game.OUT.color, side: THREE.BackSide });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + th.toFixed(5) + ';');
  };
  m.customProgramCacheKey = () => 'outline' + k;
  m.userData.shared = true;
  return OUTS[k] = m;
}
// Material names pick the colour from LOOKS, so one model can be recoloured in data.js:
// hair, skin, gi, belt, boots, pants, wrist, under ... (anything else keeps its Blender colour)
function toonFor(mat, L) {
  const n = (mat.name || '').toLowerCase().split(/[._ ]/)[0];
  if (n === 'hair') return tm(L.hc || '#1c1a28');
  if (typeof L[n] === 'string' && L[n][0] === '#') return tm(L[n]);
  if (mat.map) {
    const t = new THREE.MeshToonMaterial({ color: mat.color, map: mat.map, gradientMap: game.GRAD });
    t.userData.shared = true;
    return mat.userData.toon || (mat.userData.toon = t);
  }
  return tm('#' + mat.color.clone().convertLinearToSRGB().getHexString());
}

// Build a rig with the same parts as makeHumanoid (root, inner, body, torso, head, aL ...), whose empty
// joints are posed by applyRig; syncModel then copies the result onto the model's bones.
function makeModelRig(L) {
  const pr = prepare(L.model);
  if (!pr) return null;
  const root = new THREE.Group(), inner = Gp(root);
  inner.scale.setScalar(GS * (L.short ? 0.9 : 1) * (L.size || 1));
  const cont = Gp(inner, pr.pos.x, pr.pos.y, pr.pos.z);
  cont.scale.setScalar(pr.ns);
  const model = cloneSkinned(MODELS[L.model]);
  cont.add(model);
  const bones = {};
  const skinned = [];
  model.traverse(o => {
    if (o.isBone) bones[o.name] = o;
    if (o.isMesh) {
      const ov = game.MAT_OVERRIDE; // afterimages: one see-through material, no outline
      o.userData.line = !ov && !NO_OUTLINE.test(o.material.name || '');
      o.material = ov || toonFor(o.material, L);
      o.castShadow = !ov;
      o.frustumCulled = false;
      if (o.isSkinnedMesh) skinned.push(o);
    }
  });
  for (const o of skinned) {
    if (!o.userData.line) continue;
    const ol = new THREE.SkinnedMesh(o.geometry, outlineMat(0.026 / pr.ns));
    ol.bind(o.skeleton, o.bindMatrix);
    ol.frustumCulled = false;
    o.parent.add(ol);
  }
  const R = pr.rest, at = (par, n, from) => {
    const p = R[n].p, f = from ? R[from].p : new THREE.Vector3();
    return Gp(par, p.x - f.x, p.y - f.y, p.z - f.z);
  };
  const body = at(inner, 'hips'), torso = at(body, 'torso', 'hips'), head = at(torso, 'head', 'torso');
  const arm = sd => {
    const sh = at(torso, 'upperarm' + sd, 'torso'), el = at(sh, 'forearm' + sd, 'upperarm' + sd);
    const hy = R['hand' + sd].p.y - R['forearm' + sd].p.y;
    const hand = at(el, 'hand' + sd, 'forearm' + sd);
    let staff = null, gun = null;
    if (L.staff) {
      staff = M(cyl(.035, .035, 1, 8), '#d02020', el, 0, hy, 0, true);
      staff.visible = false;
    }
    if (L.gun) {
      gun = Gp(el, 0, hy, 0);
      M(bx(.07, .07, .24), '#30303a', gun, 0, 0, .08, false);
      M(bx(.06, .12, .06), '#30303a', gun, 0, -.06, -.02, false);
      gun.visible = false;
    }
    return { sh, el, hand, staff, gun };
  };
  const leg = sd => {
    const hip = at(body, 'thigh' + sd, 'hips'), kn = at(hip, 'shin' + sd, 'thigh' + sd), ft = at(kn, 'foot' + sd, 'shin' + sd);
    return { hip, kn, ft };
  };
  const aL = arm('_L'), aR = arm('_R'), lL = leg('_L'), lR = leg('_R');
  const tail = R.tail ? at(body, 'tail', 'hips') : null;
  const drv = { body, torso, head, aL, aR, lL, lR, tail };
  // bones in parent-first order with their driver joint
  const order = [];
  model.traverse(o => {
    if (!o.isBone) return;
    const d = BONES[o.name];
    const j = d ? d.split('.').reduce((a, k) => a && a[k], drv) : null;
    order.push({ b: o, j, restQ: o.quaternion.clone(), wq: R[o.name].q, corr: pr.corr[o.name] || null, pq: new THREE.Quaternion() });
  });
  const top = order[0].b.parent; // armature node: constant transform in rig space
  const armQ = new THREE.Quaternion(), armInv = new THREE.Matrix4();
  top.updateMatrixWorld(true);
  const hold = new THREE.Matrix4().compose(pr.pos, new THREE.Quaternion(), new THREE.Vector3(pr.ns, pr.ns, pr.ns));
  const armM = hold.clone().multiply(new THREE.Matrix4().copy(model.matrix)).multiply(relMatrix(top, model));
  armQ.setFromRotationMatrix(new THREE.Matrix4().extractRotation(armM));
  armInv.copy(armM).invert();
  return {
    type: 'hum', root, inner, body, torso, head, aL, aR, lL, lR, tail,
    cur: {}, vel: {}, hipY: R.hips.p.y, L, ph: 0, sq: 1,
    TH: pr.TH, SHN: pr.SHN, FOOT: pr.FOOT, legY: pr.legY,
    model: { order, armQ, armInv, hips: bones.hips, hipsRest: bones.hips.position.clone(), rest: R.hips.p }
  };
}
// matrix of node relative to an ancestor
function relMatrix(node, anc) {
  const m = new THREE.Matrix4();
  const chain = [];
  for (let o = node; o && o !== anc; o = o.parent) chain.unshift(o);
  for (const o of chain) {
    o.updateMatrix();
    m.multiply(o.matrix);
  }
  return m;
}

const _q = new THREE.Quaternion(), _w = new THREE.Quaternion(), _p = new THREE.Vector3();
const byBone = new Map();
function jointQ(j, inner, out) {
  out.copy(j.quaternion);
  for (let o = j.parent; o && o !== inner; o = o.parent) out.premultiply(o.quaternion);
  return out;
}
function syncModel(r) {
  const md = r.model;
  byBone.clear();
  for (const e of md.order) {
    const pq = e.b.parent && byBone.get(e.b.parent) || md.armQ;
    if (e.j) {
      // wanted orientation in rig space: the joint's rotation applied to the bone's (corrected) rest orientation
      jointQ(e.j, r.inner, _w);
      if (e.corr) _w.multiply(e.corr);
      _w.multiply(e.wq);
      e.pq.copy(_w);
      e.b.quaternion.copy(pq).invert().multiply(_w);
    } else {
      e.b.quaternion.copy(e.restQ);
      e.pq.copy(pq).multiply(e.restQ);
    }
    byBone.set(e.b, e.pq);
  }
  // hips follow the body joint's height (crouch, jump squash)
  _p.set(0, r.body.position.y - md.rest.y, 0).add(md.rest).applyMatrix4(md.armInv);
  md.hips.position.copy(_p);
}

export { loadModels, makeModelRig, syncModel };
