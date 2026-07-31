/* ============================================================
   Saal-Rundgang — Scroll-gesteuerter "Video"-Effekt.

   Prinzip: Eine Bild-Sequenz wird auf ein <canvas> gezeichnet.
   Die Scroll-Position innerhalb der Sektion bestimmt, welches
   Frame gezeigt wird — man "läuft" also beim Scrollen durch den Saal.

   Bilder tauschen: assets/saal/manifest.json bearbeiten
   (Reihenfolge = Laufrichtung). Fehlen Bilder, rendert ein
   prozeduraler Fallback denselben Effekt, damit die Sektion nie leer ist.
   ============================================================ */
(function () {
  const canvas = document.getElementById('hallCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const section = document.querySelector('.rundgang');
  const progressBar = document.getElementById('hallProgress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let frames = [];        // geladene Image-Objekte
  let frameCount = 0;
  let ready = false;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cw = 0, ch = 0;
  let currentProgress = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(currentProgress);
  }

  /* ---- Frame-Sequenz laden ---- */
  function loadManifest() {
    fetch('assets/saal/manifest.json')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list = (data.frames || []).map((f) => (data.basePath || '') + f);
        if (!list.length) throw new Error('empty');
        preload(list);
      })
      .catch(() => {
        // Kein Manifest / keine Frames → prozeduraler Fallback
        frameCount = 90;
        ready = 'procedural';
        draw(currentProgress);
      });
  }

  function preload(urls) {
    let loaded = 0;
    frames = urls.map((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === urls.length) {
          frameCount = frames.length;
          ready = 'images';
          draw(currentProgress);
        } else if (loaded === 1) {
          // erstes Frame sofort zeigen
          frameCount = frames.length;
          ready = 'images';
          draw(currentProgress);
        }
      };
      img.src = url;
      return img;
    });
  }

  /* ---- cover-fit: Bild formatfüllend zeichnen ---- */
  function drawCover(img) {
    if (!img || !img.width) return;
    const ir = img.width / img.height;
    const cr = cw / ch;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
    else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---- prozeduraler Saal (Fallback) ---- */
  function drawProcedural(p) {
    const g = ctx.createRadialGradient(cw / 2, ch * 0.44, 0, cw / 2, ch * 0.44, Math.max(cw, ch) * 0.8);
    g.addColorStop(0, '#1b1510'); g.addColorStop(0.6, '#0c0a09'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);

    const vx = cw / 2 + Math.sin(p * Math.PI * 2) * (cw * 0.02);
    const vy = ch * 0.44;
    // Bodenläufer
    ctx.fillStyle = 'rgba(201,162,75,.06)';
    const fw = cw * 0.42;
    ctx.beginPath();
    ctx.moveTo(vx - fw / 2, ch); ctx.lineTo(vx - 10, vy + 20);
    ctx.lineTo(vx + 10, vy + 20); ctx.lineTo(vx + fw / 2, ch); ctx.closePath(); ctx.fill();
    // rezedierende Bögen
    const layers = 12;
    for (let k = 0; k < layers; k++) {
      const d = ((k / layers) + p) % 1;
      const scale = 0.05 + d * d * 1.9;
      const aw = cw * scale, ah = ch * scale * 1.05;
      const x = vx - aw / 2, y = vy - ah * 0.5;
      ctx.strokeStyle = 'rgba(201,162,75,' + Math.min(0.55, 0.06 + d * 0.5).toFixed(2) + ')';
      ctx.lineWidth = 1 + d * 3;
      ctx.beginPath();
      ctx.moveTo(x, y + ah);
      ctx.lineTo(x, y + ah * 0.34);
      ctx.quadraticCurveTo(x, y, x + aw / 2, y);
      ctx.quadraticCurveTo(x + aw, y, x + aw, y + ah * 0.34);
      ctx.lineTo(x + aw, y + ah);
      ctx.stroke();
    }
    // Kronleuchter-Bokeh
    const cs = 0.4 + p * 1.6;
    ctx.fillStyle = 'rgba(232,199,122,.22)';
    ctx.beginPath(); ctx.arc(vx, vy - 40, 22 * cs, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(232,199,122,.6)';
    ctx.beginPath(); ctx.arc(vx, vy - 40, 7 * cs, 0, Math.PI * 2); ctx.fill();
    // Vignette
    const v = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.3, cw / 2, ch / 2, ch * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, cw, ch);
  }

  /* ---- zeichnen für Progress 0..1 ---- */
  function draw(p) {
    currentProgress = p;
    if (!cw || !ch) return;
    ctx.clearRect(0, 0, cw, ch);
    if (ready === 'images' && frameCount) {
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(p * (frameCount - 1))));
      drawCover(frames[idx]);
      // sanfte Vignette über Fotos
      const v = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.35, cw / 2, ch / 2, ch * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, cw, ch);
    } else if (ready === 'procedural') {
      drawProcedural(p);
    }
    if (progressBar) progressBar.style.width = (p * 100).toFixed(1) + '%';
  }

  /* ---- Scroll → Progress ---- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      let p = scrollable > 0 ? (-rect.top) / scrollable : 0;
      p = Math.max(0, Math.min(1, p));
      if (reduceMotion) p = 0.5; // statisches Standbild bei reduzierter Bewegung
      draw(p);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); });

  resize();
  loadManifest();
  onScroll();
})();
