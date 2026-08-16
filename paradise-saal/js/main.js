/* ============================================================
   Palais Doré — Interaktionen
   ============================================================ */
(function () {
  'use strict';

  /* ---- Jahr im Footer ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Nav: Hintergrund beim Scrollen + Höhe für Schnellzugriff-Leiste ---- */
  var nav = document.getElementById('nav');
  function setNavH() {
    document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px');
  }
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    setNavH();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', setNavH);
  setNavH();
  onScroll();

  /* ---- Schnellzugriff-Leiste: aktive Sektion hervorheben ---- */
  var quick = document.getElementById('quicknav');
  if (quick && 'IntersectionObserver' in window) {
    var chips = {};
    Array.prototype.slice.call(quick.querySelectorAll('a')).forEach(function (a) {
      chips[a.getAttribute('href').slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var active = chips[e.target.id];
        if (!active) return;
        Object.keys(chips).forEach(function (k) { chips[k].classList.remove('is-current'); });
        active.classList.add('is-current');
        active.scrollIntoView({ inline: 'center', block: 'nearest' });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(chips).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---- Mobile-Menü ---- */
  var burger = document.querySelector('.nav__burger');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    function toggle(open) {
      var isOpen = open !== undefined ? open : menu.hasAttribute('hidden');
      if (isOpen) { menu.removeAttribute('hidden'); }
      else { menu.setAttribute('hidden', ''); }
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { toggle(); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggle(false); });
    });
  }

  /* ---- Reveal beim Scrollen (gestaffelt pro Gruppe) ---- */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var toObserve = [];
    function mark(el, delayMs, variant) {
      if (!el || el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      if (variant) el.classList.add(variant);
      el.style.transitionDelay = Math.max(0, delayMs) + 'ms';
      toObserve.push(el);
    }
    function q(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

    // Überschriften-Zeilen einzeln einschweben lassen
    q('.section-head').forEach(function (head) {
      Array.prototype.slice.call(head.children).forEach(function (child, i) {
        mark(child, i * 110, 'reveal--up');
      });
    });

    // Gruppen: jede Kachel nacheinander (Stagger nach Position im Container)
    ['.occ', '.gtile', '.feature', '.stat', '.tcard', '.fp-legend--row li'].forEach(function (sel) {
      q(sel).forEach(function (el) {
        var sibs = Array.prototype.slice.call(el.parentElement.children).filter(function (c) { return c.matches(sel); });
        var idx = sibs.indexOf(el);
        mark(el, idx * 90, 'reveal--up');
      });
    });

    // Einzelblöcke
    ['.location__intro', '.kontakt__frame', '.rundgang__overlay', '.wstep__title'].forEach(function (sel) {
      q(sel).forEach(function (el) { mark(el, 0, 'reveal--up'); });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    toObserve.forEach(function (el) { io.observe(el); });
  }

  /* ---- Zähler hochzählen (Count-up), danach dauerhaft sichtbar ---- */
  (function () {
    var nums = Array.prototype.slice.call(document.querySelectorAll('.stat__num[data-count]'));
    if (!nums.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function finalText(el) { return el.getAttribute('data-count'); }
    if (reduce || !('IntersectionObserver' in window)) {
      nums.forEach(function (el) { el.textContent = finalText(el); });
      return;
    }
    nums.forEach(function (el) { el.textContent = '0'; });   // Startwert, nie leer
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) { el.textContent = finalText(el); return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);        // easeOutCubic
        el.textContent = Math.round(eased * target).toString();
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = finalText(el);       // exakter Zielwert, bleibt stehen
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---- Parallax (sanft, Premium) ---- */
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('.parallax'));
    if (!els.length) return;
    var vh = window.innerHeight;
    var ticking = false;
    function update() {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
        var scale = el.getAttribute('data-scale');
        var delta = (r.top + r.height / 2) - vh / 2;
        var y = (-delta * speed).toFixed(1);
        el.style.transform = 'translate3d(0,' + y + 'px,0)' + (scale ? ' scale(' + scale + ')' : '');
      });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', function () { vh = window.innerHeight; update(); });
    update();
  })();

  /* ---- Raumplan: Reveal + Hover-Verknüpfung ---- */
  var fp = document.getElementById('fp');
  if (fp) {
    if ('IntersectionObserver' in window) {
      var fpo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { fp.classList.add('is-in'); fpo.disconnect(); } });
      }, { threshold: 0.25 });
      fpo.observe(fp);
    } else { fp.classList.add('is-in'); }

    var zones = Array.prototype.slice.call(fp.querySelectorAll('.zone'));
    var legendItems = Array.prototype.slice.call(document.querySelectorAll('#fpLegend li'));
    function highlight(name, on) {
      fp.classList.toggle('is-dim', on);
      zones.forEach(function (z) { z.classList.toggle('is-hi', on && z.getAttribute('data-zone') === name); });
      legendItems.forEach(function (li) { li.classList.toggle('is-hi', on && li.getAttribute('data-zone') === name); });
    }
    function wire(el) {
      var name = el.getAttribute('data-zone');
      el.addEventListener('mouseenter', function () { highlight(name, true); });
      el.addEventListener('mouseleave', function () { highlight(name, false); });
      el.addEventListener('focus', function () { highlight(name, true); });
      el.addEventListener('blur', function () { highlight(name, false); });
    }
    zones.forEach(wire);
    legendItems.forEach(function (li) { wire(li); li.setAttribute('tabindex', '0'); });

    /* Bild-Popup je Bereich (Platzhalter-Bilder — später ersetzen) */
    var zoneImages = {
      buehne:  { img: 'assets/img/zone-buehne.jpg', cap: 'Bühne' },
      tanz:    { img: 'assets/img/venue-panorama.jpg', cap: 'Tanzfläche' },
      tische:  { img: 'assets/img/zone-tische.jpg',   cap: 'Sitzplätze' },
      bar:     { img: 'assets/img/venue-catering.jpg', cap: 'Bar' },
      lounge:  { img: 'assets/img/venue-tische.jpg',   cap: 'Lounge' },
      hof:     { img: 'assets/img/venue-panorama.jpg', cap: 'Hof · Terrasse' },
      empfang: { img: 'assets/img/zone-empfang.jpg',   cap: 'Empfang' },
      buffet:  { imgs: ['assets/img/zone-buffet-1.jpg', 'assets/img/zone-buffet-2.jpg', 'assets/img/zone-buffet-3.jpg'], cap: 'Buffet' }
    };
    var modal = document.getElementById('fpModal');
    var modalImg = document.getElementById('fpModalImg');
    var modalCap = document.getElementById('fpModalCap');
    var btnPrev = document.getElementById('fpPrev');
    var btnNext = document.getElementById('fpNext');
    var dotsWrap = document.getElementById('fpDots');
    var lastFocus = null;
    var gallery = [];   // aktuelle Bildliste des Bereichs
    var gIndex = 0, gCap = '';
    function renderSlide() {
      if (!gallery.length) return;
      gIndex = (gIndex + gallery.length) % gallery.length;
      modalImg.src = gallery[gIndex];
      modalImg.alt = gCap + ' — Bild ' + (gIndex + 1) + ' von ' + gallery.length;
      if (dotsWrap) Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.classList.toggle('is-on', i === gIndex);
      });
    }
    function openModal(name) {
      var z = zoneImages[name]; if (!z || !modal) return;
      var override = window.__ZONE_IMAGES__ && window.__ZONE_IMAGES__[name];
      gallery = override ? [].concat(override) : (z.imgs ? z.imgs.slice() : [z.img]);
      gCap = z.cap; gIndex = 0;
      modalCap.textContent = z.cap;
      var multi = gallery.length > 1;
      if (dotsWrap) {
        dotsWrap.innerHTML = '';
        if (multi) gallery.forEach(function (_, i) {
          var b = document.createElement('button');
          b.className = 'fp-dot'; b.type = 'button';
          b.setAttribute('aria-label', 'Bild ' + (i + 1));
          b.addEventListener('click', function () { gIndex = i; renderSlide(); });
          dotsWrap.appendChild(b);
        });
        dotsWrap.hidden = !multi;
      }
      if (btnPrev) btnPrev.hidden = !multi;
      if (btnNext) btnNext.hidden = !multi;
      renderSlide();
      lastFocus = document.activeElement;
      modal.hidden = false; document.body.style.overflow = 'hidden';
      var c = modal.querySelector('.fp-modal__close'); if (c) c.focus();
    }
    function closeModal() {
      if (!modal) return;
      modal.hidden = true; document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    if (btnPrev) btnPrev.addEventListener('click', function () { gIndex--; renderSlide(); });
    if (btnNext) btnNext.addEventListener('click', function () { gIndex++; renderSlide(); });
    if (modal) {
      modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeModal); });
      document.addEventListener('keydown', function (e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') closeModal();
        else if (e.key === 'ArrowLeft' && gallery.length > 1) { gIndex--; renderSlide(); }
        else if (e.key === 'ArrowRight' && gallery.length > 1) { gIndex++; renderSlide(); }
      });
    }
    function wireOpen(el) {
      var name = el.getAttribute('data-zone');
      el.addEventListener('click', function () { openModal(name); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(name); }
      });
    }
    zones.forEach(wireOpen);
    legendItems.forEach(wireOpen);

    /* Erst alles von oben — dann Drehung kurz vor dem Wegscrollen */
    var pin = document.getElementById('fp3d');
    var saal = document.getElementById('saal3d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (pin && saal && !reduce) {
      var ticking = false;
      function updateTilt() {
        var r = pin.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var scrollable = r.height - vh;
        var through = scrollable > 0 ? (-r.top) / scrollable : 0;   // 0..1 durch die Sektion
        through = Math.max(0, Math.min(1, through));
        // Drehung startet direkt beim ersten Scrollen und richtet sich
        // ueber den Grossteil der Sektion auf; danach kurzer Halt (voll gedreht)
        var p = Math.max(0, Math.min(1, through / 0.8));
        saal.style.setProperty('--p', p.toFixed(3));
      }
      window.addEventListener('scroll', function () {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { updateTilt(); ticking = false; });
      }, { passive: true });
      window.addEventListener('resize', updateTilt);
      updateTilt();
    }
  }

  /* ---- Angebot-Assistent (mehrstufig) ---- */
  var form = document.getElementById('angebotForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var steps = Array.prototype.slice.call(form.querySelectorAll('.wstep'));
    var stepDots = Array.prototype.slice.call(document.querySelectorAll('#wizardSteps .steps__item'));
    var current = 0;
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(field, msg) {
      var wrap = field.closest('.field') || field.closest('.check--privacy') || field.parentElement;
      var err = wrap ? wrap.querySelector('.field__err') : null;
      if (!err) { // Fehler-Element evtl. Geschwister
        var sib = wrap && wrap.nextElementSibling;
        if (sib && sib.classList.contains('field__err')) err = sib;
      }
      if (msg) { if (wrap) wrap.classList.add('is-invalid'); if (err) err.textContent = msg; }
      else { if (wrap) wrap.classList.remove('is-invalid'); if (err) err.textContent = ''; }
    }

    /* Ja/Nein-Termin: passendes Feld einblenden */
    var reveals = form.querySelectorAll('.reveal-block');
    form.querySelectorAll('input[name="termin"]').forEach(function (r) {
      r.addEventListener('change', function () {
        reveals.forEach(function (b) { b.hidden = (b.getAttribute('data-when') !== r.value); });
        setError(form.querySelector('input[name="termin"]'), '');
      });
    });

    /* Validierung je Schritt */
    function validateStep(idx) {
      var ok = true;
      if (idx === 0) {
        if (!form.art.value) { setError(form.art, 'Bitte Art der Veranstaltung wählen.'); ok = false; } else setError(form.art, '');
        var terminChecked = form.querySelector('input[name="termin"]:checked');
        var terminErr = document.querySelector('.field__err[data-for="termin"]');
        if (!terminChecked) { if (terminErr) terminErr.textContent = 'Bitte auswählen.'; ok = false; } else if (terminErr) terminErr.textContent = '';
      }
      if (idx === 1) {
        var mn = form.pmin.value ? parseInt(form.pmin.value, 10) : null;
        var mx = form.pmax.value ? parseInt(form.pmax.value, 10) : null;
        if (mn && mx && mx < mn) { setError(form.pmax, 'Maximum darf nicht kleiner als Minimum sein.'); ok = false; } else setError(form.pmax, '');
      }
      if (idx === 2) {
        var nameF = form.elements['name'], emailF = form.elements['email'], dsF = form.elements['datenschutz'];
        if (!nameF.value.trim()) { setError(nameF, 'Bitte geben Sie Ihren Namen an.'); ok = false; } else setError(nameF, '');
        if (!emailRe.test(emailF.value.trim())) { setError(emailF, 'Bitte eine gültige E-Mail angeben.'); ok = false; } else setError(emailF, '');
        var dsErr = document.querySelector('.field__err[data-for="datenschutz"]');
        if (!dsF.checked) { if (dsErr) dsErr.textContent = 'Bitte der Datenschutzerklärung zustimmen.'; ok = false; } else if (dsErr) dsErr.textContent = '';
      }
      return ok;
    }

    function showStep(idx) {
      steps.forEach(function (s, i) { s.hidden = i !== idx; s.classList.toggle('is-active', i === idx); });
      stepDots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
        d.classList.toggle('is-done', i < idx);
      });
      current = idx;
      var frame = document.querySelector('.kontakt__frame');
      if (frame) frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var firstField = steps[idx].querySelector('input:not([type=radio]):not([type=checkbox]), select, textarea');
      if (firstField) firstField.focus({ preventScroll: true });
    }

    form.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () {
        status.textContent = '';
        if (!validateStep(current)) {
          var fi = steps[current].querySelector('.is-invalid input, .is-invalid select, .field__err:not(:empty)');
          if (fi && fi.focus) fi.focus();
          return;
        }
        if (current < steps.length - 1) showStep(current + 1);
      });
    });
    form.querySelectorAll('[data-prev]').forEach(function (b) {
      b.addEventListener('click', function () { if (current > 0) showStep(current - 1); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      if (!validateStep(2)) {
        var fi = steps[2].querySelector('.is-invalid input, .field__err:not(:empty)');
        if (fi && fi.focus) fi.focus();
        return;
      }
      // Beispiel-Referenz: kein echter Versand — Bestätigung anzeigen.
      steps.forEach(function (s) { s.hidden = true; s.classList.remove('is-active'); });
      stepDots.forEach(function (d) { d.classList.add('is-done'); d.classList.remove('is-active'); });
      status.textContent = 'Vielen Dank, ' + form.elements['name'].value.trim() + '! Ihre Angebotsanfrage ist eingegangen — wir melden uns in Kürze mit einem persönlichen Vorschlag.';
    });
  }
})();
