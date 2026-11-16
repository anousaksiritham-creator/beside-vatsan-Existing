// Realistic style: procedural textures, materials by role, sun position, sky.
// Colours come from the site photos (Site_Visit_Prep, 16-11-2026). Textures are drawn in code
// on canvases, so there are no image files. UVs are in metres (see worldUVs in model.js), so
// each texture's `size` is the real-world size of one texture tile.
import * as THREE from 'three';
import { clipPlanes, clippedMaterials } from './model.js';

export const MOBILE = matchMedia('(max-width: 720px), (pointer: coarse)').matches;
const RES = MOBILE ? 256 : 512;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function canvas(w = RES, h = RES) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, size) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size[0], 1 / size[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function noise(ctx, w, h, amp) {
  const d = ctx.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const n = (rnd() - 0.5) * amp;
    p[i] += n; p[i + 1] += n; p[i + 2] += n;
  }
  ctx.putImageData(d, 0, 0);
}
function blotches(ctx, w, h, color, n, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, r = rMin + rnd() * (rMax - rMin);
    for (const [dx, dy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, color.replace('A', alpha)); g.addColorStop(1, color.replace('A', 0));
      ctx.fillStyle = g; ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
}

// Render: one tile = 2 m wide × 3.5 m (one storey) tall, so streaks start under each storey top.
function plaster(base, { streaks = 0, band = false, grime = 0 } = {}) {
  const w = RES, h = Math.round(RES * 1.75), [c, x] = canvas(w, h);
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  blotches(x, w, h, 'rgba(120,110,90,A)', 10, 20, 90, 0.05);
  if (grime) { const g = x.createLinearGradient(0, 0, 0, h * 0.25); g.addColorStop(0, `rgba(80,78,60,${grime})`); g.addColorStop(1, 'rgba(80,78,60,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h * 0.25); }
  for (let i = 0; i < streaks; i++) {
    const sx = rnd() * w, sw = 3 + rnd() * 18, len = h * (0.12 + rnd() * 0.45);
    const g = x.createLinearGradient(0, 0, 0, len);
    g.addColorStop(0, `rgba(80,82,60,${0.25 + rnd() * 0.35})`); g.addColorStop(1, 'rgba(80,82,60,0)');
    x.fillStyle = g; x.fillRect(sx, 0, sw, len);
  }
  if (band) {   // dusty yellow splash zone at the base (0–0.40 m)
    const b = h * 0.4 / 3.5, g = x.createLinearGradient(0, h - b * 1.3, 0, h);
    g.addColorStop(0, 'rgba(196,170,100,0)'); g.addColorStop(0.35, 'rgba(196,170,100,0.45)'); g.addColorStop(1, 'rgba(170,140,80,0.6)');
    x.fillStyle = g; x.fillRect(0, h - b * 1.3, w, b * 1.3);
  }
  noise(x, w, h, 10);
  return tex(c, [2, 3.5]);
}

// Lao flat "biscuit" tiles laid like shingles. One tile = 1 × 1 m.
function roofTiles(base = [74, 68, 64]) {
  const [c, x] = canvas(); const s = RES, rows = 8, cols = 5, th = s / rows, tw = s / cols;
  x.fillStyle = '#2e2a28'; x.fillRect(0, 0, s, s);
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * tw / 2;
    for (let k = -1; k <= cols; k++) {
      const v = 0.75 + rnd() * 0.5, moss = rnd() < 0.12;
      const col = base.map((b, i) => Math.min(255, b * v + (moss && i === 1 ? 14 : 0)));
      const g = x.createLinearGradient(0, r * th, 0, (r + 1) * th);
      g.addColorStop(0, `rgb(${col.map(n => n * 0.75)})`); g.addColorStop(0.8, `rgb(${col})`); g.addColorStop(1, `rgb(${col.map(n => Math.min(255, n * 1.35))})`);
      x.fillStyle = g; x.fillRect(k * tw + off + 2, r * th + 1, tw - 4, th - 2);
    }
  }
  noise(x, s, s, 14);
  return tex(c, [1, 1]);
}

// timber: planks (gaps) or plain grain. size in metres.
function wood(base, { plank = 0, size = [2, 2], vertical = false } = {}) {
  const [c, x] = canvas(); const s = RES;
  x.fillStyle = base; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 140; i++) {
    const y = rnd() * s; x.strokeStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + rnd() * 0.06})`;
    x.lineWidth = 0.5 + rnd() * 2; x.beginPath(); x.moveTo(0, y);
    for (let k = 0; k <= 8; k++) x.lineTo(k * s / 8, y + (rnd() - 0.5) * 3); x.stroke();
  }
  if (plank) {
    const n = Math.round(size[1] / plank), ph = s / n;
    for (let i = 0; i < n; i++) {
      x.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${rnd() * 0.08})`; x.fillRect(0, i * ph, s, ph);
      x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, i * ph, s, 1.5);
      const j = rnd() * s; x.fillRect(j, i * ph, 1.5, ph);   // butt joint
    }
  }
  noise(x, s, s, 8);
  const t = tex(c, size);
  if (vertical) t.rotation = Math.PI / 2;
  return t;
}

