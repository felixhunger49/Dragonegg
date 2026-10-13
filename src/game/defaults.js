import { game } from '../state.js';

// ================= GAME STATE: start values =================
game.state = 'title';
game.frame = 0;
game.chapter = 0;
game.eggs = 0;
game.eggsAtStart = 0;
game.score = 0;
game.stolen = false;
game.mode = 'stage';
game.L = null;
game.camX = 0;
game.camLock = false;
game.arenaL = 0;
game.shake = 0;
game.hitstop = 0;
game.slowmo = 0;
game.flashT = 0;
game.zoomPunch = 0;
game.P = null;
game.enemies = [];
game.shots = [];
game.parts = [];
game.items = [];
game.beams = [];
game.boss = null;
game.dlg = null;
game.card = null;
game.clash = null;
game.banner = null;
game.bossTriggered = false;
game.checkpointBoss = false;
game.chosen = 'goki';
game.versus = false;
game.vsSel = 0;
game.menuSel = 0;
game.selIdx = 0;
game.shT = 0;
game.bgX = 0;
game.shRnd = null;
game.endT = 0;
game.goT = 0;
game.clearT = 0;
game.atkId = 1;
game.nextChapter = 0;
const introShown = {};
game.save = {
  ch: 0
};
try {
  const s = JSON.parse(localStorage.getItem('dragoneggs-save') || 'null');
  if (s && typeof s.ch === 'number') game.save = s;
} catch (e) {}
function writeSave() {
  try {
    localStorage.setItem('dragoneggs-save', JSON.stringify(game.save));
  } catch (e) {}
}
const EGGS_BEFORE = [0, 2, 4, 5, 0];
// ================= LEVEL =================

export { EGGS_BEFORE, introShown, writeSave };
