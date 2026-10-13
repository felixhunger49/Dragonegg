import * as THREE from 'three';
import { game } from '../state.js';

// =====================================================================
// ============================ 3D RENDERING ===========================
// =====================================================================
const FACE = 1.0;
const GEO = {},
  MATS = {};
// Cached geometries/materials are reused everywhere; mark them so world cleanup never frees them
function shared(o) {
  o.userData.shared = true;
  return o;
}
// Free the GPU buffers of all geometries below root that are not shared cache entries
function freeGeometries(root) {
  root.traverse(o => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && !o.isSprite && !o.geometry.userData.shared) o.geometry.dispose();
  });
}
function geo(k, fn) {
  let g2 = GEO[k];
  if (!g2) {
    g2 = GEO[k] = fn();
    g2.userData.shared = true;
    g2.computeBoundingSphere();
  }
  return g2;
}
function sph(r, ws = 14, hs = 10) {
  return geo('s' + r + '_' + ws + '_' + hs, () => new THREE.SphereGeometry(r, ws, hs));
}
function capT(r, ws = 14) {
  return geo('t' + r + '_' + ws, () => new THREE.SphereGeometry(r, ws, 8, 0, Math.PI * 2, 0, Math.PI * 0.45));
}
function cap(r, l) {
  return geo('c' + r + '_' + l, () => new THREE.CapsuleGeometry(r, l, 4, 10));
}
function bx(w, h, d) {
  return geo('b' + w + '_' + h + '_' + d, () => new THREE.BoxGeometry(w, h, d));
}
function cone(r, h, s = 8) {
  return geo('k' + r + '_' + h + '_' + s, () => new THREE.ConeGeometry(r, h, s));
}
function cyl(a, b, h, s = 12, open = false) {
  return geo('y' + a + '_' + b + '_' + h + '_' + s + open, () => new THREE.CylinderGeometry(a, b, h, s, 1, open));
}
function tor(r, t) {
  return geo('o' + r + '_' + t, () => new THREE.TorusGeometry(r, t, 6, 18));
}
function ico(r, d = 1) {
  return geo('i' + r + '_' + d, () => new THREE.IcosahedronGeometry(r, d));
}
game.MAT_OVERRIDE = null;
function tm(c) {
  const k = 't' + c;
  return MATS[k] || (MATS[k] = shared(new THREE.MeshToonMaterial({
    color: c,
    gradientMap: game.GRAD
  })));
}
game.FABRIC = null;
function tmF(c) {
  const k = 'f' + c;
  return MATS[k] || (MATS[k] = shared(new THREE.MeshToonMaterial({
    color: c,
    gradientMap: game.GRAD,
    map: game.FABRIC
  })));
}
function bm(c, op = 1, add = false) {
  const k = 'b' + c + op + add;
  return MATS[k] || (MATS[k] = shared(new THREE.MeshBasicMaterial({
    color: c,
    transparent: op < 1 || add,
    opacity: op,
    blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !(op < 1 || add)
  })));
}
game.OUT = undefined;
function M(gm, col, par, x = 0, y = 0, z = 0, o = true, sc) {
  const mat = game.MAT_OVERRIDE || (typeof col === 'string' ? tm(col) : col);
  const m = new THREE.Mesh(gm, mat);
  m.position.set(x, y, z);
  if (sc) m.scale.set(sc[0], sc[1], sc[2]);
  if (!game.MAT_OVERRIDE) {
    m.castShadow = true;
    if (o) {
      const ol = new THREE.Mesh(gm, game.OUT);
      ol.scale.setScalar(1 + 0.03 / Math.max(0.06, gm.boundingSphere.radius));
      m.add(ol);
    }
  }
  par.add(m);
  return m;
}
function Gp(par, x = 0, y = 0, z = 0) {
  const g2 = new THREE.Group();
  g2.position.set(x, y, z);
  if (par) par.add(g2);
  return g2;
}
const UPV = new THREE.Vector3(0, 1, 0);
function aim(m, x, y, z) {
  m.quaternion.setFromUnitVectors(UPV, new THREE.Vector3(x, y, z).normalize());
}
game.GLOW = undefined;
game.STAR = undefined;
game.RING = undefined;
game.SQ = undefined;
function ctex(w, h, draw, rep) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  if (rep) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return t;
}
function spr(tex, col, size, add = true, op = 1) {
  const m = new THREE.SpriteMaterial({
    map: tex,
    color: col,
    transparent: true,
    opacity: op,
    blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}
// ---------- humanoid rig ----------

export { FACE, freeGeometries, Gp, M, aim, bm, bx, cap, capT, cone, ctex, cyl, geo, ico, sph, spr, tm, tmF, tor };