// patterned encaustic cement tiles, 0.20 m. One tile = 1 m.
function encaustic() {
  const [c, x] = canvas(); const s = RES, n = 5, t = s / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = i * t, y0 = j * t, m = t / 2;
    x.fillStyle = '#d9c9a8'; x.fillRect(x0, y0, t, t);
    x.fillStyle = '#9c4a36';
    x.beginPath(); x.arc(x0 + m, y0 + m, t * 0.3, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#d9c9a8'; x.beginPath(); x.arc(x0 + m, y0 + m, t * 0.17, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#5f7a58';
    for (const [cx, cy] of [[x0, y0], [x0 + t, y0], [x0, y0 + t], [x0 + t, y0 + t]]) { x.beginPath(); x.arc(cx, cy, t * 0.2, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = 'rgba(60,40,30,0.35)'; x.lineWidth = 1.5; x.strokeRect(x0, y0, t, t);
  }
  blotches(x, s, s, 'rgba(90,70,50,A)', 12, 20, 70, 0.12);
  noise(x, s, s, 12);
  return tex(c, [1, 1]);
}

// square terracotta tiles, `tile` m, with moss. One texture tile = 4 tiles.
function terracotta(base = [165, 90, 69], tile = 0.3, moss = 0.25) {
  const [c, x] = canvas(); const s = RES, n = 4, t = s / n;
  x.fillStyle = '#6b4a3c'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = 0.82 + rnd() * 0.3; x.fillStyle = `rgb(${base.map(b => b * v)})`;
    x.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
  }
  if (moss) blotches(x, s, s, 'rgba(70,85,45,A)', 14, 15, 70, moss);
  noise(x, s, s, 14);
  return tex(c, [tile * n, tile * n]);
}

// herringbone brick 0.20 × 0.10 m; the pattern repeats every 0.80 m.
function herringbone(base = [155, 91, 72]) {
  const [c, x] = canvas(); const s = RES, u = s / 8;
  x.fillStyle = '#5b4a40'; x.fillRect(0, 0, s, s);
  const brick = (bx, by, w, h) => {
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
      const v = 0.8 + rnd() * 0.32; x.fillStyle = `rgb(${base.map(b => b * v)})`;
      x.fillRect(bx + dx + 1.5, by + dy + 1.5, w - 3, h - 3);
    }
  };
  for (let strip = -6; strip <= 6; strip++) for (let k = -12; k <= 12; k++) {
    const ox = k * u + strip * 2 * u, oy = k * u - strip * 2 * u;
    if (ox < -3 * u || ox > s + u || oy < -3 * u || oy > s + u) continue;
    brick(ox, oy, 2 * u, u); brick(ox, oy + u, u, 2 * u);
  }
  blotches(x, s, s, 'rgba(70,90,45,A)', 6, 10, 40, 0.18);
  noise(x, s, s, 12);
  return tex(c, [0.8, 0.8]);
}

function speckle(base, size, amp = 18, blot = null) {
  const [c, x] = canvas(); const s = RES;
  x.fillStyle = base; x.fillRect(0, 0, s, s);
  if (blot) blotches(x, s, s, blot, 30, 20, 90, 0.18);
  noise(x, s, s, amp);
  return tex(c, [size, size]);
}

