# Eigene Figuren mit Blender bauen

Das Spiel kann Figuren aus Blender laden. Du musst sie **nur modellieren und mit Knochen versehen**, nicht animieren:
Laufen, Schlagen, Treten, Springen, Ducken und alle Spezialattacken übernimmt das Spiel selbst.

Alle 14 Figuren sind schon Blender-Modelle: Die Dateien liegen in `blender/` (z. B. `goki.blend`) und lassen sich in Blender öffnen, anschauen und verändern.

## 1. Welche Datei ersetzt welche Figur?

Eine Datei `src/models/<name>.glb` ersetzt die eingebaute Figur mit diesem Namen:

| Datei | Figur |
|---|---|
| `goki.glb` | Son Goki |
| `kurikin.glb` | Kurikin |
| `joshi.glb` | Mr Joshi |
| `tjamtschu.glb` | Tjamtschu |
| `wulma.glb` | Wulma |
| `bandit.glb`, `soldier.glb`, `ninja.glb`, `robot.glb` | Gegner |
| `hauzahn.glb`, `zarak.glb`, `rostbart.glb`, `eisenfaust.glb`, `morgrak.glb` | Bosse und Hauptmann Rostbart |

Fehlt eine Datei, nimmt das Spiel einfach die eingebaute Figur.

## 2. So muss die Figur in Blender stehen

- Aufrecht stehend, **Füße auf dem Boden** (Höhe 0).
- **Blickrichtung nach vorne**: In der Vorderansicht (Ziffernblock **1**) schaust du der Figur ins Gesicht.
- Die Größe ist egal, das Spiel passt sie an.
- Arme dürfen hängen, schräg nach unten zeigen (A-Pose) oder waagerecht sein (T-Pose).
- Nicht mehr als etwa **10.000 Ecken (Vertices)**, damit das Spiel flüssig bleibt. Goki hat etwa 5.500.

## 3. Die Knochen (Armature)

Die Knochen müssen **genau so heißen** (Groß- und Kleinschreibung beachten), sonst weiß das Spiel nicht, was Arm und was Bein ist.
`_L` ist die **linke Seite der Figur**. In der Vorderansicht liegt sie bei dir rechts.

| Knochen | von → bis | hängt an |
|---|---|---|
| `hips` | Becken → etwas nach oben | (erster Knochen) |
| `torso` | Bauch → Hals | `hips` |
| `head` | Halsansatz → Scheitel | `torso` |
| `upperarm_L`, `upperarm_R` | Schulter → Ellbogen | `torso` |
| `forearm_L`, `forearm_R` | Ellbogen → Handgelenk | `upperarm_…` |
| `hand_L`, `hand_R` | Handgelenk → Fingerspitzen | `forearm_…` |
| `thigh_L`, `thigh_R` | Hüftgelenk → Knie | `hips` |
| `shin_L`, `shin_R` | Knie → Knöchel | `thigh_…` |
| `foot_L`, `foot_R` | Knöchel → Zehen (nach vorne) | `shin_…` |
| `tail` (nur wenn es einen Schwanz gibt) | Schwanzansatz → Spitze | `hips` |

Weitere Knochen (Finger, Haare, Umhang) sind erlaubt. Sie bewegen sich mit ihrem Elternknochen mit.

Figur und Knochen verbinden: erst die Figur anklicken, dann mit **Shift** die Armature, dann **Strg+P → With Automatic Weights**.

## 4. Materialnamen bestimmen die Farbe

Wenn ein Material so heißt, nimmt das Spiel die Farbe der Figur aus dem Spiel. Dann klappen auch die Super-Verwandlung (goldene Haare) und spätere Farbänderungen:

`hair` (Haare), `skin` (Haut), `gi` (Anzug), `belt` (Gürtel), `boots` (Stiefel), `pants` (Hose), `wrist` (Armbänder), `under` (Unterhemd)

Alle anderen Materialien behalten die Farbe, die du in Blender einstellst (**Base Color**).
Materialien, deren Name mit `eye`, `pupil`, `shine`, `brow`, `mouth`, `symbol`, `lid` oder `detail` anfängt, bekommen **keinen schwarzen Umriss**. Das ist für kleine Gesichtsteile gedacht.
Texturen gehen auch, einfache Farben sehen im Spiel-Stil aber meist besser aus.

## 5. Exportieren

**Datei → Exportieren → glTF 2.0 (.glb/.gltf)**, dann:

- **Format**: glTF Binary (.glb)
- **Include**: nichts auswählen (es wird die ganze Szene exportiert). Es sollten nur die Figur und ihre Armature in der Szene sein.
- **Transform**: +Y Up angehakt
- **Data → Mesh**: Apply Modifiers angehakt
- **Data → Armature/Skinning**: angehakt
- **Animation**: aus (das Spiel animiert selbst)

Dateiname wie in der Tabelle oben, z. B. `kurikin.glb`.

## 6. Ins Spiel bringen

Entweder die `.glb`-Datei einfach **an Claude im Chat schicken** (am besten auch die `.blend`-Datei), oder auf GitHub im Ordner `src/models/` hochladen
(**Add file → Upload files**). Nach dem Hochladen baut GitHub die Webseite automatisch neu.

## Fertige Modelle ohne Knochen (z. B. aus einem KI-Generator)

Ein fertiges Modell mit Textur, aber ohne Knochen (oft auf einem Sockel) kannst du einfach an Claude schicken.
`blender/convert_model.py` macht daraus eine Spielfigur: Sockel weg, auf etwa 7.000 Ecken verkleinern,
Knochen einsetzen, die Haare bekommen das Material `hair` (damit sie im Spiel schwarz und im Super-Modus golden werden).
Die Gelenkpunkte werden pro Modell einmal ausgemessen und oben im Skript eingetragen. So sind der jetzige Son Goki und Kurikin entstanden. Modelle mit Farben ohne Textur (z. B. aus ComfyUI) gehen auch; stehen die Füße im Sockel, baut das Skript neue Schuhe.

## Wie die Figuren gebaut sind

`blender/build_figures.py` erzeugt die Figuren komplett per Skript (Bausteine in `blender/figlib.py`). Der Körper ist ein Strichmännchen mit **Skin-Modifier** und **Subdivision Surface**, die Kleidung entsteht durch eingefärbte Flächen. Dazu kommen einzelne Teile für Haare, Gesicht, Stiefel, Fäuste, Schwanz und Stab.
In den `.blend`-Dateien kannst du alles direkt von Hand weiterbearbeiten und dann wie oben exportieren.
