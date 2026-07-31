# Palais Doré — Event-Location (Beispiel-Referenz)

Elegante, visuell fokussierte One-Page-Website für eine Event-Location
(Hochzeiten, Firmenevents, Geburtstage, Abschlussbälle, Silvester u. v. m.).
Design in **Gold & Schwarz**, romantisch, aber betont edel.

> **„Palais Doré"** ist ein Platzhalter-Name. Namen, Kontaktdaten und alle
> Bilder sind Beispiele und sollen ersetzt werden.

## Aufbau

- `index.html` — Struktur der gesamten Seite
- `css/styles.css` — komplettes Design (Farben, Typo, Layout)
- `js/main.js` — Navigation, Scroll-Reveals, Formular
- `js/walkthrough.js` — der scroll-gesteuerte **Saal-Rundgang**
- `assets/img/` — Galerie- & Anlass-Platzhalter (SVG)
- `assets/saal/` — Frame-Sequenz für den Rundgang + `manifest.json`

### Abschnitte (in dieser Reihenfolge)

1. **Hero** — Willkommen in Gold/Schwarz mit Schrift-Signatur
2. **Anlässe** — Angebotsfeld: Hochzeiten, Abschlussbälle, Firmenevents,
   Geburtstage, Silvester, Taufe/Kommunion, Jubiläen, Gala *(steht über der Galerie)*
3. **Galerie** — visuelles Raster
4. **Der Saal** — Scroll-„Video": man läuft durch den Saal
5. **Location** — Ausstattung & Kennzahlen
6. **Kontakt** — Anfrageformular
7. **Footer**

## Lokal ansehen

Wegen `fetch()` auf die Frame-Liste bitte über einen kleinen Server öffnen
(nicht per Doppelklick):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Eigene Bilder einsetzen

### Galerie
Ersetze die Dateien in `assets/img/gallery-01.svg … gallery-12.svg` durch
eigene Fotos (gleiche Namen), **oder** passe die `<img src="…">` in
`index.html` (Abschnitt „GALERIE") an. Empfohlen: `.webp`/`.jpg`, ~1200px breit.

### Saal-Rundgang (das Scroll-Video)
Der Rundgang spielt eine **Bild-Sequenz** ab — je mehr Bilder, desto flüssiger.

1. Lege deine Frames in `assets/saal/` (z. B. `frame_001.jpg … frame_060.jpg`).
   Reihenfolge = Laufrichtung durch den Saal.
2. Trage sie in `assets/saal/manifest.json` ein:

   ```json
   {
     "basePath": "assets/saal/",
     "frames": ["frame_001.jpg", "frame_002.jpg", "frame_003.jpg"]
   }
   ```

**Woher kommen die Frames?** Aus einem kurzen Handy-Video, das durch den Saal
läuft — z. B. mit `ffmpeg` in Einzelbilder zerlegen:

```bash
ffmpeg -i rundgang.mp4 -vf "fps=15,scale=1600:-1" assets/saal/frame_%03d.jpg
```

Fehlt das Manifest oder sind keine Bilder vorhanden, rendert ein
**prozeduraler Fallback** denselben Rundgang-Effekt automatisch — die Sektion
bleibt also nie leer.

Die „Länge" der Animation steuerst du über die Scroll-Höhe:
`.rundgang__spacer { height: 340vh; }` in `css/styles.css`.

## Veröffentlichen (GitHub Pages)

Repository-Einstellungen → **Pages** → Branch wählen (`/root`) → speichern.
Die Seite ist statisch und braucht keinen Build-Schritt.

## Barrierefreiheit & Performance

- respektiert `prefers-reduced-motion` (statisches Standbild statt Scroll-Video)
- Tastatur-Fokus sichtbar, semantische Labels, Kontraste geprüft
- responsiv ab 375px, `lazy`-geladene Galeriebilder
