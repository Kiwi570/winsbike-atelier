/* Fiche produit (toutes les fiches à partir des données ; la vitrine est le cadre Beast) */
(function () {
  const { D, $, $$, euro, byId, bySlug, brand, src, srcset, url, esc, card, SW, ICONS, isCalm, addToCart, optsMarkup, readOpts, FREE } = window.WB;
  const calm = isCalm(); const G = window.gsap;
  const slug = new URLSearchParams(location.search).get('p') || 'cadre-beast-27-5';
  const p = bySlug.get(slug) || bySlug.get('cadre-beast-27-5');
  const b = brand(p.marque);
  const colorKey = (o) => o.toLowerCase().split(' / ').map((x) => ({ 'bleu ciel': 'bleu-ciel', 'bleu clair': 'bleu-ciel' }[x] || x)).find((x) => SW[x]);

  function geometry() {
    const g = { tet: 580, cs: 435, wb: 1124, fc: 692, ha: 66, sa: 73 };
    const X = (x) => ((x + 800) * 0.5).toFixed(1), Y = (y) => ((760 - y) * 0.5).toFixed(1);
    const ra = [-435, 0], fa = [692, 0], bb = [0, 0];
    const sTop = [-0.292 * 585, 0.956 * 585], hTop = [-183 + 580, 600], hBot = [397 + 110 * Math.cos(g.ha * Math.PI / 180), 600 - 110 * Math.sin(g.ha * Math.PI / 180)];
    const seatCl = [-0.292 * 530, 0.956 * 530];
    const L = (a, b2, c = 'tube') => `<line class="${c}" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b2[0])}" y2="${Y(b2[1])}"/>`;
    const arc = (c, r, a0, a1) => { const p0 = [c[0] + r * Math.cos(a0 * Math.PI / 180), c[1] + r * Math.sin(a0 * Math.PI / 180)], p1 = [c[0] + r * Math.cos(a1 * Math.PI / 180), c[1] + r * Math.sin(a1 * Math.PI / 180)]; return `<path class="cote" d="M${X(p0[0])} ${Y(p0[1])} A${r * .5} ${r * .5} 0 0 0 ${X(p1[0])} ${Y(p1[1])}"/>`; };
    const T = (x, y, t, anchor = 'middle') => `<text x="${X(x)}" y="${Y(y)}" text-anchor="${anchor}">${t}</text>`;
    return `<svg viewBox="0 0 950 500" role="img" aria-label="Schéma de géométrie du cadre : angle de direction ${g.ha} degrés, angle de selle ${g.sa} degrés, tube supérieur effectif ${g.tet} millimètres, longueur de base ${g.cs} millimètres, empattement ${g.wb} millimètres, centre avant ${g.fc} millimètres">
      <circle class="ext" cx="${X(ra[0])}" cy="${Y(0)}" r="170"/><circle class="ext" cx="${X(fa[0])}" cy="${Y(0)}" r="170"/>
      ${L(bb, ra)}${L(ra, seatCl)}${L(bb, sTop)}${L(seatCl, hTop)}${L(bb, hBot)}${L(hTop, hBot)}${L(hBot, fa)}
      ${L([sTop[0] - 10, 660], [hTop[0], 660], 'cote')}${T((sTop[0] + hTop[0]) / 2, 680, `tube supérieur effectif ${g.tet} mm`)}
      ${L([-183, 600], [-183, 660], 'ext')}${L([hTop[0], 600], [hTop[0], 660], 'ext')}
      ${L(ra, [ra[0], -70], 'ext')}${L(bb, [0, -70], 'ext')}${L(fa, [fa[0], -150], 'ext')}
      ${L([ra[0], -60], [0, -60], 'cote')}${T(-217, -45, `base ${g.cs}`)}${L([0, -60], [fa[0], -60], 'cote')}${T(346, -45, `centre avant ${g.fc}`)}
      ${L([ra[0], -140], [fa[0], -140], 'cote')}${T(128, -125, `empattement ${g.wb} mm`)}
      ${L([hBot[0], hBot[1]], [hBot[0] - 160, hBot[1]], 'ext')}${arc(hBot, 70, 180, 114)}${T(hBot[0] - 90, hBot[1] + 30, `${g.ha}°`)}
      ${L(bb, [-170, 0], 'ext')}${arc(bb, 90, 180, 107)}${T(-120, 40, `${g.sa}°`)}
    </svg><p class="illustratif" style="margin-top:8px">Schéma indicatif tracé à partir des cotes du site ; la chute de boîtier n'étant pas indiquée, les axes sont dessinés à sa hauteur.</p>`;
  }

  function render() {
    document.title = `${p.nom} ${b.nom} : ${euro(p.prix)} | Winsbike`;
    $('meta[name="description"]')?.setAttribute('content', `${p.nom} ${b.nom}, ${euro(p.prix)} TTC. ${p.points.slice(0, 2).join(' ')}`.slice(0, 160));
    $('#crumbs').innerHTML = `<a href="boutique.html">Boutique</a><span aria-hidden="true">/</span><a href="boutique.html?marque=${p.marque}">${esc(b.nom)}</a><span aria-hidden="true">/</span><a href="boutique.html?type=${encodeURIComponent(p.type)}">${esc(p.type)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.nom)}</span>`;
    const imgs = p.images;
    const stageImg = (i) => { const im = imgs[i]; const m = $('#fp-main'); m.classList.toggle('is-photo', im.k === 'photo'); m.innerHTML = `<img src="${src(p, i, 960)}" srcset="${srcset(p, i)}" sizes="(max-width: 960px) 100vw, 55vw" alt="${esc(p.nom)}, vue ${i + 1}">`; $('#loupe').style.backgroundImage = `url(${src(p, i, 1600)})`; };
    $('#thumbs').innerHTML = imgs.map((im, i) => `<button type="button" aria-current="${i === 0}" aria-label="Vue ${i + 1}"><img src="${src(p, i, 480)}" alt=""></button>`).join('');
    $('#thumbs').hidden = imgs.length < 2;
    $$('#thumbs button').forEach((t, i) => t.addEventListener('click', () => { $$('#thumbs button').forEach((x) => x.setAttribute('aria-current', String(x === t))); stageImg(i); if (G && !calm) G.from('#fp-main img', { autoAlpha: 0, scale: .94, duration: .5, ease: 'power3.out' }); }));
    stageImg(0);
    const logo = b.mono ? `${b.logo}-mono-400.webp` : `${b.logo}-400.webp`;
    $('#fp-brand').innerHTML = `<img src="assets/img/m/${logo}" alt="${esc(b.nom)}" ${b.mono ? '' : 'style="background:#e4e7ea;padding:4px 8px;border-radius:6px"'}><a class="link-trace muted" href="boutique.html?marque=${p.marque}">Tous les produits ${esc(b.nom)}</a>`;
    $('#fp-name').textContent = p.nom;
    $('#fp-ttc').textContent = euro(p.prix);
    $('#fp-ht').textContent = `${euro(p.ht)} HT`;
    $('#fp-meta').innerHTML = `${p.ref ? `<span>Référence <span class="mono">${esc(p.ref)}</span></span>` : ''}<span class="pc__stock ${p.dispo ? '' : 'is-out'}">${esc(p.dispoTexte)}</span><span>${esc(p.type)}</span>`;
    $('#fp-opts').innerHTML = p.variantes.length ? optsMarkup(p, 'fp') : '';
    const add = $('#fp-add');
    if (!p.dispo) { add.disabled = true; add.querySelector('.btn__lbl').textContent = p.dispoTexte; $('#bb-add').disabled = true; $('#bb-add .btn__lbl').textContent = p.dispoTexte; }
    const doAdd = (from) => addToCart(p.id, readOpts(p, $('#fp-opts'), 'fp'), 1, from || $('#fp-main img'));
    add.addEventListener('click', () => doAdd());
    $('#bb-add').addEventListener('click', () => doAdd());
    $('#bb-price').textContent = euro(p.prix); $('#bb-name').textContent = p.nom;
    $('#fp-ship').innerHTML = `${ICONS.truck}<span>${p.prix >= FREE ? 'Livraison offerte : ce produit dépasse 75 € TTC.' : `Livraison offerte dès 75 € TTC, il manque ${euro(FREE - p.prix)}.`} Expédition sous 2 à 8 jours.</span>`;
    if (p.note) $('#fp-note').innerHTML = `<span class="note-a-completer">À corriger sur le site : ${esc(p.note)}</span>`;
    const sec = [];
    const specKeys = new Set(p.specs.map(([k]) => k.toLowerCase()));
    const pts = p.specs.length > 1 ? p.points.filter((x) => !specKeys.has(x.split(/\s*[:=–]\s+/)[0].trim().toLowerCase())) : p.points;
    if (pts.length) sec.push(`<section class="fp__sec"><h2>En bref</h2><ul class="fp__pts">${pts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`);
    if (p.normes.length || ['Casques', 'Protections'].includes(p.type)) sec.push(`<section class="fp__sec"><h2>Normes</h2><div class="normes">${p.normes.map((n) => `<span class="norme">${ICONS.shield}${esc(n)}${n.includes('1621') ? ', selon la marque' : ', indiqué sur la fiche'}</span>`).join('') || '<span class="note-a-completer">Norme à compléter</span>'}</div><p class="muted" style="font-size:14px;margin-top:10px">Équipement de protection individuelle soumis au règlement (UE) 2016/425 et au marquage CE.${p.type === 'Casques' && /enfant/i.test(p.nom) ? ' Le casque est obligatoire à vélo pour les moins de 12 ans, conducteurs ou passagers, depuis le 22 mars 2017.' : ''}</p></section>`);
    if ([67, 68].includes(p.id)) sec.push(`<section class="fp__sec"><h2>Géométrie</h2><div class="geo" id="geo">${geometry()}</div></section>`);
    if (p.specs.length > 1) sec.push(`<section class="fp__sec"><h2>Caractéristiques</h2><table class="specs"><tbody>${p.specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></section>`);
    if (p.texte.length) sec.push(`<section class="fp__sec"><h2>Description</h2>${p.texte.map((x) => `<p class="muted">${esc(x)}</p>`).join('')}</section>`);
    if (p.compat.length) sec.push(`<section class="fp__sec"><h2>Pour le monter</h2><div class="compat">${p.compat.map(([id, why]) => { const q = byId.get(id); return q ? `<a href="${url(q)}"><img src="${src(q, 0, 480)}" alt=""><span><b>${esc(q.nom)}</b><span>${esc(why)}</span></span><span class="mono">${euro(q.prix)}</span></a>` : ''; }).join('')}</div><p class="illustratif" style="margin-top:8px">Rapprochements tirés des caractéristiques publiées ; à confirmer par l'atelier avant achat.</p></section>`);
    $('#fp-secs').innerHTML = sec.join('');
    const rel = D.produits.filter((q) => q.marque === p.marque && q.id !== p.id).sort((a, c) => (c.dispo - a.dispo)).slice(0, 8);
    $('#related-t').textContent = `Autres produits ${b.nom}`;
    $('#related').innerHTML = rel.map((q) => card(q)).join('');
    // couleur choisie : le métal prend la teinte
    let metal = null; const box = $('#fp-metal');
    if (box && window.WBMetal) metal = WBMetal.create(box, { tint: p.couleurs[0] && ['oil', 'rouge', 'bleu', 'violet', 'or', 'vert', 'orange', 'noir'].includes(p.couleurs[0]) ? p.couleurs[0] : 'alu', focusX: .5, dpr: 1 });
    $('#fp-opts').addEventListener('change', (e) => { if (e.target.closest('fieldset')?.querySelector('legend')?.textContent === 'Couleur') { const k = colorKey(e.target.value); if (k && metal) metal.setTint(['rouge', 'bleu', 'violet', 'or', 'vert', 'orange', 'noir'].includes(k) ? k : 'alu'); } });
  }
  function loupe() {
    const st = $('#fp-stage'), lp = $('#loupe');
    if (!window.matchMedia('(hover: hover)').matches) return;
    st.addEventListener('pointermove', (e) => {
      const img = $('#fp-main img'); if (!img) return; const r = img.getBoundingClientRect(); const sr = st.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { st.classList.remove('is-zoom'); return; }
      st.classList.add('is-zoom'); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; const z = 2.6;
      lp.style.left = `${e.clientX - sr.left - 95}px`; lp.style.top = `${e.clientY - sr.top - 95}px`;
      lp.style.backgroundSize = `${r.width * z}px ${r.height * z}px`; lp.style.backgroundPosition = `${-(px * r.width * z - 95)}px ${-(py * r.height * z - 95)}px`;
    });
    st.addEventListener('pointerleave', () => st.classList.remove('is-zoom'));
  }
  function fx() {
    const bar = $('.buybar'); const add = $('#fp-add');
    new IntersectionObserver(([e]) => bar.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(add);
    // la barre s'efface dès que la lettre d'information ou le pied de page entre dans l'écran
    const seen = new Set();
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))); bar.classList.toggle('is-off', seen.size > 0); });
    $$('.nl, .ftr').forEach((el) => io.observe(el));
    const setH = () => document.documentElement.style.setProperty('--barres-h', `${bar.offsetHeight}px`);
    if (window.ResizeObserver) new ResizeObserver(setH).observe(bar); setH();
    if (!G || calm) return;
    G.from(['#fp-brand', '#fp-name', '.fp__price', '#fp-meta', '#fp-opts', '.fp__buy'], { autoAlpha: 0, y: 26, duration: .8, ease: 'power3.out', stagger: .06 });
    G.from('#fp-main img', { autoAlpha: 0, scale: .85, rotation: -4, duration: 1.3, ease: 'expo.out' });
    const geo = $('#geo');
    if (geo && window.DrawSVGPlugin) { G.registerPlugin(DrawSVGPlugin); G.from($$('line, path, circle', geo), { drawSVG: '0%', duration: 1.2, ease: 'power2.inOut', stagger: .05, scrollTrigger: { trigger: geo, start: 'top 80%' } }); G.from($$('text', geo), { autoAlpha: 0, duration: .5, stagger: .05, delay: .8, scrollTrigger: { trigger: geo, start: 'top 80%' } }); }
    G.from($$('.fp__sec'), { autoAlpha: 0, y: 30, duration: .7, ease: 'power3.out', stagger: .05, scrollTrigger: { trigger: '#fp-secs', start: 'top 85%' } });
  }
  function start() { render(); loupe(); fx(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
