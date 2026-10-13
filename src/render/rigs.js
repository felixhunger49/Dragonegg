import * as THREE from 'three';
import { game } from '../state.js';
import { LOOKS } from '../data/data.js';
import { Gp, M, bm, bx, cap, cone, ctex, cyl, sph, spr, tor } from './materials.js';
import { makeHumanoid } from './humanoid.js';

// ---------- other rigs ----------
function makeWolf(d) {
  const [c, cd] = d.col;
  const root = new THREE.Group(),
    inner = Gp(root);
  const body = Gp(inner, 0, .36, 0);
  M(cap(.19, .38), c, body, 0, 0, 0, true, [1, .95, 1]).rotation.x = Math.PI / 2;
  M(cap(.12, .2), cd, body, 0, .1, -.05).rotation.x = Math.PI / 2;
  const head = Gp(body, 0, .14, .38);
  M(sph(.17, 12, 10), c, head);
  M(bx(.13, .11, .2), c, head, 0, -.04, .15);
  M(sph(.035, 6, 4), '#111', head, 0, -.01, .26, false);
  for (const sx of [-1, 1]) {
    const e = M(cone(.06, .16, 5), c, head, sx * .08, .16, -.03);
    e.rotation.z = -sx * .2;
    const ey = new THREE.Mesh(sph(.025, 6, 4), bm(d.eye || '#ffe040'));
    ey.position.set(sx * .08, .05, .13);
    head.add(ey);
  }
  M(bx(.1, .025, .02), bm('#ffffff'), head, 0, -.09, .24, false);
  const tail = Gp(body, 0, .05, -.33);
  M(cap(.05, .22), c, tail, 0, .12, -.05).rotation.x = -0.6;
  const legs = [];
  for (const p of [[.1, .2], [-.1, .2], [.1, -.2], [-.1, -.2]]) {
    const lg = Gp(body, p[0], -.08, p[1]);
    M(cap(.05, .16), cd, lg, 0, -.13, 0);
    M(sph(.06, 6, 4), cd, lg, 0, -.24, .03, false);
    legs.push(lg);
  }
  return {
    type: 'wolf',
    root,
    inner,
    body,
    head,
    tail,
    legs,
    cur: {}
  };
}
function makeFlyer(d) {
  const [c, cd] = d.col;
  const root = new THREE.Group(),
    inner = Gp(root);
  const body = Gp(inner);
  const k = d.kind;
  let wl = null,
    wr = null,
    rotors = [];
  if (k === 'drone') {
    M(bx(.4, .22, .4), c, body);
    const ey = new THREE.Mesh(sph(.06, 8, 6), bm('#ff3030'));
    ey.position.set(0, 0, .2);
    body.add(ey);
    for (const sx of [-1, 1]) {
      M(cyl(.02, .02, .2, 6), cd, body, sx * .25, .12, 0, false).rotation.z = Math.PI / 2;
      const r = M(bx(.36, .015, .05), cd, body, sx * .36, .2, 0, false);
      rotors.push(r);
    }
  } else {
    M(sph(k === 'bird' ? .17 : .15, 12, 10), c, body, 0, 0, 0, true, [1, 1, k === 'bird' ? 1.3 : 1]);
    const ec = k === 'imp' ? '#ffe040' : '#ffe040';
    for (const sx of [-1, 1]) {
      const ey = new THREE.Mesh(sph(.03, 6, 4), bm(ec));
      ey.position.set(sx * .06, .05, .13);
      body.add(ey);
    }
    if (k === 'bat' || k === 'imp') for (const sx of [-1, 1]) {
      const e = M(cone(.05, .14, 5), k === 'imp' ? '#f0e0c0' : c, body, sx * .07, .17, 0);
      e.rotation.z = -sx * .3;
    }
    if (k === 'bird') {
      M(sph(.1, 10, 8), '#e8d8c8', body, 0, .12, .17);
      const bk = M(cone(.04, .14, 6), '#f0b020', body, 0, .1, .3);
      bk.rotation.x = Math.PI / 2;
    }
    if (k === 'imp') {
      const t = M(cap(.025, .25), c, body, 0, -.05, -.2, false);
      t.rotation.x = 1;
    }
    wl = Gp(body, .12, 0, 0);
    wr = Gp(body, -.12, 0, 0);
    const ww = k === 'bird' ? .55 : .42;
    M(bx(ww, .02, .24), cd, wl, ww / 2, 0, 0);
    M(bx(ww, .02, .24), cd, wr, -ww / 2, 0, 0);
  }
  return {
    type: 'fly',
    root,
    inner,
    body,
    wl,
    wr,
    rotors,
    kind: k,
    cur: {}
  };
}
function makeScorp(d) {
  const [c, cd] = d.col;
  const root = new THREE.Group(),
    inner = Gp(root);
  const body = Gp(inner, 0, .16, 0);
  M(sph(.2, 12, 10), c, body, 0, 0, 0, true, [1, .55, 1.4]);
  M(sph(.12, 10, 8), c, body, 0, .02, .25);
  for (const sx of [-1, 1]) {
    const a = Gp(body, sx * .15, 0, .28);
    M(cap(.04, .14), c, a, 0, 0, .08).rotation.x = Math.PI / 2;
    M(sph(.07, 8, 6), c, a, sx * .02, 0, .22, true, [1, .7, 1.3]);
    for (let i = 0; i < 3; i++) {
      const lg = M(cyl(.02, .02, .2, 5), cd, body, sx * .18, -.06, .08 - i * .12, false);
      lg.rotation.z = sx * 1.1;
    }
    const ey = new THREE.Mesh(sph(.025, 6, 4), bm('#111'));
    ey.position.set(sx * .05, .08, .34);
    body.add(ey);
  }
  const tail = Gp(body, 0, .05, -.25);
  const pts = [[0, .05, -.08], [0, .18, -.16], [0, .33, -.16], [0, .45, -.08], [0, .52, .05]];
  pts.forEach((p, i) => M(sph(.07 - i * .006, 8, 6), c, tail, p[0], p[1], p[2]));
  const st = M(cone(.04, .14, 6), '#f0e040', tail, 0, .5, .14);
  st.rotation.x = 2.3;
  return {
    type: 'scorp',
    root,
    inner,
    body,
    tail,
    cur: {}
  };
}
function makePlane() {
  const root = new THREE.Group(),
    inner = Gp(root);
  M(cap(.13, .55), '#8a8f9a', inner, 0, 0, 0).rotation.x = Math.PI / 2;
  M(bx(.95, .04, .24), '#70747e', inner, 0, 0, -.02);
  M(bx(.4, .03, .14), '#70747e', inner, 0, 0, -.38);
  M(bx(.03, .2, .14), '#b02828', inner, 0, .12, -.38);
  M(sph(.09, 8, 6), bm('#80d0f0'), inner, 0, .1, .08, false);
  M(cyl(.135, .135, .08, 10), '#b02828', inner, 0, 0, .15, false).rotation.x = Math.PI / 2;
  const pr = Gp(inner, 0, 0, .44);
  M(bx(.5, .05, .02), '#e0e0e0', pr, 0, 0, 0, false);
  return {
    type: 'plane',
    root,
    inner,
    prop: pr,
    cur: {}
  };
}
function makeAirship() {
  const root = new THREE.Group(),
    inner = Gp(root);
  M(cap(1.0, 3.0), '#8a90a0', inner, 0, 0, 0, true, [1, 1, .85]).rotation.z = Math.PI / 2;
  for (const xx of [-1.1, 1.1]) {
    const t = M(tor(.98, .07), '#b02828', inner, xx, 0, 0, false, [1, 1, .88]);
    t.rotation.y = Math.PI / 2;
  }
  {
    const em = M(cyl(.45, .45, .05, 18), '#f0e8d0', inner, 0, .1, .86, false);
    em.rotation.x = Math.PI / 2;
    for (const xx of [-.15, 0, .15]) M(bx(.05, .4, .06), '#1a1a1a', inner, xx, .1, .88, false);
  }
  for (const s of [[1, 0], [-1, 0]]) {
    M(bx(.7, .06, .7), '#b02828', inner, 2.3, s[0] * .75, 0);
  }
  M(bx(.7, 1.4, .06), '#b02828', inner, 2.3, 0, 0);
  M(bx(2.2, .55, .9), '#6a4020', inner, -.2, -1.35, 0);
  for (let i = 0; i < 4; i++) M(bx(.22, .16, .02), bm('#ffe080'), inner, -1 + i * .5, -1.3, .46, false);
  for (const xx of [-1, .6]) M(cyl(.025, .025, .5, 5), '#3a3a3a', inner, xx, -.95, 0, false);
  const can = M(cyl(.07, .08, .6, 8), '#2a2a30', inner, -1.5, -1.3, .2);
  can.rotation.z = Math.PI / 2;
  const pr = Gp(inner, 2.75, 0, 0);
  M(bx(.06, 1.4, .12), '#d8d8e0', pr);
  M(bx(.06, .12, 1.4), '#d8d8e0', pr);
  M(sph(.12, 8, 6), '#3a3a44', pr, 0, 0, 0, false);
  const cap2 = makeHumanoid(LOOKS.rostbart);
  cap2.root.position.set(-.3, -1.1, 0);
  cap2.root.scale.setScalar(.85);
  inner.add(cap2.root);
  return {
    type: 'air',
    root,
    inner,
    prop: pr,
    capt: cap2,
    cur: {}
  };
}
const EGGTEX = {};
function eggTex(n) {
  if (EGGTEX[n]) return EGGTEX[n];
  const t = ctex(128, 64, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffd870');
    gr.addColorStop(.6, '#f8a020');
    gr.addColorStop(1, '#d07010');
    x.fillStyle = gr;
    x.fillRect(0, 0, w, h);
    const pos = [[0, 0], [-7, -7], [7, 7], [7, -7], [-7, 7], [0, -12], [0, 12]];
    for (const cx of [32, 96]) for (let i = 0; i < n; i++) starAt(x, cx + pos[i][0], 32 + pos[i][1] * 0.8, 5);
  });
  EGGTEX[n] = t;
  return t;
}
function starAt(x, cx, cy, r) {
  x.fillStyle = '#d81818';
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5,
      rr = i % 2 ? r * 0.45 : r;
    x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  x.fill();
}
function makeEgg(n, size = 1) {
  const root = new THREE.Group();
  const m = new THREE.Mesh(sph(.34, 20, 16), new THREE.MeshToonMaterial({
    map: eggTex(n),
    gradientMap: game.GRAD
  }));
  m.scale.set(size, size * 1.25, size);
  m.castShadow = true;
  root.add(m);
  const ol = new THREE.Mesh(sph(.34, 20, 16), game.OUT);
  ol.scale.setScalar(1.08);
  m.add(ol);
  const gl = spr(game.GLOW, 0xffc040, 1.6 * size, true, .55);
  root.add(gl);
  return {
    type: 'egg',
    root,
    egg: m,
    glow: gl
  };
}
// ---------- portraits ----------

export { makeAirship, makeEgg, makeFlyer, makePlane, makeScorp, makeWolf };
