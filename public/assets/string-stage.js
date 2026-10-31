// The "string": a bundle of hand-drawn pencil lines that is the homepage and the frame of every page.
// Home: the bundle breathes and parts near the cursor, and the lines write the navigation words.
// Pages: the lines sit in a band at the top and bottom, and the section name is written as the title.
(() => {
  const cv = document.querySelector("[data-string-stage]");
  const track = document.querySelector("[data-track]");
  if (!cv || !track || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FPS = 8, K = 12, SEG = 7, TOP = 34;

  let content = { navigation: [] };
  try { content = JSON.parse(document.getElementById("portal-content-data").textContent); } catch {}
  const NAV = content.navigation.filter((item) => item.kind !== "home").map((item) => ({ id: item.id, slug: item.slug, word: wordOf(item.label || item.title) }));
  function wordOf(label) { return String(label || "").toLowerCase().replace(/[^a-z ]+/g, "").trim() || String(label || "").toLowerCase(); }

  // ---------- helpers ----------
  const hash = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const sstep = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const rnd = (k, i, a, b) => a + (b - a) * hash(k * 1.37 + 0.11, i);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }
  const noiseL = (x) => { const xi = Math.floor(x), f = x - xi; return (hash(xi, 7) + (hash(xi + 1, 7) - hash(xi, 7)) * f) * 2 - 1; };

  // ---------- single-stroke cursive letters (baseline 0, x-height -10) ----------
  const GL = {
    a: [12, "M0,0 C3,-2 6,-7 9,-9 C6,-11 2,-8 2,-4 C2,0 7,0 9,-5 L9,-10 C9,-6 9,-1 12,0"],
    b: [12, "M0,0 C3,-6 6,-16 6,-20 C6,-24 2,-23 2,-18 L2,0 C3,-6 9,-11 10,-6 C11,-1 5,1 3,-1 C6,-1 9,-1 12,0"],
    c: [10, "M0,0 C2,-4 5,-9 8,-9 C5,-10 2,-7 2,-4 C2,0 7,0 10,0"],
    d: [12, "M0,0 C3,-2 6,-7 9,-9 C6,-11 2,-8 2,-4 C2,0 7,0 9,-5 L9,-20 L9,-2 C9,0 10,0 12,0"],
    e: [10, "M0,0 C4,-1 8,-4 8,-7 C8,-10 3,-10 2,-6 C1,-2 5,0 10,0"],
    f: [9, "M0,0 C2,-6 5,-16 5,-20 C5,-23 2,-22 2,-18 L2,6 C2,9 0,9 0,7 C0,4 4,1 9,0"],
    g: [12, "M0,0 C3,-2 6,-7 9,-9 C6,-11 2,-8 2,-4 C2,0 7,0 9,-5 L9,-10 L9,4 C9,10 3,11 3,7 C3,4 8,1 12,0"],
    h: [13, "M0,0 C3,-6 6,-16 6,-20 C6,-24 2,-23 2,-18 L2,0 C3,-5 5,-9 8,-9 C10,-9 10,-6 10,-4 C10,-1 11,0 13,0"],
    i: [6, "M0,0 C1,-3 2,-7 3,-10 L3,-2 C3,0 5,0 6,0", [3, -14]],
    j: [8, "M0,0 C1,-3 2,-7 3,-10 L3,5 C3,10 -1,10 -1,7 C-1,4 4,1 8,0", [3, -14]],
    k: [12, "M0,0 C3,-6 6,-16 6,-20 C6,-24 2,-23 2,-18 L2,0 L2,-4 C4,-8 8,-11 8,-8 C8,-6 5,-5 3,-5 C6,-4 7,-1 9,0 C10,0 11,0 12,0"],
    l: [8, "M0,0 C3,-6 6,-16 6,-20 C6,-24 2,-23 2,-18 L2,-3 C2,0 5,0 8,0"],
    m: [17, "M0,0 C1,-3 2,-7 2,-10 L2,0 C2,-6 4,-10 6,-10 C8,-10 8,-6 8,0 C8,-6 10,-10 12,-10 C14,-10 14,-6 14,-2 C14,0 15,0 17,0"],
    n: [12, "M0,0 C1,-3 2,-7 2,-10 L2,0 C2,-6 4,-10 7,-10 C9,-10 9,-6 9,-2 C9,0 10,0 12,0"],
    o: [13, "M0,0 C2,-5 4,-10 7,-10 C10,-10 10,-4 8,-1 C6,1 3,0 3,-3 C3,-6 6,-8 9,-6 C10,-5 11,-1 13,0"],
    p: [12, "M0,0 C1,-3 2,-7 2,-10 L2,10 L2,-6 C3,-9 9,-11 10,-6 C11,-1 5,1 3,-1 C6,-1 9,-1 12,0"],
    q: [12, "M0,0 C3,-2 6,-7 9,-9 C6,-11 2,-8 2,-4 C2,0 7,0 9,-5 L9,-10 L9,10 L9,4 C10,2 11,0 12,0"],
    r: [10, "M0,0 C1,-4 2,-8 3,-10 C4,-9 6,-9 7,-10 C7,-6 7,-2 7,-1 C7,0 9,0 10,0"],
    s: [10, "M0,0 C2,-4 4,-8 5,-10 C7,-7 9,-4 7,-1 C6,0 3,0 2,-1 C5,0 8,0 10,0"],
    t: [8, "M0,0 C1,-6 2,-13 3,-18 L3,-2 C3,0 5,0 8,0", null, [0, -11, 7, -11]],
    u: [12, "M0,0 C1,-4 2,-8 2,-10 L2,-3 C2,0 6,0 8,-4 L8,-10 L8,-2 C8,0 10,0 12,0"],
    v: [13, "M0,0 C1,-4 2,-8 2,-10 C3,-6 4,-2 6,0 C7,-3 9,-8 10,-10 C11,-6 12,-1 13,0"],
    w: [16, "M0,0 C1,-4 2,-8 2,-10 L2,-3 C2,0 6,0 7,-4 L7,-6 L7,-3 C7,0 11,0 12,-4 L12,-10 C13,-7 14,-2 16,0"],
    y: [11, "M0,0 C1,-4 2,-8 2,-10 L2,-3 C2,0 6,0 8,-4 L8,-10 L8,4 C8,10 2,11 2,7 C2,4 7,1 11,0"],
    " ": [7, "M0,0 L7,0"],
  };
  const words = {};
  let svg = null;
  function samplePath(d, step) {
    if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.style.position = "absolute"; body.appendChild(svg); }
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path"); el.setAttribute("d", d); svg.appendChild(el);
    const L = el.getTotalLength(), n = Math.max(2, Math.ceil(L / step)), out = [];
    for (let i = 0; i <= n; i++) { const q = el.getPointAtLength((L * i) / n); out.push([q.x, q.y]); }
    el.remove(); return out;
  }
  // Words with letters outside the set fall back to plain italic text.
  function word(w) {
    if (words[w]) return words[w];
    if (![...w].every((ch) => GL[ch])) return (words[w] = { text: w, pts: [], w: w.length * 10, marks: [] });
    let ox = 0, d = ""; const marks = [];
    for (const ch of w) {
      const g = GL[ch];
      const part = g[1].replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${(+x + ox).toFixed(2)},${(+y).toFixed(2)}`);
      d += d ? part.replace(/^M/, " L") : part;
      if (g[2]) marks.push({ dot: [g[2][0] + ox, g[2][1]] });
      if (g[3]) marks.push({ bar: [g[3][0] + ox, g[3][1], g[3][2] + ox, g[3][3]] });
      ox += g[0];
    }
    return (words[w] = { pts: samplePath(d, 1), w: ox, marks });
  }

  // ---------- canvases ----------
  let W = 0, H = 0, D = 1, paperPat = null, toothPat = null;
  const linesCv = document.createElement("canvas"), lctx = linesCv.getContext("2d");
  const decoCv = document.createElement("canvas"), dctx = decoCv.getContext("2d");
  let ink = lctx;
  let paperTile = null;
  function makePattern(size, fill) {
    const o = document.createElement("canvas"); o.width = o.height = size; const g = o.getContext("2d"); fill(g, size); if (!paperTile) paperTile = o; return ctx.createPattern(o, "repeat");
  }
  function buildPatterns() {
    paperPat = makePattern(256, (g, s) => {
      g.fillStyle = "#fefefc"; g.fillRect(0, 0, s, s);
      const im = g.getImageData(0, 0, s, s), p = im.data;
      for (let i = 0; i < p.length; i += 4) { const n = (Math.random() - 0.5) * 6; p[i] += n; p[i + 1] += n; p[i + 2] += n - 0.5; }
      g.putImageData(im, 0, 0);
      for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(140,135,125,${0.025 + Math.random() * 0.04})`; g.lineWidth = 0.4 + Math.random() * 0.5; g.beginPath(); const x = Math.random() * s, y = Math.random() * s, a = Math.random() * 6.28, l = 5 + Math.random() * 16; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    });
    toothPat = makePattern(256, (g, s) => {
      const im = g.createImageData(s, s), p = im.data;
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const v = 0.45 * noise(x / 2.3, y / 2.3) + 0.25 * noise(x / 9, y / 3.5 + 50) + 0.3 * (Math.random() * 2 - 1); p[(y * s + x) * 4 + 3] = Math.max(0, Math.min(215, (v - 0.02) * 260)); }
      g.putImageData(im, 0, 0);
    });
  }
  function tooth(c, tick) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "destination-out";
    c.translate(-Math.floor(hash(tick, 1) * 64), -Math.floor(hash(tick, 2) * 64)); c.fillStyle = toothPat; c.fillRect(0, 0, W * D + 64, H * D + 64); c.restore();
  }

  function pencil(pts, w, seed, tick, nt, al) {
    const n = pts.length; if (n < 2) return; al = al == null ? 1 : al;
    ink.lineCap = "round"; ink.lineJoin = "round"; ink.strokeStyle = "#2a2a2d";
    for (let q = 0; q < 3; q++) {
      const off = (q - 1) * Math.min(0.9, w * 0.25);
      for (let c = 0; c < n - 1; c += 3) {
        const u = c / (n - 1), tp = nt ? 1 : Math.pow(Math.min(1, u / 0.025), 0.5) * (1 + 0.35 * Math.exp(-(((u - 0.04) / 0.03) ** 2))) * Math.pow(Math.min(1, (1 - u) / 0.15), 0.9);
        const pr = Math.min(1.2, tp * (0.62 + 0.38 * noise(u * 3.5 + seed, q * 0.5 + tick * 0.35)));
        const wv = Math.max(0.35, 1 + 0.42 * noise(u * 2.3 + seed * 5, 9) + 0.16 * noise(u * 7 + seed, 11));
        ink.globalAlpha = al * (q === 1 ? 0.85 : 0.45) * pr * (0.8 + 0.2 * Math.min(1.3, wv));
        ink.lineWidth = Math.max(0.55, w * (q === 1 ? 0.8 : 0.55) * (0.55 + 0.45 * pr) * wv);
        ink.beginPath();
        for (let i = c; i <= Math.min(c + 3, n - 1); i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, o = off * (1 + 0.6 * noise(i * 0.08 + seed, q + tick * 1.3));
          const x = pts[i][0] - (dy / l) * o, y = pts[i][1] + (dx / l) * o; i === c ? ink.moveTo(x, y) : ink.lineTo(x, y);
        }
        ink.stroke();
      }
    }
    ink.globalAlpha = 1;
  }
  function line(x0, y0, x1, y1, sd, tick, w, al, p) {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / 3)), m = Math.max(2, Math.round(n * (p == null ? 1 : p))), pts = [];
    for (let i = 0; i <= m; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + (reduce ? 0 : 0.4 * noise(i * 0.2 + sd, tick * 1.5)), y0 + (y1 - y0) * u + 0.9 * noise(i * 0.07 + sd, 3) + (reduce ? 0 : 0.45 * noise(i * 0.15 + sd + 5, tick * 1.7))]); }
    pencil(pts, w, sd, tick, len < 30, al);
  }
  function drawWord(w, x, y, s, G, sd, tick, lw, al) {
    const wd = word(w);
    if (wd.text) { ink.save(); ink.globalAlpha = (al == null ? 1 : al) * clamp(G * 1.5); ink.fillStyle = "#2a2a2d"; ink.font = `italic ${Math.round(15 * s)}px Georgia, serif`; ink.textBaseline = "alphabetic"; ink.fillText(wd.text, x, y); ink.restore(); return ink.measureText ? wd.w * s : 0; }
    const n = Math.max(2, Math.floor(wd.pts.length * G));
    pencil(wd.pts.slice(0, n).map((p, k) => [x + p[0] * s + (reduce ? 0 : noise(k * 0.06 + sd, tick * 1.3) * 0.5), y + p[1] * s + (reduce ? 0 : noise(k * 0.05 + sd + 9, tick * 1.1) * 0.6)]), lw, sd, tick, true, al);
    if (G > 0.98) for (const m of wd.marks) {
      if (m.dot) { ink.globalAlpha = 0.8 * (al == null ? 1 : al); ink.fillStyle = "#2a2a2d"; ink.beginPath(); ink.arc(x + m.dot[0] * s, y + m.dot[1] * s, 0.6 + 0.5 * s, 0, 6.28); ink.fill(); ink.globalAlpha = 1; }
      if (m.bar) line(x + m.bar[0] * s, y + m.bar[1] * s, x + m.bar[2] * s, y + m.bar[3] * s, sd + 3, tick, lw * 0.9, al);
    }
    return wd.w * s;
  }

  // ---------- the bundle ----------
  let lines = [], extras = [], gusts = [], cpts = [], upts = [], lpts = [], zx = [], zs = [];
  function makeLine(k) {
    const type = k < 2 ? 0 : k < 6 ? 1 : 2, branch = type === 2 && hash(k, 40) < 0.55, left = hash(k, 41) < 0.5;
    let x0 = rnd(k, 1, 0.03, 0.12), x1 = rnd(k, 2, 0.88, 0.97);
    if (type === 2 && !branch) { x0 = rnd(k, 1, 0.05, 0.25); x1 = rnd(k, 2, 0.75, 0.95); }
    if (branch) { if (left) { x0 = rnd(k, 1, 0.02, 0.14); x1 = rnd(k, 2, 0.32, 0.6); } else { x0 = rnd(k, 1, 0.4, 0.68); x1 = rnd(k, 2, 0.86, 0.98); } }
    const fan = [4, 6, 8][type];
    return { k, type, seed: k * 13.7 + 3, x0: W * x0, x1: W * x1, w: [rnd(k, 3, 2.6, 3.4), rnd(k, 3, 1.6, 2.3), rnd(k, 3, 0.8, 1.3)][type],
      yo: (hash(k, 5) - 0.5) * 2 * [0.8, 1.6, 2.6][type], fanL: (hash(k, 6) - 0.5) * 2 * fan, fanR: (hash(k, 7) - 0.5) * 2 * fan,
      amp: [2.6, 3.6, 5.5][type], sp: rnd(k, 8, 0.18, 0.55), ph: hash(k, 9) * 50, bow: (hash(k, 11) - 0.5) * 4, hook: hash(k, 13) < 0.4 ? (hash(k, 14) - 0.5) * 6 : 0,
      split: type < 2 && hash(k, 15) < 0.5 ? 0.35 + hash(k, 16) * 0.3 : 0, xs: Array.from({ length: SEG + 1 }, (_, j) => j / SEG + (j && j < SEG ? (hash(k, j + 30) - 0.5) * 0.1 : 0)), B: 0, tw: null };
  }
  function layoutLines() {
    lines = []; for (let k = 0; k < K; k++) if (k !== 9) lines.push(makeLine(k));
    const sorted = [...lines].sort((a, b) => a.yo - b.yo), mid = Math.floor(sorted.length / 2); let ci = mid;
    for (let d = 0; d < sorted.length; d++) { const c = [mid + d, mid - d].find((i) => sorted[i] && sorted[i].type === 1); if (c !== undefined) { ci = c; break; } }
    const carrier = sorted.splice(ci, 1)[0]; carrier.open = 0.16; carrier.carrier = true;
    const n = sorted.length, up = Math.floor(n / 2);
    sorted.forEach((l, r) => { const j = 0.92 + 0.16 * hash(l.k, 60); l.open = r < up ? -(0.5 + (0.5 * (up - 1 - r)) / (up - 1)) * j : (0.5 + (0.5 * (r - up)) / (n - up - 1)) * j; });
    (sorted.slice(0, up).filter((l) => l.x0 < W * 0.15 && l.x1 > W * 0.85).pop() || sorted[up - 1]).upper = true;
    (sorted.slice(up).filter((l) => l.x0 < W * 0.15 && l.x1 > W * 0.85)[0] || sorted[up]).lower = true;
    const topOff = H / 2 - TOP, botOff = H / 2 - 26;
    for (const l of lines) { l.bandY = l.open < 0 ? -topOff + (hash(l.k, 70) - 0.5) * 7 : botOff + (hash(l.k, 70) - 0.5) * 7; l.dl = hash(l.k, 80) * 0.22; }
    extras = [];
    for (let k = 0; k < 18; k++) { const l = makeLine(30 + k); l.extra = true; l.type = hash(k, 71) < 0.3 ? 1 : 2; l.w = l.type === 1 ? rnd(k, 72, 1.4, 2.1) : rnd(k, 72, 0.7, 1.3); l.bandY = (k % 2 ? botOff : -topOff) + (hash(k, 73) - 0.5) * 9; l.delay = hash(k, 74) * 0.45; l.x0 = W * rnd(k, 75, 0, 0.25); l.x1 = W * rnd(k, 76, 0.75, 1); l.split = 0; l.g = 0; extras.push(l); }
    zx = NAV.map((_, i) => W * (0.14 + (0.72 * (i + 0.5)) / Math.max(1, NAV.length)));
    zs = NAV.map((n) => Math.max(42, (word(n.word).w * 1.25 / 2 + 16) / 0.62));
  }
  const rest = (l, x) => { const g = (x - W / 2) / (W / 2), side = g < 0 ? l.fanL : l.fanR; return l.yo * (1.9 + 1.3 * l.B) + side * Math.pow(Math.abs(g), 1.3); };
  function ctrl(l, t, tick) {
    const pts = [];
    for (let j = 0; j <= SEG; j++) {
      const x = l.a0 + (l.a1 - l.a0) * l.xs[j], env = j === 0 || j === SEG ? 0.35 : 1; let y = rest(l, x);
      if (!reduce) {
        y += env * l.amp * (0.6 + 0.7 * l.B) * (noise(j * 1.3 + l.ph, t * l.sp) + 0.5 * noise(j * 2.9 + l.ph * 2, t * l.sp * 2.3 + 7));
        y += (hash(tick, l.k * 31 + j) - 0.5) * 1.4 * (0.4 + hash(tick, l.k + 77));
        if (l.tw && l.tw.j === j) { const d = t - l.tw.t0; if (d >= 0 && d < 0.6) y += l.tw.a * Math.exp(-d * 7); }
      }
      pts.push([x, y]);
    }
    return pts;
  }
  function curve(c, l, t, tick) {
    const out = [], n = c.length - 1, per = 34;
    for (let s = 0; s < n; s++) {
      const p0 = c[Math.max(0, s - 1)], p1 = c[s], p2 = c[s + 1], p3 = c[Math.min(n, s + 2)];
      for (let i = 0; i < per; i++) { const q = i / per, q2 = q * q, q3 = q2 * q, f = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * q + (2 * a - 5 * b + 4 * c2 - d) * q2 + (-a + 3 * b - 3 * c2 + d) * q3); out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
    }
    out.push(c[n]);
    const X0 = out[0][0], XL = out[out.length - 1][0] - X0 || 1, sd = l.seed, hw = l.type === 2 ? 1.4 : 1;
    return out.map((p) => {
      const u = (p[0] - X0) / XL, sx = p[0] + 1000;
      let y = p[1] + l.bow * Math.sin(Math.PI * u) + hw * (1.3 * noise(sx / 55 + sd, 0) + 0.65 * noise(sx / 18 + sd * 2, 1) + 0.35 * noise(sx / 6 + sd * 3, 2) + 0.8 * noiseL(sx / 80 + sd * 4)) + (u > 0.96 ? l.hook * ((u - 0.96) / 0.04) ** 2 : 0);
      let lens = 0;
      if (S > 0.001 && !l.extra) { const dx = (p[0] - lx) / sg; lens = l.open * 38 * S * (1 + 0.1 * noise(l.seed, t * 0.6)) * Math.exp(-dx * dx); }
      y += lens;
      if (!reduce) {
        y += (0.6 + 0.5 * l.B) * (0.6 * noise(sx / 40 + sd, tick * 1.7) + 0.3 * noise(sx / 12 + sd, tick * 2.3 + 5));
        for (const g of gusts) { const dt = t - g.t0 - Math.abs(l.yo - g.yo) * 0.09; if (dt <= 0 || dt > 4) continue; const wd = 0.04 + 0.18 * dt, dx = (p[0] - g.x) / W; y += g.a * Math.exp(-(dx * dx) / (wd * wd)) * Math.sin(dt * (5 + l.sp * 4) + l.k * 0.9) * Math.exp(-dt * 1.4); }
      }
      if (l.extra) { const g = l.g, d = Math.abs(p[0] - lx) / W, wd = 0.04 + 1.4 * g * g, s2 = Math.exp(-Math.pow(d / wd, 2.5)), e = sstep(g) * s2 + (1 - s2) * sstep((g - 0.7) / 0.3); y = (y - rest(l, p[0])) * 0.25 * e + l.bandY * e; }
      else if (E > 0) { const d = Math.abs(p[0] - lx) / W, Ek = clamp((E - l.dl) / 0.78), wd = 0.06 + 1.5 * Ek * Ek, s2 = Math.exp(-Math.pow(d / wd, 2.5)), e = sstep(Ek) * s2 + (1 - s2) * sstep((Ek - 0.7) / 0.3); y = y * (1 - e) + (l.bandY + 0.25 * (y - lens - l.yo * 2.5)) * e; }
      return [p[0] + (reduce ? 0 : 0.5 * noise(sx / 30 + sd, tick * 1.9 + 9)), y];
    });
  }
  const nearY = (arr, x) => { let b = arr[0]; for (const p of arr) if (Math.abs(p[0] - x) < Math.abs(b[0] - x)) b = p; return b ? b[1] : 0; };
  const carrierY = (x) => nearY(cpts, x), upperY = (x) => nearY(upts, x), lowerY = (x) => nearY(lpts, x);
  const STRANDS = [{ from: "u", to: "l", off: -1.1, delay: 0, w: 1.45, sd: 3 }, { from: "c", to: "c", off: 0, delay: 0.12, w: 1.25, sd: 11 }, { from: "l", to: "u", off: 1.1, delay: 0.24, w: 1.05, sd: 19 }];
  let geo = null;
  // Three strands peel off the upper, middle and lower lines and write the word together.
  function writeNav(i, G, tick) {
    if (G <= 0 || i < 0 || !cpts.length || !upts.length || !lpts.length) return;
    const wd = word(NAV[i].word), GS = 1.25;
    if (wd.text) { drawWord(NAV[i].word, lx - (wd.w * GS) / 2, carrierY(lx) + 2, GS, G, i, tick, 1.4); return; }
    const x0 = lx - (wd.w * GS) / 2, xe = x0 + wd.w * GS, run = Math.min(60, sg * 0.9), Y = { u: upperY, c: carrierY, l: lowerY };
    for (const st of STRANDS) {
      const g = clamp((G - st.delay) / 0.76); if (g <= 0) continue;
      const F = Y[st.from], T = Y[st.to], sd = i * 17 + st.sd, pts = [];
      for (let x = x0 - run; x < x0; x += 2) { const e = sstep((x - x0 + run) / run); pts.push([x, F(x) * (1 - e) + (carrierY(x) + st.off) * e + (reduce ? 0 : noise(x * 0.05 + sd, tick * 1.2) * 0.5)]); }
      const bodyStart = pts.length;
      wd.pts.forEach((p, k) => { const x = x0 + p[0] * GS + (reduce ? 0 : noise(k * 0.06 + sd, tick * 1.3) * 0.55); pts.push([x, carrierY(x0 + p[0] * GS) + p[1] * GS + st.off + (reduce ? 0 : noise(k * 0.05 + sd + 9, tick * 1.1) * 0.65)]); });
      const bodyEnd = pts.length;
      for (let x = xe; x <= xe + run; x += 2) { const e = sstep((x - xe) / run); pts.push([x, (carrierY(x) + st.off) * (1 - e) + T(x) * e + (reduce ? 0 : noise(x * 0.05 + sd + 4, tick * 1.2) * 0.5)]); }
      pencil(pts.slice(0, Math.max(2, Math.floor(pts.length * g))), st.w, sd, tick, true);
      if (G > 0.98) { const base = carrierY(x0); geo = geo && geo.i === i ? geo : { i, strands: [] }; geo.x0 = x0; geo.base = base; geo.s = GS; geo.marks = wd.marks; geo.strands[STRANDS.indexOf(st)] = { w: st.w, sd, pts: pts.slice(bodyStart, bodyEnd).map((q) => [q[0] - x0, q[1] - base]) }; }
    }
    if (G > 0.98) for (const m of wd.marks) {
      if (m.dot) { const x = x0 + m.dot[0] * GS; ink.fillStyle = "#2a2a2d"; ink.globalAlpha = 0.85; ink.beginPath(); ink.arc(x, carrierY(x) + m.dot[1] * GS, 1.4, 0, 6.28); ink.fill(); ink.globalAlpha = 1; }
      if (m.bar) { const xa = x0 + m.bar[0] * GS, xb = x0 + m.bar[2] * GS, y = carrierY((xa + xb) / 2) + m.bar[1] * GS; line(xa, y + 0.6, xb, y - 0.2, i * 5 + 1, tick, 1.5); }
    }
  }

  // ---------- state ----------
  let mode = "home", Et = 0, E = 0, navZone = -1, frozen = null, routeAt = null, internal = false;
  let S = 0, P = 0, lx = 0, sg = 60, zone = -1, mx = -1, my = -1, inside = false, touchLock = false, peek = null, nextPeek = 7, lastMove = -99, nextGust = 1;
  let title = "", titleP = 1, bandNavP = 0, navBoxes = [], circleEl = null, circleP = 1, hoverEl = null, hoverP = 0;
  let lastTick = -1, T = 0, needDeco = true;

  const currentPanel = () => track.querySelector("[data-panel].is-current");
  const isHomePanel = (p) => !p || p.dataset.panel === "home";
  function titleFor(panel) {
    if (!panel) return "";
    if (panel.dataset.panel === "search") return "search";
    if (panel.dataset.panel === "not-found") return "lost";
    const tab = panel.dataset.tab !== undefined ? Number(panel.dataset.tab) : -1;
    const item = content.navigation[tab];
    return item && item.kind !== "home" ? wordOf(item.label || item.title) : "";
  }
  function slotRect() {
    const slot = currentPanel()?.querySelector(".string-title-slot") || track.querySelector(".string-title-slot");
    const r = slot ? slot.getBoundingClientRect() : { left: W * 0.12, top: 70, height: 76 };
    return { x: r.left, y: r.top + r.height - 18 };
  }

  // Every panel gets an empty slot where the section name is written.
  track.querySelectorAll("[data-panel]").forEach((panel) => { if (!panel.querySelector(":scope > .string-title-slot")) { const s = document.createElement("div"); s.className = "string-title-slot"; s.setAttribute("aria-hidden", "true"); panel.prepend(s); } });

  function syncBody() {
    const home = mode === "home" || mode === "exit";
    body.classList.toggle("string-home", home && isHomePanel(currentPanel()));
  }
  function goRoute(route) { internal = true; try { window.portalRouter?.openRoute(route, true); } finally { internal = false; } syncBody(); }

  function startEnter(i) {
    if (mode !== "home" || !geo || geo.i !== i) return;
    const slug = NAV[i].slug; navZone = i;
    frozen = JSON.parse(JSON.stringify(geo)); title = NAV[i].word;
    window.scrollTo({ top: 0 });
    if (reduce) { goRoute(`${slug}/`); mode = "page"; Et = 1; titleP = 1; return; }
    mode = "enter"; Et = 0; routeAt = `${slug}/`;
  }
  function startExit() {
    if (mode !== "page") return;
    const i = NAV.findIndex((n) => n.word === title);
    navZone = i >= 0 ? i : 0; zone = navZone; lx = zx[navZone] || W / 2; sg = zs[navZone] || 60;
    const wd = word(title), GS = 1.25, s = slotRect();
    frozen = wd.text ? null : { from: { x: s.x, y: s.y - (H / 2), s: 1.9 }, x0: lx - (wd.w * GS) / 2, base: 6, s: GS, marks: wd.marks, strands: [{ w: 1.45, sd: 3, pts: wd.pts.map((p) => [p[0] * GS, p[1] * GS]) }] };
    window.scrollTo({ top: 0 });
    if (reduce) { goRoute(""); mode = "home"; Et = 0; return; }
    mode = "exit"; Et = 1; goRoute("");
  }

  // Router changes that did not come from the string (links, back button) just move the bands.
  new MutationObserver(() => {
    if (internal) return;
    const panel = currentPanel(), home = isHomePanel(panel);
    if (home && (mode === "page" || mode === "enter")) { mode = "home"; Et = reduce ? 0 : Math.min(Et, 1); frozen = null; if (!reduce) mode = "exitPlain"; }
    else if (!home) { const t = titleFor(panel); if (t !== title) { title = t; titleP = 0; } if (mode === "home" || mode === "exit" || mode === "exitPlain") { mode = reduce ? "page" : "enterPlain"; frozen = null; if (reduce) Et = 1; } }
    syncBody(); needDeco = true;
  }).observe(track, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // ---------- drawing ----------
  function drawTitle(tick) {
    if (!title) return;
    const s = slotRect(), y = s.y - (H / 2);
    if ((mode === "enter" || mode === "exit") && frozen) {
      const k = sstep(clamp((Et - 0.2) / 0.65)), sc = frozen.s + (1.9 - frozen.s) * k, X = frozen.x0 + (s.x - frozen.x0) * k, Y = frozen.base + (y - frozen.base) * k;
      for (const st of frozen.strands) if (st) pencil(st.pts.map((q, j) => [X + (q[0] / frozen.s) * sc + (reduce ? 0 : noise(j * 0.07 + st.sd, tick * 1.3) * 0.5), Y + (q[1] / frozen.s) * sc + (reduce ? 0 : noise(j * 0.06 + st.sd + 9, tick * 1.1) * 0.6)]), st.w * (1 + 0.25 * k), st.sd, tick, true);
      return;
    }
  }
  function renderLines(tick) {
    const t = T;
    ink = lctx; lctx.setTransform(D, 0, 0, D, 0, 0); lctx.clearRect(0, 0, W, H);
    const grow = reduce ? 1 : 1 + 0.05 * noise(999, t * 0.09);
    for (const l of lines) { const cx = (l.x0 + l.x1) / 2, half = ((l.x1 - l.x0) / 2) * grow; l.a0 = cx - half - (reduce ? 0 : 0.03 * W * noise(l.seed + 70, t * 0.13)); l.a1 = cx + half + (reduce ? 0 : 0.03 * W * noise(l.seed + 90, t * 0.13)); l.B = reduce ? 0.4 : clamp(0.5 + 0.75 * noise(l.seed + 50, t * 0.24)); }
    const sway = (reduce ? 0 : 5 * noise(500, t * 0.2) + 2 * noise(600, t * 0.55)) * (1 - E);
    lctx.save(); lctx.translate(0, H / 2 + sway);
    for (const l of lines) {
      const pts = curve(ctrl(l, t, tick), l, t, tick), bw = l.w * (0.85 + 0.25 * l.B);
      if (l.carrier) cpts = pts; if (l.upper) upts = pts; if (l.lower) lpts = pts;
      if (l.split) { const b = Math.floor(pts.length * l.split); pencil(pts.slice(0, b + 6), bw, l.seed, tick); pencil(pts.slice(b - 6).map((p) => [p[0], p[1] + 1.6]), bw * 0.85, l.seed + 5, tick); } else pencil(pts, bw, l.seed, tick);
    }
    for (const l of extras) { if (l.g <= 0) continue; const eg = sstep(l.g); l.a0 = lx - (lx - l.x0) * eg; l.a1 = lx + (l.x1 - lx) * eg; l.B = 0.4; pencil(curve(ctrl(l, t, tick), l, t, tick), l.w, l.seed, tick); }
    if (mode === "home") writeNav(zone, P, tick); else drawTitle(tick);
    lctx.restore();
    // Section words grow out of the top band when the cursor reaches it.
    navBoxes = [];
    if (bandNavP > 0) {
      const list = [{ word: "string", slug: "" }, ...NAV]; let x = W * 0.42;
      list.forEach((n, i) => { const g = clamp(bandNavP * list.length - i), ww = word(n.word).w * 1.05; if (g > 0) drawWord(n.word, x, TOP + 24, 1.05, g, 30 + i * 9, tick, 1.1, 0.9); navBoxes.push({ n, x: x - 4, ww: ww + 8 }); x += ww + 24; });
    }
    if (mode === "page") {
      const rp = document.querySelector("[data-reading-progress]");
      if (rp && !rp.hidden) { const p = parseFloat(rp.style.getPropertyValue("--reading-progress")) || 0; if (p > 0.002) line(-4, TOP + 10, -4 + (W + 8) * p, TOP + 10.5, 11, tick, 1.6, 0.95); }
      const btt = document.querySelector("[data-back-to-top]");
      if (btt && !btt.hidden) { const x = W - 30, y = H - 30; line(x, y + 9, x, y - 9, 21, tick, 1.3, 0.95); line(x - 6, y - 3, x, y - 10, 22, tick, 1.2, 0.95); line(x + 6, y - 3, x, y - 10, 23, tick, 1.2, 0.95); }
    }
    tooth(lctx, tick);
  }
  function ellipse(r, sd, tick, p) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rx = r.w / 2 + 7, ry = r.h / 2 + 5, a0 = -2.4 + hash(sd, 1), pts = [], n = 46, m = Math.max(2, Math.round(n * 1.1 * p));
    for (let i = 0; i <= m; i++) { const a = a0 + (i / n) * Math.PI * 2, k = 1 + 0.06 * noise(a * 1.4 + sd, 2) + (reduce ? 0 : 0.02 * noise(a + sd, tick * 0.8)) + (i / n) * 0.06; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    pencil(pts, 1.15, sd, tick, false, 0.9);
  }
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  function renderDeco(tick) {
    ink = dctx; dctx.setTransform(D, 0, 0, D, 0, 0); dctx.clearRect(0, 0, W, H);
    if ((mode === "page" || mode === "enterPlain") && title) { const s = slotRect(); dctx.save(); dctx.beginPath(); dctx.rect(0, TOP + 16, W, H - TOP - 60); dctx.clip(); drawWord(title, s.x, s.y, 1.9, titleP, 7, tick, 1.9); dctx.restore(); }
    if (mode !== "page") { tooth(dctx, tick); return; }
    const panel = currentPanel(); if (!panel) return;
    dctx.save(); dctx.beginPath(); dctx.rect(0, TOP + 16, W, H - TOP - 16 - 44); dctx.clip();
    const vis = (r) => r.y < H && r.y + r.h > 0;
    panel.querySelectorAll(".blog-row:not([hidden]), .search-result-card, .managed-card").forEach((el, i) => { const r = rect(el); if (vis(r) && r.w) line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, 60 + i * 5, tick, 0.7, 0.55 * (+getComputedStyle(el).opacity || 1)); });
    const on = panel.querySelector(".string-filters button.is-on");
    if (on) { if (on !== circleEl) { circleEl = on; circleP = 0; } ellipse(rect(on), on.textContent.length * 3.1, tick, circleP); }
    panel.querySelectorAll(".string-search input, .portal-search-box").forEach((el, i) => { const r = rect(el); if (vis(r) && r.w) line(r.x, r.y + r.h, r.x + r.w, r.y + r.h + 1, 41 + i, tick, 0.9, 0.8); });
    if (hoverEl && hoverP > 0 && panel.contains(hoverEl)) { const r = rect(hoverEl); line(r.x - 2, r.y + r.h + 1, r.x + r.w + 3, r.y + r.h + 2, 90, tick, 1.1, 0.95, hoverP); }
    dctx.restore();
    tooth(dctx, tick);
  }
  function composite() {
    if (!linesCv.width || !linesCv.height) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W * D, H * D);
    if (E > 0.01) { ctx.globalAlpha = Math.min(1, E * 1.2); ctx.fillStyle = paperPat; ctx.fillRect(0, 0, W * D, (TOP + 18) * D); ctx.fillRect(0, (H - 46) * D, W * D, 46 * D); ctx.globalAlpha = 1; }
    ctx.drawImage(linesCv, 0, 0); ctx.drawImage(decoCv, 0, 0);
  }

  // ---------- loop ----------
  function step() {
    const t = T;
    if (!reduce && t > nextGust) { const l = lines[Math.floor(Math.random() * lines.length)]; const x = W * (0.12 + Math.random() * 0.76), a = 3 + Math.random() * 5; gusts.push({ x, yo: l.yo, a, t0: t }); if (Math.random() < 0.4) gusts.push({ x: x + (Math.random() - 0.5) * W * 0.4, yo: lines[Math.floor(Math.random() * lines.length)].yo, a: a * 0.7, t0: t + 0.3 + Math.random() * 0.6 }); gusts = gusts.slice(-14); nextGust = t + 0.8 + Math.random() * 2.6; }
    if (!reduce) for (const l of lines) if ((!l.tw || t - l.tw.t0 > 0.6) && Math.random() < 0.012) l.tw = { j: 1 + Math.floor(Math.random() * (SEG - 1)), t0: t, a: (Math.random() - 0.5) * (l.type === 2 ? 14 : 8) };
    if (mode === "enter") { Et = Math.min(1, Et + 0.085); if (routeAt && Et > 0.55) { const r = routeAt; routeAt = null; goRoute(r); } if (Et >= 1) { mode = "page"; frozen = null; titleP = 1; } }
    else if (mode === "enterPlain") { Et = Math.min(1, Et + 0.11); titleP = Math.min(1, titleP + 0.14); if (Et >= 1) mode = "page"; }
    else if (mode === "exit" || mode === "exitPlain") { Et = Math.max(0, Et - 0.09); if (Et <= 0) { const wasExit = mode === "exit"; mode = "home"; frozen = null; if (wasExit && navZone >= 0) { zone = navZone; S = 1; P = 1; inside = false; } syncBody(); } }
    else if (mode === "page") { Et = 1; titleP = Math.min(1, titleP + 0.14); }
    E = sstep(clamp(Et / 0.85)); for (const l of extras) l.g = clamp((E - l.delay) / 0.5);
    if (mode === "home") {
      let T2 = 0; const now = performance.now() / 1000;
      if (inside && mx > W * 0.08 && mx < W * 0.92) { const v = clamp(1 - (Math.abs(my - H / 2) - 12) / 33); if (v > 0) { T2 = v; let z = 0; for (let i = 1; i < zx.length; i++) if (Math.abs(mx - zx[i]) < Math.abs(mx - zx[z])) z = i; if (z !== zone && S > 0.15) T2 = 0; else { if (z !== zone) P = 0; zone = z; } } }
      if (!T2 && !inside && !reduce && now - lastMove > 6) { if (!peek && t > nextPeek) { peek = { i: Math.floor(Math.random() * NAV.length), t0: t }; nextPeek = t + 9 + Math.random() * 5; } if (peek) { if (t - peek.t0 < 1.8) { if (S < 0.05 || zone === peek.i) { if (zone !== peek.i) P = 0; zone = peek.i; T2 = 0.5; } } else peek = null; } }
      S += (T2 - S) * (T2 > S ? 0.3 : 0.2); if (zone >= 0) { lx = zx[zone]; sg = zs[zone]; }
      const Pmax = clamp((S - 0.25) / 0.55); P = P < Pmax ? Math.min(Pmax, P + 0.14) : Math.max(Pmax, P - 0.28);
      cv.style.cursor = S > 0.5 ? "pointer" : "";
    } else { S += (0 - S) * 0.3; }
    bandNavP = mode === "page" && my >= 0 && my < 72 ? Math.min(1, bandNavP + 0.12) : Math.max(0, bandNavP - 0.25);
    circleP = Math.min(1, circleP + 0.2); hoverP = hoverEl ? Math.min(1, hoverP + 0.34) : 0;
    if (mode === "page") cv.style.cursor = bandNavP > 0.3 && navHit(mx, my) ? "pointer" : "";
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (body.classList.contains("is-editing") || document.hidden) return;
    const tick = Math.floor((now / 1000) * FPS);
    if (tick === lastTick) { if (needDeco) { renderDeco(lastTick); composite(); needDeco = false; } return; }
    if (!reduce && lastTick >= 0 && hash(tick, 99) < 0.16 && mode === "home") { lastTick = tick; return; }
    lastTick = tick; T = reduce ? 0 : tick / FPS;
    step(); renderLines(tick); renderDeco(tick); composite(); needDeco = false;
  }
  function navHit(x, y) { if (y < 0 || y > 72) return null; return navBoxes.find((b) => x >= b.x && x <= b.x + b.ww) || null; }
  function resize() {
    D = Math.min(2, window.devicePixelRatio || 1); W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    for (const c of [cv, linesCv, decoCv]) { c.width = Math.round(W * D); c.height = Math.round(H * D); }
    layoutLines(); lastTick = -1;
  }

  // ---------- input ----------
  const interactive = (el) => el && el.closest && el.closest("a,button,input,textarea,select,label,dialog,iframe,[data-editor-toolbar],.page-editor,.giscus");
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (e.pointerType === "mouse") { inside = true; lastMove = performance.now() / 1000; }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { if (!touchLock) inside = false; my = -1; });
  window.addEventListener("click", (e) => {
    if (body.classList.contains("is-editing")) return;
    if (mode === "home" && isHomePanel(currentPanel())) {
      if (interactive(e.target)) return;
      const x = e.clientX, y = e.clientY, near = Math.abs(y - H / 2) < 45 && x > W * 0.08 && x < W * 0.92;
      if (e.pointerType === "mouse" || !e.pointerType) { if (zone >= 0 && S > 0.5 && P > 0.95) startEnter(zone); return; }
      let z = 0; for (let i = 1; i < zx.length; i++) if (Math.abs(x - zx[i]) < Math.abs(x - zx[z])) z = i;
      if (near && touchLock && zone === z && S > 0.6 && P > 0.95) { startEnter(zone); return; }
      if (near) { mx = x; my = H / 2; inside = true; touchLock = true; } else { inside = false; touchLock = false; }
      return;
    }
    if (mode === "page" && e.clientY < 72 && !interactive(e.target)) {
      const b = bandNavP > 0.3 && navHit(e.clientX, e.clientY);
      if (b && b.n.slug) { if (b.n.word !== title) { goRoute(`${b.n.slug}/`); } }
      else startExit();
    }
  });
  window.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { mx = e.clientX; my = e.clientY; } }, { passive: true });
  document.addEventListener("pointerover", (e) => { const a = e.target.closest && e.target.closest(".post-title-link, a.managed-card h3, .search-result-card .post-title-link"); if (a !== hoverEl) { hoverEl = a; hoverP = 0; needDeco = true; } });
  window.addEventListener("scroll", () => { needDeco = true; }, { passive: true });
  window.addEventListener("resize", () => { resize(); needDeco = true; });

  // ---------- blog filters ----------
  const filters = document.querySelector(".string-filters");
  if (filters) {
    const rows = () => Array.from(document.querySelectorAll(".blog-list .blog-row"));
    let active = "";
    const apply = (animate) => {
      const q = (filters.querySelector("input")?.value || "").trim().toLowerCase();
      rows().forEach((row) => { const ok = (!active || row.dataset.category === active || row.dataset.series === active) && (!q || (row.dataset.text || "").includes(q)); row.hidden = !ok; });
      document.querySelectorAll(".blog-list .string-month").forEach((h) => { let n = h.nextElementSibling, any = false; while (n && !n.classList.contains("string-month")) { if (!n.hidden) any = true; n = n.nextElementSibling; } h.hidden = !any; });
      const empty = document.querySelector(".blog-list .string-empty"); if (empty) empty.hidden = rows().some((r) => !r.hidden);
      if (animate && !reduce) document.querySelectorAll(".blog-list .string-month:not([hidden]), .blog-list .blog-row:not([hidden])").forEach((el, i) => { el.classList.remove("rise"); void el.offsetWidth; el.style.animationDelay = `${i * 45}ms`; el.classList.add("rise"); });
      needDeco = true;
    };
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filter]"); if (!b || b.classList.contains("is-on")) return;
      filters.querySelectorAll("button[data-filter]").forEach((x) => x.classList.toggle("is-on", x === b));
      active = b.dataset.filter; const list = document.querySelector(".blog-list");
      if (reduce || !list) { apply(false); return; }
      list.classList.add("out"); setTimeout(() => { apply(true); list.classList.remove("out"); }, 170);
    });
    filters.querySelector("input")?.addEventListener("input", () => apply(false));
    filters.querySelector("input")?.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.currentTarget.value.trim()) window.portalRouter?.openRoute(`search/?q=${encodeURIComponent(e.currentTarget.value.trim())}`, true); });
  }

  // ---------- start ----------
  buildPatterns(); resize();
  try { body.style.backgroundImage = `url(${paperTile.toDataURL()})`; body.style.backgroundSize = "256px 256px"; } catch {}
  const first = currentPanel();
  if (!isHomePanel(first)) { mode = "page"; Et = 1; E = 1; title = titleFor(first); titleP = 1; }
  syncBody();
  requestAnimationFrame(frame);
})();
