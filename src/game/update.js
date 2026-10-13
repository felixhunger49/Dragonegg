import { game } from '../state.js';
import { W } from '../core/setup.js';
import { clamp } from '../core/helpers.js';
import { pressed } from '../core/input.js';
import { playSong, sfx } from '../audio/audio.js';
import { CHAPTERS, ENDING, ORDER, STORY } from '../data/data.js';
import { EGGS_BEFORE, introShown, writeSave } from './state.js';
import { updParts } from './particles.js';
import { updPlayer } from './player.js';
import { updEnemy } from './enemies.js';
import { updBoss, updTimers } from './boss.js';
import { updBeams, updShots } from './shots.js';
import { updItems } from './items.js';
import { updShmup } from './shmup.js';
import { dlgStart, setupChapter, triggerBoss, updDialog } from './flow.js';
import { updVsArena, updVsWin } from '../ui/hud.js';

// ================= UPDATE =================
game.slowTick = 0;
function update() {
  game.frame++;
  if (game.state === 'title') {
    updTitle();
    return;
  }
  if (game.state === 'select') {
    updSelect();
    return;
  }
  if (game.state === 'vsarena') {
    updVsArena();
    return;
  }
  if (game.state === 'vswin') {
    updVsWin();
    return;
  }
  if (game.state === 'gameover') {
    game.goT++;
    if (game.goT > 40 && game.versus && pressed.ki) {
      game.state = 'vsarena';
      playSong('title');
      return;
    }
    if (game.goT > 40 && (pressed.atk || pressed.start || pressed.jump || game.tap)) {
      game.tap = null;
      setupChapter(game.chapter, game.checkpointBoss);
    }
    return;
  }
  if (game.state === 'clear') {
    game.clearT++;
    updParts();
    if (game.clearT > 60 && (pressed.atk || pressed.start || pressed.jump || game.tap)) {
      game.tap = null;
      if (game.chapter + 1 < CHAPTERS.length) {
        game.state = 'select';
        game.selIdx = ORDER.indexOf(game.chosen);
        game.nextChapter = game.chapter + 1;
      } else game.state = 'title';
    }
    return;
  }
  if (game.state === 'ending') {
    updEnding();
    return;
  }
  if (game.state === 'pause') {
    if (pressed.start || game.tap) {
      game.tap = null;
      game.state = 'play';
    }
    return;
  }
  if (game.card) {
    game.card.t++;
    if (game.card.t > 130 || game.card.t > 30 && (pressed.atk || pressed.start || game.tap)) {
      game.tap = null;
      const ch = game.card.ch;
      game.card = null;
      const i = CHAPTERS.indexOf(ch);
      if (STORY[i] && STORY[i].intro && !introShown[i]) {
        introShown[i] = true;
        dlgStart(STORY[i].intro, null);
      }
    }
    return;
  }
  if (game.dlg) {
    updDialog();
    updParts();
    return;
  }
  if (pressed.start) {
    game.state = 'pause';
    return;
  }
  if (game.flashT > 0) game.flashT--;
  if (game.zoomPunch > 0) game.zoomPunch *= 0.85;
  for (const gh of game.ghosts) gh.life--;
  game.ghosts = game.ghosts.filter(gh => gh.life > 0);
  if (game.hitstop > 0) {
    game.hitstop--;
    return;
  }
  if (game.slowmo > 0) {
    game.slowmo--;
    if (game.slowTick++ % 3 !== 0) {
      updParts();
      return;
    }
  }
  if (game.banner && --game.banner.t <= 0) game.banner = null;
  updTimers();
  if (game.clash) {
    updBeams();
    updParts();
    return;
  }
  updPlayer();
  if (game.mode === 'stage') {
    for (const e of game.enemies) {
      if (Math.abs(e.x - (game.camX + W / 2)) < W * 0.75) updEnemy(e);
    }
    game.enemies = game.enemies.filter(e => !e.dead);
    if (!game.camLock) {
      const target = game.P.x - W * 0.42 + game.P.f * 14;
      game.camX += (target - game.camX) * 0.1;
      game.camX = clamp(game.camX, 0, game.L.w - W);
      if (!game.bossTriggered && game.P.x > game.arenaL + 24) {
        game.camLock = true;
        triggerBoss(false);
      }
    } else {
      game.camX += (game.arenaL - game.camX) * 0.15;
      if (Math.abs(game.camX - game.arenaL) < 0.5) game.camX = game.arenaL;
    }
  } else updShmup();
  if (game.boss) updBoss();
  updShots();
  updBeams();
  updItems();
  updParts();
  if (game.shake > 0) game.shake--;
}
function menuItems() {
  const a = [{
    k: 'new',
    t: 'NEUES SPIEL'
  }];
  if (game.save.ch > 0) a.push({
    k: 'cont',
    t: 'WEITER: KAPITEL ' + (Math.min(game.save.ch, 4) + 1)
  });
  a.push({
    k: 'vs',
    t: 'VERSUS-MODUS'
  });
  return a;
}
function updTitle() {
  if (game.AC && !game.curSong) playSong('title');
  const items = menuItems();
  const n = items.length;
  if (pressed.up) {
    game.menuSel = (game.menuSel + n - 1) % n;
    sfx.blip();
  }
  if (pressed.down) {
    game.menuSel = (game.menuSel + 1) % n;
    sfx.blip();
  }
  game.menuSel = Math.min(game.menuSel, n - 1);
  if (game.tap) {
    const i = Math.floor((game.tap.y - 59) / 12);
    if (i >= 0 && i < n) {
      if (i !== game.menuSel) {
        game.menuSel = i;
        sfx.blip();
        game.tap = null;
      }
    }
  }
  if (pressed.atk || pressed.start || pressed.jump || game.tap) {
    game.tap = null;
    sfx.sel();
    const k = items[game.menuSel].k;
    game.versus = k === 'vs';
    if (game.versus) {
      game.eggs = 0;
      game.score = 0;
      game.state = 'select';
      game.selIdx = ORDER.indexOf(game.chosen);
      return;
    }
    if (k === 'cont') {
      game.nextChapter = Math.min(game.save.ch, 4);
      game.eggs = game.nextChapter === 4 ? 0 : EGGS_BEFORE[game.nextChapter];
    } else {
      game.nextChapter = 0;
      game.eggs = 0;
    }
    game.score = 0;
    for (const k in introShown) delete introShown[k];
    game.state = 'select';
    game.selIdx = ORDER.indexOf(game.chosen);
    playSong('title');
  }
}
function updSelect() {
  if (pressed.left) {
    game.selIdx = (game.selIdx + 4) % 5;
    sfx.blip();
  }
  if (pressed.right) {
    game.selIdx = (game.selIdx + 1) % 5;
    sfx.blip();
  }
  let go = pressed.atk || pressed.start || pressed.jump;
  if (game.tap) {
    const i = Math.floor((game.tap.x - 12) / 44);
    if (game.tap.y < 52 && i >= 0 && i < 5) {
      if (i === game.selIdx) go = true;else {
        game.selIdx = i;
        sfx.blip();
      }
    } else if (game.tap.y > 52) go = true;
    game.tap = null;
  }
  if (go && game.versus) {
    sfx.sel();
    game.chosen = ORDER[game.selIdx];
    game.state = 'vsarena';
    return;
  }
  if (go) {
    sfx.sel();
    game.chosen = ORDER[game.selIdx];
    if (game.nextChapter === 4) game.eggs = 0;else if (game.eggs < EGGS_BEFORE[game.nextChapter]) game.eggs = EGGS_BEFORE[game.nextChapter];
    setupChapter(game.nextChapter, false);
  }
}
function updEnding() {
  updParts();
  if (game.dlg) {
    updDialog();
    return;
  }
  game.endT++;
  if (game.endT === 200) dlgStart(ENDING, () => {
    game.endT = 1000;
  });
  if (game.endT > 1200 && (pressed.atk || pressed.start || game.tap)) {
    game.tap = null;
    game.state = 'title';
    game.save.ch = 0;
    writeSave();
    playSong('title');
  }
}
// =====================================================================
// ============================ 3D RENDERING ===========================
// =====================================================================

export { menuItems, update };
