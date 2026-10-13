import { game } from '../state.js';
import { FONT, H, S, W, dc, hudC, lo } from '../core/setup.js';
import { R, circ, clamp, txt, wrapLines } from '../core/helpers.js';
import { keys, pressed } from '../core/input.js';
import { playSong, sfx } from '../audio/audio.js';
import { CH, CHAPTERS, NAMES, ORDER } from '../data/data.js';
import { updParts } from '../game/particles.js';
import { setupChapter } from '../game/flow.js';
import { menuItems } from '../game/update.js';
import { portrait } from '../render/portraits.js';
import { toScreen } from '../render/render.js';

// ================= HUD / OVERLAY =================
function drawEggIcon(x, y, on) {
  if (on) {
    circ(x, y, 4, '#7a3000');
    circ(x, y, 3, '#f8a020');
    R(x - 1, y - 2, 1, 1, '#fff');
    R(x, y, 1, 1, '#d81818');
    R(x - 2, y + 1, 1, 1, '#d81818');
    R(x + 1, y + 1, 1, 1, '#d81818');
  } else {
    circ(x, y, 4, '#00000080');
    circ(x, y, 3, '#4a405a');
  }
}
function drawHUD() {
  const p = game.P;
  R(2, 2, 20, 20, '#120c16');
  R(3, 3, 18, 18, '#2a2440');
  R(24, 4, 66, 7, '#120c16');
  R(25, 5, 64, 5, '#3a1a1a');
  const hpw = Math.round(64 * p.hp / p.maxhp);
  R(25, 5, hpw, 5, p.hp / p.maxhp > 0.35 ? '#48d848' : p.hp / p.maxhp > 0.18 ? '#e8c030' : '#e83030');
  R(25, 5, hpw, 1, '#b8f8a8');
  R(24, 13, 66, 5, '#120c16');
  R(25, 14, 64, 3, '#1a2040');
  R(25, 14, Math.round(64 * p.ki / 100), 3, p.sup > 0 ? game.frame >> 2 & 1 ? '#fff080' : '#ffb020' : p.ki >= 50 ? '#ffd040' : '#58b8f8');
  R(25 + 32, 13, 1, 5, '#ffffff');
  if (!game.versus) for (let i = 0; i < 7; i++) drawEggIcon(W - 8 - i * 10, 9, i < game.eggs && !game.stolen);
  if (game.boss && (game.boss.active || game.boss.dying) && !game.boss.gone) {
    R(38, H - 10, 164, 7, '#120c16');
    R(39, H - 9, 162, 5, '#3a1a1a');
    R(39, H - 9, Math.round(162 * game.boss.hp / game.boss.maxhp), 5, '#e84040');
    R(39, H - 9, Math.round(162 * game.boss.hp / game.boss.maxhp), 1, '#ff9090');
  }
  if (game.mode === 'stage') for (const e of game.enemies) {
    if (e.hp < e.maxhp && !e.dead && Math.abs(e.x - (game.camX + W / 2)) < W * 0.6) {
      const s = toScreen(e.x, e.y - e.h - 6, 0);
      R(s.x - 7, s.y, 14, 3, '#120c16');
      R(s.x - 6, s.y + 1, Math.ceil(12 * e.hp / e.maxhp), 1, '#f05050');
    }
  }
  if (game.clash) {
    R(60, 66, 120, 6, '#120c16');
    R(61, 67, 118, 4, '#a020e0');
    R(61, 67, Math.round(118 * clamp(game.clash.v, 0, 100) / 100), 4, '#58b8f8');
    R(120, 65, 1, 8, '#fff');
  }
}
function drawHUDText() {
  const p = game.P;
  const pc = portrait(p.char);
  if (pc) dc.drawImage(pc, 12, 12, 72, 72);
  txt(CH[p.char].name, 24, 19, 12, '#fff');
  txt(String(game.score).padStart(7, '0'), W - 4, 19, 12, '#ffe8a0', 'right');
  if (p.kiHold > 12 && keys.ki) txt(p.ki >= 50 ? 'SPEZIAL BEREIT! LOSLASSEN' : 'KI LÄDT...', W / 2, 30, 12, p.ki >= 50 ? '#ffd040' : '#a0e0ff', 'center');
  if (!(p.kiHold > 12 && keys.ki) && !game.banner) {
    if (p.sup > 0) txt('SUPER-MODUS', W / 2, 30, 12, game.frame >> 3 & 1 ? '#ffd040' : '#fff4b0', 'center');else if (p.ki >= 100 && p.castT <= 0 && game.frame >> 4 & 1) txt(document.body.classList.contains('touch') ? 'SUPER BEREIT! TIPPE SUPER' : 'SUPER BEREIT! DRÜCKE F', W / 2, 30, 12, '#ffd040', 'center');
  }
  if (game.versus) txt('VERSUS', W - 4, 9, 12, '#ff8080', 'right');
  if (p.hits >= 2 && p.hitT > 0) {
    const pop = p.hitT > 72 ? 1 + (p.hitT - 72) * 0.06 : 1;
    dc.save();
    dc.translate(W * S - 24, 56 * S);
    dc.scale(pop, pop);
    dc.font = '28px ' + FONT;
    dc.textAlign = 'right';
    dc.textBaseline = 'top';
    dc.fillStyle = '#000';
    dc.fillText(p.hits + ' HITS', 3, 3);
    dc.fillStyle = p.hits >= 10 ? '#ff6040' : '#ffd040';
    dc.fillText(p.hits + ' HITS', 0, 0);
    dc.restore();
  }
  if (game.boss && (game.boss.active || game.boss.dying) && !game.boss.gone) txt(NAMES[game.boss.key] || '', W / 2, H - 19, 12, '#ffd0d0', 'center');
  if (game.banner) {
    const a = game.banner.t > 10 ? 1 : game.banner.t / 10;
    dc.globalAlpha = a;
    txt(game.banner.text, W / 2, 44, 28, '#ffd040', 'center', '#7a2000');
    dc.globalAlpha = 1;
  }
  if (game.clash) {
    txt('STRAHLEN-DUELL!', W / 2, 40, 24, '#ffffff', 'center', '#2040a0');
    txt('DRÜCK SCHNELL KI / SCHLAG!', W / 2, 54, 14, '#ffd040', 'center');
  }
}
function drawDialogBox() {
  R(3, 107, 234, 50, '#120c16');
  R(4, 108, 232, 48, '#20206a');
  R(5, 109, 230, 46, '#2c34a0');
  R(5, 109, 230, 1, '#5868d8');
  R(6, 110, 228, 44, '#1c2460');
  R(9, 113, 38, 38, '#120c16');
  R(10, 114, 36, 36, '#4a4a8a');
}
function drawDialogText() {
  const ln = game.dlg.lines[game.dlg.i];
  const who = ln[0] === 'P' ? game.P ? game.P.char : 'goki' : ln[0];
  const pc = portrait(who);
  if (pc) dc.drawImage(pc, 10 * S, 114 * S, 36 * S, 36 * S);
  txt(NAMES[who] || who, 52, 112, 16, '#ffd040');
  const shown = ln[1].slice(0, Math.floor(game.dlg.ch));
  const lines = wrapLines(ln[1], 178 * S, 16);
  let n = 0,
    y = 124;
  for (const l of lines) {
    const take = Math.max(0, Math.min(l.length, shown.length - n));
    txt(l.slice(0, take), 52, y, 16, '#ffffff');
    n += l.length + 1;
    y += 9;
  }
  if (game.dlg.ch >= ln[1].length && game.frame >> 4 & 1) txt('▼', 228, 148, 12, '#ffd040');
}
function drawTitleText() {
  const t = game.frame;
  const y = 12 + Math.round(Math.sin(t * 0.05) * 1.5);
  dc.font = '52px ' + FONT;
  dc.textAlign = 'center';
  dc.textBaseline = 'top';
  dc.lineJoin = 'round';
  dc.lineWidth = 14;
  dc.strokeStyle = '#3a1000';
  dc.strokeText('DRAGONEGGS', W * S / 2, y * S);
  const gr = dc.createLinearGradient(0, y * S, 0, y * S + 52);
  gr.addColorStop(0, '#fff4a0');
  gr.addColorStop(0.5, '#ffb020');
  gr.addColorStop(1, '#e04010');
  dc.fillStyle = gr;
  dc.fillText('DRAGONEGGS', W * S / 2, y * S);
  txt('Das große Abenteuer von Son Goki', W / 2, y + 18, 14, '#ffffff', 'center', '#2a2060');
  const items = menuItems();
  const blink = t >> 4 & 1;
  items.forEach((it, i) => txt((game.menuSel === i ? '▶ ' : '  ') + it.t, W / 2, 60 + i * 12, 16, game.menuSel === i ? '#ffe060' : '#ffffff', 'center', '#000'));
  if (blink) txt(document.body.classList.contains('touch') ? 'TIPPEN ZUM STARTEN' : 'DRÜCKE ENTER', W / 2, 62 + items.length * 12, 12, '#ffffff', 'center');
}
function drawSelect2D() {
  for (let i = 0; i < 5; i++) {
    const x = 12 + i * 44,
      y = 12;
    const on = i === game.selIdx;
    R(x - 1, y - 1, 38, 38, on ? '#ffd040' : '#120c16');
    R(x, y, 36, 36, on ? '#3a3a8a' : '#24204a');
  }
}
function drawSelectText() {
  for (let i = 0; i < 5; i++) {
    const pc = portrait(ORDER[i]);
    if (pc) dc.drawImage(pc, (12 + i * 44) * S, 12 * S, 36 * S, 36 * S);
  }
  const k = ORDER[game.selIdx],
    c = CH[k];
  txt('WER KÄMPFT?', W / 2, 3, 14, '#ffd040', 'center');
  txt(c.name, 130, 60, 18, '#ffffff');
  txt('Spezial: ' + c.sp, 130, 72, 11, '#ffd040');
  const lab = ['Kraft', 'Leben', 'Tempo'];
  const vals = [c.dmg >= 10 ? 5 : c.dmg >= 9 ? 4 : c.dmg >= 8 ? 3 : c.dmg >= 7 ? 2 : 1, c.hp >= 120 ? 5 : c.hp >= 100 ? 4 : c.hp >= 95 ? 3 : c.hp >= 85 ? 2 : 1, c.spd >= 1.8 ? 5 : c.spd >= 1.7 ? 4 : c.spd >= 1.55 ? 3 : c.spd >= 1.35 ? 2 : 1];
  for (let i = 0; i < 3; i++) {
    txt(lab[i], 130, 84 + i * 9, 11, '#c8c0e8');
    for (let j = 0; j < 5; j++) {
      dc.fillStyle = j < vals[i] ? '#ffd040' : '#3a3460';
      dc.fillRect((176 + j * 9) * S, (84 + i * 9) * S, 7 * S, 5 * S);
    }
  }
  const ls = wrapLines(c.info, 104 * S, 11);
  ls.forEach((l, i) => txt(l, 130, 114 + i * 8, 11, '#ffffff'));
  txt(game.versus ? 'VERSUS-MODUS: Wähle deinen Kämpfer' : CHAPTERS[game.nextChapter].title + ': ' + CHAPTERS[game.nextChapter].name, W / 2, 151, 11, '#c8c0e8', 'center');
}
function updVsArena() {
  if (pressed.left) {
    game.vsSel = (game.vsSel + 4) % 5;
    sfx.blip();
  }
  if (pressed.right) {
    game.vsSel = (game.vsSel + 1) % 5;
    sfx.blip();
  }
  if (pressed.ki) {
    sfx.blip();
    game.state = 'select';
    return;
  }
  let go = pressed.atk || pressed.start || pressed.jump;
  if (game.tap) {
    const i = Math.floor((game.tap.x - 12) / 44);
    if (game.tap.y < 52 && i >= 0 && i < 5) {
      if (i === game.vsSel) go = true;else {
        game.vsSel = i;
        sfx.blip();
      }
    } else if (game.tap.y > 52 && game.tap.x > 110) go = true;else if (game.tap.y > 52) {
      game.state = 'select';
      sfx.blip();
    }
    game.tap = null;
  }
  if (go) {
    sfx.sel();
    game.eggs = 0;
    game.score = 0;
    setupChapter(game.vsSel, true);
  }
}
function drawVsArena2D() {
  for (let i = 0; i < 5; i++) {
    const x = 12 + i * 44,
      y = 12;
    const on = i === game.vsSel;
    R(x - 1, y - 1, 38, 38, on ? '#ff6040' : '#120c16');
    R(x, y, 36, 36, on ? '#6a2a3a' : '#2a1c30');
  }
}
function drawVsArenaText() {
  const bk = CHAPTERS[game.vsSel].boss;
  for (let i = 0; i < 5; i++) {
    const pc = portrait(CHAPTERS[i].boss);
    if (pc) dc.drawImage(pc, (12 + i * 44) * S, 12 * S, 36 * S, 36 * S);
  }
  txt('WÄHLE DEINEN GEGNER', W / 2, 3, 14, '#ff8060', 'center');
  const lines = wrapLines(NAMES[bk], 104 * S, 16);
  lines.forEach((l, i) => txt(l, 130, 58 + i * 11, 16, '#ffffff'));
  const y0 = 58 + lines.length * 11 + 2;
  txt('Arena: ' + CHAPTERS[game.vsSel].name, 130, y0, 11, '#ffd040');
  const st = Math.min(5, 1 + Math.round(game.vsSel * 1.0));
  txt('Stärke', 130, y0 + 12, 11, '#c8c0e8');
  for (let j = 0; j < 5; j++) {
    dc.fillStyle = j < st ? '#ff6040' : '#3a3460';
    dc.fillRect((176 + j * 9) * S, (y0 + 12) * S, 7 * S, 5 * S);
  }
  txt('Kämpfer: ' + NAMES[game.chosen], 130, y0 + 26, 11, '#ffffff');
  txt(document.body.classList.contains('touch') ? 'Rechts tippen = Los · Links = zurück' : '◀ ▶ wählen · Enter = Los · C = zurück', W / 2, 151, 11, '#c8c0e8', 'center');
}
function updVsWin() {
  game.clearT++;
  updParts();
  if (game.clearT > 60 && (pressed.atk || pressed.start || pressed.jump || game.tap)) {
    game.tap = null;
    game.state = 'vsarena';
    game.vsSel = (game.vsSel + 1) % 5;
    playSong('title');
  }
}
function drawEndingText() {
  if (game.endT > 1000) {
    txt('ENDE', W / 2, 30, 40, '#ffd040', 'center', '#7a2000');
    txt('Danke fürs Spielen!', W / 2, 62, 14, '#ffffff', 'center');
    txt('Punkte: ' + game.score, W / 2, 76, 14, '#ffe8a0', 'center');
    if (game.endT > 1200 && game.frame >> 4 & 1) txt('ENTER / TIPPEN', W / 2, 96, 12, '#ffffff', 'center');
  }
}
function renderOverlay() {
  game.g.clearRect(0, 0, W, H);
  dc.clearRect(0, 0, hudC.width, hudC.height);
  if (game.state === 'title') {
    dc.drawImage(lo, 0, 0, W * S, H * S);
    drawTitleText();
    return;
  }
  if (game.state === 'select') {
    drawSelect2D();
    dc.drawImage(lo, 0, 0, W * S, H * S);
    drawSelectText();
    return;
  }
  if (game.state === 'vsarena') {
    drawVsArena2D();
    dc.drawImage(lo, 0, 0, W * S, H * S);
    drawVsArenaText();
    return;
  }
  if (game.state === 'ending') {
    if (game.dlg) drawDialogBox();
    dc.drawImage(lo, 0, 0, W * S, H * S);
    if (game.dlg) drawDialogText();
    drawEndingText();
    return;
  }
  if (game.card) {
    R(0, 0, W, H, '#000000');
  } else if (game.P) drawHUD();
  if (game.dlg) drawDialogBox();
  if (game.state === 'pause' || game.state === 'gameover' || game.state === 'clear' || game.state === 'vswin') {
    game.g.globalAlpha = 0.6;
    R(0, 0, W, H, '#000');
    game.g.globalAlpha = 1;
  }
  dc.drawImage(lo, 0, 0, W * S, H * S);
  if (game.flashT > 0) {
    dc.fillStyle = 'rgba(255,255,255,' + game.flashT / 10 + ')';
    dc.fillRect(0, 0, hudC.width, hudC.height);
  }
  if (game.card) {
    const c = game.card.ch;
    txt(c.title, W / 2, 56, 20, '#ffd040', 'center');
    txt(c.name, W / 2, 72, 18, '#ffffff', 'center');
    txt('Kämpfer: ' + CH[game.chosen].name, W / 2, 94, 12, '#c8c0e8', 'center');
  } else {
    if (game.P) drawHUDText();
    if (game.dlg) drawDialogText();
  }
  if (game.state === 'pause') {
    txt('PAUSE', W / 2, 22, 28, '#ffd040', 'center');
    const lines = ['Pfeile: laufen · ▼: ducken', 'Z / Leertaste / ▲: springen (2x = Doppelsprung)', 'X: Schlag · S: Tritt (abwechseln = Kombo!)', '▲ + X: Aufwärtshaken · Ducken + S: Feger', 'In der Luft ▼ + S: Sturztritt', 'C kurz: Ki-Schuss · C halten: Ki laden', 'Ki ab Hälfte + loslassen: Spezialangriff', 'V / Shift: Dash · M: Ton an/aus', 'F (Ki voll): Super-Verwandlung · B: Vollbild'];
    if (game.versus) lines.push('Im Versus: C bei Game Over = Gegner wählen');
    lines.forEach((l, i) => txt(l, W / 2, 48 + i * 10, 11, '#ffffff', 'center'));
  }
  if (game.state === 'gameover') {
    txt('GAME OVER', W / 2, 52, 32, '#ff5050', 'center', '#400');
    if (game.goT > 40) txt('Nochmal? ENTER / TIPPEN', W / 2, 84, 13, '#ffffff', 'center');
    if (game.goT > 40 && game.versus) txt('C = anderen Gegner wählen', W / 2, 98, 11, '#c8c0e8', 'center');
  }
  if (game.state === 'vswin') {
    txt('SIEG!', W / 2, 40, 32, '#ffd040', 'center', '#7a2000');
    txt(NAMES[game.chosen] + ' besiegt ' + NAMES[CHAPTERS[game.chapter].boss] + '!', W / 2, 72, 12, '#ffffff', 'center');
    txt('Punkte: ' + game.score, W / 2, 86, 14, '#ffe8a0', 'center');
    if (game.clearT > 60 && game.frame >> 4 & 1) txt('WEITER: ENTER / TIPPEN', W / 2, 106, 12, '#ffffff', 'center');
  }
  if (game.state === 'clear') {
    txt(CHAPTERS[game.chapter].title + ' geschafft!', W / 2, 46, 20, '#ffd040', 'center');
    txt('Dragoneggs: ' + (game.stolen ? 'gestohlen!' : game.eggs + '/7'), W / 2, 70, 14, '#ffffff', 'center');
    txt('Punkte: ' + game.score, W / 2, 84, 14, '#ffe8a0', 'center');
    if (game.clearT > 60 && game.frame >> 4 & 1) txt('WEITER: ENTER / TIPPEN', W / 2, 104, 12, '#ffffff', 'center');
  }
}
// ================= LOOP =================

export { renderOverlay, updVsArena, updVsWin };
