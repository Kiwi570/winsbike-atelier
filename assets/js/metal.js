/* Métal liquide anodisé (WebGL, OGL). Version sans WebGL : dégradé CSS .metal-fallback. */
(function () {
  const TINTS = {
    oil: [0.55, 0.45, 0.95], rouge: [0.88, 0.19, 0.23], bleu: [0.17, 0.42, 1.0], violet: [0.54, 0.30, 1.0],
    or: [0.85, 0.64, 0.23], vert: [0.18, 0.75, 0.44], orange: [1.0, 0.48, 0.12], noir: [0.32, 0.34, 0.37], alu: [0.79, 0.80, 0.82],
  };
  const vertex = `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 0., 1.); }`;
  const fragment = `precision highp float;
  varying vec2 vUv; uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform vec3 uTint; uniform float uOil; uniform float uDark; uniform float uFocusX;
  float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for(int i=0;i<4;i++){ v += a*noise(p); p = m*p; a *= .5; } return v; }
  float field(vec2 p){
    vec2 q = vec2(fbm(p*.8 + vec2(0., uTime*.035)), fbm(p*.8 + vec2(5.2, 1.3) - uTime*.03));
    vec2 r = vec2(fbm(p + 1.7*q + vec2(1.7, 9.2) + uTime*.02), fbm(p + 1.7*q + vec2(8.3, 2.8)));
    float h = fbm(p*.9 + 1.4*r);
    vec2 m = (uMouse - .5) * vec2(uRes.x/uRes.y, 1.) * 1.6;
    float d = length(p - m);
    h += .06*exp(-d*d*2.5) * sin(d*14. - uTime*2.);
    return h;
  }
  vec3 pal(float t){ return .5 + .5*cos(6.28318*(vec3(1.,1.,1.)*t + vec3(0., .33, .67))); }
  void main(){
    vec2 uv = vUv; vec2 p = (uv - .5) * vec2(uRes.x/uRes.y, 1.) * 1.7;
    float e = .01;
    float h = field(p);
    float hx = field(p + vec2(e, 0.)) - h; float hy = field(p + vec2(0., e)) - h;
    vec3 n = normalize(vec3(-hx/e*.32, -hy/e*.32, 1.));
    vec3 v = vec3(0., 0., 1.);
    vec3 r = reflect(-v, n);
    float bands = smoothstep(.62, 1., sin(r.y*4. + r.x*1.6 + 1.2)*.5+.5);
    vec3 L = normalize(vec3(-.7, .5, .5));
    float diff = clamp(dot(n, L), 0., 1.);
    float spec = pow(clamp(dot(reflect(-L, n), v), 0., 1.), 60.);
    float fres = pow(1. - clamp(dot(n, v), 0., 1.), 1.6);
    vec3 irid = pal(h*1.3 + fres*1.1 + .2);
    vec3 base = mix(uTint, irid, uOil);
    vec3 col = base * (0.015 + 0.10*diff) + base * bands * (0.10 + 1.6*fres) + vec3(1.)*spec*.55;
    float vig = smoothstep(1.15, .1, length((uv - vec2(uFocusX, .5)) * vec2(1.1, 1.)));
    col *= mix(.06, 1., vig);
    col = mix(col, col*vec3(.55,.57,.6), uDark);
    col = col / (1. + col*.5);
    gl_FragColor = vec4(pow(col, vec3(.95)), 1.);
  }`;

  function hasGL() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; }
  }

  function create(el, opts = {}) {
    if (!window.OGL || !hasGL()) return null;
    const { Renderer, Program, Mesh, Triangle, Vec2 } = window.OGL;
    let renderer;
    try { renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, opts.dpr || 1.25), alpha: false, antialias: false, powerPreference: 'low-power' }); }
    catch (e) { return null; }
    const gl = renderer.gl; gl.clearColor(0.08, 0.09, 0.1, 1);
    el.appendChild(gl.canvas);
    gl.canvas.setAttribute('aria-hidden', 'true');
    const geometry = new Triangle(gl);
    const start = (opts.tint && TINTS[opts.tint]) || TINTS.oil;
    const program = new Program(gl, { vertex, fragment, uniforms: {
      uTime: { value: Math.random() * 40 }, uRes: { value: new Vec2(1, 1) }, uMouse: { value: new Vec2(.6, .5) },
      uTint: { value: start.slice() }, uOil: { value: opts.tint && opts.tint !== 'oil' ? 0 : 1 }, uDark: { value: opts.dark || 0 }, uFocusX: { value: opts.focusX ?? .62 },
    } });
    const mesh = new Mesh(gl, { geometry, program });
    let target = { tint: start.slice(), oil: program.uniforms.uOil.value };
    let mouse = { x: .6, y: .5 }, sm = { x: .6, y: .5 };
    let raf = 0, visible = true, running = false, last = performance.now();
    const calm = () => document.documentElement.classList.contains('calme');
    function resize() {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h); program.uniforms.uRes.value.set(w, h);
      if (!running) draw(0);
    }
    function draw(dt) {
      const u = program.uniforms;
      if (!calm()) u.uTime.value += dt * (opts.speed || 1);
      const k = Math.min(1, dt * 3.2);
      for (let i = 0; i < 3; i++) u.uTint.value[i] += (target.tint[i] - u.uTint.value[i]) * k;
      u.uOil.value += (target.oil - u.uOil.value) * k;
      sm.x += (mouse.x - sm.x) * Math.min(1, dt * 2.5); sm.y += (mouse.y - sm.y) * Math.min(1, dt * 2.5);
      u.uMouse.value.set(sm.x, sm.y);
      renderer.render({ scene: mesh });
    }
    function loop(t) {
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      draw(dt);
      if (running) raf = requestAnimationFrame(loop);
    }
    function play() { if (running || calm()) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function pause() { running = false; cancelAnimationFrame(raf); }
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible && !document.hidden ? play() : pause(); }, { threshold: 0 });
    io.observe(el);
    document.addEventListener('visibilitychange', () => { document.hidden ? pause() : visible && play(); });
    const onMove = (e) => { const r = el.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width; mouse.y = 1 - (e.clientY - r.top) / r.height; };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', resize);
    document.documentElement.classList.add('webgl');
    resize();
    return {
      setTint(key) {
        const t = TINTS[key] || TINTS.alu;
        target = { tint: t.slice(), oil: key === 'oil' ? 1 : 0 };
        if (!running) { program.uniforms.uTint.value = t.slice(); program.uniforms.uOil.value = target.oil; draw(0); }
      },
      refresh() { calm() ? (pause(), draw(0)) : play(); },
      destroy() { pause(); io.disconnect(); window.removeEventListener('pointermove', onMove); gl.canvas.remove(); },
    };
  }
  window.WBMetal = { create, TINTS };
})();