// ---------- materials by role ----------
function real(color, map, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, map: map ?? null, roughness: 0.88, metalness: 0, side: THREE.DoubleSide,
    clippingPlanes: clipPlanes, clipShadows: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...opts,
  });
  clippedMaterials.push(m);
  return m;
}
const MAKERS = {
  plasterW:     () => real(0xffffff, plaster('#ece8dc', { streaks: 6, grime: 0.06 })),
  plasterWBase: () => real(0xffffff, plaster('#ece8dc', { streaks: 4, grime: 0.08, band: true })),
  ochre:        () => real(0xffffff, plaster('#d2a63e', { streaks: 34, grime: 0.35 })),
  interior:     () => real(0xffffff, plaster('#e6e1d2', { streaks: 0 })),
  plinth:       () => real(0xffffff, plaster('#e3ddcc', { band: true })),
  concrete:     () => real(0xffffff, speckle('#bdb8ad', 2, 16, 'rgba(90,90,80,A)')),
  balustrade:   () => real(0xffffff, plaster('#cbbd8a', { streaks: 26, grime: 0.4 })),
  roofTile:     () => real(0xffffff, roofTiles()),
  ridge:        () => real(0x3b3633, null, { roughness: 0.8 }),
  fascia:       () => real(0xffffff, wood('#86463a', { size: [1.5, 1.5] })),
  shutterF:     () => real(0xffffff, wood('#7a4a35', { size: [1, 1] })),
  shutterR:     () => real(0xffffff, wood('#4a3328', { size: [1, 1] })),
  shutterBlue:  () => real(0xffffff, wood('#4a5e80', { size: [1, 1] })),
  frame:        () => real(0xffffff, wood('#4a3328', { size: [1, 1] })),
  teak:         () => real(0xffffff, wood('#8b4a2b', { size: [1, 1] }), { roughness: 0.6 }),
  doorDark:     () => real(0xffffff, wood('#3e2a20', { size: [1, 1], plank: 0.15, vertical: true })),
  post:         () => real(0xffffff, wood('#4a2e22', { size: [1, 1], vertical: true })),
  planksGrey:   () => real(0xffffff, wood('#6e655c', { plank: 0.2, size: [2, 2] })),
  planksDark:   () => real(0xffffff, wood('#3e3833', { plank: 0.15, size: [2, 2] })),
  ceilingDark:  () => real(0xffffff, wood('#5a2e22', { plank: 0.1, size: [2, 2] }), { roughness: 0.5 }),
  ceilingWhite: () => real(0xffffff, wood('#eeede6', { plank: 0.1, size: [2, 2] })),
  encaustic:    () => real(0xffffff, encaustic(), { roughness: 0.55 }),
  terracotta:   () => real(0xffffff, terracotta()),
  terracottaK:  () => real(0xffffff, terracotta([178, 98, 70], 0.25, 0)),
  brick:        () => real(0xffffff, herringbone()),
  asphalt:      () => real(0xffffff, speckle('#77777a', 3, 22, 'rgba(40,40,40,A)')),
  ground:       () => real(0xffffff, speckle('#8b8a68', 4, 22, 'rgba(110,130,70,A)')),
  fenceDark:    () => real(0xffffff, wood('#5a4a3e', { size: [1, 1], vertical: true })),
  trunk:        () => real(0x6a5f55, null, { roughness: 1 }),
  leaf:         () => real(0x6f9a42, null, { flatShading: true, roughness: 0.8 }),
  leafBanana:   () => real(0x8fb04e, null, { roughness: 0.7 }),
  flower:       () => real(0xf7f3e6, null, { roughness: 0.6 }),
  glass:        () => real(0x1d2a30, null, { roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.6, depthWrite: false }),
  pvc:          () => real(0xf1f1ef, null, { roughness: 0.5 }),
  porcelain:    () => real(0xf4f4f2, null, { roughness: 0.3 }),
  roadLine:     () => real(0xf2f0e8, null),
  context:      () => real(0xe9e7e2, null, { roughness: 0.95 }),
};
const cache = {};
export function getReal(role) {
  if (typeof role === 'object') {          // per-face roles for boxes: [+x, -x, +y, -y, +z, -z]
    const key = JSON.stringify(role);
    if (!cache[key]) { const s = getReal(role.side), t = role.top ? getReal(role.top) : s, b = role.bottom ? getReal(role.bottom) : s; cache[key] = [s, s, t, b, s, s]; }
    return cache[key];
  }
  return (cache[role] ||= (MAKERS[role] || MAKERS.concrete)());
}

// Swap every mesh between its white technical material and its realistic material.
export function applyStyle(root, isReal, edges) {
  root.traverse(o => {
    const u = o.userData;
    if (u.role && o.isMesh) o.material = isReal ? getReal(u.role) : u.white;
    if (u.realOnly) o.visible = isReal;
    if (u.whiteOnly) o.visible = !isReal;
    if (u.isEdge) o.visible = edges && !isReal;
  });
}

// ---------- sun ----------
// Solar position (NOAA approximation). Returns azimuth from north (clockwise) and elevation, degrees.
export function sunPosition(hour, dayOfYear, lat, lon, tz) {
  const r = Math.PI / 180;
  const decl = 23.44 * Math.sin(r * 360 * (284 + dayOfYear) / 365);
  const B = r * 360 * (dayOfYear - 81) / 364;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const solar = hour + (4 * (lon - 15 * tz) + eot) / 60;
  const H = r * 15 * (solar - 12), phi = lat * r, d = decl * r;
  const el = Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(d) * Math.cos(phi)) + Math.PI;
  return { az: az / r, el: el / r };
}
// direction toward the sun in three.js coords.
// northDeg: angle of true north measured clockwise from data +z (plan "up", toward the rear), from the CAD north arrow.
export function sunVector(az, el, northDeg) {
  const r = Math.PI / 180, n = northDeg * r;
  // data plan axes (x right, z up): north and east expressed in (x, z)
  const N = [Math.sin(n), Math.cos(n)], E = [N[1], -N[0]];
  const h = Math.cos(el * r), sa = Math.sin(az * r), ca = Math.cos(az * r);
  const x = h * (sa * E[0] + ca * N[0]), z = h * (sa * E[1] + ca * N[1]);
  return new THREE.Vector3(x, Math.sin(el * r), -z);
}

export function skyTexture() {
  const [c, x] = canvas(4, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#7fb0dc'); g.addColorStop(0.55, '#bcd5e8'); g.addColorStop(1, '#eef1ec');
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
