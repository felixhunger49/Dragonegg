import { game } from '../state.js';
import { TS, W } from '../core/setup.js';
import { clamp, rng } from '../core/helpers.js';
import { pressed } from '../core/input.js';
import { playSong, sfx } from '../audio/audio.js';
import { CHAPTERS, STORY } from '../data/data.js';
import { EGGS_BEFORE, writeSave } from './state.js';
import { buildLevel } from './level.js';
import { newPlayer } from './player.js';
import { bossToIdle, makeBoss, setTimeoutFrames } from './boss.js';
import { buildWorld } from '../render/world.js';

// ================= FLOW =================
function dlgStart(lines, done) {
  game.dlg = {
    lines,
    i: 0,
    ch: 0,
    done
  };
}
function updDialog() {
  const ln = game.dlg.lines[game.dlg.i];
  const full = ln[1];
  if (game.dlg.ch < full.length) {
    game.dlg.ch += 0.8;
    if (game.frame % 4 === 0) sfx.blip();
  }
  if (pressed.atk || pressed.jump || pressed.start || pressed.ki || pressed.kick || game.tap) {
    game.tap = null;
    if (game.dlg.ch < full.length) game.dlg.ch = full.length;else {
      game.dlg.i++;
      game.dlg.ch = 0;
      if (game.dlg.i >= game.dlg.lines.length) {
        const d = game.dlg.done;
        game.dlg = null;
        d && d();
      }
    }
  }
}
function setupChapter(i, atBoss) {
  game.chapter = i;
  const ch = CHAPTERS[i];
  game.mode = ch.type === 'shmup' ? 'shmup' : 'stage';
  game.enemies = [];
  game.shots = [];
  game.parts = [];
  game.items = [];
  game.beams = [];
  game.boss = null;
  game.clash = null;
  game.timers = [];
  game.banner = null;
  game.camLock = false;
  game.bossTriggered = false;
  game.shake = 0;
  game.ghosts = [];
  game.lightFx = [];
  game.slowmo = 0;
  if (!atBoss) {
    game.eggsAtStart = game.eggs;
    game.checkpointBoss = false;
  } else game.eggs = game.eggsAtStart;
  game.stolen = i === 4;
  if (game.mode === 'stage') {
    game.L = buildLevel(ch);
    game.enemies = game.L.enemies;
    game.items = game.L.items;
    game.arenaL = (game.L.cols - 15) * TS;
    if (i === 4) game.items = game.items.filter(it => it.type !== 'egg');
    game.P = newPlayer(game.chosen, 40, game.L.top[2] * TS);
    game.camX = 0;
    if (atBoss) {
      game.P.x = game.arenaL + 40;
      game.P.y = 128;
      game.camX = game.arenaL;
      game.enemies = [];
      game.items = game.items.filter(it => it.type !== 'egg');
      game.eggs = game.eggsAtStart + (i !== 4 ? 1 : 0);
      triggerBoss(true);
    }
  } else {
    game.L = null;
    game.P = newPlayer(game.chosen, 50, 90);
    game.shT = atBoss ? 3390 : 0;
    game.bgX = 0;
    game.shRnd = rng(77);
  }
  if (game.renderer) buildWorld(ch.theme, game.L);
  playSong(atBoss ? 'boss' : ch.music);
  game.state = 'play';
  game.card = atBoss ? null : {
    t: 0,
    ch
  };
}
function triggerBoss(quick) {
  game.bossTriggered = true;
  game.checkpointBoss = true;
  game.camLock = true;
  game.enemies = [];
  const ch = CHAPTERS[game.chapter];
  game.boss = makeBoss(ch.boss);
  game.boss.state = 'wait';
  playSong('boss');
  const go = () => {
    game.boss.active = true;
    bossToIdle(40);
  };
  if (quick) setTimeoutFrames(40, go);else setTimeoutFrames(30, () => dlgStart(STORY[game.chapter].boss, go));
}
function bossDefeated() {
  const b = game.boss;
  game.banner = {
    text: 'BESIEGT!',
    t: 90
  };
  playSong(null);
  sfx.egg();
  if (game.versus) {
    setTimeoutFrames(110, () => {
      game.state = 'vswin';
      game.clearT = 0;
      playSong('title');
    });
    return;
  }
  if (game.chapter === 4) {
    setTimeoutFrames(60, () => dlgStart(STORY[4].outro, () => {
      game.state = 'ending';
      game.endT = 0;
      game.stolen = false;
      game.eggs = 7;
      playSong('title');
    }));
    return;
  }
  const stars = game.chapter === 2 ? 5 : EGGS_BEFORE[game.chapter] + 2;
  game.items.push({
    type: 'egg',
    x: clamp(b.x, (game.mode === 'stage' ? game.arenaL : 0) + 30, (game.mode === 'stage' ? game.arenaL : 0) + W - 30),
    y: game.mode === 'stage' ? 100 : b.y,
    vy: game.mode === 'stage' ? -2 : undefined,
    vx: game.mode === 'shmup' ? -0.4 : undefined,
    stars,
    boss: true
  });
}
function chapterOutro() {
  const i = game.chapter;
  dlgStart(STORY[i].outro, () => {
    if (i === 3) {
      game.stolen = true;
    }
    game.save.ch = Math.max(game.save.ch, i + 1);
    writeSave();
    game.state = 'clear';
    game.clearT = 0;
    playSong('title');
  });
}
// ================= UPDATE =================

export { bossDefeated, chapterOutro, dlgStart, setupChapter, triggerBoss, updDialog };
