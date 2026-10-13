import * as THREE from 'three';
import { game } from '../state.js';
import { hsh, rng } from '../core/helpers.js';
import { LOOKS, ORDER } from '../data/data.js';
import { M, bm, bx, cone, cyl, sph } from './materials.js';
import { makeHumanoid } from './humanoid.js';
import { makeEgg } from './rigs.js';
import { makeDragonHead } from './dragon.js';
import { cloud, tree } from './world.js';

// ---------- title / select / ending scenes ----------
game.titleRigs = [];
game.titleEgg = undefined;
game.selRigs = [];
game.endEggs = [];
game.endDragon = null;
game.endPillar = undefined;
function buildTitle() {
  const g2 = game.titleG;
  g2.visible = false;
  M(bx(30, 2, 8), '#5cc048', g2, 0, 1, -1, false).receiveShadow = true;
  M(bx(30, 2.2, 8.05), '#b07038', g2, 0, -1.1, -1, false);
  const r = rng(3);
  for (let i = 0; i < 9; i++) tree(g2, -13 + i * 3.2 + r(), 2, -4 - r() * 3, 0.9 + r() * 0.4, ['#2e8a3e', '#4cb050']);
  for (let i = 0; i < 8; i++) {
    const h = 10 + r() * 8;
    M(cone(7 + r() * 4, h, 7), '#6a7ab8', g2, -30 + i * 9, 1.6 + h / 2, -40 - r() * 10, false);
    M(cone(2.5, h * .32, 7), '#eef4ff', g2, -30 + i * 9, 1.6 + h * .84, -40 - r() * 10 + 0.01, false);
  }
  for (let i = 0; i < 5; i++) cloud(g2, -20 + i * 10, 12 + r() * 4, -30, 1.6);
  ['goki', 'wulma', 'kurikin', 'tjamtschu', 'joshi'].forEach((k, i) => {
    const rg = makeHumanoid(LOOKS[k]);
    rg.root.position.set([-0.9, 0.9, -2.6, 2.6, 4.3][i] - 0.2, 2, [0.6, 0.3, 0, 0, -0.4][i]);
    g2.add(rg.root);
    game.titleRigs.push({
      rg,
      k,
      i
    });
  });
  game.titleEgg = makeEgg(4, 1.3);
  game.titleEgg.root.position.set(0, 4.1, 0.2);
  g2.add(game.titleEgg.root);
}
function buildSelect() {
  const g2 = game.selectG;
  g2.visible = false;
  M(cyl(1.4, 1.5, .3, 32), '#2a2450', g2, 0, .15, 0, false).receiveShadow = true;
  M(cyl(1.5, 1.5, .05, 32), bm('#ffd040'), g2, 0, .31, 0, false);
  const beam = new THREE.Mesh(cyl(.9, 1.4, 6, 24, true), bm('#ffe8a0', 0.08, true));
  beam.position.set(0, 3.3, 0);
  g2.add(beam);
  for (const k of ORDER) {
    const rg = makeHumanoid(LOOKS[k]);
    rg.root.position.set(0, .32, 0);
    rg.root.visible = false;
    g2.add(rg.root);
    game.selRigs.push(rg);
  }
}
function buildEnding() {
  const g2 = game.endG;
  g2.visible = false;
  M(cyl(10, 10, .4, 32), '#2a2040', g2, 0, -.2, 0, false).receiveShadow = true;
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.283;
    const e = makeEgg(i + 1, 1);
    e.root.position.set(Math.cos(a) * 2.2, .45, Math.sin(a) * 2.2);
    g2.add(e.root);
    game.endEggs.push(e);
  }
  game.endPillar = new THREE.Mesh(cyl(1.2, 1.2, 40, 24, true), bm('#fff4a0', 0.25, true));
  game.endPillar.position.set(0, 20, 0);
  g2.add(game.endPillar);
  const stars = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 400; i++) {
    const a = hsh(i) * 6.283,
      e = hsh(i + 9) * 1.3;
    pts.push(Math.cos(a) * 80 * Math.cos(e), 10 + Math.sin(e) * 80, Math.sin(a) * 80 * Math.cos(e));
  }
  stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g2.add(new THREE.Points(stars, new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.6,
    fog: false
  })));
  game.endDragon = {
    segs: [],
    head: makeDragonHead()
  };
  for (let i = 0; i < 34; i++) {
    const s = M(sph(.55 - i * .011, 12, 8), i % 2 ? '#2a9a4a' : '#34a856', g2, 0, -50, 0, false);
    game.endDragon.segs.push(s);
  }
  game.endDragon.head.scale.setScalar(1.3);
  g2.add(game.endDragon.head);
}
// ---------- views ----------

export { buildEnding, buildSelect, buildTitle };
