import * as THREE from 'three';
import { M, bm, bx, cone, cyl, sph } from './materials.js';

// ---------- dragon ----------
function makeDragonHead() {
  const g2 = new THREE.Group();
  M(sph(.55, 16, 12), '#2a9a4a', g2, 0, 0, 0, true, [1, .85, 1.1]);
  M(bx(.55, .35, .6), '#2a9a4a', g2, 0, -.1, .5);
  M(bx(.5, .12, .5), '#e8d060', g2, 0, -.28, .5);
  for (const sx of [-1, 1]) {
    const h = M(cone(.07, .6, 6), '#e8e0c8', g2, sx * .25, .5, -.2);
    h.rotation.x = -.6;
    h.rotation.z = -sx * .3;
    const ey = new THREE.Mesh(sph(.08, 8, 6), bm('#ff2020'));
    ey.position.set(sx * .25, .12, .38);
    g2.add(ey);
    const wh = M(cyl(.015, .015, .9, 5), '#e8d060', g2, sx * .35, -.15, .6, false);
    wh.rotation.z = sx * 1.2;
  }
  for (let i = 0; i < 5; i++) {
    const s = M(cone(.08, .3, 5), '#e8d060', g2, 0, .35 - i * .05, -.2 - i * .18);
    s.rotation.x = -.5;
  }
  g2.rotation.y = 0.5;
  return g2;
}
// ---------- scene setup ----------

export { makeDragonHead };
