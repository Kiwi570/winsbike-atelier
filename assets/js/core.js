/* Winsbike : socle commun (défilement, curseur, panier, transitions, cartes produit) */
(function () {
  const D = window.WB_DATA || { produits: [], marques: [] };
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* rien */ } },
  };
  const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const euro = (n) => fmt.format(n);
  const byId = new Map(D.produits.map((p) => [p.id, p]));
  const bySlug = new Map(D.produits.map((p) => [p.slug, p]));
  const brand = (k) => D.marques.find((b) => b.key === k) || { nom: k };
  const IMG = 'assets/img/p/';
  const SW = { rouge: '#e0313b', noir: '#1d1f22', bleu: '#2c6bff', violet: '#8a4dff', or: '#d8a43a', vert: '#2fbf71', orange: '#ff7a1f', rose: '#ff4f9a', jaune: '#f5d63b', gris: '#8b9097', blanc: '#f1f3f5', 'bleu-ciel': '#7cc6ff', marron: '#7a4b2a', iridium: '#5b6b8c', glacier: '#cfe3ea', oil: '#8a6cff' };
  const SW_NAME = { rouge: 'Rouge', noir: 'Noir', bleu: 'Bleu', violet: 'Violet', or: 'Or', vert: 'Vert', orange: 'Orange', rose: 'Rose', jaune: 'Jaune', gris: 'Gris', blanc: 'Blanc', 'bleu-ciel': 'Bleu ciel', marron: 'Marron', iridium: 'Iridium', glacier: 'Glacier', oil: 'Oil Slick' };
  const FREE = 75;

  function src(p, i = 0, size = 480) {
    const im = p.images[i]; if (!im) return '';
    const keys = Object.keys(im.s).map(Number).sort((a, b) => a - b);
    const k = keys.find((s) => s >= size) || keys[keys.length - 1];
    return IMG + im.s[k];
  }
  function srcset(p, i = 0) {
    const im = p.images[i]; if (!im) return '';
    return Object.keys(im.s).map((s) => `${IMG}${im.s[s]} ${s}w`).join(', ');
  }
  const url = (p) => `produit.html?p=${encodeURIComponent(p.slug)}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Animations réduites ---------- */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function isCalm() { return html.classList.contains('calme'); }
  function applyCalm(v, save) {
    html.classList.toggle('calme', v);
    if (save) store.set('wb-calme', v ? 1 : 0);
    $$('[data-calme-toggle]').forEach((b) => { b.textContent = v ? 'Activer les animations' : 'Réduire les animations'; b.setAttribute('aria-pressed', String(v)); });
    document.dispatchEvent(new CustomEvent('wb:calme', { detail: v }));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-calme-toggle]'); if (!b) return;
    applyCalm(!isCalm(), true); setTimeout(() => location.reload(), 150);
  });

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  function initScroll() {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (isCalm() || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    if (window.gsap) { gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const r = (t) => { lenis.raf(t); requestAnimationFrame(r); }; requestAnimationFrame(r); }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -70, duration: 1.4 });
      history.replaceState(null, '', id);
    });
  }
  function scrollLock(v) { if (lenis) v ? lenis.stop() : lenis.start(); document.body.style.overflow = v ? 'hidden' : ''; }

  /* ---------- Horaires et ouverture ---------- */
  const HOURS = { 1: [[14, 18]], 2: [[9, 12], [14, 18]], 3: [[9, 12], [14, 18]], 4: [[9, 12], [14, 18]], 5: [[9, 12], [14, 18]], 6: [], 0: [] };
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function parisNow(d = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const g = (t) => parts.find((x) => x.type === t).value;
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
    return { day: wd, h: parseInt(g('hour'), 10) % 24, m: parseInt(g('minute'), 10) };
  }
  function openState(d) {
    const n = parisNow(d); const t = n.h + n.m / 60;
    const today = HOURS[n.day];
    const cur = today.find(([a, b]) => t >= a && t < b);
    if (cur) return { open: true, now: n, label: `Ouvert maintenant, jusqu'à ${cur[1]}h` };
    const later = today.find(([a]) => t < a);
    if (later) return { open: false, now: n, label: `Fermé, ouvre aujourd'hui à ${later[0]}h` };
    for (let i = 1; i <= 7; i++) {
      const dd = (n.day + i) % 7; if (HOURS[dd].length) return { open: false, now: n, label: `Fermé, ouvre ${i === 1 ? 'demain' : DAYS[dd]} à ${HOURS[dd][0][0]}h` };
    }
    return { open: false, now: n, label: 'Fermé' };
  }

  /* ---------- En-tête ---------- */
  function initHeader() {
    const h = $('.hdr'); if (!h) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      h.classList.toggle('is-scrolled', y > 30);
      if (!document.body.classList.contains('no-hide')) h.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !$('.drawer.is-open'));
      if (y < lastY - 4) h.classList.remove('is-hidden');
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const st = openState();
    $$('[data-open-dot]').forEach((d) => { d.classList.toggle('is-open', st.open); d.title = st.label; });
    $$('[data-open-label]').forEach((d) => { d.textContent = st.label; });
    const menu = $('.menu-m'), burger = $('.burger');
    if (menu && burger) {
      const set = (v) => { menu.classList.toggle('is-open', v); burger.setAttribute('aria-expanded', String(v)); scrollLock(v); if (v) $('a', menu).focus(); else burger.focus(); };
      burger.addEventListener('click', () => set(!menu.classList.contains('is-open')));
      $('.menu-m__close', menu)?.addEventListener('click', () => set(false));
      $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) set(false); });
    }
  }

  /* ---------- Curseur disque ---------- */
  function initCursor() {
    if (isCalm() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const c = document.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = `<svg viewBox="0 0 100 100"><g fill="none" stroke="#eef0f2" stroke-width="2.4"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="12"/></g><g fill="#eef0f2">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<ellipse cx="${50 + Math.cos(a) * 29}" cy="${50 + Math.sin(a) * 29}" rx="6.5" ry="3.4" transform="rotate(${i * 45 + 30} ${50 + Math.cos(a) * 29} ${50 + Math.sin(a) * 29})" opacity=".85"/>`; }).join('')}</g></svg>`;
    const dot = document.createElement('div'); dot.className = 'cursor__dot'; dot.setAttribute('aria-hidden', 'true');
    document.body.append(c, dot);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, rot = 0, lastScroll = scrollY, vel = 0;
    window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; c.classList.add('is-on'); dot.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => { c.classList.remove('is-on'); dot.classList.remove('is-on'); });
    document.addEventListener('pointerover', (e) => { c.classList.toggle('is-hover', !!e.target.closest('a, button, label, input, select, [data-hover]')); });
    const tick = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      const s = scrollY; vel += ((s - lastScroll) - vel) * 0.2; lastScroll = s;
      rot += 0.6 + vel * 0.9;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${rot}deg)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Boutons magnétiques ---------- */
  function initMagnetic() {
    if (isCalm() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || !window.gsap) return;
    document.addEventListener('pointermove', (e) => {
      const b = e.target.closest('.btn, .cart-btn, .chip-teinte');
      $$('.is-mag').forEach((m) => { if (m !== b) { m.classList.remove('is-mag'); gsap.to(m, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1, .45)' }); } });
      if (!b) return;
      const r = b.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.classList.add('is-mag'); gsap.to(b, { x: dx * 0.22, y: dy * 0.3, duration: .4, ease: 'power3.out' });
    }, { passive: true });
  }

  /* ---------- Rideau de transition ---------- */
  function initShutter() {
    const sh = document.createElement('div'); sh.className = 'shutter'; sh.setAttribute('aria-hidden', 'true');
    sh.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>'; document.body.appendChild(sh);
    const bars = $$('i', sh);
    if (ss.get('wb-shutter') === '1' && window.gsap && !isCalm()) {
      ss.set('wb-shutter', '0');
      gsap.set(bars, { scaleY: 1, transformOrigin: 'bottom' });
      gsap.to(bars, { scaleY: 0, duration: .7, ease: 'power3.inOut', stagger: 0.05, delay: .05 });
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href'); if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const u = new URL(href, location.href); if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search && u.hash) return;
      if (isCalm() || !window.gsap) return;
      e.preventDefault(); ss.set('wb-shutter', '1');
      gsap.set(bars, { transformOrigin: 'top' });
      gsap.to(bars, { scaleY: 1, duration: .55, ease: 'power3.inOut', stagger: 0.045, onComplete: () => { location.href = u.href; } });
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted && window.gsap) gsap.set(bars, { scaleY: 0 }); });
  }

  /* ---------- Images Grok (posées quand elles existent) ---------- */
  function initGrok(root = document) {
    const ok = new Set(window.WB_GROK || []);
    $$('[data-grok]:not(.has-img)', root).forEach((el) => {
      const name = el.dataset.grok; const mob = el.dataset.grokMobile;
      const pick = (mob && ok.has(mob) && window.matchMedia('(max-width: 760px)').matches) ? mob : name;
      if (!ok.has(pick)) return;
      const img = new Image(); img.alt = ''; img.decoding = 'async'; img.loading = el.dataset.eager ? 'eager' : 'lazy';
      img.src = `assets/img/grok/${pick}.webp`; el.appendChild(img); el.classList.add('has-img');
    });
  }

  /* ---------- Toast ---------- */
  let toastT;
  function toast(msg, action) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : '');
    if (action) $('button', t).onclick = () => { action.fn(); t.classList.remove('is-on'); };
    requestAnimationFrame(() => t.classList.add('is-on'));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 3800);
  }

  /* ---------- Jauge dynamométrique (livraison offerte) ---------- */
  function torqueSVG() {
    const ticks = Array.from({ length: 11 }, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; const r1 = 50, r2 = i % 5 ? 45 : 41; return `<line x1="${66 + Math.cos(a) * r1}" y1="${66 + Math.sin(a) * r1}" x2="${66 + Math.cos(a) * r2}" y2="${66 + Math.sin(a) * r2}"/>`; }).join('');
    return `<svg viewBox="0 0 132 78" aria-hidden="true"><path class="torque__arc" d="M14 66 A52 52 0 0 1 118 66"/><path class="torque__fill" d="M14 66 A52 52 0 0 1 118 66" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/><g class="torque__ticks">${ticks}</g><line class="torque__needle" x1="66" y1="66" x2="24" y2="66"/><circle class="torque__hub" cx="66" cy="66" r="5"/></svg>`;
  }
  function setTorque(el, total) {
    if (!el) return;
    const ratio = Math.max(0, Math.min(1, total / FREE)); const ok = total >= FREE;
    const fill = $('.torque__fill', el), needle = $('.torque__needle', el), txt = $('.torque__txt', el);
    const deg = ratio * 180;
    const was = el.classList.contains('is-ok');
    el.classList.toggle('is-ok', ok);
    if (window.gsap && !isCalm()) {
      gsap.to(fill, { strokeDashoffset: 100 - ratio * 100, duration: .8, ease: 'power3.out' });
      gsap.to(needle, { rotation: deg, svgOrigin: '66 66', duration: 1, ease: ok && !was ? 'elastic.out(1.1, .35)' : 'power3.out' });
    } else { fill.setAttribute('stroke-dashoffset', 100 - ratio * 100); needle.setAttribute('transform', `rotate(${deg} 66 66)`); }
    if (txt) txt.innerHTML = ok ? `<b>Livraison offerte</b><br>commande au-delà de 75 € TTC` : (total > 0 ? `Plus que <b>${euro(FREE - total)}</b><br>pour la livraison offerte` : `<b>Livraison offerte</b><br>dès 75 € TTC d'achat`);
  }

  /* ---------- Panier ---------- */
  let cart = store.get('wb-panier', []).filter((l) => byId.has(l.id));
  const key = (l) => l.id + '|' + JSON.stringify(l.opts || {});
  const cartTotal = () => cart.reduce((s, l) => s + byId.get(l.id).prix * l.q, 0);
  const cartCount = () => cart.reduce((s, l) => s + l.q, 0);
  function saveCart() { store.set('wb-panier', cart); renderCart(); document.dispatchEvent(new CustomEvent('wb:cart', { detail: { total: cartTotal() } })); }
  function addToCart(id, opts = {}, q = 1, fromEl) {
    const p = byId.get(id); if (!p || !p.dispo) { toast('Ce produit est en rupture : il ne peut pas être ajouté.'); return false; }
    const k = key({ id, opts }); const ex = cart.find((l) => key(l) === k);
    if (ex) ex.q = Math.min(99, ex.q + q); else cart.push({ id, opts, q });
    saveCart();
    if (fromEl) fly(fromEl, p); else bump();
    toast(`${p.nom} ajouté au panier`, { label: 'Voir le panier', fn: openDrawer });
    return true;
  }
  function bump() { const b = $('.cart-btn'); if (!b) return; b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
  function fly(fromEl, p) {
    const target = $('.cart-btn'); const img = fromEl.tagName === 'IMG' ? fromEl : $('img', fromEl);
    if (!target || !img || isCalm() || !window.gsap) { bump(); return; }
    const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'fly'; f.innerHTML = `<img src="${img.currentSrc || img.src}" alt="">`;
    document.body.appendChild(f);
    const size = Math.min(140, Math.max(70, a.width * 0.6));
    gsap.set(f, { left: a.left + a.width / 2 - size / 2, top: a.top + a.height / 2 - size / 2, width: size, height: size });
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const colors = ['#e0313b', '#ff7a1f', '#d8a43a', '#2fbf71', '#2c6bff', '#8a4dff'];
    colors.forEach((c, i) => {
      const s = document.createElement('i'); s.style.cssText = `position:fixed;z-index:149;width:9px;height:9px;border-radius:50%;background:${c};pointer-events:none;left:${a.left + a.width / 2 - 4}px;top:${a.top + a.height / 2 - 4}px;box-shadow:0 0 10px ${c}`;
      document.body.appendChild(s);
      gsap.timeline({ delay: 0.05 + i * 0.035, onComplete: () => s.remove() })
        .to(s, { x: dx, duration: .85, ease: 'power2.in' }, 0)
        .to(s, { y: dy, duration: .85, ease: 'back.in(2.2)' }, 0)
        .to(s, { scale: 0.2, opacity: 0, duration: .85, ease: 'power2.in' }, 0);
    });
    gsap.timeline({ onComplete: () => { f.remove(); bump(); } })
      .to(f, { x: dx, duration: .8, ease: 'power2.in' }, 0)
      .to(f, { y: dy, duration: .8, ease: 'back.in(2.2)' }, 0)
      .to(f, { scale: 0.18, rotation: 200, duration: .8, ease: 'power2.in' }, 0);
  }
  function lineOpts(l) { const o = l.opts || {}; return Object.keys(o).map((k) => `${k} : ${o[k]}`).join(', '); }
  function renderCart() {
    $$('.cart-btn__n').forEach((n) => { n.textContent = cartCount(); });
    $$('.cart-btn').forEach((b) => b.setAttribute('aria-label', `Panier, ${cartCount()} article${cartCount() > 1 ? 's' : ''}`));
    const list = $('.drawer__items'); if (!list) return;
    if (!cart.length) {
      list.innerHTML = `<div class="drawer__empty"><p>Votre panier est vide. Les pièces ajoutées apparaîtront ici.</p><a class="btn btn--ghost btn--sm" href="boutique.html"><span class="btn__lbl">Voir la boutique</span></a></div>`;
    } else {
      list.innerHTML = cart.map((l, i) => { const p = byId.get(l.id); return `<div class="line"><div class="line__img"><img src="${src(p, 0, 480)}" alt="" loading="lazy"></div><div><a class="line__name" href="${url(p)}">${esc(p.nom)}</a><div class="line__opt">${esc(brand(p.marque).nom)}${l.opts && Object.keys(l.opts).length ? ' ; ' + esc(lineOpts(l)) : ''}</div><div class="qty"><button type="button" data-q="-1" data-i="${i}" aria-label="Retirer un">−</button><span>${l.q}</span><button type="button" data-q="1" data-i="${i}" aria-label="Ajouter un">+</button></div></div><div class="line__right"><span class="mono">${euro(p.prix * l.q)}</span><button class="line__rm" type="button" data-rm="${i}">Retirer</button></div></div>`; }).join('');
    }
    const t = cartTotal();
    $$('[data-cart-total]').forEach((e) => { e.textContent = euro(t); });
    $$('.drawer .torque').forEach((g) => setTorque(g, t));
    const go = $('[data-checkout]'); if (go) go.disabled = !cart.length;
  }
  function openDrawer() { const d = $('.drawer'); if (!d) return; d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); scrollLock(true); renderCart(); setTimeout(() => $('.drawer .x')?.focus(), 60); }
  function closeDrawer() { const d = $('.drawer'); if (!d) return; d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); scrollLock(false); $('.cart-btn')?.focus(); }
  function initCart() {
    const d = $('.drawer'); if (!d) return;
    $$('.drawer .torque').forEach((g) => { if (!$('svg', g)) g.insertAdjacentHTML('afterbegin', torqueSVG()); });
    $$('.cart-btn').forEach((b) => b.addEventListener('click', openDrawer));
    $('.drawer__bg', d).addEventListener('click', closeDrawer);
    $('.drawer .x', d).addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('is-open')) closeDrawer(); });
    d.addEventListener('click', (e) => {
      const q = e.target.closest('[data-q]'); const rm = e.target.closest('[data-rm]');
      if (q) { const l = cart[+q.dataset.i]; l.q += +q.dataset.q; if (l.q <= 0) cart.splice(+q.dataset.i, 1); saveCart(); }
      if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); }
    });
    $('[data-checkout]', d)?.addEventListener('click', () => { closeDrawer(); openCheckout(); });
    renderCart();
  }

  /* ---------- Fenêtres ---------- */
  let lastFocus;
  function openModal(id) {
    const m = document.getElementById(id); if (!m) return; lastFocus = document.activeElement;
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false'); scrollLock(true);
    const f = $('input, select, button:not(.x), a[href]', m) || $('.x', m); setTimeout(() => f?.focus(), 30);
  }
  function closeModal(m) { m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true'); scrollLock(false); lastFocus?.focus?.(); }
  document.addEventListener('click', (e) => { const m = e.target.closest('.modal'); if (m && (e.target.classList.contains('modal__bg') || e.target.closest('.modal .x'))) closeModal(m); });
  document.addEventListener('keydown', (e) => {
    const m = $('.modal.is-open'); if (!m) return;
    if (e.key === 'Escape') closeModal(m);
    if (e.key === 'Tab') { const f = $$('a[href], button, input, select, textarea', m).filter((x) => !x.disabled && x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });

  /* Paiement simulé : vrais moyens de paiement du site, rien n'est envoyé */
  function openCheckout() {
    let m = $('#m-paiement');
    if (!m) {
      m = document.createElement('div'); m.className = 'modal'; m.id = 'm-paiement'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'm-paiement-t'); m.setAttribute('aria-hidden', 'true');
      m.innerHTML = `<div class="modal__bg"></div><div class="modal__box"><button class="x" type="button" aria-label="Fermer"><svg viewBox="0 0 20 20"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2"/></svg></button>
      <h2 id="m-paiement-t">Paiement</h2><p class="muted">Paiement simulé pour la maquette : aucune commande n'est enregistrée ni envoyée.</p>
      <div class="sum" style="margin:14px 0"><span>Total TTC</span><b data-cart-total></b></div>
      <form class="form" id="f-paiement" novalidate><fieldset class="field" style="border:0;padding:0;margin:0"><legend>Moyen de paiement</legend><div class="payopts">
      <label class="payopt"><input type="radio" name="pay" value="cb" checked>${ICONS.card}<div><b>Carte bancaire, Visa ou Mastercard</b><span>Paiement sur la page sécurisée PayPlug, avec 3D Secure.</span></div></label>
      <label class="payopt"><input type="radio" name="pay" value="cheque">${ICONS.cheque}<div><b>Chèque</b><span>À l'ordre de Ets Corbières, envoyé au 8 rue Abbé Gibert, 22110 Rostrenen, avec le numéro de commande au dos. Commande gardée 7 jours.</span></div></label>
      <label class="payopt"><input type="radio" name="pay" value="virement">${ICONS.bank}<div><b>Virement bancaire</b><span>Coordonnées bancaires affichées après la commande ; indiquez le numéro de commande.</span></div></label>
      </div></fieldset><p class="muted" style="font-size:14px">Expédition sous 2 à 8 jours après réception du paiement, avec un lien de suivi. Frais de port selon le poids, à compléter.</p>
      <button class="btn" type="submit"><span class="btn__lbl">Valider la commande (simulation)</span></button><div class="confirm" hidden aria-live="polite"></div></form></div>`;
      document.body.appendChild(m);
      $('#f-paiement', m).addEventListener('submit', (e) => {
        e.preventDefault(); const v = new FormData(e.target).get('pay');
        const c = $('.confirm', m); c.hidden = false;
        c.textContent = v === 'cb' ? 'Simulation : vous seriez redirigé vers la page sécurisée PayPlug. Rien n\'a été débité.' : v === 'cheque' ? 'Simulation : commande enregistrée 7 jours en attente de votre chèque. Rien n\'a été envoyé.' : 'Simulation : les coordonnées bancaires s\'afficheraient ici. Rien n\'a été envoyé.';
      });
    }
    renderCart(); $('.confirm', m).hidden = true; openModal('m-paiement');
  }

  /* Choix des options avant l'ajout */
  function needsOptions(p) { return p.variantes && p.variantes.length > 0; }
  function optsMarkup(p, prefix) {
    return p.variantes.map((g, gi) => `<fieldset class="field" style="border:0;padding:0;margin:0"><legend>${esc(g.label)}</legend><div class="optsw">${g.options.map((o, oi) => {
      const ck = g.label === 'Couleur' ? (o.toLowerCase().split(' / ').map((x) => ({ 'bleu ciel': 'bleu-ciel', 'bleu clair': 'bleu-ciel' }[x] || x)).filter((x) => SW[x])) : [];
      return `<label><input type="radio" name="${prefix}-${gi}" value="${esc(o)}" ${oi === 0 ? 'checked' : ''}><span>${ck.map((c) => `<i class="sw" style="--c:${SW[c]}" data-c="${c}"></i>`).join('')}${esc(o)}</span></label>`; }).join('')}</div></fieldset>`).join('');
  }
  function readOpts(p, root, prefix) { const o = {}; p.variantes.forEach((g, gi) => { const c = $(`input[name="${prefix}-${gi}"]:checked`, root); if (c) o[g.label] = c.value; }); return o; }
  function pickAndAdd(p, fromEl) {
    let m = $('#m-options');
    if (!m) { m = document.createElement('div'); m.className = 'modal'; m.id = 'm-options'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'm-options-t'); m.setAttribute('aria-hidden', 'true'); document.body.appendChild(m); }
    m.innerHTML = `<div class="modal__bg"></div><div class="modal__box"><button class="x" type="button" aria-label="Fermer"><svg viewBox="0 0 20 20"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2"/></svg></button>
      <div style="display:grid;grid-template-columns:96px 1fr;gap:16px;align-items:center"><img src="${src(p, 0, 480)}" alt="" style="width:96px;height:96px;object-fit:contain"><div><h2 id="m-options-t" style="font-size:24px">${esc(p.nom)}</h2><span class="mono">${euro(p.prix)}</span></div></div>
      <form><div class="pick-opts">${optsMarkup(p, 'mo')}</div><button class="btn" type="submit"><span class="btn__lbl">Ajouter au panier</span></button></form></div>`;
    $('form', m).addEventListener('submit', (e) => { e.preventDefault(); const o = readOpts(p, m, 'mo'); closeModal(m); addToCart(p.id, o, 1, fromEl); });
    openModal('m-options');
  }

  /* ---------- Cartes produit ---------- */
  const ICONS = {
    plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    card: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="7" width="22" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h22" stroke="currentColor" stroke-width="2.4"/><path d="M7 18h5" stroke="currentColor" stroke-width="1.8"/></svg>',
    cheque: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="8" width="22" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 17c2-3 3 1 5-1s2-2 4 0M18 13h4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
    bank: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 11l10-6 10 6H4zM6 12v8M11 12v8M17 12v8M22 12v8M4 22h20" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="6" cy="17.5" r="1.8" fill="currentColor"/><circle cx="17" cy="17.5" r="1.8" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shield: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 10l2.4 2.4 4.6-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };
  function swatches(p, max = 7) {
    if (!p.couleurs.length) return '';
    const s = p.couleurs.slice(0, max).map((c) => `<i class="sw" style="--c:${SW[c] || '#888'}" data-c="${c}" title="${esc(SW_NAME[c] || c)}"></i>`).join('');
    return `<div class="pc__sw" aria-label="Couleurs : ${esc(p.couleurs.map((c) => SW_NAME[c] || c).join(', '))}">${s}</div>`;
  }
  function card(p, o = {}) {
    const im = p.images[0] || { k: 'photo' };
    const tag = o.tag ? `<span class="pc__tag">${esc(o.tag)}</span>` : '';
    return `<article class="pc" data-id="${p.id}" data-tilt>
      <div class="pc__media ${im.k === 'photo' ? 'is-photo' : ''}">${tag}<img src="${src(p, 0, 480)}" srcset="${srcset(p, 0)}" sizes="(max-width: 600px) 50vw, 25vw" alt="${esc(p.nom)}, ${esc(brand(p.marque).nom)}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"></div>
      <span class="pc__shine" aria-hidden="true"></span>
      <div class="pc__body"><span class="pc__brand">${esc(brand(p.marque).nom)}</span><a class="pc__name" href="${url(p)}">${esc(p.nom)}</a>${swatches(p)}
      <div class="pc__row"><span class="pc__price">${euro(p.prix)}</span>${p.dispo ? `<button class="pc__add" type="button" data-add="${p.id}">${ICONS.plus}<span>${needsOptions(p) ? 'Choisir' : 'Ajouter'}</span></button>` : `<span class="pc__stock is-out">${esc(p.dispoTexte)}</span>`}</div></div></article>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    e.preventDefault(); const p = byId.get(+b.dataset.add); const media = b.closest('.pc')?.querySelector('.pc__media img');
    if (needsOptions(p)) pickAndAdd(p, media); else addToCart(p.id, {}, 1, media);
  });
  function initTilt() {
    if (isCalm() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.addEventListener('pointermove', (e) => {
      const c = e.target.closest('[data-tilt]');
      $$('.pc.is-tilt').forEach((x) => { if (x !== c) { x.classList.remove('is-tilt'); x.style.transform = ''; } });
      if (!c) return;
      const r = c.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.classList.add('is-tilt');
      c.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg)`;
      c.style.setProperty('--mx', `${px * 100}%`); c.style.setProperty('--my', `${py * 100}%`);
    }, { passive: true });
  }

  /* ---------- Titres découpés ---------- */
  function splitReveal(root = document) {
    if (!window.gsap || !window.SplitText || isCalm()) return;
    gsap.registerPlugin(SplitText);
    $$('[data-split]', root).forEach((el) => {
      const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'sl' });
      gsap.from(s.lines, { yPercent: 110, duration: 1.05, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
  }

  /* ---------- Démarrage ---------- */
  function boot() {
    applyCalm(html.classList.contains('calme'), false);
    initScroll(); initHeader(); initCart(); initGrok(); initShutter(); initCursor(); initMagnetic(); initTilt();
    $$('[data-year]').forEach((y) => { y.textContent = new Date().getFullYear(); });
    $$('form[data-nl]').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault(); const em = $('input[type=email]', f), ck = $('input[type=checkbox]', f), out = $('[data-nl-out]', f);
      if (!em.value || !em.checkValidity()) { out.textContent = 'Saisissez une adresse e-mail valide, par exemple nom@exemple.fr.'; em.focus(); return; }
      if (!ck.checked) { out.textContent = 'Cochez la case d\'accord pour vous inscrire.'; ck.focus(); return; }
      out.textContent = 'Inscription simulée : aucune adresse n\'a été envoyée.'; f.reset();
    }));
  }
  window.WB_reGrok = initGrok;
  window.WB = { D, $, $$, euro, byId, bySlug, brand, src, srcset, url, esc, card, swatches, SW, SW_NAME, ICONS, addToCart, pickAndAdd, needsOptions, optsMarkup, readOpts, openDrawer, openCheckout, toast, torqueSVG, setTorque, isCalm, openState, HOURS, DAYS, parisNow, splitReveal, store, get lenis() { return lenis; }, scrollLock, FREE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
