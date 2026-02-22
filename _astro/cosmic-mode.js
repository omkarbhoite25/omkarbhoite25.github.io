/**
 * Cosmic Dark Mode — Three.js starfield + dark theme toggle
 *
 * DOM strategy:
 *   - Style + canvas container → appended to <html> (survives View Transition body swaps)
 *   - Toggle button → injected into <header> on each page load (destroyed + recreated on swap)
 *
 * Uses data-astro-cosmic attribute so Astro's $t() preserves it during
 * html attribute sync (only data-astro-* attributes survive swaps).
 *
 * Starfield is an exact replica of the astrophysics page Three.js implementation.
 */
(function () {
  'use strict';

  if (window.__cosmicMode) return;

  var STORAGE_KEY = 'cosmic_dark_mode';
  var ATTR = 'data-astro-cosmic';
  var state = {
    active: localStorage.getItem(STORAGE_KEY) !== 'false',
    scene: null,
    camera: null,
    renderer: null,
    stars: null,
    starsMaterial: null,
    clock: null,
    animId: null,
    mouseX: 0,
    mouseY: 0,
  };
  window.__cosmicMode = state;

  /* ───────── CSS (on <html>, survives swaps) ───────── */
  var A = 'html[' + ATTR + '="true"]';
  var style = document.createElement('style');
  style.id = 'cosmic-mode-styles';
  style.textContent = [
    'html{transition:background-color .6s ease,color .6s ease}',
    A + '{background-color:#0a0a0f!important;color:#e8dfd5!important}',

    A + ' .bg-paper,' + A + ' .bg-paper\\/95,' + A + ' .bg-paper\\/60{background-color:transparent!important}',
    A + ' .text-ink{color:#e8dfd5!important}',
    A + ' .text-ink\\/80{color:rgba(232,223,213,.8)!important}',
    A + ' .text-muted-ink{color:#b8a898!important}',
    A + ' .text-muted-ink\\/70{color:rgba(184,168,152,.7)!important}',
    A + ' .text-accent-sage{color:#ff6b00!important}',
    A + ' .border-accent-sage,' + A + ' .border-accent-sage\\/30{border-color:rgba(255,107,0,.3)!important}',
    A + ' .border-wash-sage{border-color:rgba(255,107,0,.2)!important}',
    A + ' .bg-wash-sage,' + A + ' .bg-wash-sage\\/50,' + A + ' .bg-wash-sage\\/60{background-color:rgba(255,107,0,.1)!important}',
    A + ' .bg-wash-sage:hover,' + A + ' .hover\\:bg-wash-sage:hover{background-color:rgba(255,107,0,.2)!important}',

    A + ' .bg-white\\/10{background-color:rgba(255,255,255,.05)!important}',
    A + ' .bg-white\\/15{background-color:rgba(255,255,255,.08)!important}',
    A + ' .hover\\:bg-white\\/20:hover{background-color:rgba(255,255,255,.1)!important}',
    A + ' .border-white\\/20{border-color:rgba(255,255,255,.1)!important}',
    A + ' .border-white\\/25{border-color:rgba(255,255,255,.12)!important}',
    A + ' .hover\\:border-pigment-orange\\/40:hover{border-color:rgba(255,107,0,.3)!important}',
    A + ' .bg-paper-dark\\/20,' + A + ' .bg-paper-dark\\/30{background-color:rgba(255,255,255,.05)!important}',

    A + ' .bg-wash-pink,' + A + ' .bg-wash-coral,' + A + ' .bg-wash-orange,' + A + ' .bg-wash-peach,' + A + ' .bg-wash-amber,' + A + ' .bg-wash-teal,' + A + ' .bg-wash-butter,' + A + ' .bg-wash-cream,' + A + ' .bg-wash-ivory,' + A + ' .bg-wash-linen,' + A + ' .bg-wash-pearl,' + A + ' .bg-wash-snow{background-color:rgba(176,38,255,.06)!important}',

    A + ' .watercolor-text{color:#ff6b00!important;-webkit-text-fill-color:#ff6b00!important}',
    A + ' .nav-link .relative{color:inherit}',
    A + ' .nav-brush{background-color:rgba(255,107,0,.15)!important}',
    A + ' .bio-brush,' + A + ' .page-brush{background:rgba(255,107,0,.3)!important}',
    A + ' strong{color:#fff!important}',
    A + ' .bg-paper\\/60{background-color:rgba(10,10,15,.6)!important}',
    A + ' .shadow-pigment{box-shadow:0 8px 32px rgba(255,107,0,.05),inset 0 1px 0 rgba(255,255,255,.05)!important}',
    A + ' .hover\\:shadow-lg:hover{box-shadow:0 10px 25px rgba(255,107,0,.1)!important}',
    A + ' #mobile-menu{background-color:rgba(10,10,15,.95)!important}',

    A + ' #meadow-container{opacity:0!important;transition:opacity .8s ease;pointer-events:none}',
    A + ' #butterfly-svg{opacity:0!important;transition:opacity .8s ease}',
    A + ' #meadow-container>div:first-child{display:none}',

    '#cosmic-canvas-container{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0;transition:opacity .8s ease}',
    '#cosmic-canvas-container.active{opacity:1}',
    '#cosmic-canvas-container canvas{display:block;width:100%;height:100%}',

    /* Button lives inside <header> flex row. margin-left:auto pushes it + nav/hamburger to the right. */
    '#cosmic-toggle{margin-left:auto;margin-right:12px;z-index:51;height:38px;padding:0 14px;border-radius:999px;border:2px solid rgba(107,154,143,.65);background:rgba(235,228,218,.95);backdrop-filter:blur(8px);cursor:pointer;display:flex;align-items:center;gap:7px;transition:all .4s ease;box-shadow:0 2px 12px rgba(0,0,0,.15),0 0 0 1px rgba(107,154,143,.15);flex-shrink:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#5a4e42;white-space:nowrap}',
    '#cosmic-toggle:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(0,0,0,.15);border-color:rgba(107,154,143,.8)}',
    '#cosmic-toggle.cosmic-on{border-color:rgba(255,107,0,.5);background:rgba(10,10,15,.85);box-shadow:0 0 16px rgba(255,107,0,.25),0 0 32px rgba(176,38,255,.08);color:#ff6b00}',
    '#cosmic-toggle.cosmic-on:hover{box-shadow:0 0 22px rgba(255,107,0,.4),0 0 44px rgba(176,38,255,.15)}',
    '#cosmic-toggle svg{width:18px;height:18px;transition:all .4s ease;flex-shrink:0}',
    '#cosmic-toggle .icon-light{display:block}',
    '#cosmic-toggle .icon-cosmic{display:none}',
    '#cosmic-toggle.cosmic-on .icon-light{display:none}',
    '#cosmic-toggle.cosmic-on .icon-cosmic{display:block}',
    '#cosmic-toggle .label-light{display:inline}',
    '#cosmic-toggle .label-cosmic{display:none}',
    '#cosmic-toggle.cosmic-on .label-light{display:none}',
    '#cosmic-toggle.cosmic-on .label-cosmic{display:inline}',
    '@media(max-width:400px){#cosmic-toggle .label-light,#cosmic-toggle .label-cosmic{display:none}#cosmic-toggle{padding:0 10px}}',

    A + ' header,' + A + ' main,' + A + ' footer{position:relative;z-index:10}',
    A + ' [filter*="watercolor"]{filter:none}',
    A + ' .lightbox{background-color:rgba(0,0,0,.95)!important}',

    A + ' .pb-16.md\\:pb-\\[280px\\]{padding-bottom:4rem!important}',
    '@media(min-width:768px){' + A + ' .md\\:pb-\\[280px\\]{padding-bottom:4rem!important}}',
    '@media(min-width:1024px){' + A + ' .lg\\:pb-\\[330px\\]{padding-bottom:4rem!important}}',
    '@media(min-width:1280px){' + A + ' .xl\\:pb-\\[380px\\]{padding-bottom:4rem!important}}',
  ].join('\n');
  document.documentElement.appendChild(style);

  /* ───────── Canvas container (on <html>, survives swaps) ───────── */
  var canvasEl = document.createElement('div');
  canvasEl.id = 'cosmic-canvas-container';
  document.documentElement.appendChild(canvasEl);

  /* ───────── Button HTML (recreated on each page load) ───────── */
  var BTN_HTML =
    '<svg class="icon-light" viewBox="0 0 24 24" fill="none" stroke="#6b5a4a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '<circle cx="17" cy="5" r="1" fill="#6b5a4a" stroke="none"/>' +
      '<circle cx="19" cy="8" r="0.5" fill="#6b5a4a" stroke="none"/>' +
    '</svg>' +
    '<span class="label-light">Cosmic Mode</span>' +
    '<svg class="icon-cosmic" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="5"/>' +
      '<line x1="12" y1="1" x2="12" y2="3"/>' +
      '<line x1="12" y1="21" x2="12" y2="23"/>' +
      '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
      '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
      '<line x1="1" y1="12" x2="3" y2="12"/>' +
      '<line x1="21" y1="12" x2="23" y2="12"/>' +
      '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
      '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
    '</svg>' +
    '<span class="label-cosmic">Earth Mode</span>';

  function ensureButton() {
    if (document.getElementById('cosmic-toggle')) return;
    var b = document.createElement('button');
    b.id = 'cosmic-toggle';
    b.setAttribute('aria-label', 'Toggle cosmic dark mode');
    b.innerHTML = BTN_HTML;
    if (state.active) b.classList.add('cosmic-on');
    b.addEventListener('click', function () {
      if (state.active) disableCosmic(); else enableCosmic();
    });
    // Insert into header, before <nav> — puts it visually before "Home"
    var header = document.querySelector('header');
    if (header) {
      var nav = header.querySelector('nav');
      if (nav) {
        header.insertBefore(b, nav);
      } else {
        var hamburger = document.getElementById('mobile-menu-btn');
        if (hamburger) header.insertBefore(b, hamburger);
        else header.appendChild(b);
      }
    } else {
      // Fallback: fixed position if no header found
      b.style.cssText = 'position:fixed;top:24px;right:24px';
      document.body.appendChild(b);
    }
  }

  /* ───────── Three.js starfield (exact astrophysics replica) ───────── */
  function initStarfield() {
    if (state.scene) return;
    if (typeof THREE !== 'undefined') {
      buildStarfield();
    } else {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = buildStarfield;
      document.head.appendChild(s);
    }
  }

  function buildStarfield() {
    var isMobile = window.innerWidth < 768;
    var starsCount = isMobile ? 3000 : 8000;

    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    state.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasEl.appendChild(state.renderer.domElement);

    // Stars with per-vertex colors — identical to astrophysics page
    var geometry = new THREE.BufferGeometry();
    var posArray = new Float32Array(starsCount * 3);
    var colorArray = new Float32Array(starsCount * 3);

    for (var i = 0; i < starsCount * 3; i += 3) {
      posArray[i]     = (Math.random() - 0.5) * 100;
      posArray[i + 1] = (Math.random() - 0.5) * 100;
      posArray[i + 2] = (Math.random() - 0.5) * 100;

      var c = Math.random();
      if (c > 0.8) {
        colorArray[i] = 0.7; colorArray[i + 1] = 0.8; colorArray[i + 2] = 1;     // blue-white (20%)
      } else if (c > 0.6) {
        colorArray[i] = 0.8; colorArray[i + 1] = 0.7; colorArray[i + 2] = 1;     // purple-white (20%)
      } else {
        colorArray[i] = 1; colorArray[i + 1] = 1; colorArray[i + 2] = 1;         // white (60%)
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    state.starsMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    state.stars = new THREE.Points(geometry, state.starsMaterial);
    state.scene.add(state.stars);
    state.camera.position.z = 30;
    state.clock = new THREE.Clock();

    // Mouse parallax (desktop)
    if (!isMobile) {
      document.addEventListener('mousemove', function (e) {
        state.mouseX = (e.clientX - window.innerWidth / 2) / 100;
        state.mouseY = (e.clientY - window.innerHeight / 2) / 100;
      }, { passive: true });
    }

    // Resize
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (!state.renderer) return;
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(window.innerWidth, window.innerHeight);
      }, 250);
    }, { passive: true });

    animate();
  }

  function animate() {
    if (!state.active || !state.renderer) { state.animId = null; return; }
    state.animId = requestAnimationFrame(animate);
    if (document.hidden) return;

    var elapsed = state.clock.getElapsedTime();
    state.stars.rotation.y += 0.0005;
    state.stars.rotation.x += 0.0002;
    state.starsMaterial.opacity = 0.6 + Math.sin(elapsed) * 0.2;

    state.camera.position.x += (state.mouseX - state.camera.position.x) * 0.05;
    state.camera.position.y += (-state.mouseY - state.camera.position.y) * 0.05;
    state.camera.lookAt(state.scene.position);

    state.renderer.render(state.scene, state.camera);
  }

  /* ───────── Enable / Disable ───────── */
  function enableCosmic() {
    state.active = true;
    localStorage.setItem(STORAGE_KEY, 'true');
    document.documentElement.setAttribute(ATTR, 'true');
    var b = document.getElementById('cosmic-toggle');
    if (b) b.classList.add('cosmic-on');
    canvasEl.classList.add('active');
    initStarfield();
    if (!state.animId) animate();
  }

  function disableCosmic() {
    state.active = false;
    localStorage.setItem(STORAGE_KEY, 'false');
    document.documentElement.removeAttribute(ATTR);
    var b = document.getElementById('cosmic-toggle');
    if (b) b.classList.remove('cosmic-on');
    canvasEl.classList.remove('active');
    if (state.animId) { cancelAnimationFrame(state.animId); state.animId = null; }
  }

  /* ───────── Page sync ───────── */
  function syncPage() {
    var isAstro = location.pathname.indexOf('/astrophysics') === 0;

    // Re-inject button into the new page's header (body was swapped)
    if (!isAstro) {
      ensureButton();
    }

    // Hide canvas on astrophysics (it has its own starfield)
    if (isAstro && state.active) {
      canvasEl.classList.remove('active');
      if (state.animId) { cancelAnimationFrame(state.animId); state.animId = null; }
    } else if (!isAstro && state.active) {
      canvasEl.classList.add('active');
      if (!state.animId && state.scene) animate();
    }
  }

  /* ───────── Init ───────── */
  if (state.active) {
    document.documentElement.setAttribute(ATTR, 'true');
    canvasEl.classList.add('active');
    requestAnimationFrame(initStarfield);
  }
  syncPage();

  document.addEventListener('astro:page-load', syncPage);
})();
