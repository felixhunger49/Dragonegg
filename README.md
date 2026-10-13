# Dragoneggs

Ein Jump-'n'-Run-Prügelspiel im Stil von Dragon Ball Advanced Adventure, mit 3D-Grafik im Browser.
Son Goki, Kurikin, Mr Joshi, Tjamtschu und Wulma suchen die Dragoneggs in 5 Kapiteln, dazu gibt es einen Versus-Modus.

## Spielen

- Online: über GitHub Pages (siehe „Website“ unten)
- Lokal: `npm install`, dann `npm run dev` und die angezeigte Adresse im Browser öffnen

Steuerung: Pfeile laufen, ▼ ducken, Z/Leertaste springen, X Schlag, S Tritt, C Ki (halten = Spezial),
V Dash, F Super (Ki voll), B Vollbild, Enter Pause, M Ton, G Grafikstufe.

## Wie das Projekt aufgebaut ist

```
src/
  main.js        Startpunkt und Spielschleife
  state.js       gemeinsamer Spielzustand (game.P, game.enemies, game.state ...)
  core/          Bildschirm, Eingabe, Vollbild, Grafikqualität
  audio/         Musik und Soundeffekte
  data/          Figuren, Gegner, Bosse, Kapitel, Story-Texte
  game/          Spiellogik: Spieler, Gegner, Bosse, Schüsse, Ablauf
  render/        3D-Grafik: Figuren, Posen, Kamera, Welt-Grundgerüst
  ui/            Lebensleisten, Texte, Menüs
  worlds/        eine Datei pro Welt (Wald, Wüste, Basis, Schloss, Himmel)
  models/        Figuren aus Blender (.glb)
blender/         Blender-Dateien und das Skript, das Goki baut
```

Damit das Spiel wachsen kann, ohne den Browser zu überlasten:

- **Welten werden einzeln nachgeladen.** Jede Welt in `src/worlds/` ist eine eigene Datei, die erst geladen wird, wenn das Kapitel startet. Das nächste Kapitel wird im Hintergrund schon vorgeladen.
- **Alte Welten werden freigegeben.** Beim Kapitelwechsel wird der Grafikspeicher der alten Welt und verschwundener Gegner wieder freigegeben.
- **Grafikstufe passt sich an.** Läuft das Spiel zu langsam, schaltet es automatisch auf „Mittel“ und dann „Niedrig“ (weniger Schatten, geringere Auflösung). Mit der Taste **G** oder `?q=hoch|mittel|niedrig` in der Adresse wählt man selbst.

**Eigene 3D-Figuren aus Blender:** siehe [docs/BLENDER.md](docs/BLENDER.md). Alle Figuren sind schon Blender-Modelle (`blender/*.blend`).

Eine neue Welt hinzufügen: Datei in `src/worlds/` anlegen (wie `forest.js`), in `THEME_LOADERS` und `THEME3` in `src/render/world.js` eintragen und das Kapitel in `src/data/data.js` darauf zeigen lassen.

## Bauen

- `npm run build`: Website in `dist/` (wird bei jedem Push automatisch auf GitHub Pages veröffentlicht)
- `npm run build:single`: alles in einer einzigen Datei `dist-single/index.html`

## Website

Einmalig in GitHub einstellen: **Settings → Pages → Source: GitHub Actions**. Danach baut jeder Push auf `main` die Seite neu.
