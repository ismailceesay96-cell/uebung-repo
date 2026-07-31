/* ============================================================
   Palais Doré — Interaktionen
   ============================================================ */
(function () {
  'use strict';

  /* ---- Jahr im Footer ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Nav: Hintergrund beim Scrollen ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  /* ---- Reveal beim Scrollen ---- */
  var revealEls = [
    '.section-head', '.occ', '.gtile', '.location__intro',
    '.stat', '.feature', '.kontakt__frame'
  ].reduce(function (acc, sel) {
    return acc.concat(Array.prototype.slice.call(document.querySelectorAll(sel)));
  }, []);

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealEls.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 8, 6) * 45) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

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

    /* Draufsicht → 3D: Kippwinkel per Scroll */
    var saal = document.getElementById('saal3d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (saal && !reduce) {
      var ticking = false;
      function updateTilt() {
        var r = saal.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        // 0 wenn das Element gerade von unten erscheint, 1 sobald es im oberen Drittel steht
        var start = vh * 0.9, end = vh * 0.25;
        var p = (start - r.top) / (start - end);
        p = Math.max(0, Math.min(1, p));
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
