import * as THREE from 'three';
import { LOOKS } from '../data/data.js';
import { makeHumanoid } from './humanoid.js';
import { applyRig, poseHum } from './poses.js';
import { makeEgg } from './rigs.js';
import { makeDragonHead } from './dragon.js';

// ---------- portraits ----------
const portraitCache = {};
function makePortraits() {
  let r2;
  try {
    r2 = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
  } catch (e) {
    return;
  }
  r2.setSize(128, 128, false);
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0x606080, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(2, 3, 4);
  sc.add(dl);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const list = ['goki', 'kurikin', 'joshi', 'tjamtschu', 'wulma', 'hauzahn', 'zarak', 'rostbart', 'eisenfaust', 'morgrak', 'erz', 'drache'];
  for (const who of list) {
    let obj,
      hy = 1.32;
    if (who === 'erz') {
      const e = makeEgg(4, 1.4);
      obj = e.root;
      hy = 0;
      e.glow.visible = false;
    } else if (who === 'drache') {
      obj = makeDragonHead();
      hy = 0;
    } else {
      const r = makeHumanoid(LOOKS[who]);
      applyRig(r, 1, poseHum('stand', 0), 1);
      r.root.rotation.y = 0.45;
      obj = r.root;
      hy = 1.52 * (LOOKS[who].size || 1) * (LOOKS[who].short ? 0.9 : 1);
    }
    sc.add(obj);
    cam.position.set(0.12, hy + 0.06, who === 'drache' ? 3.4 : who === 'erz' ? 2.6 : 1.55 * (LOOKS[who] ? LOOKS[who].size || 1 : 1));
    cam.lookAt(0, hy - 0.08, 0);
    r2.render(sc, cam);
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    c.getContext('2d').drawImage(r2.domElement, 0, 0);
    portraitCache[who] = c;
    sc.remove(obj);
  }
  r2.dispose();
  if (r2.forceContextLoss) r2.forceContextLoss();
}
function portrait(who) {
  return portraitCache[who] || null;
}
// ---------- dragon ----------

export { makePortraits, portrait };
