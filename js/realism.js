// Colour style: plain solid colours by role, sun position, sky.
// Colours follow the site photos (Site_Visit_Prep, 16-11-2026), kept clean and light:
// no textures, no stains or weathering.
import * as THREE from 'three';
import { clipPlanes, clippedMaterials } from './model.js';

export const MOBILE = matchMedia('(max-width: 720px), (pointer: coarse)').matches;

function solid(color, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
    clippingPlanes: clipPlanes, clipShadows: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...opts,
  });
  clippedMaterials.push(m);
  return m;
}
// role → colour. Edit here to change a colour everywhere.
export const COLOURS = {
  plasterW: 0xf4f1e8,     // front and side walls, white render
  plasterWBase: 0xf4f1e8,
  ochre: 0xe2bb5c,        // rear block and annex
  interior: 0xf1ede2,
  plinth: 0xeae6da,
  concrete: 0xd3cfc6,
  balustrade: 0xe3d8ac,
  roofTile: 0x7a706a,     // Lao flat tiles
  ridge: 0x6a615c,
  fascia: 0xa85a48,       // fascia and barge boards
  shutterF: 0x9a6046,     // front shutters
  shutterR: 0x7a5440,     // rear shutters
  shutterBlue: 0x6680a6,
  frame: 0x7a5440,
  teak: 0xb06a40,         // front folding doors
  doorDark: 0x6e4c3a,
  post: 0x70503e,         // rear timber posts
  planksGrey: 0x9c9186,   // GF floor
  planksDark: 0x7a6e64,   // 1F floor, stair
  ceilingDark: 0x8e5a44,  // GF ceiling
  ceilingWhite: 0xf5f4ee, // 1F ceiling
  encaustic: 0xd2ab90,    // veranda tiles
  terracotta: 0xc47a5e,   // garden paving
  terracottaK: 0xcc8262,
  brick: 0xb87460,        // side passage and footpath
  asphalt: 0x9a9a9c,
  ground: 0xa9b585,
  fenceDark: 0x7e6a5a,
  trunk: 0x857868,
  leaf: 0x86b25a,
  leafBanana: 0x9cc462,
  flower: 0xfbf8ee,
  pvc: 0xf4f4f2,
  porcelain: 0xf7f7f5,
  roadLine: 0xf6f4ee,
  context: 0xedebe6,
};
const MAKERS = {
  leaf: () => solid(COLOURS.leaf, { flatShading: true }),
  glass: () => solid(0x6f8a96, { roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.45, depthWrite: false }),
};
const cache = {};
export function getReal(role) {
  if (typeof role === 'object') {          // per-face roles for boxes: [+x, -x, +y, -y, +z, -z]
    const key = JSON.stringify(role);
    if (!cache[key]) { const s = getReal(role.side), t = role.top ? getReal(role.top) : s, b = role.bottom ? getReal(role.bottom) : s; cache[key] = [s, s, t, b, s, s]; }
    return cache[key];
  }
  return (cache[role] ||= MAKERS[role] ? MAKERS[role]() : solid(COLOURS[role] ?? COLOURS.concrete));
}

// Swap every mesh between its white technical material (plans, elevations, sections) and its colour.
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
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#7fb0dc'); g.addColorStop(0.55, '#bcd5e8'); g.addColorStop(1, '#eef1ec');
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
