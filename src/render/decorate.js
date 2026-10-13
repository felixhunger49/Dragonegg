import * as THREE from 'three';
import { game } from '../state.js';
import { rng } from '../core/helpers.js';
import { Gp, M, bm, bx, capT, cone, cyl, ico, sph, spr, tm, tor } from './materials.js';
import { wy } from './world.js';

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
  const G = {
    forest: {
      bl: ['#3a9a3a', '#4cb848', '#2e8030', '#5ac850'],
      dens: 0.13,
      fl: ['#ffe040', '#ff6080', '#ffffff', '#b080ff', '#ff9030'],
      flp: .22,
      pb: ['#8a8a98', '#a0a0b0', '#6a6a7a']
    },
    desert: {
      bl: ['#c8a050', '#b08840', '#d8b868'],
      dens: 0.45,
      fl: [],
      flp: 0,
      pb: ['#c09060', '#a87850', '#d8a878', '#8a6040']
    },
    base: {
      bl: [],
      dens: 0,
      fl: [],
      flp: 0,
      pb: []
    },
    castle: {
      bl: ['#3a5a3a', '#2e4a30', '#4a6a40'],
      dens: 0.6,
      fl: ['#c0a0ff'],
      flp: .05,
      pb: ['#5a5470', '#4a4460', '#6a6480']
    }
  }[theme];
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
  if (theme === 'forest') {
    // mushrooms and ferns near the back edge
    for (let x = 3; x < lv.cols; x += 6 + r() * 9) {
      const c = Math.floor(x),
        y = topY(c);
      if (y === null) continue;
      const g2 = Gp(game.worldG, x, y, -1.9 - r() * .4);
      const s2 = .7 + r() * .6;
      g2.scale.setScalar(s2);
      if (r() < .5) {
        M(cyl(.05, .06, .18, 8), '#f4ecd8', g2, 0, .09, 0, false);
        M(capT(.13, 12), '#d83a2a', g2, 0, .16, 0, false);
        for (let k = 0; k < 4; k++) M(sph(.022, 6, 4), '#ffffff', g2, Math.cos(k * 1.6) * .08, .26, Math.sin(k * 1.6) * .08, false);
      } else for (let k = 0; k < 6; k++) {
        const fr = M(bx(.06, .5, .02), '#2e8a3e', g2, 0, .2, 0, false);
        fr.rotation.set(-.6, k * 1.05, 0);
        fr.geometry;
        fr.position.set(Math.sin(k * 1.05) * .12, .18, Math.cos(k * 1.05) * .12);
      }
    }
  }
  if (theme === 'desert') {
    // bleached bones and dry shrubs
    for (let x = 8; x < lv.cols; x += 14 + r() * 14) {
      const c = Math.floor(x),
        y = topY(c);
      if (y === null) continue;
      const g2 = Gp(game.worldG, x, y + .06, -1.8);
      g2.rotation.y = r() * 3;
      const bo = M(cyl(.035, .035, .5, 6), '#f0e8d0', g2, 0, 0, 0, false);
      bo.rotation.z = Math.PI / 2;
      for (const sx of [-.25, .25]) for (const dz of [-.04, .04]) M(sph(.05, 6, 4), '#f0e8d0', g2, sx, 0, dz, false);
      if (r() < .5) {
        const sk = M(sph(.14, 10, 8), '#f0e8d0', g2, .5, .08, .1, false, [1, .85, 1.1]);
        for (const sx of [-1, 1]) {
          const e = new THREE.Mesh(sph(.035, 6, 4), bm('#2a1a10'));
          e.position.set(.5 + sx * .05, .1, .24);
          g2.add(e);
        }
      }
    }
  }
  if (theme === 'base') {
    // rivets along the floor edge, vents and hanging cables on the wall
    const riv = [];
    for (let x = 0.25; x < lv.cols; x += 0.5) {
      const y = topY(Math.floor(x));
      if (y === null) continue;
      riv.push({
        x,
        y: y + .005,
        z: 1.05,
        s: 1,
        sy: .5
      });
      riv.push({
        x,
        y: y + .005,
        z: -2.2,
        s: 1,
        sy: .5
      });
    }
    inst(sph(.045, 8, 4), tm('#9aa2b2'), riv);
    for (let x = 4; x < lv.cols + 10; x += 9) {
      const v = M(bx(1.2, .7, .08), '#2a2e38', game.worldG, x, 3.6, -2.66, false);
      for (let k = 0; k < 5; k++) M(bx(1.05, .05, .02), '#5a6272', game.worldG, x, 3.35 + k * .12, -2.6, false);
      const cab = M(tor(.9, .05), '#202228', game.worldG, x + 3, 7.6, -2.6, false);
      cab.scale.set(1.4, .6, 1);
      for (const yy of [2.6, 4.4]) {
        const pp = M(cyl(.09, .09, 1.8, 8), '#7a8292', game.worldG, x + 4.6, yy + .9, -2.55, false);
      }
      M(tor(.16, .04), '#c03030', game.worldG, x + 4.6, 3.4, -2.45, false);
    }
  }
  if (theme === 'castle') {
    // candles on the back edge, hanging banners between the pillars
    for (let x = 3.5; x < lv.cols; x += 7) {
      const c = Math.floor(x),
        y = topY(c);
      if (y === null) continue;
      for (let k = 0; k < 3; k++) {
        const h = .18 + k * .08;
        M(cyl(.045, .05, h, 8), '#efe6d0', game.worldG, x + k * .16, y + h / 2, -2.0 + k * .05, false);
        const fl = new THREE.Mesh(cone(.03, .09, 6), bm('#ffd060'));
        fl.position.set(x + k * .16, y + h + .05, -2.0 + k * .05);
        game.worldG.add(fl);
        const g3 = spr(game.GLOW, 0xff9030, .5, true, .7);
        g3.position.copy(fl.position);
        game.worldG.add(g3);
      }
    }
    for (let x = 5.5; x < lv.cols + 10; x += 7) {
      const bn = Gp(game.worldG, x, 5.4, -2.5);
      M(cyl(.03, .03, 1.3, 6), '#3a2a20', bn, 0, .62, 0, false).rotation.z = Math.PI / 2;
      M(bx(1, 1.5, .03), '#801828', bn, 0, -.15, 0, false);
      M(bx(.86, .06, .035), '#d8a830', bn, 0, .45, 0, false);
      M(bx(.86, .06, .035), '#d8a830', bn, 0, -.75, 0, false);
      const em = M(cone(.22, .4, 3), '#d8a830', bn, 0, -.2, .01, false);
      em.rotation.z = Math.PI;
      em.scale.z = .1;
      for (const sx of [-.35, 0, .35]) {
        const t = M(cone(.15, .25, 3), '#801828', bn, sx, -1.02, 0, false);
        t.rotation.z = Math.PI;
        t.scale.z = .1;
      }
    }
  }
}
// ---------- title / select / ending scenes ----------

export { decorate };
