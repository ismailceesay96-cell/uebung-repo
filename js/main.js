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

  /* ---- Formular-Validierung ---- */
  var form = document.getElementById('anfrageForm');
  if (form) {
    var status = document.getElementById('formStatus');

    function setError(field, msg) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.field__err') : null;
      if (msg) { wrap.classList.add('is-invalid'); if (err) err.textContent = msg; }
      else { wrap.classList.remove('is-invalid'); if (err) err.textContent = ''; }
    }

    function validate() {
      var ok = true;
      var name = form.name, email = form.email, anlass = form.anlass;
      if (!name.value.trim()) { setError(name, 'Bitte geben Sie Ihren Namen an.'); ok = false; } else setError(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, 'Bitte eine gültige E-Mail angeben.'); ok = false; } else setError(email, '');
      if (!anlass.value) { setError(anlass, 'Bitte einen Anlass wählen.'); ok = false; } else setError(anlass, '');
      return ok;
    }

    // Inline-Validierung beim Verlassen des Feldes
    ['name', 'email', 'anlass'].forEach(function (n) {
      var f = form[n];
      f.addEventListener('blur', function () {
        if (n === 'name' && !f.value.trim()) setError(f, 'Bitte geben Sie Ihren Namen an.');
        else if (n === 'email' && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim())) setError(f, 'Bitte eine gültige E-Mail angeben.');
        else if (n === 'anlass' && !f.value) setError(f, 'Bitte einen Anlass wählen.');
        else setError(f, '');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      if (!validate()) {
        var firstInvalid = form.querySelector('.field.is-invalid input, .field.is-invalid select');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      // Demo-Referenz: kein echter Versand — Bestätigung anzeigen.
      status.textContent = 'Danke, ' + form.name.value.trim() + '! Ihre Anfrage ist bei uns eingegangen — wir melden uns in Kürze.';
      form.reset();
    });
  }
})();
