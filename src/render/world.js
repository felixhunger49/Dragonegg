import * as THREE from 'three';
import { game } from '../state.js';
import { ROWS } from '../core/setup.js';
import { clamp, hsh, rng } from '../core/helpers.js';
import { Gp, M, bm, bx, cap, cone, ctex, cyl, ico, sph, spr } from './materials.js';
import { decorate } from './decorate.js';

// ---------- world themes: loaded on demand ----------
// Each theme (src/worlds/<name>.js) holds its own textures, scenery and props.
// Only the themes that are actually played get downloaded and built.
const THEME_LOADERS = {
  forest: () => import('../worlds/forest.js'),
  desert: () => import('../worlds/desert.js'),
  base: () => import('../worlds/base.js'),
  castle: () => import('../worlds/castle.js'),
  sky: () => import('../worlds/sky.js')
};
const loaded = {};
const loading = {};
function themeReady(theme) {
  return !!loaded[theme];
}
function loadTheme(theme) {
  if (loaded[theme]) return Promise.resolve(loaded[theme]);
  if (!loading[theme]) loading[theme] = THEME_LOADERS[theme]().then(m => loaded[theme] = m, e => {
    delete loading[theme];
    throw e;
  });
  return loading[theme];
}

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
  return loaded[theme] && loaded[theme].textures ? loaded[theme].textures() : null;
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
// Remove everything from a group and free its GPU memory.
// Cached geometries/materials (marked userData.shared) stay alive for reuse.
function disposeObject(o) {
  if (o.isInstancedMesh) o.dispose();
  if (o.geometry && !o.isSprite && !o.geometry.userData.shared) o.geometry.dispose();
  const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
  for (const m of ms) if (!m.userData.shared && m !== game.OUT) m.dispose();
}
function clearGroup(gr) {
  gr.traverse(o => {
    if (o !== gr) disposeObject(o);
  });
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
// Build the 3D level for a theme. The theme module must be loaded first (see loadTheme).
function buildWorld(theme, lv) {
  const mod = loaded[theme];
  if (!mod) throw new Error('theme not loaded: ' + theme);
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
    const sideM = texMat(tx.side),
      topM = texMat(tx.top),
      lipT = texMat(tx.lip);
    const mats = [sideM, sideM, topM, sideM, sideM, sideM];
    const lipM = [lipT, lipT, topM, lipT, lipT, lipT];
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
        if (mod.posts) {
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
  if (mod.farGround) {
    const gp = M(bx(len + 400, 0.1, 200), T.ground, game.worldG, len / 2, 1.6, -104, false);
    gp.castShadow = false;
  }
  if (mod.backdrop) mod.backdrop({
    lv,
    len,
    r,
    T,
    tx
  });
}
// Show the world for a chapter: build it now if its theme is loaded,
// otherwise load it first (the game waits while game.worldLoading is set).
let worldToken = 0;
function showWorld(theme, lv) {
  const token = ++worldToken;
  if (loaded[theme]) {
    game.worldLoading = null;
    buildWorld(theme, lv);
    return;
  }
  game.worldLoading = theme;
  clearGroup(game.worldG);
  loadTheme(theme).then(() => {
    if (token !== worldToken) return;
    game.worldLoading = null;
    buildWorld(theme, lv);
  }, e => {
    console.error(e);
    if (token === worldToken) setTimeout(() => token === worldToken && showWorld(theme, lv), 2000);
  });
}

export { applyTheme, boxUV, buildWorld, clearGroup, showWorld, cloud, loadTheme, loaded, noiseTex, skyTex, texMat, themeReady, tree, wx, wy };