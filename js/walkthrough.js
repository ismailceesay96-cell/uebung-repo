/* ============================================================
   Saal-Rundgang — Scroll-gesteuerter "Video"-Effekt.

   Die Scroll-Position innerhalb der Sektion steuert die Animation,
   man "läuft" also beim Scrollen durch den Saal.

   Zwei Modi (automatisch gewählt):
   • FRAME  (>= 20 Bilder): zeigt das zur Scroll-Position passende
     Frame — wie ein echtes Video, das man mit dem Scrollen abspielt.
   • CINEMA (< 20 Bilder): blendet die Fotos mit sanftem Zoom
     (Ken Burns) ineinander über — cinematischer Rundgang aus wenigen Fotos.

   Bilder tauschen: assets/saal/manifest.json bearbeiten.
   Fehlen Bilder, rendert ein prozeduraler Fallback denselben Effekt.
   ============================================================ */
(function () {
  var canvas = document.getElementById('hallCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var section = document.querySelector('.rundgang');
  var progressBar = document.getElementById('hallProgress');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var frames = [];
  var frameCount = 0;
  var mode = null;              // 'frame' | 'cinema' | 'procedural'
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var cw = 0, ch = 0;
  var currentProgress = 0;

  function resize() {
    var r = canvas.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(currentProgress);
  }

  /* ---- Manifest + Bilder laden ---- */
  function loadManifest() {
    fetch('assets/saal/manifest.json')
      .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
      .then(function (data) {
        var list = (data.frames || []).map(function (f) { return (data.basePath || '') + f; });
        if (!list.length) throw new Error('empty');
        preload(list);
      })
      .catch(function () {
        frameCount = 90; mode = 'procedural'; draw(currentProgress);
      });
  }

  function preload(urls) {
    var loaded = 0, shownFirst = false;
    frames = urls.map(function (url) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = function () {
        loaded++;
        if (!shownFirst) {
          shownFirst = true;
          frameCount = frames.length;
          mode = frameCount >= 20 ? 'frame' : 'cinema';
          draw(currentProgress);
        }
        if (loaded === urls.length) { frameCount = frames.length; draw(currentProgress); }
      };
      img.src = url;
      return img;
    });
  }

  /* ---- cover-fit mit Zoom (scale) und Pan (ox, oy in -1..1) ---- */
  function drawCover(img, scale, ox, oy) {
    if (!img || !img.width) return;
    scale = scale || 1;
    var ir = img.width / img.height;
    var cr = cw / ch;
    var dw, dh;
    if (ir > cr) { dh = ch * scale; dw = dh * ir; }
    else { dw = cw * scale; dh = dw / ir; }
    var dx = (cw - dw) / 2 + (ox || 0) * (dw - cw) * 0.5;
    var dy = (ch - dh) / 2 + (oy || 0) * (dh - ch) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function vignette() {
    var v = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.35, cw / 2, ch / 2, ch * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, cw, ch);
  }

  /* ---- CINEMA: Cross-Fade + Ken Burns ---- */
  function drawCinema(p) {
    var segs = frameCount - 1;
    if (segs < 1) { drawCover(frames[0], 1.08, 0, 0); vignette(); return; }
    var fpos = p * segs;
    var i = Math.min(segs - 1, Math.floor(fpos));
    var t = fpos - i;                       // 0..1 innerhalb des Segments
    var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOut
    // aktuelles Bild zoomt langsam heran, nächstes wartet etwas größer
    ctx.globalAlpha = 1;
    drawCover(frames[i], 1.14 - 0.06 * t, (t - 0.5) * 0.18, -0.06);
    if (e > 0.001) {
      ctx.globalAlpha = e;
      drawCover(frames[i + 1], 1.20 - 0.06 * e, (e - 0.5) * -0.12, 0.05);
      ctx.globalAlpha = 1;
    }
    vignette();
  }

  /* ---- FRAME: passendes Einzelbild (Video-Modus) ---- */
  function drawFrameMode(p) {
    var idx = Math.min(frameCount - 1, Math.max(0, Math.round(p * (frameCount - 1))));
    drawCover(frames[idx], 1.04, 0, 0);
    vignette();
  }

  /* ---- prozeduraler Saal (Fallback) ---- */
  function drawProcedural(p) {
    var g = ctx.createRadialGradient(cw / 2, ch * 0.44, 0, cw / 2, ch * 0.44, Math.max(cw, ch) * 0.8);
    g.addColorStop(0, '#1b1510'); g.addColorStop(0.6, '#0c0a09'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    var vx = cw / 2 + Math.sin(p * Math.PI * 2) * (cw * 0.02);
    var vy = ch * 0.44;
    ctx.fillStyle = 'rgba(201,162,75,.06)';
    var fw = cw * 0.42;
    ctx.beginPath();
    ctx.moveTo(vx - fw / 2, ch); ctx.lineTo(vx - 10, vy + 20);
    ctx.lineTo(vx + 10, vy + 20); ctx.lineTo(vx + fw / 2, ch); ctx.closePath(); ctx.fill();
    for (var k = 0; k < 12; k++) {
      var d = ((k / 12) + p) % 1;
      var scale = 0.05 + d * d * 1.9;
      var aw = cw * scale, ah = ch * scale * 1.05;
      var x = vx - aw / 2, y = vy - ah * 0.5;
      ctx.strokeStyle = 'rgba(201,162,75,' + Math.min(0.55, 0.06 + d * 0.5).toFixed(2) + ')';
      ctx.lineWidth = 1 + d * 3;
      ctx.beginPath();
      ctx.moveTo(x, y + ah); ctx.lineTo(x, y + ah * 0.34);
      ctx.quadraticCurveTo(x, y, x + aw / 2, y);
      ctx.quadraticCurveTo(x + aw, y, x + aw, y + ah * 0.34);
      ctx.lineTo(x + aw, y + ah); ctx.stroke();
    }
    var cs = 0.4 + p * 1.6;
    ctx.fillStyle = 'rgba(232,199,122,.22)';
    ctx.beginPath(); ctx.arc(vx, vy - 40, 22 * cs, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(232,199,122,.6)';
    ctx.beginPath(); ctx.arc(vx, vy - 40, 7 * cs, 0, Math.PI * 2); ctx.fill();
    vignette();
  }

  function draw(p) {
    currentProgress = p;
    if (!cw || !ch) return;
    ctx.clearRect(0, 0, cw, ch);
    if (mode === 'frame') drawFrameMode(p);
    else if (mode === 'cinema') drawCinema(p);
    else if (mode === 'procedural') drawProcedural(p);
    if (progressBar) progressBar.style.width = (p * 100).toFixed(1) + '%';
  }

  /* ---- Scroll → Progress ---- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var rect = section.getBoundingClientRect();
      var scrollable = rect.height - window.innerHeight;
      var p = scrollable > 0 ? (-rect.top) / scrollable : 0;
      p = Math.max(0, Math.min(1, p));
      if (reduceMotion) p = 0.5;
      draw(p);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); });

  resize();
  loadManifest();
  onScroll();
})();
