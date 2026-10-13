import * as THREE from 'three';
import { game } from '../state.js';
import { fit, glC } from '../core/setup.js';
import { rng } from '../core/helpers.js';
import { Gp, bm, ctex, sph, spr } from './materials.js';
import { makePortraits } from './portraits.js';
import { buildEnding, buildSelect, buildTitle } from './menus3d.js';

// ---------- scene setup ----------
game.views = [];
game.frameId = 0;
game.particlesPool = [];
game.ghostPool = {};
game.auraMesh = undefined;
game.kameBall = undefined;
game.staticAnim = [];
function initGL() {
  game.renderer = new THREE.WebGLRenderer({
    canvas: glC,
    antialias: true
  });
  game.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  game.renderer.shadowMap.enabled = true;
  game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  game.scene = new THREE.Scene();
  game.camera = new THREE.PerspectiveCamera(38, 1.5, 0.1, 500);
  game.GRAD = new THREE.DataTexture(new Uint8Array([88, 150, 212, 255]), 4, 1, THREE.RedFormat);
  game.GRAD.minFilter = game.GRAD.magFilter = THREE.NearestFilter;
  game.GRAD.needsUpdate = true;
  game.OUT = new THREE.MeshBasicMaterial({
    color: 0x140c18,
    side: THREE.BackSide
  });
  game.GLOW = ctex(64, 64, (x, w, h) => {
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.25, 'rgba(255,255,255,.8)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, w, h);
  });
  game.STAR = ctex(64, 64, x => {
    x.fillStyle = '#fff';
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4,
        r = i % 2 ? 7 : 31;
      x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
    }
    x.fill();
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 14);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
  });
  game.RING = ctex(64, 64, x => {
    x.strokeStyle = '#fff';
    x.lineWidth = 5;
    x.beginPath();
    x.arc(32, 32, 27, 0, 6.29);
    x.stroke();
  });
  game.SQ = ctex(8, 8, x => {
    x.fillStyle = '#fff';
    x.fillRect(1, 1, 6, 6);
  });
  // cloth: weave noise + soft fold lines running along limbs
  game.FABRIC = ctex(128, 128, (x, w, h) => {
    x.fillStyle = '#fff';
    x.fillRect(0, 0, w, h);
    const r2 = rng(4242);
    for (let i = 0; i < 1400; i++) {
      x.fillStyle = `rgba(40,20,40,${0.03 + r2() * 0.05})`;
      x.fillRect(Math.floor(r2() * w), Math.floor(r2() * h), 1, 1);
    }
    for (let i = 0; i < 9; i++) {
      const x0 = r2() * w,
        len = 30 + r2() * 60,
        y0 = r2() * h;
      const gr = x.createLinearGradient(x0 - 4, 0, x0 + 4, 0);
      gr.addColorStop(0, 'rgba(60,30,60,0)');
      gr.addColorStop(.5, 'rgba(60,30,60,.16)');
      gr.addColorStop(1, 'rgba(60,30,60,0)');
      x.save();
      x.translate(x0, y0);
      x.rotate((r2() - .5) * .5);
      x.fillStyle = gr;
      x.translate(-x0, 0);
      x.fillRect(x0 - 4, 0, 8, len);
      x.restore();
    }
    x.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 5; i++) {
      const x0 = r2() * w;
      x.fillRect(x0, 0, 1.5, h);
    }
  }, true);
  game.FABRIC.magFilter = THREE.LinearFilter;
  game.hemi = new THREE.HemisphereLight(0xffffff, 0x405060, 0.7);
  game.scene.add(game.hemi);
  game.sun = new THREE.DirectionalLight(0xffffff, 0.85);
  game.sun.castShadow = true;
  game.sun.shadow.mapSize.set(1024, 1024);
  const sc = game.sun.shadow.camera;
  sc.left = -13;
  sc.right = 13;
  sc.top = 10;
  sc.bottom = -6;
  sc.near = 1;
  sc.far = 60;
  game.sun.shadow.bias = -0.0006;
  game.scene.add(game.sun);
  game.scene.add(game.sun.target);
  {
    const rim = new THREE.DirectionalLight(0xcfe0ff, 0.5);
    rim.position.set(-7, 9, -12);
    game.scene.add(rim);
  }
  for (let i = 0; i < 3; i++) {
    const l = new THREE.PointLight(0xffffff, 0, 7, 2);
    game.scene.add(l);
    game.lightsPool.push(l);
  }
  game.worldG = Gp(game.scene);
  game.dynG = Gp(game.scene);
  game.titleG = Gp(game.scene);
  game.selectG = Gp(game.scene);
  game.endG = Gp(game.scene);
  for (let i = 0; i < 380; i++) {
    const s = spr(game.GLOW, 0xffffff, 0.2);
    s.visible = false;
    game.scene.add(s);
    game.particlesPool.push(s);
  }
  game.auraMesh = new THREE.Mesh(sph(.6, 16, 12), bm('#a0e0ff', 0.35, true));
  game.auraMesh.visible = false;
  game.scene.add(game.auraMesh);
  game.kameBall = new THREE.Group();
  game.kameBall.add(new THREE.Mesh(sph(.12, 12, 8), bm('#ffffff')));
  game.kameBall.add(spr(game.GLOW, 0x60a0ff, 1));
  game.kameBall.visible = false;
  game.scene.add(game.kameBall);
  buildTitle();
  buildSelect();
  buildEnding();
  makePortraits();
  fit();
}
// ---------- textures for worlds ----------

export { initGL };
