# Dragoneggs – notes for working on the code

- Vite + three.js **0.149.0** (pinned on purpose: newer versions change color management and light intensities, which changes the look). Plain JavaScript ES modules, no framework.
- All mutable game state lives on the shared `game` object from `src/state.js` (`game.P`, `game.enemies`, `game.state`, `game.renderer` ...). Modules export functions and constant data only; never add module-level `let` that other modules need.
- The code was split mechanically from one big file, so the style is compact and the comment density is low. Match it.
- Section-by-section ownership: `game/` is logic at a fixed 60 Hz (`update()`), `render/` turns that state into three.js objects each frame (`render3D()`), `ui/hud.js` draws the 2D pixel HUD on a 240x160 canvas scaled up.
- Worlds: each theme in `src/worlds/<name>.js` exports `posts`, `farGround`, `ground`, `textures()`, `details()`, `backdrop()`. They are loaded with dynamic `import()` through `loadTheme()`/`showWorld()` in `src/render/world.js`; colors/fog/lights stay in `THEME3` there because menus use them before any world loads.
- GPU memory: cached geometries/materials from `geo()`, `tm()`, `tmF()`, `bm()` are marked `userData.shared` and are never disposed. Anything created ad hoc for a world or an entity view is disposed by `clearGroup()` / `cleanupViews()`.
- Quality levels live in `src/core/quality.js` (auto step-down on low FPS, key G, `?q=`).
- Browser console / tests: `window.DE.game` exposes state, `DE.setupChapter(i, atBoss)` jumps to a chapter.
- Builds: `npm run build` (GitHub Pages, chunked) and `npm run build:single` (one self-contained HTML file, used for the Claude artifact).
- Playwright headless needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`; it runs at about 5 FPS, so pass `?q=hoch` when comparing screenshots (otherwise auto-quality drops the level).
- Blender models: `src/models/<LOOKS key>.glb` replaces that built-in figure (loaded in `src/render/models.js` before the first scene is built). The game's procedural poses drive the model: `makeModelRig` builds empty driver joints at the model's bone positions, `applyRig` poses them as usual, `syncModel` copies the rotations onto the bones (limbs get a rest correction, so A-pose/T-pose both work). Bone names and material-name conventions are in `docs/BLENDER.md`.
- `blender/build_goki.py` generates Goki (`goki.blend` + `src/models/goki.glb`). Run it with Blender, or headless with the `bpy` pip package (Python 3.13): `python blender/build_goki.py`.
