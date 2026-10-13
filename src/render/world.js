import * as THREE from 'three';
import { game } from '../state.js';
import { ROWS } from '../core/setup.js';
import { clamp, hsh, rng } from '../core/helpers.js';
import { Gp, M, bm, bx, cap, cone, ctex, cyl, ico, sph, spr } from './materials.js';
import { decorate } from './decorate.js';

// ---------- textures for worlds ----------
const TEX = {};
function noiseTex(key, base, dots, extra) {
  if (TEX[key]) return TEX[key];
  TEX[key] = ctex(16, 16, x => {
    x.fillStyle = base;
    x.fillRect(0, 0, 16, 16);
    for (let i = 0; i < dots.length; i++) {
      const [c, n] = dots[i];
      x.fillStyle = c;
      for (let k = 0; k < n; k++) {
        x.fillRect(Math.floor(hsh(i * 97 + k * 13 + key.length) * 16), Math.floor(hsh(i * 31 + k * 7 + 3) * 16), 1 + k % 2, 1);
      }
    }
    extra && extra(x);
  }, true);
  return TEX[key];
}
function themeTex(theme) {
  if (theme === 'forest') return {
    top: noiseTex('fg', '#5cc048', [['#3a9030', 18], ['#8ad870', 10]]),
    side: noiseTex('fd', '#b07038', [['#865028', 22], ['#c88848', 12], ['#6a6a70', 3]]),
    lip: noiseTex('fl', '#5cc048', [['#3a9030', 14]], x => {
      x.fillStyle = '#b07038';
      x.fillRect(0, 9, 16, 7);
      x.fillStyle = '#4aa83a';
      for (let i = 0; i < 16; i += 2) x.fillRect(i, 9, 1, 2 + (i % 4 ? 0 : 2));
    }),
    plat: noiseTex('fw', '#a06830', [['#6a4018', 12]], x => {
      x.fillStyle = '#6a4018';
      x.fillRect(0, 7, 16, 1);
      x.fillRect(0, 15, 16, 1);
    })
  };
  if (theme === 'desert') return {
    top: noiseTex('dg', '#f8d088', [['#e0b060', 18], ['#fff0c0', 8]]),
    side: noiseTex('dd', '#d09850', [['#b07838', 20], ['#e0b070', 10]], x => {
      x.fillStyle = '#c08848';
      x.fillRect(0, 5, 16, 1);
      x.fillRect(0, 12, 16, 1);
    }),
    lip: noiseTex('dl', '#f8d088', [['#e0b060', 10]], x => {
      x.fillStyle = '#d09850';
      x.fillRect(0, 11, 16, 5);
    }),
    plat: noiseTex('dp', '#c88850', [['#8a5830', 14]])
  };
  if (theme === 'base') return {
    top: noiseTex('bg', '#9aa2b0', [['#7a828f', 10]], x => {
      for (let i = 0; i < 16; i += 8) {
        x.fillStyle = '#e8c020';
        x.fillRect(i, 0, 4, 16);
        x.fillStyle = '#2a2a2a';
        x.fillRect(i + 4, 0, 4, 16);
      }
    }),
    side: noiseTex('bd', '#5a6270', [['#40464f', 6]], x => {
      x.fillStyle = '#7a828f';
      x.fillRect(0, 0, 16, 1);
      x.fillRect(0, 0, 1, 16);
      x.fillStyle = '#40464f';
      x.fillRect(0, 15, 16, 1);
      x.fillRect(15, 0, 1, 16);
      x.fillStyle = '#30343c';
      [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(p => x.fillRect(p[0], p[1], 1, 1));
    }),
    lip: noiseTex('bl', '#9aa2b0', [['#7a828f', 6]]),
    plat: noiseTex('bp', '#8890a0', [], x => {
      x.fillStyle = '#40464f';
      for (let i = 1; i < 16; i += 3) x.fillRect(i, 2, 1, 12);
    }),
    wall: noiseTex('bw', '#3c4350', [['#363c48', 10]], x => {
      x.fillStyle = '#262a33';
      x.fillRect(0, 0, 16, 1);
      x.fillRect(0, 0, 1, 16);
      x.fillRect(3, 3, 1, 1);
      x.fillRect(12, 3, 1, 1);
    })
  };
  if (theme === 'castle') return {
    top: noiseTex('cg', '#8a82a2', [['#6a6290', 14]]),
    side: noiseTex('cd', '#5a5272', [], x => {
      x.fillStyle = '#3e3854';
      x.fillRect(0, 7, 16, 1);
      x.fillRect(0, 15, 16, 1);
      x.fillRect(4, 0, 1, 7);
      x.fillRect(12, 8, 1, 7);
      x.fillStyle = '#726a8c';
      x.fillRect(1, 1, 6, 1);
      x.fillRect(9, 9, 6, 1);
    }),
    lip: noiseTex('cl', '#8a82a2', [['#6a6290', 8]]),
    plat: noiseTex('cp', '#7a7294', [['#3e3854', 10]])
  };
  return null;
}
function texMat(t, repeat) {
  const m = new THREE.MeshToonMaterial({
    map: t,
    gradientMap: game.GRAD
  });
  return m;
}
function boxUV(w, h, d) {
  const gm = new THREE.BoxGeometry(w, h, d);
  const uv = gm.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  uv.needsUpdate = true;
  return gm;
}
const THEME3 = {
  forest: {
    sky: ['#2f6fd6', '#7cbcf4', '#cfeefc'],
    fog: 0xb8e0f4,
    hemi: [0xeaf6ff, 0x4a6a3a, 0.72],
    sun: [0xfff2d8, 0.9],
    ground: '#4a9a40'
  },
  desert: {
    sky: ['#d8603a', '#f4a058', '#fbe0a8'],
    fog: 0xf4c890,
    hemi: [0xfff0d8, 0x8a5a30, 0.75],
    sun: [0xffe8c0, 0.95],
    ground: '#e0b070'
  },
  base: {
    sky: ['#1a1e26', '#2a303c', '#3a4252'],
    fog: 0x2a303c,
    hemi: [0xc8d8ff, 0x303848, 0.72],
    sun: [0xe0e8ff, 0.75],
    ground: '#40464f'
  },
  castle: {
    sky: ['#07040f', '#180e30', '#3a2058'],
    fog: 0x1c1030,
    hemi: [0x9a88d0, 0x201030, 0.62],
    sun: [0xb8b0ff, 0.6],
    ground: '#2a2040'
  },
  sky: {
    sky: ['#1e5cd0', '#5098f0', '#bfe4fc'],
    fog: 0xbfe4fc,
    hemi: [0xffffff, 0x80a0d0, 0.78],
    sun: [0xffffff, 0.85],
    ground: '#ffffff'
  }
};
const BGTEX = {};
function skyTex(theme) {
  if (BGTEX[theme]) return BGTEX[theme];
  const c = THEME3[theme].sky;
  BGTEX[theme] = ctex(4, 256, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, c[0]);
    gr.addColorStop(.55, c[1]);
    gr.addColorStop(1, c[2]);
    x.fillStyle = gr;
    x.fillRect(0, 0, w, h);
  });
  return BGTEX[theme];
}
function clearGroup(gr) {
  while (gr.children.length) gr.remove(gr.children[0]);
}
function wx(x) {
  return x / 16;
}
function wy(y) {
  return (160 - y) / 16;
}
game.worldExtra = {};
function applyTheme(theme) {
  const T = THEME3[theme];
  game.scene.background = skyTex(theme);
  game.scene.fog = new THREE.Fog(T.fog, 30, theme === 'base' ? 60 : 130);
  game.hemi.color.set(T.hemi[0]);
  game.hemi.groundColor.set(T.hemi[1]);
  game.hemi.intensity = T.hemi[2];
  game.sun.color.set(T.sun[0]);
  game.sun.intensity = T.sun[1];
}
function tree(par, x, y, z, s, cols) {
  const t = Gp(par, x, y, z);
  t.scale.setScalar(s);
  M(cyl(.14, .22, 1.6, 7), '#7a4a28', t, 0, .8, 0, false).castShadow = true;
  const c1 = cols[0],
    c2 = cols[1];
  const a = M(ico(.85, 1), c1, t, 0, 2.0, 0, false);
  const b = M(ico(.62, 1), c2, t, -.45, 1.75, .3, false);
  const c = M(ico(.58, 1), c1, t, .5, 1.7, -.2, false);
  const d = M(ico(.45, 1), c2, t, .1, 2.55, .2, false);
  [a, b, c, d].forEach(m => m.castShadow = true);
  return t;
}
function cloud(par, x, y, z, s, col = '#ffffff') {
  const c = Gp(par, x, y, z);
  c.scale.setScalar(s);
  for (const p of [[0, 0, 0, 1], [1, .2, 0, .8], [-1, .1, 0, .75], [.4, .6, 0, .7], [-.4, .5, .2, .6]]) M(sph(p[3], 12, 8), col, c, p[0], p[1], p[2], false);
  return c;
}
function buildWorld(theme, lv) {
  clearGroup(game.worldG);
  game.staticAnim = [];
  game.worldExtra = {};
  applyTheme(theme);
  const T = THEME3[theme];
  const tx = themeTex(theme);
  const len = lv ? lv.cols : 40;
  const r = rng((lv ? lv.seed : 5) + 999);
  if (lv) {
    // terrain
    const mats = [texMat(tx.side), texMat(tx.side), texMat(tx.top), texMat(tx.side), texMat(tx.side), texMat(tx.side)];
    const lipM = [texMat(tx.lip), texMat(tx.lip), texMat(tx.top), texMat(tx.lip), texMat(tx.lip), texMat(tx.lip)];
    let c = 0;
    while (c < lv.cols) {
      const t = lv.top[c];
      if (t === 99) {
        c++;
        continue;
      }
      let e = c;
      while (e + 1 < lv.cols && lv.top[e + 1] === t) e++;
      const w = e - c + 1;
      const ty = (160 - t * 16) / 16;
      const y0 = -4;
      const gm = boxUV(w, ty - y0, 3.6);
      const m = new THREE.Mesh(gm, mats);
      m.position.set(c + w / 2, (ty + y0) / 2, -0.6);
      m.receiveShadow = true;
      game.worldG.add(m);
      const lg = boxUV(w + 0.06, 0.3, 3.66);
      const lm = new THREE.Mesh(lg, lipM);
      lm.position.set(c + w / 2, ty - 0.14, -0.6);
      lm.receiveShadow = true;
      game.worldG.add(lm);
      c = e + 1;
    }
    const pm = texMat(tx.plat);
    for (let row = 0; row < ROWS; row++) {
      let c2 = 0;
      while (c2 < lv.cols) {
        if (lv.grid[row][c2] !== 2) {
          c2++;
          continue;
        }
        let e = c2;
        while (e + 1 < lv.cols && lv.grid[row][e + 1] === 2) e++;
        const w = e - c2 + 1;
        const ty = (160 - row * 16) / 16;
        const m = new THREE.Mesh(boxUV(w, 0.32, 1.5), pm);
        m.position.set(c2 + w / 2, ty - 0.16, 0);
        m.castShadow = true;
        m.receiveShadow = true;
        game.worldG.add(m);
        if (theme === 'forest' || theme === 'desert') {
          for (const xx of [c2 + 0.3, e + 0.7]) M(cyl(.06, .06, 0.5, 6), '#5a3a1a', game.worldG, xx, ty - 0.45, 0.5, false);
        }
        c2 = e + 1;
      }
    }
    const ab = M(bx(len + 60, 0.2, 40), '#05030a', game.worldG, len / 2, -2.5, -10, false);
    ab.material = bm('#0a0612');
  }
  if (lv) decorate(theme, lv);
  // far ground plane
  if (theme !== 'base' && theme !== 'sky') {
    const gp = M(bx(len + 400, 0.1, 200), T.ground, game.worldG, len / 2, 1.6, -104, false);
    gp.castShadow = false;
  }
  if (theme === 'forest') {
    for (let x = -30; x < len + 40; x += 8 + r() * 8) {
      const h = 9 + r() * 9,
        rad = 6 + r() * 5;
      const z = -60 - r() * 20;
      M(cone(rad, h, 7), '#6a7ab8', game.worldG, x, 1.6 + h / 2, z, false).castShadow = false;
      const sn = M(cone(rad * 0.32, h * 0.32, 7), '#eef4ff', game.worldG, x, 1.6 + h - h * 0.16 + 0.02, z, false);
    }
    for (let x = -20; x < len + 30; x += 7 + r() * 6) M(sph(5 + r() * 4, 12, 8), '#3a8a4a', game.worldG, x, 1, -26 - r() * 8, false, [1.4, .55, 1]);
    for (let x = -10; x < len + 20; x += 2.5 + r() * 4) {
      const z = -3.4 - r() * 4;
      tree(game.worldG, x, 2, z, 0.8 + r() * 0.5, ['#2e8a3e', '#4cb050']);
    }
    for (let x = 4; x < len; x += 7 + r() * 9) {
      const b = Gp(game.worldG, x, 2.05, 1.5 + r() * 0.5);
      for (let i = 0; i < 3; i++) M(sph(.35 + r() * .2, 10, 8), i % 2 ? '#3a9a40' : '#2e8a3e', b, i * .35 - .35, 0, 0, false);
    }
    for (let x = 0; x < len; x += 3 + r() * 5) {
      if (lv && lv.top[Math.floor(x)] === 99) continue;
      const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
      M(ico(.18 + r() * .15, 0), '#8a8a98', game.worldG, x, yy + .05, -1.6 - r() * 0.6, false);
      for (let k = 0; k < 3; k++) M(sph(.05, 6, 4), ['#ffe040', '#ff6080', '#ffffff'][k], game.worldG, x + 0.6 + k * .15, yy + .05, -1.1 + r() * 0.3, false);
    }
    for (let x = -20; x < len + 30; x += 14 + r() * 14) cloud(game.worldG, x, 13 + r() * 6, -40 - r() * 20, 1.6 + r());
  }
  if (theme === 'desert') {
    for (let x = -30; x < len + 40; x += 10 + r() * 10) {
      const h = 6 + r() * 8,
        w = 5 + r() * 8;
      const z = -50 - r() * 25;
      M(bx(w, h, 6), '#b85838', game.worldG, x, 1.6 + h / 2, z, false);
      M(bx(w + .4, .8, 6.4), '#d87850', game.worldG, x, 1.6 + h, z, false);
    }
    for (let x = -20; x < len + 30; x += 8 + r() * 6) M(sph(5 + r() * 4, 12, 8), '#e8b868', game.worldG, x, 1, -22 - r() * 8, false, [1.6, .4, 1]);
    for (let x = 0; x < len + 10; x += 4 + r() * 6) {
      const z = -3 - r() * 4,
        s = 0.8 + r() * 0.6;
      const c = Gp(game.worldG, x, 2, z);
      c.scale.setScalar(s);
      M(cap(.2, 1.3), '#4a9a40', c, 0, .85, 0);
      const a1 = Gp(c, .2, .9, 0);
      M(cap(.12, .4), '#4a9a40', a1, .2, 0, 0).rotation.z = Math.PI / 2;
      M(cap(.12, .35), '#4a9a40', a1, .38, .25, 0);
      if (r() < .6) {
        const a2 = Gp(c, -.2, .6, 0);
        M(cap(.11, .3), '#4a9a40', a2, -.18, 0, 0).rotation.z = Math.PI / 2;
        M(cap(.11, .3), '#4a9a40', a2, -.34, .2, 0);
      }
    }
    for (let x = 2; x < len; x += 5 + r() * 6) {
      if (lv && lv.top[Math.floor(x)] === 99) continue;
      const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
      M(ico(.22 + r() * .2, 0), '#c09060', game.worldG, x, yy + .05, -1.5 - r() * 0.8, false);
    }
    const sunM = new THREE.Mesh(sph(5, 20, 14), bm('#fff0c0'));
    sunM.position.set(0, 24, -120);
    game.worldG.add(sunM);
    game.worldExtra.follow = [{
      o: sunM,
      k: 0.9,
      x: 12
    }];
  }
  if (theme === 'base') {
    const wm = texMat(tx.wall);
    const wall = new THREE.Mesh(boxUV(len + 40, 14, .4), wm);
    wall.position.set(len / 2, 5, -2.9);
    wall.receiveShadow = true;
    game.worldG.add(wall);
    M(bx(len + 40, .6, 4), '#1a1e26', game.worldG, len / 2, 10.6, -1, false);
    for (let x = 0; x < len + 10; x += 6) {
      M(bx(.8, 10, .8), '#4a5262', game.worldG, x, 6, -2.4, false);
      M(bx(1, .3, 1), '#5a6474', game.worldG, x, 2.1, -2.4, false);
      const lamp = new THREE.Mesh(sph(.18, 10, 8), bm('#ff3030'));
      lamp.position.set(x, 8.6, -1.95);
      game.worldG.add(lamp);
      const gl = spr(game.GLOW, 0xff3030, 1.6, true, .6);
      gl.position.copy(lamp.position);
      game.worldG.add(gl);
      game.staticAnim.push({
        t: 'blink',
        o: lamp,
        g: gl,
        ph: x
      });
    }
    for (const yy of [7.5, 8.0]) {
      const p = M(cyl(.14, .14, len + 40, 10), '#6a7282', game.worldG, len / 2, yy, -2.5, false);
      p.rotation.z = Math.PI / 2;
    }
    for (let x = 3; x < len; x += 12) {
      const sc = M(bx(1.6, 1.1, .1), '#22262e', game.worldG, x, 5, -2.65, false);
      const scr = new THREE.Mesh(bx(1.4, .9, .02), bm('#1a5a3a'));
      scr.position.set(x, 5, -2.58);
      game.worldG.add(scr);
      for (let i = 0; i < 4; i++) {
        const l = new THREE.Mesh(bx(.3 + i * 7 % 5 * .15, .08, .01), bm('#40e080'));
        l.position.set(x - .45 + (.15 + i * 7 % 5 * .075), 5.3 - i * .2, -2.56);
        game.worldG.add(l);
      }
    }
    for (let x = 5; x < len; x += 5 + r() * 7) {
      if (lv && lv.top[Math.floor(x)] === 99) continue;
      const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
      const cr = M(bx(.9, .9, .9), '#8a6a3a', game.worldG, x, yy + .45, -1.7, false);
      cr.castShadow = true;
      M(bx(.92, .1, .92), '#5a4020', game.worldG, x, yy + .45, -1.7, false);
      if (r() < .4) M(cyl(.3, .3, 1, 12), '#c03030', game.worldG, x + 1.1, yy + .5, -1.9, false);
    }
  }
  if (theme === 'castle') {
    const moon = new THREE.Mesh(sph(4, 20, 14), bm('#f0e8c0'));
    moon.position.set(0, 22, -110);
    game.worldG.add(moon);
    const mg = spr(game.GLOW, 0xf0e8c0, 22, true, .35);
    mg.position.copy(moon.position);
    game.worldG.add(mg);
    const stars = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 300; i++) pts.push((hsh(i) - 0.5) * 260, 8 + hsh(i + 5) * 60, -140);
    stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const st = new THREE.Points(stars, new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      fog: false
    }));
    game.worldG.add(st);
    game.worldExtra.follow = [{
      o: moon,
      k: 0.92,
      x: 14
    }, {
      o: mg,
      k: 0.92,
      x: 14
    }, {
      o: st,
      k: 0.95,
      x: 0
    }];
    for (let x = -20; x < len + 30; x += 10 + r() * 12) {
      const z = -28 - r() * 18,
        h = 8 + r() * 10,
        rad = 1.2 + r() * 1.4;
      M(cyl(rad, rad * 1.1, h, 10), '#241638', game.worldG, x, 1.6 + h / 2, z, false);
      const roof = M(cone(rad * 1.3, h * 0.4, 10), '#3a1a4a', game.worldG, x, 1.6 + h + h * 0.2, z, false);
      for (let k = 0; k < 3; k++) {
        const wd = new THREE.Mesh(bx(.3, .5, .05), bm(r() < .7 ? '#f8c040' : '#4a3010'));
        wd.position.set(x + (k - 1) * rad * 0.45, 1.6 + h * 0.4 + k * 1.6, z + rad + 0.02);
        game.worldG.add(wd);
      }
    }
    for (let x = 2; x < len + 10; x += 7) {
      const pil = Gp(game.worldG, x, 2, -2.2);
      M(cyl(.3, .35, 4, 8), '#4a4262', pil, 0, 2, 0, false);
      M(cyl(.45, .3, .4, 8), '#5a4a30', pil, 0, 4.2, 0, false);
      const fl = spr(game.GLOW, 0xff8020, 1.4, true, .9);
      fl.position.set(0, 4.7, 0);
      pil.add(fl);
      const fc = new THREE.Mesh(cone(.18, .5, 6), bm('#ffd060'));
      fc.position.set(0, 4.65, 0);
      pil.add(fc);
      game.staticAnim.push({
        t: 'flame',
        o: fl,
        c: fc,
        ph: x
      });
    }
    for (let x = 6; x < len; x += 9 + r() * 8) {
      if (lv && lv.top[Math.floor(x)] === 99) continue;
      const yy = lv ? wy(lv.top[clamp(Math.floor(x), 0, len - 1)] * 16) : 2;
      M(bx(.5, .7, .15), '#6a6a7a', game.worldG, x, yy + .35, -1.7, false);
      M(cyl(.25, .25, .15, 10), '#6a6a7a', game.worldG, x, yy + .7, -1.7, false).rotation.x = Math.PI / 2;
    }
  }
  if (theme === 'sky') {
    game.worldExtra.clouds = [];
    for (let i = 0; i < 26; i++) {
      const layer = i % 3;
      const z = [-4, -18, -40][layer];
      const s = [1.6, 2.4, 3.5][layer];
      const c = cloud(game.worldG, 0, [0.2, 2, 4][layer] + r() * [2, 6, 10][layer], z, s * (0.7 + r() * 0.6), layer ? '#eef6ff' : '#ffffff');
      game.worldExtra.clouds.push({
        o: c,
        bx: r() * 60,
        spd: [1, 0.45, 0.2][layer]
      });
    }
    for (let x = -60; x < 80; x += 9) M(cone(6 + r() * 4, 10 + r() * 8, 6), '#6a88c8', game.worldG, x, -12, -90 - r() * 20, false);
  }
}
// ---------- ground detail: instanced grass, flowers, pebbles, rivets, candles ----------

export { applyTheme, buildWorld, cloud, skyTex, tree, wx, wy };
