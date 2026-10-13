import * as THREE from 'three';
import { game } from '../state.js';
import { rng } from '../core/helpers.js';
import { Gp, M, bm, bx, capT, cone, cyl, ico, sph, spr, tm, tor } from './materials.js';
import { loaded, wy } from './world.js';

// ---------- ground detail: instanced grass, flowers, pebbles, rivets, candles ----------
function inst(gm, mat, list, colors) {
  if (!list.length) return;
  const im = new THREE.InstancedMesh(gm, mat, list.length);
  const m4 = new THREE.Matrix4(),
    q = new THREE.Quaternion(),
    e = new THREE.Euler(),
    p = new THREE.Vector3(),
    sc = new THREE.Vector3();
  list.forEach((o, i) => {
    e.set(o.rx || 0, o.ry || 0, o.rz || 0);
    q.setFromEuler(e);
    p.set(o.x, o.y, o.z);
    sc.set(o.s || 1, o.sy || o.s || 1, o.s || 1);
    m4.compose(p, q, sc);
    im.setMatrixAt(i, m4);
    if (colors) im.setColorAt(i, new THREE.Color(colors[i]));
  });
  im.receiveShadow = true;
  game.worldG.add(im);
  return im;
}
function decorate(theme, lv) {
  const r = rng(lv.seed * 7 + 3);
  const blades = [],
    bc = [],
    heads = [],
    hc = [],
    peb = [],
    pc = [];
  const topY = c => {
    const t = lv.top[c];
    return t === 99 ? null : wy(t * 16);
  };
  const G = loaded[theme] && loaded[theme].ground;
  if (!G) return;
  for (let x = 0.2; x < lv.cols; x += G.dens ? G.dens + r() * G.dens : 1) {
    const c = Math.floor(x),
      y = topY(c);
    if (y === null) continue;
    if (G.bl.length && !(c > 0 && lv.top[c - 1] !== lv.top[c] && x - c < .15)) {
      const front = r() < 0.5;
      const z = front ? 0.75 + r() * 0.45 : -1.6 - r() * 0.7;
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        blades.push({
          x: x + (r() - .5) * .25,
          y: y + .11,
          z: z + (r() - .5) * .15,
          rz: (r() - .5) * .7,
          rx: (r() - .5) * .4,
          ry: r() * 3,
          s: .8 + r() * .6,
          sy: .7 + r() * .8
        });
        bc.push(G.bl[Math.floor(r() * G.bl.length)]);
      }
      if (r() < G.flp) {
        heads.push({
          x: x,
          y: y + .27,
          z: z,
          s: .8 + r() * .5
        });
        hc.push(G.fl[Math.floor(r() * G.fl.length)]);
      }
    }
    if (G.pb.length && r() < 0.35) {
      peb.push({
        x: x + r() * .5,
        y: y + .02,
        z: r() < .5 ? 0.9 + r() * .4 : -1.9 - r() * .5,
        ry: r() * 3,
        rx: r(),
        s: .6 + r() * 1.1,
        sy: .4 + r() * .4
      });
      pc.push(G.pb[Math.floor(r() * G.pb.length)]);
    }
  }
  inst(cone(.045, .34, 3), tm('#ffffff'), blades, bc);
  inst(sph(.055, 8, 6), tm('#ffffff'), heads, hc);
  inst(ico(.09, 0), tm('#ffffff'), peb, pc);
  const mod = loaded[theme];
  if (mod.details) mod.details({
    lv,
    r,
    topY
  });
}
// ---------- title / select / ending scenes ----------

export { decorate, inst };