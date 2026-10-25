/* Accueil Winsbike */
(function () {
  const { D, $, $$, euro, byId, brand, src, srcset, url, esc, card, SW, SW_NAME, isCalm, openState, HOURS, parisNow, addToCart, torqueSVG, setTorque, ICONS } = window.WB;
  const calm = isCalm();
  const G = window.gsap, ST = window.ScrollTrigger;
  const desktop = () => window.matchMedia('(min-width: 901px)').matches;
  if (G) G.registerPlugin(ST, window.DrawSVGPlugin, window.SplitText, window.CustomEase);

  /* ---------- Ouverture ---------- */
  function opening(done) {
    const L = $('#loader');
    let seen = false; try { seen = sessionStorage.getItem('wb-vu') === '1'; sessionStorage.setItem('wb-vu', '1'); } catch (e) { /* rien */ }
    if (!L || calm || !G || seen) { L && L.remove(); done(); return; }
    const arcs = $$('.loader__ring path', L), logo = $('.loader__logo img', L), cut = $('.loader__cut', L);
    const tl = G.timeline({ onComplete: () => { L.remove(); } });
    tl.from(arcs, { drawSVG: '0%', duration: .7, ease: 'power2.inOut', stagger: .07 })
      .to(cut, { opacity: 1, duration: .1 }, '-=.2')
      .to(logo, { clipPath: 'inset(0 0% 0 0)', duration: .7, ease: 'power2.inOut' }, '<')
      .to(cut, { left: '100%', duration: .7, ease: 'power2.inOut' }, '<')
      .to(cut, { opacity: 0, duration: .15 })
      .to($('.loader__ring', L), { rotation: 90, scale: .92, duration: .5, ease: 'power3.in' }, '+=.1')
      .add(done, '-=.25')
      .to(L, { clipPath: 'inset(0 0 100% 0)', duration: .75, ease: 'expo.inOut' }, '-=.3');
  }

  /* ---------- Héros ---------- */
  let metal = null;
  function hero() {
    const box = $('#hero-metal');
    if (box && window.WBMetal) metal = WBMetal.create(box, { tint: 'oil', focusX: .66, dpr: 1.25 });
    const frame = $('#hero-frame');
    const counts = {};
    D.produits.forEach((p) => p.couleurs.forEach((c) => { counts[c] = (counts[c] || 0) + 1; }));
    const out = $('#teintes-out');
    const show = (c) => {
      const n = counts[c] || 0;
      out.innerHTML = c === 'oil' ? `Oil Slick : <a class="link-trace" href="boutique.html?couleur=oil">${n} pièces Weapon dans cette finition</a>` : `${SW_NAME[c]} : <a class="link-trace" href="boutique.html?couleur=${c}">${n} produits dans cette couleur</a>`;
    };
    $$('.chip-teinte').forEach((b) => b.addEventListener('click', () => {
      $$('.chip-teinte').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      metal && metal.setTint(b.dataset.c); show(b.dataset.c);
      if (G && !calm) G.fromTo(frame, { filter: 'drop-shadow(0 50px 60px rgba(0,0,0,.65)) brightness(1.35)' }, { filter: 'drop-shadow(0 50px 60px rgba(0,0,0,.65)) brightness(1)', duration: .8 });
    }));
    show('oil');
    if (!G || calm) return () => {};
    const title = $('[data-hero-title]');
    const lines = $$('.l', title);
    const st = SplitText.create(lines, { type: 'words,chars', charsClass: 'ch' });
    G.set(st.chars, { yPercent: 115 });
    $$('.l', title).forEach((l) => { l.style.overflow = 'hidden'; l.style.display = 'block'; l.style.paddingBottom = '.05em'; });
    G.set(['.hero__sub', '.hero__cta', '.teintes', '.hero__tag'], { autoAlpha: 0, y: 24 });
    G.set(frame, { autoAlpha: 0, x: 120, rotationY: -28, rotationZ: 4 });
    const intro = () => {
      const tl = G.timeline();
      tl.to(st.chars, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: .018 })
        .to(frame, { autoAlpha: 1, x: 0, rotationY: 0, rotationZ: 0, duration: 1.6, ease: 'expo.out' }, '-=.9')
        .to(['.hero__sub', '.hero__cta', '.teintes', '.hero__tag'], { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .08 }, '-=1.2');
    };
    if (window.matchMedia('(hover: hover)').matches) {
      window.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        G.to(frame, { rotationY: x * 14, rotationX: -y * 10, x: x * 30, y: y * 18, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
      }, { passive: true });
    }
    G.to(frame, { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__in > div:first-child', { yPercent: -14, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
    return intro;
  }

  /* ---------- Bandeau en roue libre ---------- */
  function bandeau() {
    const tr = $('.bandeau__track'); if (!tr) return;
    tr.innerHTML += tr.innerHTML; tr.innerHTML += tr.innerHTML;
    if (calm || !G) return;
    let x = 0, v = 0, lastY = scrollY;
    const w = () => tr.scrollWidth / 4;
    const icons = $$('.bandeau__item svg', tr);
    G.ticker.add((t, dt) => {
      const y = scrollY; const dy = y - lastY; lastY = y;
      v += (Math.abs(dy) * 0.9 - v) * 0.08;
      x -= (0.6 + v) * (dt / 16.7);
      if (-x >= w()) x += w();
      tr.style.transform = `translate3d(${x}px,0,0)`;
      const r = (-x * 0.9) % 360; icons.forEach((i) => { i.style.transform = `rotate(${r}deg)`; });
    });
  }

  /* ---------- Marques ---------- */
  function marques() {
    const track = $('.marques__track'); if (!track) return;
    const pick = { weapon: [67, 90, 103], sumart: [147, 209, 131], seryt: [188, 189, 201], 'crazy-safety': [174, 178, 182], troxco: [13, 14], 'all-wings': [170, 169] };
    const tex = { weapon: 'marques-alu-brosse-16x9', sumart: 'marques-alu-brosse-16x9', seryt: 'marques-tissu-technique-16x9', 'crazy-safety': 'marques-tissu-technique-16x9', troxco: 'marques-alu-brosse-16x9', 'all-wings': 'marques-alu-brosse-16x9' };
    track.innerHTML = D.marques.map((b, i) => {
      const fl = (pick[b.key] || []).map((id) => byId.get(id)).filter((p) => p && p.images[0] && p.images[0].k === 'cut');
      const logo = b.mono ? `${b.logo}-mono-400.webp` : `${b.logo}-400.webp`;
      return `<article class="mq" aria-labelledby="mq-${b.key}">
        <div class="grok ${b.key === 'seryt' || b.key === 'crazy-safety' ? 'ph-tissu' : 'ph-brosse'}" data-grok="${tex[b.key]}" aria-hidden="true"></div>
        <div class="mq__intro">
          ${b.key === 'all-wings' ? `<p class="mq__name" aria-hidden="true">${esc(b.nom)}</p>` : `<img class="mq__logo ${b.mono ? '' : 'is-plate'}" src="assets/img/m/${b.mono ? logo : b.logo + '-400.webp'}" alt="" width="400" height="120">`}
          <div class="mq__meta"><span class="mq__count" data-count="${b.n}">${b.n}<small>produit${b.n > 1 ? 's' : ''}</small></span>${b.exclusif ? `<span class="badge-ex">${ICONS.check}Distribution exclusive en France</span>` : '<span class="badge-ex" style="background:transparent">Au catalogue</span>'}</div>
          <h2 id="mq-${b.key}" class="visually-hidden">${esc(b.nom)}</h2>
          <p class="mq__accroche">${esc(b.accroche)}</p>
          <p class="mq__texte">${esc(b.texte)}</p>
          <a class="btn btn--ghost" href="boutique.html?marque=${b.key}"><span class="btn__lbl">Voir ${b.n > 1 ? 'les ' + b.n + ' produits' : 'le produit'} ${esc(b.nom)}</span></a>
        </div>
        <div class="mq__visual" aria-hidden="true">
          <div class="mq__banner"><img src="assets/img/m/${b.diapo}-1200.webp" srcset="assets/img/m/${b.diapo}-1200.webp 1200w, assets/img/m/${b.diapo}-2340.webp 2340w" sizes="60vw" alt="" loading="lazy"></div>
          ${fl.map((p) => `<div class="mq__float"><img src="${src(p, 0, 480)}" alt="" loading="lazy"></div>`).join('')}
        </div></article>`;
    }).join('');
    const dots = $('.marques__dots'); if (dots) dots.innerHTML = D.marques.map(() => '<i><b></b></i>').join('');
    window.WB_reGrok && window.WB_reGrok(track);
    if (!G || calm || !desktop()) return;
    const panels = $$('.mq', track);
    const total = () => track.scrollWidth - innerWidth;
    const tween = G.to(track, { x: () => -total(), ease: 'none', scrollTrigger: { trigger: '.marques__pin', pin: true, scrub: .6, end: () => '+=' + Math.round(total() * .72), invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (s) => { const bars = $$('.marques__dots b'); const k = s.progress * (bars.length - 1); bars.forEach((b, i) => { b.style.transform = `scaleX(${Math.max(0, Math.min(1, k - i + 1))})`; }); } } });
    panels.forEach((pn) => {
      const st = { trigger: pn, containerAnimation: tween, start: 'left 80%', end: 'right 20%', scrub: true };
      G.fromTo($('.mq__banner img', pn), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: st });
      $$('.mq__float', pn).forEach((f, i) => G.fromTo(f, { x: 120 + i * 80, rotation: 10 - i * 8 }, { x: -60 - i * 40, rotation: -6 + i * 4, ease: 'none', scrollTrigger: st }));
      const c = $('.mq__count', pn); const n = +c.dataset.count;
      ST.create({ trigger: pn, containerAnimation: tween, start: 'left 70%', once: true, onEnter: () => {
        const o = { v: 0 }; G.to(o, { v: n, duration: 1.4, ease: 'power3.out', onUpdate: () => { c.firstChild.nodeValue = Math.round(o.v); } });
        G.from($$('.mq__intro > *', pn), { y: 30, autoAlpha: 0, duration: .8, stagger: .06, ease: 'power3.out' });
      } });
    });
  }

  /* ---------- Le Beast : cotes et vue éclatée ---------- */
  function beast() {
    const svg = $('#beast-cotes'); const pinEl = $('.beast__pin'); if (!svg || !pinEl) return;
    const kitIds = D.beastKit;
    const reasons = Object.fromEntries((byId.get(67).compat || []).map(([id, r]) => [id, r]));
    const parts = kitIds.map((id) => byId.get(id)).filter(Boolean);
    const kit = $('.kit');
    kit.insertAdjacentHTML('afterbegin', parts.map((p, i) => `<div class="kit__part" data-i="${i}" aria-hidden="true"><img src="${src(p, 0, 960)}" alt="" loading="lazy"></div>`).join(''));
    const list = $('.kit__list');
    list.innerHTML = parts.map((p) => `<li><a href="${url(p)}">${esc(p.nom)}</a><span class="mono">${euro(p.prix)}</span><span>${esc(reasons[p.id] || '')}</span><span class="st ${p.dispo ? '' : 'muted'}">${p.dispo ? 'En stock' : esc(p.dispoTexte)}</span></li>`).join('');
    const dispo = parts.filter((p) => p.dispo);
    const sum = dispo.reduce((s, p) => s + p.prix, 0);
    $('#kit-sum').textContent = euro(sum);
    const btn = $('#kit-add');
    btn.querySelector('.btn__lbl').textContent = `Ajouter les ${dispo.length} pièces en stock`;
    btn.addEventListener('click', () => { dispo.forEach((p, i) => setTimeout(() => addToCart(p.id, p.variantes.length ? Object.fromEntries(p.variantes.map((g) => [g.label, g.options[0]])) : {}, 1, i === 0 ? $(`.kit__part[data-i="${parts.indexOf(p)}"] img`) : null), i * 160)); });
    if (!G || calm || !desktop()) return;
    const cotes = $$('.cote, .ext', svg), labels = $$('.lab', svg), nums = $$('[data-num]', svg);
    G.set(cotes, { drawSVG: '0%' }); G.set(labels, { autoAlpha: 0, y: 10 });
    const partEls = $$('.kit__part', kit);
    const slots = [{ x: .61, y: .27 }, { x: .72, y: .27 }, { x: .83, y: .27 }, { x: .93, y: .27 }];
    const scatter = [{ x: -.1, y: .1, r: -60 }, { x: 1.1, y: -.1, r: 80 }, { x: -.1, y: 1.1, r: 120 }, { x: 1.15, y: 1.1, r: -90 }];
    partEls.forEach((el, i) => { G.set(el, { left: 0, top: 0, xPercent: -50, yPercent: -50, x: scatter[i].x * innerWidth, y: scatter[i].y * innerHeight, rotation: scatter[i].r, autoAlpha: 0, scale: .6 }); });
    const tl = G.timeline({ scrollTrigger: { trigger: pinEl, pin: true, scrub: .8, start: 'top top', end: '+=260%', anticipatePin: 1 } });
    tl.from('.beast__img', { autoAlpha: 0, scale: .9, rotation: -2, duration: .6 })
      .from('.beast__head > *', { autoAlpha: 0, y: 30, stagger: .05, duration: .4 }, 0)
      .from('.beast__specs > *', { autoAlpha: 0, x: 20, stagger: .03, duration: .3 }, .1);
    $$('g[data-step]', svg).forEach((g, i) => {
      const at = .6 + i * .45;
      const cs = $$('.cote, .ext', g), ls = $$('.lab', g);
      if (cs.length) tl.to(cs, { drawSVG: '100%', duration: .5, ease: 'none' }, at);
      if (ls.length) tl.to(ls, { autoAlpha: 1, y: 0, duration: .3 }, at + .25);
      $$('[data-num]', g).forEach((n) => { const o = { v: 0 }; const end = +n.dataset.num; tl.to(o, { v: end, duration: .5, onUpdate: () => { n.textContent = Math.round(o.v) + (n.dataset.unit || ''); } }, at + .2); });
    });
    const tEnd = .6 + $$('g[data-step]', svg).length * .45 + .4;
    tl.to('.beast__stage', { xPercent: -62, scale: .58, duration: .8, ease: 'power2.inOut' }, tEnd)
      .to('.beast__svg g[data-step]', { autoAlpha: 0, duration: .3 }, tEnd)
      .to('.beast__specs', { autoAlpha: 0, duration: .3 }, tEnd);
    partEls.forEach((el, i) => {
      tl.to(el, { autoAlpha: 1, scale: 1, rotation: 0, x: () => slots[i].x * innerWidth, y: () => slots[i].y * innerHeight, duration: .9, ease: 'power3.out' }, tEnd + .2 + i * .12);
    });
    tl.to('.kit__panel', { autoAlpha: 1, y: 0, duration: .4 }, tEnd + .9).from('.kit__panel', { y: 40, duration: .4 }, tEnd + .9);
    tl.to({}, { duration: .5 });
  }

  /* ---------- Produits populaires ---------- */
  function populaires() {
    const g = $('#pop-grid'); if (!g) return;
    g.innerHTML = D.populaires.map((id) => byId.get(id)).filter(Boolean).map((p) => card(p)).join('');
    if (!G || calm) return;
    const cards = $$('.pc', g);
    G.from(cards, { y: -70, autoAlpha: 0, rotation: (i) => (i % 2 ? 3 : -3), duration: 1, ease: 'bounce.out', stagger: { each: .07, from: 'start' }, scrollTrigger: { trigger: g, start: 'top 78%' } });
  }

  /* ---------- Composeur kit atelier ---------- */
  function composeur() {
    const ul = $('#compo-tools'); if (!ul) return;
    const tools = D.composeur.map((id) => byId.get(id)).filter(Boolean);
    ul.innerHTML = tools.map((p) => `<li><label class="tool ${p.dispo ? '' : 'is-out'}"><input type="checkbox" value="${p.id}" ${p.dispo ? '' : 'disabled'} aria-describedby="t-${p.id}"><span class="tool__img"><img src="${src(p, 0, 480)}" alt="" loading="lazy"></span><span><span class="tool__name">${esc(p.nom)}</span><span class="tool__meta" id="t-${p.id}"><span class="mono">${euro(p.prix)}</span><span>${p.dispo ? 'En stock' : esc(p.dispoTexte)}</span></span></span></label></li>`).join('');
    const board = $('#peg'), total = $('#peg-total'), torque = $('#peg-torque'), add = $('#compo-add'), empty = $('.peg__empty');
    torque.insertAdjacentHTML('afterbegin', torqueSVG());
    const slots = [[.16, .14], [.40, .12], [.64, .16], [.86, .12], [.14, .48], [.38, .46], [.62, .50], [.86, .46], [.26, .78], [.52, .80], [.76, .78], [.10, .82], [.92, .80], [.50, .30]];
    const items = new Map();
    let shown = 0;
    const roll = (to) => {
      if (!G || calm) { total.textContent = euro(to); return; }
      const o = { v: shown }; G.to(o, { v: to, duration: .7, ease: 'power3.out', onUpdate: () => { total.textContent = euro(o.v); } }); shown = to;
    };
    function physics() {
      if (calm) return;
      let lastT = performance.now(), mx = -1, my = -1, pmx = -1;
      board.addEventListener('pointermove', (e) => { const r = board.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
      board.addEventListener('pointerleave', () => { mx = -1; });
      const step = (t) => {
        const dt = Math.min(.033, (t - lastT) / 1000); lastT = t;
        const vx = pmx < 0 || mx < 0 ? 0 : (mx - pmx) / Math.max(dt, .001); pmx = mx;
        items.forEach((it) => {
          if (mx >= 0) {
            const r = it.el.getBoundingClientRect(), b = board.getBoundingClientRect();
            const cx = r.left - b.left + r.width / 2, cy = r.top - b.top + r.height / 2;
            if (Math.abs(mx - cx) < r.width * .6 && Math.abs(my - cy) < r.height * .6) it.w += vx * .00045;
          }
          it.w += (-9.0 * Math.sin(it.a) - 1.6 * it.w) * dt;
          it.a += it.w * dt;
          it.el.style.transform = `rotate(${it.a * 57.3}deg)`;
        });
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    function update() {
      const ids = $$('input:checked', ul).map((i) => +i.value);
      ids.forEach((id, k) => {
        if (items.has(id)) return;
        const p = byId.get(id); const free = slots.find((s, si) => ![...items.values()].some((it) => it.slot === si));
        const si = slots.indexOf(free);
        const el = document.createElement('div'); el.className = 'peg__item'; el.style.left = (free[0] * 100 - 11) + '%'; el.style.top = (free[1] * 100) + '%';
        el.innerHTML = `<img src="${src(p, 0, 480)}" alt="">`; board.appendChild(el);
        const it = { el, slot: si, a: calm ? 0 : (Math.random() > .5 ? .7 : -.7), w: 0 };
        items.set(id, it);
        if (G && !calm) G.from(el, { y: -80, autoAlpha: 0, duration: .5, ease: 'back.out(2)' });
      });
      [...items.keys()].forEach((id) => { if (!ids.includes(id)) { const it = items.get(id); items.delete(id); if (G && !calm) G.to(it.el, { y: 60, autoAlpha: 0, duration: .35, onComplete: () => it.el.remove() }); else it.el.remove(); } });
      const sum = ids.reduce((s, id) => s + byId.get(id).prix, 0);
      roll(sum); setTorque(torque, sum);
      empty.hidden = ids.length > 0;
      add.disabled = !ids.length;
      add.querySelector('.btn__lbl').textContent = ids.length ? `Ajouter le kit (${ids.length} outil${ids.length > 1 ? 's' : ''}) au panier` : 'Choisissez des outils';
    }
    ul.addEventListener('change', update);
    add.addEventListener('click', () => {
      const ids = $$('input:checked', ul).map((i) => +i.value);
      ids.forEach((id, i) => setTimeout(() => addToCart(id, {}, 1, i === 0 ? items.get(id)?.el : null), i * 120));
    });
    total.textContent = euro(0); setTorque(torque, 0); update(); physics();
  }

  /* ---------- Protection ---------- */
  function protection() {
    const vid = $('.prot__video video');
    if (vid) {
      const btn = $('.vid-ctl');
      if (calm) { vid.removeAttribute('autoplay'); vid.pause(); }
      else { const io = new IntersectionObserver(([e]) => { e.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }, { threshold: .25 }); io.observe(vid); }
      btn?.addEventListener('click', () => { if (vid.paused) { vid.play(); btn.querySelector('.btn__lbl').textContent = 'Mettre en pause'; } else { vid.pause(); btn.querySelector('.btn__lbl').textContent = 'Lire la vidéo'; } });
      if (btn) btn.querySelector('.btn__lbl').textContent = calm ? 'Lire la vidéo' : 'Mettre en pause';
      if (G && !calm && desktop()) G.to('.prot__video', { clipPath: 'circle(75% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: '.prot__video', start: 'top 85%', end: 'center 50%', scrub: true } });
    }
    const genou = D.produits.filter((p) => p.type === 'Protections' && /^Genouillères/.test(p.nom) && !/enfant/.test(p.nom) && p.images[0]);
    const nu = $('#nuancier'), gc = $('#genou-card');
    const showG = (p) => {
      gc.innerHTML = `<div class="genou__img"><img src="${src(p, 0, 480)}" alt="${esc(p.nom)}"></div><div><a class="genou__name link-trace" href="${url(p)}">${esc(p.nom)}</a><div class="mono">${euro(p.prix)}</div><div class="muted" style="font-size:14px">${p.dispo ? 'En stock' : esc(p.dispoTexte)}</div></div>`;
      if (G && !calm) G.from($('.genou__img img', gc), { scale: .85, autoAlpha: 0, rotation: -6, duration: .5, ease: 'back.out(1.8)' });
    };
    nu.innerHTML = genou.map((p, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="${esc(p.nom)}"><img src="${src(p, 0, 480)}" alt=""></button>`).join('');
    $$('button', nu).forEach((b, i) => b.addEventListener('click', () => { $$('button', nu).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); showG(genou[i]); }));
    if (genou[0]) showG(genou.find((p) => p.dispo) || genou[0]);
    const row = $('#casques-row');
    const kids = [174, 176, 177, 178, 179, 180].map((id) => byId.get(id)).filter(Boolean);
    row.innerHTML = kids.map((p) => `<a class="casque" href="${url(p)}"><img src="${src(p, 0, 480)}" alt="${esc(p.nom)}" loading="lazy"><span>${esc(p.nom.replace('Casque enfant ', ''))}</span></a>`).join('');
    if (!G || calm) return;
    G.from($$('.casque img', row), { y: -160, rotation: (i) => (i % 2 ? 25 : -25), autoAlpha: 0, duration: 1.2, ease: 'bounce.out', stagger: .09, scrollTrigger: { trigger: row, start: 'top 80%' } });
    $$('.casque', row).forEach((a) => a.addEventListener('pointerenter', () => G.fromTo($('img', a), { rotation: 0 }, { keyframes: { rotation: [-8, 7, -4, 2, 0] }, duration: .7, ease: 'power1.out' })));
    G.from('.prot__award', { x: -40, autoAlpha: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.prot__award', start: 'top 88%' } });
    G.to('.prot .grok', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.prot', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Atelier : cassette horaire, horaires, rendez-vous ---------- */
  function atelier() {
    const st = openState();
    $$('[data-statut]').forEach((s) => { s.classList.toggle('is-open', st.open); $('span', s).textContent = st.label; });
    const tb = $('#horaires tbody');
    const names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const order = [1, 2, 3, 4, 5, 6, 0];
    tb.innerHTML = order.map((d, i) => `<tr class="${d === st.now.day ? 'is-today' : ''}"><th scope="row">${names[i]}${d === st.now.day ? ' (aujourd\'hui)' : ''}</th><td>${HOURS[d].length ? HOURS[d].map(([a, b]) => `${a}h – ${b}h`).join(' / ') : 'Fermé'}</td></tr>`).join('');
    const box = $('#cassette');
    const cx = 250, cy = 250, H0 = 8, H1 = 19, A0 = 140, A1 = 400;
    const ang = (h) => (A0 + (h - H0) / (H1 - H0) * (A1 - A0)) * Math.PI / 180;
    const pt = (r, a) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    const arcP = (r, a0, a1) => `M${pt(r, a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${pt(r, a1)}`;
    const nowH = st.now.h + st.now.m / 60;
    let s = '';
    order.forEach((d, i) => {
      const R = 222 - i * 25; const today = d === st.now.day;
      s += `<path class="track ${today ? 'today' : ''}" d="${arcP(R, ang(H0), ang(H1))}"/>`;
      for (let k = 0; k < (H1 - H0) * 2; k++) {
        const h = H0 + k / 2; const on = HOURS[d].some(([a, b2]) => h >= a && h < b2);
        const a0 = ang(h) + .012, a1 = ang(h + .5) - .03;
        s += `<path class="tooth ${on ? 'on' : ''} ${today ? 'today' : ''}" d="${arcP(R, a0, a1)}"/>`;
      }
      const lp = [cx + Math.cos(ang(H0)) * R, cy + Math.sin(ang(H0)) * R];
      s += `<text class="lbl-day ${today ? 'today' : ''}" x="${(lp[0] - 12).toFixed(1)}" y="${(lp[1] + 18).toFixed(1)}" text-anchor="end">${names[i].slice(0, 3)}.</text>`;
    });
    [8, 12, 14, 18].forEach((h) => { s += `<text x="${pt(250, ang(h)).split(' ')[0]}" y="${(+pt(250, ang(h)).split(' ')[1] + 4).toFixed(1)}" text-anchor="middle">${h}h</text>`; });
    if (nowH >= H0 && nowH <= H1) s += `<line class="now-line" x1="${pt(60, ang(nowH)).split(' ')[0]}" y1="${pt(60, ang(nowH)).split(' ')[1]}" x2="${pt(236, ang(nowH)).split(' ')[0]}" y2="${pt(236, ang(nowH)).split(' ')[1]}"/>`;
    box.innerHTML = `<svg viewBox="-20 -10 540 470" role="img" aria-label="Horaires d'ouverture dessinés comme une cassette : un pignon par jour, une dent par demi-heure ouverte, de 8 h à 19 h">${s}<circle cx="${cx}" cy="${cy}" r="44" fill="#15171a"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" style="fill:#fff;font-size:13px">${st.open ? 'ouvert' : 'fermé'}</text></svg>`;
    if (G && !calm) {
      G.from($$('.track', box), { drawSVG: '0%', duration: 1.2, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: box, start: 'top 80%' } });
      G.from($$('.tooth.on', box), { autoAlpha: 0, duration: .02, stagger: .006, scrollTrigger: { trigger: box, start: 'top 75%' } });
      G.to('.atelier__photo--a', { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.atelier__photos', start: 'top 75%' } });
      G.to('.atelier__photo--b', { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.out', delay: .2, scrollTrigger: { trigger: '.atelier__photos', start: 'top 75%' } });
      G.fromTo('.atelier__photo--a img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.atelier__photos', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    // Rendez-vous simulé : créneaux pris dans les vraies heures d'ouverture
    const f = $('#rdv'); if (!f) return;
    const daySel = $('#rdv-jour'), slotBox = $('#rdv-creneaux');
    const opts = []; const base = new Date();
    for (let i = 1; opts.length < 8 && i < 20; i++) {
      const dt = new Date(base.getTime() + i * 864e5); const wd = parisNow(dt).day;
      if (HOURS[wd].length) opts.push({ wd, label: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(dt), iso: dt.toISOString().slice(0, 10) });
    }
    daySel.innerHTML = opts.map((o) => `<option value="${o.iso}" data-wd="${o.wd}">${o.label[0].toUpperCase() + o.label.slice(1)}</option>`).join('');
    const fillSlots = () => {
      const wd = +daySel.selectedOptions[0].dataset.wd;
      const sl = []; HOURS[wd].forEach(([a, b]) => { for (let h = a; h < b; h++) sl.push(`${h}h00`, `${h}h30`); });
      slotBox.innerHTML = sl.map((x, i) => `<label><input type="radio" name="creneau" value="${x}" ${i === 0 ? 'checked' : ''}><span>${x}</span></label>`).join('');
    };
    daySel.addEventListener('change', fillSlots); fillSlots();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const tel = $('#rdv-tel'); const fld = tel.closest('.field'); const ok = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/.test(tel.value.trim());
      fld.classList.toggle('is-err', !ok); $('.err', fld).hidden = ok;
      if (!ok) { tel.focus(); return; }
      const fd = new FormData(f); const out = $('.confirm', f);
      out.hidden = false;
      out.innerHTML = `<b>Demande simulée enregistrée.</b> ${esc(fd.get('velo'))}, ${esc(daySel.selectedOptions[0].textContent.toLowerCase())} à ${esc(fd.get('creneau'))}. Rien n'a été envoyé : pour un vrai rendez-vous, appelez le <a href="tel:+33296294626">02 96 29 46 26</a>.`;
    });
  }

  /* ---------- Revendeurs : formulaire en 3 maillons ---------- */
  function revendeurs() {
    const f = $('#pro-form'); if (!f) return;
    const steps = $$('.step', f), links = $$('.chaine__link'), labels = $$('.chaine__step');
    let cur = 0;
    const show = (i) => {
      cur = i; steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      labels.forEach((l, k) => l.classList.toggle('is-on', k <= i));
      links.forEach((l, k) => {
        const on = k < i; const was = l.classList.contains('is-on'); l.classList.toggle('is-on', on);
        if (on && !was && G && !calm) G.fromTo($$('.pin', l), { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: .5, ease: 'back.out(3)', stagger: .1 });
      });
      $('[data-prev]', f).hidden = i === 0; $('[data-next]', f).hidden = i === steps.length - 1; $('[data-send]', f).hidden = i !== steps.length - 1;
      $('input, select', steps[i])?.focus({ preventScroll: true });
    };
    const valid = (i) => {
      let ok = true;
      $$('[required]', steps[i]).forEach((inp) => {
        let good = inp.type === 'file' ? true : inp.checkValidity() && inp.value.trim() !== '';
        if (inp.name === 'siret') good = /^\d{14}$/.test(inp.value.replace(/\s/g, ''));
        const fld = inp.closest('.field'); fld?.classList.toggle('is-err', !good); const er = fld && $('.err', fld); if (er) er.hidden = good;
        if (!good && ok) { inp.focus(); ok = false; }
      });
      return ok;
    };
    $('[data-next]', f).addEventListener('click', () => { if (valid(cur)) show(cur + 1); });
    $('[data-prev]', f).addEventListener('click', () => show(cur - 1));
    $$('.drop input', f).forEach((inp) => inp.addEventListener('change', () => { const d = inp.closest('.drop'); d.classList.toggle('is-ok', !!inp.files.length); $('b', d).textContent = inp.files.length ? inp.files[0].name : $('b', d).dataset.def; }));
    f.addEventListener('submit', (e) => {
      e.preventDefault(); if (!valid(cur)) return;
      const out = $('.confirm', f); out.hidden = false;
      out.innerHTML = `<b>Demande simulée prête.</b> Dans la vraie démarche, créez votre compte sur la boutique puis envoyez le Kbis et le RIB à <a href="mailto:contact@winsbike.fr">contact@winsbike.fr</a> pour passer au tarif professionnel. Aucun fichier n'a été envoyé.`;
    });
    show(0);
  }

  /* ---------- Carte de France schématique ---------- */
  function carte() {
    const box = $('#carte-fr'); if (!box) return;
    const FR = [[2.37, 51.05], [1.85, 50.95], [1.6, 50.72], [1.55, 50.2], [1.08, 49.93], [0.37, 49.76], [0.1, 49.49], [-0.35, 49.3], [-1.26, 49.67], [-1.62, 49.65], [-1.94, 49.72], [-1.6, 48.84], [-1.51, 48.64], [-2.02, 48.65], [-2.77, 48.53], [-3.05, 48.78], [-3.45, 48.82], [-3.98, 48.73], [-4.77, 48.33], [-4.55, 48.2], [-4.73, 48.04], [-4.37, 47.8], [-3.37, 47.73], [-3.12, 47.48], [-2.2, 47.27], [-2.25, 47.0], [-1.78, 46.5], [-1.15, 46.16], [-1.03, 45.62], [-1.2, 44.66], [-1.56, 43.48], [-1.78, 43.37], [-0.73, 42.95], [0.65, 42.7], [1.5, 42.5], [3.17, 42.44], [3.05, 42.9], [3.47, 43.28], [3.9, 43.52], [4.6, 43.4], [5.37, 43.3], [5.93, 43.1], [6.64, 43.27], [7.27, 43.7], [7.5, 43.78], [7.0, 44.2], [6.9, 44.7], [7.0, 45.25], [6.86, 45.83], [6.1, 46.15], [6.1, 46.6], [6.9, 47.4], [7.58, 47.58], [7.8, 48.6], [8.2, 48.97], [6.4, 49.47], [5.8, 49.55], [4.85, 50.15], [4.15, 49.98], [3.6, 50.45], [2.6, 50.8]];
    const CO = [[9.35, 43.0], [9.55, 42.6], [9.4, 41.9], [9.2, 41.4], [8.8, 41.6], [8.6, 42.2], [8.7, 42.6], [9.0, 42.8]];
    const k = Math.cos(46.5 * Math.PI / 180);
    const P = ([lo, la]) => [((lo + 5.2) * k * 60).toFixed(1), ((51.4 - la) * 60).toFixed(1)];
    const path = (pts) => 'M' + pts.map(P).join(' L') + ' Z';
    const home = P([-3.316, 48.235]);
    const dests = [[2.35, 48.86], [4.83, 45.76], [5.37, 43.3], [-0.58, 44.84], [7.75, 48.58], [3.06, 50.63], [1.44, 43.6], [-1.55, 47.22]].map(P);
    const arcs = dests.map(([x, y]) => { const mx = (+home[0] + +x) / 2, my = Math.min(+home[1], +y) - 70; return `<path class="arc" d="M${home[0]} ${home[1]} Q${mx} ${my} ${x} ${y}"/>`; }).join('');
    box.innerHTML = `<svg viewBox="0 0 640 600" role="img" aria-label="Carte schématique de la France avec Rostrenen, point de départ des colis"><defs><linearGradient id="gArc" x1="0" x2="1"><stop offset="0" stop-color="#4d74ff"/><stop offset="1" stop-color="#8a4dff"/></linearGradient></defs>
      <path class="pays" d="${path(FR)}"/><path class="pays" d="${path(CO)}"/>${arcs}${dests.map(([x, y]) => `<circle class="dest" cx="${x}" cy="${y}" r="3.5"/>`).join('')}
      <circle class="pin-ring" cx="${home[0]}" cy="${home[1]}" r="12"/><circle class="pin" cx="${home[0]}" cy="${home[1]}" r="6"/><text x="${+home[0] + 18}" y="${+home[1] - 14}">Rostrenen</text></svg>`;
    if (G && !calm) {
      G.from($$('.arc', box), { drawSVG: '0%', duration: 1.4, ease: 'power2.inOut', stagger: .12, scrollTrigger: { trigger: box, start: 'top 75%' } });
      G.from($$('.dest', box), { scale: 0, transformOrigin: 'center', duration: .4, stagger: .12, delay: 1, ease: 'back.out(3)', scrollTrigger: { trigger: box, start: 'top 75%' } });
      G.to($('.pin-ring', box), { attr: { r: 26 }, opacity: 0, duration: 1.8, repeat: -1, ease: 'power2.out' });
    }
  }

  /* ---------- Démarrage ---------- */
  function start() {
    const intro = hero();
    bandeau(); marques(); beast(); populaires(); composeur(); protection(); atelier(); revendeurs(); carte();
    window.WB.splitReveal();
    if (G && !calm) {
      G.from('.livr .fait', { y: 30, autoAlpha: 0, duration: .7, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.faits', start: 'top 80%' } });
      G.from('.ftr__big img', { yPercent: 40, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ftr__big', start: 'top 92%' } });
      setTimeout(() => ST.refresh(), 400);
    }
    opening(() => intro && intro());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
