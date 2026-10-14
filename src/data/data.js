// ================= DATA =================
const LOOKS = {
  goki: {
    skin: '#f8c088',
    gi: '#f07818',
    belt: '#2848c0',
    boots: '#2848c0',
    hair: 'goki',
    hc: '#1c1a28',
    tail: true,
    staff: true,
    wrist: '#2848c0',
    under: '#2848c0',
    sym: true
  },
  kurikin: {
    skin: '#f8c088',
    gi: '#f07818',
    belt: '#2848c0',
    boots: '#2848c0',
    hair: 'bald',
    short: true,
    size: 0.9,
    wrist: '#2848c0',
    under: '#2848c0',
    sym: true
  },
  joshi: {
    skin: '#f0b880',
    gi: '#e8583a',
    pants: '#e8d8a0',
    belt: '#3a8a3a',
    boots: '#a87038',
    hair: 'joshi',
    shell: true,
    glasses: true
  },
  tjamtschu: {
    skin: '#e0a870',
    gi: '#48a058',
    pants: '#3a6a9a',
    belt: '#e8c848',
    boots: '#784828',
    hair: 'long',
    hc: '#1c1a28',
    wrist: '#e8c848'
  },
  wulma: {
    skin: '#f8c8a0',
    gi: '#f070a8',
    pants: '#f8c8a0',
    belt: '#f8f0f8',
    boots: '#d02828',
    hair: 'wulma',
    hc: '#30c0c8',
    dress: true,
    lashes: true,
    gun: true
  },
  bandit: {
    skin: '#d8a068',
    gi: '#8a5a30',
    pants: '#5a3a20',
    belt: '#c03030',
    boots: '#3a2818',
    hair: 'band',
    hc: '#3a2818'
  },
  soldier: {
    skin: '#e8b078',
    gi: '#5a7040',
    belt: '#2a2a2a',
    boots: '#2a2a2a',
    hair: 'helmet',
    hc: '#3e5430',
    gun: true
  },
  ninja: {
    skin: '#e8b078',
    gi: '#4a2a6a',
    belt: '#c8a020',
    boots: '#2a1a3a',
    hair: 'mask',
    hc: '#3a1a5a'
  },
  robot: {
    skin: '#a8b0c0',
    gi: '#707888',
    pants: '#58606e',
    belt: '#e8c020',
    boots: '#40464f',
    hair: 'robo',
    metal: true,
    eye: '#ff3030'
  },
  hauzahn: {
    skin: '#9a8a7a',
    gi: '#6a4a30',
    pants: '#4a3020',
    belt: '#c03030',
    boots: '#3a2818',
    hair: 'wolf',
    hc: '#6a6070',
    claws: true,
    size: 1.15,
    eye: '#e0b020'
  },
  zarak: {
    skin: '#c8925a',
    gi: '#7040a0',
    pants: '#e8e0d0',
    belt: '#e8c020',
    boots: '#5a3070',
    hair: 'turban',
    stinger: true,
    size: 1.1
  },
  rostbart: {
    skin: '#f0b880',
    gi: '#b02828',
    pants: '#2a2a3a',
    belt: '#e8c020',
    boots: '#1a1a1a',
    hair: 'captain',
    hc: '#c84818',
    size: 0.95
  },
  eisenfaust: {
    skin: '#b8c0cc',
    gi: '#7a1c1c',
    pants: '#3a3a44',
    belt: '#e8c020',
    boots: '#2a2a30',
    hair: 'cyborg',
    hc: '#e02020',
    bigArm: true,
    size: 1.2
  },
  morgrak: {
    skin: '#8a60c0',
    gi: '#2a1c40',
    pants: '#2a1c40',
    belt: '#c02848',
    boots: '#1a1028',
    hair: 'horns',
    cape: '#a01830',
    size: 1.15,
    eye: '#ff3030'
  }
};
for (const k in LOOKS) {
  const L = LOOKS[k];
  L.pants = L.pants || L.gi;
}
const CH = {
  goki: {
    name: 'Son Goki',
    hp: 100,
    spd: 1.55,
    jmp: 4.7,
    dmg: 8,
    sp: 'Kamehameha',
    info: 'Allrounder. 3. Schlag der Kombo: Zauberstab!'
  },
  kurikin: {
    name: 'Kurikin',
    hp: 85,
    spd: 1.8,
    jmp: 5.0,
    dmg: 7,
    sp: 'Kienzan',
    info: 'Flink. Die Kienzan-Scheibe schneidet durch alles.'
  },
  joshi: {
    name: 'Mr Joshi',
    hp: 125,
    spd: 1.3,
    jmp: 4.4,
    dmg: 10,
    sp: 'MAX-Kamehameha',
    info: 'Langsam, aber stark. Riesiger Strahl!'
  },
  tjamtschu: {
    name: 'Tjamtschu',
    hp: 95,
    spd: 1.7,
    jmp: 4.8,
    dmg: 9,
    sp: 'Wolfsfang-Faust',
    info: 'Schnelle Fäuste. Wilder Ansturm nach vorn.'
  },
  wulma: {
    name: 'Wulma',
    hp: 80,
    spd: 1.55,
    jmp: 4.6,
    dmg: 6,
    sp: 'Kapsel-Bombe',
    info: 'Schießt mit der Pistole. Bombe wirft sie im Bogen.'
  }
};
const ORDER = ['goki', 'kurikin', 'joshi', 'tjamtschu', 'wulma'];
const NAMES = {
  goki: 'Son Goki',
  kurikin: 'Kurikin',
  joshi: 'Mr Joshi',
  tjamtschu: 'Tjamtschu',
  wulma: 'Wulma',
  hauzahn: 'Wolfsfürst Hauzahn',
  zarak: 'Skorpion Zarak',
  rostbart: 'Kapitän Rostbart',
  eisenfaust: 'General Eisenfaust',
  morgrak: 'Dämonenkönig Morgrak',
  erz: 'Erzähler',
  drache: 'Weltdrache Ovaron'
};
const EN = {
  bandit: {
    beh: 'walker',
    hp: 24,
    look: 'bandit',
    dmg: 7,
    score: 100,
    spd: 0.9
  },
  soldier: {
    beh: 'walker',
    gun: true,
    hp: 22,
    look: 'soldier',
    dmg: 7,
    score: 120,
    spd: 0.7
  },
  ninja: {
    beh: 'walker',
    hp: 32,
    look: 'ninja',
    dmg: 9,
    score: 150,
    spd: 1.3
  },
  robot: {
    beh: 'walker',
    hp: 55,
    look: 'robot',
    dmg: 12,
    score: 200,
    armor: true,
    spd: 0.5
  },
  wolf: {
    beh: 'wolf',
    hp: 18,
    col: ['#9a9aa8', '#5a5a6a'],
    dmg: 9,
    score: 100
  },
  hound: {
    beh: 'wolf',
    hp: 26,
    col: ['#6a3050', '#3a1830'],
    eye: '#ff4040',
    dmg: 11,
    score: 150
  },
  bat: {
    beh: 'flyer',
    hp: 10,
    col: ['#7a5aaa', '#40286a'],
    dmg: 6,
    score: 80,
    kind: 'bat'
  },
  vulture: {
    beh: 'flyer',
    hp: 14,
    col: ['#9a7048', '#5a3a20'],
    dmg: 7,
    score: 90,
    kind: 'bird'
  },
  drone: {
    beh: 'flyer',
    hp: 16,
    col: ['#9098a8', '#505868'],
    dmg: 7,
    score: 110,
    shoots: true,
    kind: 'drone'
  },
  imp: {
    beh: 'flyer',
    hp: 18,
    col: ['#d04040', '#801818'],
    dmg: 8,
    score: 130,
    shoots: true,
    kind: 'imp'
  },
  scorpion: {
    beh: 'crawler',
    hp: 20,
    col: ['#d06030', '#803018'],
    dmg: 8,
    score: 100
  }
};
const BOSS = {
  hauzahn: {
    look: 'hauzahn',
    hp: 170,
    spd: 1.35,
    atks: ['melee', 'melee', 'dash', 'jump'],
    dmg: 10,
    cd: 50
  },
  zarak: {
    look: 'zarak',
    hp: 210,
    spd: 1.2,
    atks: ['melee', 'shot', 'dash', 'jump'],
    dmg: 11,
    shots: 2,
    shotCol: ['#a0f040', '#407010'],
    cd: 45
  },
  eisenfaust: {
    look: 'eisenfaust',
    hp: 260,
    spd: 1.0,
    atks: ['melee', 'shot', 'beam', 'jump', 'melee'],
    dmg: 13,
    shots: 3,
    shotCol: ['#ffb040', '#c04010'],
    beam: ['#ff3818', '#ff9060'],
    cd: 40
  },
  morgrak: {
    look: 'morgrak',
    hp: 280,
    spd: 1.45,
    atks: ['melee', 'shot', 'beam', 'dash', 'jump'],
    dmg: 14,
    shots: 3,
    shotCol: ['#e070ff', '#6a10a0'],
    beam: ['#a020e0', '#e090ff'],
    cd: 34
  }
};
const CHAPTERS = [{
  title: 'Kapitel 1',
  name: 'Der Wald der Wölfe',
  type: 'stage',
  theme: 'forest',
  seed: 11,
  cols: 150,
  enemies: ['wolf', 'bandit', 'bat', 'bandit'],
  boss: 'hauzahn',
  music: 'adv'
}, {
  title: 'Kapitel 2',
  name: 'Die Teufelswüste',
  type: 'stage',
  theme: 'desert',
  seed: 23,
  cols: 165,
  enemies: ['scorpion', 'bandit', 'vulture', 'wolf'],
  boss: 'zarak',
  music: 'adv2'
}, {
  title: 'Kapitel 3',
  name: 'Jagd über den Wolken',
  type: 'shmup',
  theme: 'sky',
  boss: 'rostbart',
  music: 'sky'
}, {
  title: 'Kapitel 4',
  name: 'Festung der Krallen-Armee',
  type: 'stage',
  theme: 'base',
  seed: 37,
  cols: 180,
  enemies: ['soldier', 'robot', 'drone', 'soldier'],
  boss: 'eisenfaust',
  music: 'base'
}, {
  title: 'Kapitel 5',
  name: 'Morgraks Schloss',
  type: 'stage',
  theme: 'castle',
  seed: 51,
  cols: 180,
  enemies: ['ninja', 'imp', 'hound', 'robot'],
  boss: 'morgrak',
  music: 'dark'
}];
const STORY = {
  0: {
    intro: [['erz', 'Vor langer Zeit versteckte der Weltdrache Ovaron sieben magische Dragoneggs auf der ganzen Welt.'], ['erz', 'Wer alle sieben findet, dem erfüllt der Drache einen Wunsch...'], ['wulma', 'Hey Goki! Mein Ei-Radar piept! Im Wald der Wölfe liegt ein Dragonegg!'], ['goki', 'Super! Vielleicht treffe ich da auch ein paar starke Gegner!'], ['kurikin', 'Tipp: Wölfe sind klein. Duck dich und tritt zu, oder nimm einen Tritt!'], ['joshi', 'Hohoho... und vergesst nicht: Schlag und Tritt lassen sich zu Kombos verbinden!'], ['tjamtschu', 'Wölfe? Pah! Gegen meine Wolfsfang-Faust haben die keine Chance!']],
    boss: [['hauzahn', 'Grrrr! Wer wagt es, in mein Revier einzudringen?!'], ['hauzahn', 'Ich bin Hauzahn, der Wolfsfürst! Das Ei gehört Meister Morgrak!'], ['P', 'Das werden wir ja sehen! Los geht\'s!']],
    outro: [['hauzahn', 'Unmöglich... der Meister... wird sich rächen...'], ['wulma', 'Zwei Eier! Das Radar zeigt das nächste in der Teufelswüste!'], ['tjamtschu', 'Die Wüste... da war ich früher Bandit. Ich kenne mich aus!']]
  },
  1: {
    intro: [['wulma', 'Hier ist es sooo heiß... meine Frisur geht kaputt!'], ['tjamtschu', 'Vorsicht vor den Riesenskorpionen. Die erwischt man nur geduckt oder mit Tritten!'], ['P', 'Dann nichts wie los!']],
    boss: [['zarak', 'Hehehe! Ich bin Zarak, der Skorpion der Wüste!'], ['zarak', 'Mein Giftstachel hat noch jeden erwischt!'], ['P', 'Mich nicht!']],
    outro: [['zarak', 'Aaargh... Kapitän Rostbart wird euch vom Himmel holen...'], ['wulma', 'Das nächste Ei ist an Bord eines Luftschiffs! Es fliegt davon!'], ['goki', 'Kein Problem! Goldwolkeee!']]
  },
  2: {
    intro: [['erz', 'Hoch über den Wolken jagen unsere Helden die Luftflotte der Krallen-Armee.'], ['wulma', 'Steuern mit den Pfeilen. Schlag halten für Dauerfeuer, Tritt für Streuschuss!'], ['P', 'Auf geht\'s!']],
    boss: [['rostbart', 'Harr harr! Kein Kind hält die Luftflotte von Kapitän Rostbart auf!'], ['rostbart', 'Feuer frei aus allen Rohren!']],
    outro: [['rostbart', 'Mein schönes Luftschiff! General Eisenfaust wird davon erfahren!'], ['kurikin', 'Die Spur führt zu ihrer Festung. Dort sind noch zwei Eier!']]
  },
  3: {
    intro: [['wulma', 'Das ist die Festung der Schwarzen Krallen-Armee...'], ['joshi', 'Hmm, in meinem Alter... na gut, ein letzter großer Kampf!'], ['kurikin', 'Die Soldaten schießen hoch. Duck dich unter den Kugeln weg!']],
    boss: [['eisenfaust', 'EINDRINGLING ERKANNT. VERNICHTUNGSPROGRAMM STARTET.'], ['P', 'Du bist also der Chef hier? Komm her!']],
    outro: [['eisenfaust', 'SYSTEM... FEHLER... FEHLER...'], ['wulma', 'Wir haben alle sieben Dragoneggs! Wir haben es geschafft!'], ['morgrak', 'Hahaha! Vielen Dank, dass ihr sie für mich gesammelt habt!'], ['goki', 'Hey! Wer bist du denn?!'], ['morgrak', 'Ich bin Morgrak, der Dämonenkönig! Die Eier gehören jetzt MIR!'], ['morgrak', 'Wenn ihr sie wollt, kommt in mein Schloss... wenn ihr euch traut!'], ['wulma', 'Er hat alle Eier geklaut!!']]
  },
  4: {
    intro: [['tjamtschu', 'Uuuh... gruselig hier...'], ['kurikin', 'Zusammen schaffen wir das! Holen wir die Eier zurück!'], ['joshi', 'Hohoho, zeigt ihm, was ihr bei mir gelernt habt! Strahlen kann man auch geduckt ausweichen.']],
    boss: [['morgrak', 'Ihr seid tatsächlich gekommen. Wie dumm!'], ['morgrak', 'Mit dem Wunsch des Drachen stürze ich die Welt in ewige Nacht!'], ['P', 'Niemals! Gib die Dragoneggs zurück!']],
    phase2: [['morgrak', 'Grrr... GENUG GESPIELT!'], ['morgrak', 'Seht meine wahre Gestalt!!']],
    outro: [['morgrak', 'Neeeein... besiegt... von euch...'], ['erz', 'Die sieben Dragoneggs fallen zu Boden. Sie beginnen zu leuchten...']]
  }
};
const ENDING = [['drache', 'WER HAT MICH GEWECKT? ICH ERFÜLLE EUCH EINEN WUNSCH. SPRECHT!'], ['goki', 'Ich wünsche mir ganz, ganz viel Essen!'], ['wulma', 'Nein! Ich wünsche mir den perfekten Freund!'], ['kurikin', 'Waaas?!'], ['joshi', 'Hohoho, ich wünsche mir eine Sonnenbrille, die nie kaputt geht.'], ['tjamtschu', 'Ich will stärker werden als Goki!'], ['drache', 'RUHE! EIN WUNSCH NUR. ICH WÄHLE SELBST: FRIEDEN FÜR DIE WELT.'], ['drache', 'DIE EIER WERDEN SICH NUN WIEDER ÜBER DIE WELT VERSTREUEN. LEBT WOHL!'], ['goki', 'Schade... aber dann können wir ja bald wieder auf Abenteuerreise gehen!']];
// ================= GAME STATE =================

export { BOSS, CH, CHAPTERS, EN, ENDING, LOOKS, NAMES, ORDER, STORY };
