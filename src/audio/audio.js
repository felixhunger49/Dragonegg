import { game } from '../state.js';

// ================= AUDIO =================
game.AC = null;
game.master = null;
game.mus = null;
game.muted = false;
game.noiseBuf = null;
function ac() {
  if (!game.AC) {
    try {
      game.AC = new (window.AudioContext || window.webkitAudioContext)();
      game.master = game.AC.createGain();
      game.master.gain.value = 0.6;
      game.master.connect(game.AC.destination);
      game.mus = game.AC.createGain();
      game.mus.gain.value = 0.9;
      game.mus.connect(game.master);
      game.noiseBuf = game.AC.createBuffer(1, game.AC.sampleRate * 0.5, game.AC.sampleRate);
      const d = game.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      game.AC = null;
    }
  }
  if (game.AC && game.AC.state === 'suspended') game.AC.resume();
  return game.AC;
}
function tone(f, dur, type = 'square', vol = 0.08, f2 = 0, delay = 0, dest) {
  const a = game.AC;
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(),
    gn = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn);
  gn.connect(dest || game.master);
  o.start(t);
  o.stop(t + dur + 0.03);
}
function noise(dur, vol = 0.1, delay = 0, hp = 600, dest) {
  const a = game.AC;
  if (!a) return;
  const t = a.currentTime + delay;
  const s = a.createBufferSource();
  s.buffer = game.noiseBuf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const gn = a.createGain();
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(gn);
  gn.connect(dest || game.master);
  s.start(t);
  s.stop(t + dur + 0.02);
}
const sfx = {
  punch() {
    noise(0.06, 0.12, 0, 1500);
    tone(220, 0.05, 'square', 0.05, 90);
  },
  kick() {
    noise(0.09, 0.14, 0, 900);
    tone(160, 0.08, 'square', 0.05, 70);
  },
  hit() {
    noise(0.09, 0.2, 0, 400);
    tone(140, 0.08, 'square', 0.08, 50);
  },
  big() {
    noise(0.2, 0.28, 0, 200);
    tone(110, 0.2, 'square', 0.1, 35);
  },
  jump() {
    tone(260, 0.12, 'square', 0.05, 620);
  },
  dash() {
    noise(0.15, 0.08, 0, 2500);
  },
  ki() {
    tone(900, 0.16, 'sawtooth', 0.04, 250);
  },
  gun() {
    noise(0.05, 0.12, 0, 3000);
    tone(1200, 0.04, 'square', 0.03, 400);
  },
  charge() {
    tone(180 + Math.random() * 40, 0.12, 'triangle', 0.05, 360);
  },
  beam() {
    noise(0.9, 0.12, 0, 300);
    tone(120, 0.9, 'sawtooth', 0.05, 60);
    tone(240, 0.6, 'square', 0.03, 120);
  },
  boom() {
    noise(0.45, 0.25, 0, 120);
    tone(90, 0.4, 'square', 0.08, 30);
  },
  hurt() {
    tone(400, 0.18, 'square', 0.07, 120);
  },
  item() {
    tone(880, 0.07, 'square', 0.05);
    tone(1320, 0.1, 'square', 0.05, 0, 0.07);
  },
  egg() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.05, 0, i * 0.07));
  },
  blip() {
    tone(660, 0.025, 'square', 0.025);
  },
  sel() {
    tone(520, 0.05, 'square', 0.05);
    tone(780, 0.07, 'square', 0.05, 0, 0.05);
  },
  warn() {
    tone(300, 0.25, 'square', 0.05, 600);
  }
};
const NOTE = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};
function nf(n) {
  const m = n.match(/^([A-G])(#|b)?(\d)$/);
  if (!m) return 0;
  let s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  return 440 * Math.pow(2, (s - 69) / 12);
}
function parse(str) {
  const t = str.split(/\s+/).filter(x => x && x !== '|');
  const out = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '-' || t[i] === '.') {
      out.push(null);
      continue;
    }
    let len = 1;
    while (t[i + len] === '-') len++;
    out.push({
      f: nf(t[i]),
      len
    });
  }
  return out;
}
function song(bpm, lead, bass, drums = true) {
  const l = parse(lead),
    b = parse(bass);
  return {
    bpm,
    lead: l,
    bass: b,
    len: Math.max(l.length, b.length),
    drums
  };
}
const SONGS = {
  title: song(116, 'E5 - G5 E5 D5 C5 D5 E5 | G5 - A5 G5 E5 - C5 - | F5 - E5 D5 C5 - D5 E5 | D5 - - - G4 - - - | E5 - G5 E5 D5 C5 D5 E5 | G5 - A5 G5 C6 - A5 - | G5 - E5 C5 D5 - E5 D5 | C5 - - - . . . .', 'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . G2 . D3 . | C3 . G3 . C3 . . .', false),
  adv: song(150, 'E5 - G5 E5 D5 C5 D5 E5 | G5 - A5 G5 E5 - C5 - | F5 - E5 D5 C5 - D5 E5 | D5 - - - G4 - - - | E5 - G5 E5 D5 C5 D5 E5 | G5 - A5 G5 C6 - A5 - | G5 - E5 C5 D5 - E5 D5 | C5 - - - . . . .', 'C3 . C4 . C3 . C4 . | A2 . A3 . A2 . A3 . | F2 . F3 . F2 . F3 . | G2 . G3 . G2 . G3 . | C3 . C4 . C3 . C4 . | A2 . A3 . A2 . A3 . | F2 . F3 . G2 . G3 . | C3 . C4 . C3 . G2 .'),
  adv2: song(140, 'D5 - F5 G5 A5 - G5 F5 | E5 - C5 D5 E5 - - - | D5 - F5 G5 A5 - C6 A5 | G5 - E5 - D5 - - - | A5 - G5 F5 G5 - F5 E5 | F5 - E5 D5 C5 - D5 E5 | D5 - F5 A5 G5 - E5 C5 | D5 - - - . . . .', 'D3 . D3 A2 D3 . D3 A2 | C3 . C3 G2 C3 . C3 G2 | Bb2 . Bb2 F2 Bb2 . Bb2 F2 | A2 . A2 E2 A2 . C3 . | D3 . D3 A2 D3 . D3 A2 | F2 . F2 C3 F2 . F2 C3 | Bb2 . Bb2 F2 C3 . C3 G2 | D3 . D3 A2 D3 . . .'),
  sky: song(160, 'C5 E5 G5 C6 B5 G5 E5 G5 | A5 F5 C5 F5 A5 - G5 - | E5 G5 C6 E6 D6 C6 B5 G5 | A5 - G5 - E5 - D5 - | C5 E5 G5 C6 B5 G5 E5 G5 | A5 F5 C5 F5 A5 - C6 - | B5 - G5 - D6 - B5 - | C6 - - - . . . .', 'C3 . C4 . C3 . C4 . | F2 . F3 . F2 . F3 . | A2 . A3 . A2 . A3 . | G2 . G3 . G2 . G3 . | C3 . C4 . C3 . C4 . | F2 . F3 . F2 . F3 . | G2 . G3 . G2 . G3 . | C3 . C4 . C3 . . .'),
  base: song(145, 'E5 . E5 E5 G5 . E5 . | D5 . D5 D5 F#5 . D5 . | C5 . C5 C5 E5 . G5 . | B4 - - - D#5 - - - | E5 . E5 E5 G5 . B5 . | A5 . G5 F#5 E5 . D5 . | C5 . E5 . A5 . G5 . | F#5 - - - B4 - - -', 'E2 E2 E3 E2 E2 E2 E3 E2 | D2 D2 D3 D2 D2 D2 D3 D2 | C2 C2 C3 C2 C2 C2 C3 C2 | B1 B1 B2 B1 B1 B1 B2 B1 | E2 E2 E3 E2 E2 E2 E3 E2 | D2 D2 D3 D2 D2 D2 D3 D2 | C2 C2 C3 C2 A1 A1 A2 A1 | B1 B1 B2 B1 B1 B1 B2 B1'),
  dark: song(120, 'E4 - A4 - B4 - C5 B4 | A4 - E4 - - - . . | F4 - A4 - C5 - D5 C5 | B4 - G#4 - E4 - - - | E4 - A4 - B4 - C5 D5 | E5 - C5 - A4 - . . | F4 - A4 - D5 - C5 B4 | A4 - - - - - . .', 'A2 . A2 . A2 . A2 . | A2 . A2 . G2 . G2 . | F2 . F2 . F2 . F2 . | E2 . E2 . E2 . E2 . | A2 . A2 . A2 . A2 . | C3 . C3 . C3 . C3 . | D3 . D3 . E2 . E2 . | A2 . A2 . A2 . A2 .'),
  boss: song(172, 'A4 . A4 C5 . A4 E5 . | D5 . C5 B4 . G4 A4 . | F4 . F4 A4 . F4 C5 . | B4 . G#4 B4 E5 - D5 B4 | A4 . A4 C5 . A4 E5 . | G5 . F5 E5 . D5 E5 . | F5 . E5 D5 . C5 D5 . | E5 - - - G#4 - B4 -', 'A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 A2 A3 A2 A3 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | E2 E3 E2 E3 E2 E3 E2 E3')
};
game.curSong = null;
game.songStep = 0;
game.nextT = 0;
function playSong(n) {
  const s = n ? SONGS[n] : null;
  if (game.curSong === s) return;
  game.curSong = s;
  game.songStep = 0;
  if (game.AC) game.nextT = game.AC.currentTime + 0.06;
}
setInterval(() => {
  if (!game.AC || !game.curSong || game.muted) return;
  const sd = 60 / game.curSong.bpm / 2;
  if (game.nextT < game.AC.currentTime - 0.2) game.nextT = game.AC.currentTime + 0.05;
  while (game.nextT < game.AC.currentTime + 0.15) {
    const i = game.songStep,
      dt = game.nextT - game.AC.currentTime;
    const l = game.curSong.lead[i % game.curSong.lead.length],
      b = game.curSong.bass[i % game.curSong.bass.length];
    if (l && l.f) tone(l.f, sd * l.len * 0.95, 'square', 0.032, 0, dt, game.mus);
    if (b && b.f) tone(b.f, sd * b.len * 0.9, 'triangle', 0.11, 0, dt, game.mus);
    if (game.curSong.drums) {
      if (i % 4 === 0) tone(140, 0.12, 'sine', 0.16, 40, dt, game.mus);
      if (i % 4 === 2) noise(0.04, 0.03, dt, 5000, game.mus);
      if (i % 8 === 4) noise(0.1, 0.06, dt, 1200, game.mus);
    }
    game.nextT += sd;
    game.songStep = (game.songStep + 1) % game.curSong.len;
  }
}, 25);
// ================= DATA =================

export { ac, playSong, sfx, tone };
