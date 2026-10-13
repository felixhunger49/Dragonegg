import * as THREE from 'three';
import { game } from '../state.js';
import { H, W } from '../core/setup.js';
import { applyRig, poseHum } from './poses.js';
import { applyTheme, skyTex, wx, wy } from './world.js';
import { cleanupViews, syncBeams, syncBoss, syncEnemy, syncGhosts, syncItems, syncLights, syncParticles, syncPlayer, syncShots } from './views.js';
import { updCamera } from './camera.js';

// ---------- per-state 3D render ----------
game.shownGroup = null;
function show(gr) {
  for (const x of [game.worldG, game.dynG, game.titleG, game.selectG, game.endG]) x.visible = false;
  if (Array.isArray(gr)) gr.forEach(x => x.visible = true);else gr.visible = true;
}
function render3D() {
  game.frameId++;
  for (const s of game.particlesPool) if (s.visible) s.visible = false;
  game.auraMesh.visible = false;
  game.kameBall.visible = false;
  if (game.state === 'title') {
    show(game.titleG);
    applyTheme('forest');
    const t = game.frame * 0.006;
    game.camera.position.set(Math.sin(t) * 2.2, 3.6, 9.2);
    game.camera.lookAt(0, 3.1, 0);
    game.sun.position.set(-5, 14, 10);
    game.sun.target.position.set(0, 2, 0);
    game.titleRigs.forEach(({
      rg,
      i
    }) => {
      const ph = (game.frame + i * 47) % 240;
      const pose = ph < 20 ? 'jab' : ph < 40 ? 'kick' : ph < 60 ? 'upper' : i === 0 ? 'idle' : 'stand';
      applyRig(rg, i < 2 ? 1 : -1, poseHum(pose, game.frame + i * 13), 0.25);
    });
    game.titleEgg.root.position.y = 4.1 + Math.sin(game.frame * 0.05) * 0.15;
    game.titleEgg.root.rotation.y = game.frame * 0.02;
    game.lightsPool.forEach(l => l.intensity = 0);
    game.renderer.render(game.scene, game.camera);
    return;
  }
  if (game.state === 'select' || game.state === 'vsarena') {
    show(game.selectG);
    game.scene.background = skyTex('castle');
    game.scene.fog = null;
    game.hemi.intensity = 0.65;
    game.sun.intensity = 0.9;
    game.sun.position.set(2, 8, 6);
    game.sun.target.position.set(0, 1, 0);
    game.selRigs.forEach((rg, i) => {
      rg.root.visible = i === game.selIdx;
      if (i === game.selIdx) {
        const ph = game.frame % 200;
        applyRig(rg, 1, poseHum(ph < 25 ? 'jab' : ph < 50 ? 'highk' : ph < 70 ? 'round' : 'idle', game.frame, {
          p: ph < 70 && ph >= 50 ? (ph - 50) / 20 : 0
        }), 0.3);
        rg.root.rotation.y += Math.sin(game.frame * 0.01) * 0.6 - 0.4;
      }
    });
    {
      const cx = 0.9;
      game.camera.position.set(cx, 1.6, 5.4);
      game.camera.lookAt(cx, 1.24, 0);
    }
    game.lightsPool.forEach(l => l.intensity = 0);
    game.renderer.render(game.scene, game.camera);
    return;
  }
  if (game.state === 'ending') {
    show(game.endG);
    game.scene.background = skyTex('castle');
    game.scene.fog = null;
    game.hemi.color.set(0x9a88d0);
    game.hemi.intensity = 0.6;
    game.sun.intensity = 0.5;
    const t = game.endT;
    const rise = Math.min(1, Math.max(0, (t - 120) / 200));
    game.endPillar.material.opacity = Math.min(0.35, Math.max(0, (t - 60) / 200)) * (0.8 + 0.2 * Math.sin(game.frame * 0.2));
    game.endEggs.forEach((e, i) => {
      e.root.position.y = .45 + Math.min(1, t / 100) * (0.6 + Math.sin(game.frame * 0.06 + i) * 0.15);
      e.root.rotation.y = game.frame * 0.03;
      e.glow.material.opacity = 0.4 + Math.min(1, t / 100) * 0.4;
    });
    game.endDragon.segs.forEach((s, i) => {
      const u = i / game.endDragon.segs.length;
      const a = game.frame * 0.03 - u * 7;
      const rr = 3.2 + u * 1.5;
      s.position.set(Math.cos(a) * rr, -6 + rise * 20 - u * 14, Math.sin(a) * rr - 2);
    });
    const hs = game.endDragon.segs[0].position;
    game.endDragon.head.position.set(hs.x, hs.y + 0.6, hs.z + 0.3);
    game.endDragon.head.lookAt(game.camera.position);
    game.camera.position.set(Math.sin(game.frame * 0.004) * 8, 4 + rise * 7, 15);
    game.camera.lookAt(0, 2 + rise * 8, 0);
    game.lightsPool.forEach((l, i) => {
      l.intensity = i === 0 ? 2 : 0;
      l.color.set(0xffd060);
      l.position.set(0, 2, 0);
    });
    game.renderer.render(game.scene, game.camera);
    return;
  }
  // gameplay
  show([game.worldG, game.dynG]);
  if (game.P) syncPlayer();
  for (const e of game.enemies) {
    if (game.mode === 'shmup' || Math.abs(e.x - (game.camX + W / 2)) < W * 0.8) syncEnemy(e);
  }
  syncBoss();
  syncItems();
  syncShots();
  syncBeams();
  syncGhosts();
  syncParticles();
  cleanupViews();
  updCamera();
  syncLights();
  game.renderer.render(game.scene, game.camera);
}
function toScreen(x, y, z = 0) {
  const v = new THREE.Vector3(wx(x), wy(y), z).project(game.camera);
  return {
    x: (v.x + 1) / 2 * W,
    y: (1 - v.y) / 2 * H
  };
}
// ================= HUD / OVERLAY =================

export { render3D, toScreen };
