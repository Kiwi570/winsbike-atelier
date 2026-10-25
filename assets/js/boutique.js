/* Boutique : filtres, recherche, tri, module saisonnier */
(function () {
  const { D, $, $$, euro, byId, brand, card, SW, SW_NAME, isCalm, scrollLock } = window.WB;
  const calm = isCalm(); const G = window.gsap;
  if (G && window.Flip) G.registerPlugin(Flip);
  const all = D.produits.slice();
  const maxPrice = Math.ceil(Math.max(...all.map((p) => p.prix)) / 10) * 10;
  const params = new URLSearchParams(location.search);
  const st = {
    marque: new Set((params.get('marque') || '').split(',').filter(Boolean)),
    type: new Set((params.get('type') || '').split(',').filter(Boolean)),
    couleur: new Set((params.get('couleur') || '').split(',').filter(Boolean)),
    q: params.get('q') || '', dispo: params.get('dispo') === '1', max: +(params.get('max') || maxPrice), tri: params.get('tri') || 'pertinence',
  };
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const types = [...new Set(all.map((p) => p.type))].sort((a, b) => a.localeCompare(b, 'fr'));
  const colorKeys = Object.keys(SW).filter((c) => all.some((p) => p.couleurs.includes(c)));

  function match(p, skip) {
    if (skip !== 'marque' && st.marque.size && !st.marque.has(p.marque)) return false;
    if (skip !== 'type' && st.type.size && !st.type.has(p.type)) return false;
    if (skip !== 'couleur' && st.couleur.size && !p.couleurs.some((c) => st.couleur.has(c))) return false;
    if (st.dispo && !p.dispo) return false;
    if (p.prix > st.max) return false;
    if (st.q) { const h = norm(`${p.nom} ${p.nomSite} ${brand(p.marque).nom} ${p.type} ${p.ref} ${p.points.join(' ')}`); if (!norm(st.q).split(/\s+/).every((w) => h.includes(w))) return false; }
    return true;
  }
  function sorted(list) {
    const l = list.slice();
    if (st.tri === 'prix-asc') l.sort((a, b) => a.prix - b.prix);
    else if (st.tri === 'prix-desc') l.sort((a, b) => b.prix - a.prix);
    else if (st.tri === 'nom') l.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    else l.sort((a, b) => (b.dispo - a.dispo) || (D.populaires.includes(b.id) - D.populaires.includes(a.id)));
    return l;
  }
  function renderFilters() {
    const cnt = (k, v) => all.filter((p) => match(p, k) && (k === 'marque' ? p.marque === v : k === 'type' ? p.type === v : p.couleurs.includes(v))).length;
    $('#f-marques').innerHTML = D.marques.map((b) => `<li><label class="fopt"><input type="checkbox" name="marque" value="${b.key}" ${st.marque.has(b.key) ? 'checked' : ''}>${b.nom}<span class="n">${cnt('marque', b.key)}</span></label></li>`).join('');
    $('#f-types').innerHTML = types.map((t) => `<li><label class="fopt"><input type="checkbox" name="type" value="${t}" ${st.type.has(t) ? 'checked' : ''}>${t}<span class="n">${cnt('type', t)}</span></label></li>`).join('');
    $('#f-couleurs').innerHTML = colorKeys.map((c) => `<label title="${SW_NAME[c]} (${cnt('couleur', c)})"><input type="checkbox" name="couleur" value="${c}" ${st.couleur.has(c) ? 'checked' : ''} aria-label="${SW_NAME[c]}, ${cnt('couleur', c)} produits"><span class="sw" style="--c:${SW[c]}" data-c="${c}"></span></label>`).join('');
    const r = $('#f-prix'); r.max = maxPrice; r.value = st.max; $('#f-prix-v').textContent = st.max >= maxPrice ? 'Tous les prix' : `jusqu'à ${euro(st.max)}`;
    $('#f-dispo').checked = st.dispo;
    $('#q').value = st.q; $('#tri').value = st.tri;
  }
  function chips() {
    const c = [];
    st.marque.forEach((v) => c.push(['marque', v, brand(v).nom]));
    st.type.forEach((v) => c.push(['type', v, v]));
    st.couleur.forEach((v) => c.push(['couleur', v, SW_NAME[v]]));
    if (st.dispo) c.push(['dispo', '1', 'En stock']);
    if (st.max < maxPrice) c.push(['max', '', `Jusqu'à ${euro(st.max)}`]);
    if (st.q) c.push(['q', '', `« ${st.q} »`]);
    $('#chips').innerHTML = c.map(([k, v, l]) => `<button class="chip" type="button" data-k="${k}" data-v="${v}" aria-label="Retirer le filtre ${l}">${l}<svg viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6"/></svg></button>`).join('') + (c.length > 1 ? '<button class="chip" type="button" data-k="tout">Tout effacer</button>' : '');
    const nb = st.marque.size + st.type.size + st.couleur.size + (st.dispo ? 1 : 0) + (st.max < maxPrice ? 1 : 0);
    $$('[data-fcount]').forEach((b) => { b.textContent = nb; b.hidden = !nb; });
    return c.length;
  }
  function syncURL() {
    const p = new URLSearchParams();
    if (st.marque.size) p.set('marque', [...st.marque].join(','));
    if (st.type.size) p.set('type', [...st.type].join(','));
    if (st.couleur.size) p.set('couleur', [...st.couleur].join(','));
    if (st.q) p.set('q', st.q); if (st.dispo) p.set('dispo', '1'); if (st.max < maxPrice) p.set('max', st.max); if (st.tri !== 'pertinence') p.set('tri', st.tri);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }
  let first = true;
  function render() {
    const ae = document.activeElement; const fk = ae && ae.name ? `${ae.name}|${ae.value}` : ae && ae.id;
    const grid = $('#grid');
    const list = sorted(all.filter((p) => match(p)));
    const state = (!first && G && window.Flip && !calm) ? Flip.getState($$('.pc', grid)) : null;
    const prev = new Map($$('.pc', grid).map((el) => [+el.dataset.id, el]));
    const nodes = list.map((p) => prev.get(p.id) || Object.assign(document.createElement('div'), { innerHTML: card(p) }).firstElementChild);
    grid.replaceChildren(...nodes);
    $('#count').textContent = list.length;
    $('#count-l').textContent = list.length > 1 ? 'produits' : 'produit';
    $('#empty').hidden = list.length > 0;
    const n = chips();
    $('#saison').hidden = n > 0;
    renderFilters(); syncURL();
    if (fk && fk.includes('|')) { const [n, v] = fk.split('|'); const el = $$(`.filters input[name="${n}"]`).find((i) => i.value === v); el?.focus({ preventScroll: true }); }
    else if (fk === 'f-dispo') $('#f-dispo').focus({ preventScroll: true });
    if (state) Flip.from(state, { duration: .6, ease: 'power3.inOut', absolute: true, stagger: .01, onEnter: (els) => G.fromTo(els, { autoAlpha: 0, scale: .9 }, { autoAlpha: 1, scale: 1, duration: .5 }), onLeave: (els) => G.to(els, { autoAlpha: 0, scale: .9, duration: .35 }) });
    else if (first && G && !calm) G.from(nodes.slice(0, 12), { autoAlpha: 0, y: 40, clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.out', stagger: .04, delay: .3 });
    first = false;
  }
  function saison() {
    const s = D.saison; const box = $('#saison');
    $('#saison-t').textContent = s.titre; $('#saison-p').textContent = s.texte;
    $('#saison-row').innerHTML = s.ids.map((id) => byId.get(id)).filter(Boolean).map((p) => card(p)).join('');
  }
  function bind() {
    const f = $('.filters');
    f.addEventListener('change', (e) => {
      const t = e.target;
      if (['marque', 'type', 'couleur'].includes(t.name)) { t.checked ? st[t.name].add(t.value) : st[t.name].delete(t.value); render(); }
      if (t.id === 'f-dispo') { st.dispo = t.checked; render(); }
    });
    $('#f-prix').addEventListener('input', (e) => { st.max = +e.target.value; $('#f-prix-v').textContent = st.max >= maxPrice ? 'Tous les prix' : `jusqu'à ${euro(st.max)}`; });
    $('#f-prix').addEventListener('change', render);
    let tq; $('#q').addEventListener('input', (e) => { clearTimeout(tq); tq = setTimeout(() => { st.q = e.target.value.trim(); render(); }, 220); });
    $('#q').closest('form').addEventListener('submit', (e) => { e.preventDefault(); st.q = $('#q').value.trim(); render(); });
    $('#tri').addEventListener('change', (e) => { st.tri = e.target.value; render(); });
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k;
      if (k === 'tout') { st.marque.clear(); st.type.clear(); st.couleur.clear(); st.dispo = false; st.max = maxPrice; st.q = ''; }
      else if (k === 'dispo') st.dispo = false; else if (k === 'max') st.max = maxPrice; else if (k === 'q') st.q = ''; else st[k].delete(b.dataset.v);
      render();
    });
    $('#empty-reset').addEventListener('click', () => { st.marque.clear(); st.type.clear(); st.couleur.clear(); st.dispo = false; st.max = maxPrice; st.q = ''; render(); });
    const open = (v) => { f.classList.toggle('is-open', v); $('[data-filters]').setAttribute('aria-expanded', String(v)); scrollLock(v); if (v) $('input', f)?.focus(); };
    $('[data-filters]').addEventListener('click', () => open(!f.classList.contains('is-open')));
    $$('[data-filters-close]').forEach((b) => b.addEventListener('click', () => open(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && f.classList.contains('is-open')) open(false); });
  }
  function headerFx() {
    const box = $('#bq-metal'); if (box && window.WBMetal) WBMetal.create(box, { tint: st.couleur.size === 1 ? [...st.couleur][0] : 'oil', focusX: .8, dpr: 1 });
    if (!G || calm) return;
    const s = SplitText.create('.bq-hero h1', { type: 'chars' });
    G.from(s.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .03 });
    $('.bq-hero h1').style.overflow = 'hidden';
  }
  function start() { saison(); renderFilters(); bind(); render(); headerFx(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
