# Paradise Saal — Event-Location (Beispiel-Referenz)

Elegante, visuell fokussierte One-Page-Website für eine Event-Location
(Hochzeiten, Firmenevents, Geburtstage, Abschlussbälle, Silvester u. v. m.).
Design in **Gold & Schwarz**, romantisch, aber betont edel.

> **„Paradise Saal"** dient als Beispiel-Referenz. Die Fotos sind echt,
> Kontaktdaten, Social-Links und die Angaben in Impressum/Datenschutz sind
> Platzhalter und vor Veröffentlichung durch echte Daten zu ersetzen.

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

## Bilder

Aktuell sind **4 echte Fotos der Location** eingebunden (`assets/img/venue-*.jpg`).
Sie werden im Hero, in der Galerie **und** im Saal-Rundgang verwendet.

> Tipp: Für scharfe Vollbild-Darstellung im Rundgang am besten Fotos mit
> **mind. ~1600px Breite** liefern. Drei der aktuellen Fotos sind klein
> (452–588px) und wirken im Vollbild etwas weich.

### Galerie / Hero
Ersetze die Dateien in `assets/img/` (gleiche Namen), **oder** passe die
`<img src="…">` in `index.html` an. Empfohlen: `.webp`/`.jpg`, ~1600px breit.

### Saal-Rundgang (das Scroll-Video)
Der Player wählt automatisch den Modus – gesteuert über `assets/saal/manifest.json`:

- **< 20 Bilder → Cinema-Modus:** sanfter Cross-Fade mit Zoom (Ken Burns).
  So entsteht schon aus wenigen Fotos ein cinematischer Rundgang (aktueller Stand).
- **≥ 20 Bilder → Frame-Modus:** wie ein echtes Video, das man mit dem
  Scrollen abspielt – man „läuft" flüssig durch den Saal.

Für den echten Video-Walk ein kurzes Handy-Video (durch den Saal laufend) in
Einzelbilder zerlegen und ins Manifest eintragen:

```bash
ffmpeg -i rundgang.mp4 -vf "fps=15,scale=1600:-1" assets/saal/frame_%03d.jpg
```

```json
{
  "basePath": "assets/saal/",
  "frames": ["frame_001.jpg", "frame_002.jpg", "frame_003.jpg", "…"]
}
```

Fehlt das Manifest oder laden keine Bilder, rendert ein **prozeduraler
Fallback** denselben Effekt automatisch — die Sektion bleibt nie leer.

Die „Länge" der Animation steuerst du über die Scroll-Höhe:
`.rundgang__spacer { height: 340vh; }` in `css/styles.css`.

## Veröffentlichen (GitHub Pages)

Repository-Einstellungen → **Pages** → Branch wählen (`/root`) → speichern.
Die Seite ist statisch und braucht keinen Build-Schritt.

## Barrierefreiheit & Performance

- respektiert `prefers-reduced-motion` (statisches Standbild statt Scroll-Video)
- Tastatur-Fokus sichtbar, semantische Labels, Kontraste geprüft
- responsiv ab 375px, `lazy`-geladene Galeriebilder
