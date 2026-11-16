// CAD-style dimensions, level marks and room labels.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as D from './building-data.js';
import { CAD_LINES } from './cad-linework.js';

const dimMat = new THREE.LineBasicMaterial({ color: 0x1f6fb2 });
const lvlMat = new THREE.LineDashedMaterial({ color: 0xb03a2e, dashSize: 0.25, gapSize: 0.15 });

export const annot = {};               // tag → THREE.Group
const A = (t) => (annot[t] ||= Object.assign(new THREE.Group(), { name: t }));

function label(text, cls, pos, group) {
  const el = document.createElement('div');
  el.className = cls; el.innerHTML = text;
  const o = new CSS2DObject(el); o.position.copy(pos); group.add(o);
  return o;
}
const v = (x, y, z) => new THREE.Vector3(x, y, -z);   // data → three
function seg(pts, group, m = dimMat) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m);
  if (m.isLineDashedMaterial) l.computeLineDistances();
  group.add(l); return l;
}

// Plan dimension: a,b in (x,z); off = (dx,dz) offset of the dimension line.
function planDim(d) {
  const y = d.tag === '1F' ? D.LEVELS.ff + 1.25 : 1.25;
  const g = A('dim-' + d.tag);
  const [ax, az] = d.a, [bx, bz] = d.b, [ox, oz] = d.off;
  const p1 = v(ax + ox, y, az + oz), p2 = v(bx + ox, y, bz + oz);
  seg([p1, p2], g);
  if (ox || oz) { seg([v(ax, y, az), p1], g); seg([v(bx, y, bz), p2], g); }
  // 45° ticks
  const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
  const n = new THREE.Vector3(-dir.z, 0, dir.x);
  const tk = new THREE.Vector3().addVectors(dir, n).normalize().multiplyScalar(0.18);
  for (const p of [p1, p2]) seg([p.clone().sub(tk), p.clone().add(tk)], g);
  label(d.t, 'dim', p1.clone().add(p2).multiplyScalar(0.5), g);
}

// Level marks for elevations/sections. side: front | rear | left | right
function levelMarks(side, ridge) {
  const g = A('lvl-' + side);
  const marks = D.LEVEL_MARKS.map(m => m.y === null ? { ...m, y: ridge, t: `+${ridge.toFixed(2)} ${m.t}` } : m);
  for (const m of marks) {
    let a, b, lp;   // lp = screen-left end of the line; text runs to the right, above the line
    if (side === 'front')      { a = v(-2.0, m.y, -9);  b = v(10.4, m.y, -9);  lp = a; }
    else if (side === 'rear')  { a = v(11.4, m.y, 36);  b = v(-1.0, m.y, 36);  lp = a; }
    else if (side === 'left')  { a = v(-12, m.y, 24);   b = v(-12, m.y, -1.5); lp = a; }
    else                       { a = v(14, m.y, -1.5);  b = v(14, m.y, 24);    lp = a; }
    seg([a, b], g, lvlMat);
    label(`<span>${m.t}</span>`, 'lvl', lp, g);
  }
  // overall height dimension text near the building
  if (side === 'front') {
    const y = -1.3;
    seg([v(0.5, y, -9), v(9.4, y, -9)], g, dimMat); seg([v(0, y - 0.6, -9), v(11.9, y - 0.6, -9)], g, dimMat);
    label('8.90', 'dim', v(4.95, y, -9), g); label('11.90 (plot)', 'dim', v(5.95, y - 0.6, -9), g);
  }
  if (side === 'right') {
    const y = -1.3;
    seg([v(14, y, 0.5), v(14, y, 23)], g, dimMat); label('23.00', 'dim', v(14, y, 11.75), g);
    seg([v(14, y - 0.6, 0), v(14, y - 0.6, 28.5)], g, dimMat); label('28.50 (plot)', 'dim', v(14, y - 0.6, 14.25), g);
  }
}

function roomLabels() {
  for (const r of D.ROOMS) {
    const g = A('rooms-' + r.floor);
    const y = r.floor === '1F' ? D.LEVELS.ff + 0.05 : 0.05;
    const area = r.area ? `<span class="ar">~${r.area.toFixed(1)} m²</span>` : '';
    const code = r.code !== '—' ? `<b>${r.code}</b> ` : '';
    label(`${code}${r.en}${area}`, 'room', v(r.x, y, r.z), g);
  }
  const s = D.SITE;
  label(s.road.name, 'ctx', v(5.95, D.LEVELS.ground, -4.2), A('ctx-labels'));
  label(s.temple.label, 'ctx', v(21, D.LEVELS.ground + s.temple.h + 1, 13), A('ctx-labels'));
  label('LPB-001 · plot 11.9 × 28.5 m', 'ctx', v(5.95, D.LEVELS.ground, 29.6), A('ctx-labels'));
}

// exact CAD plan linework (exiting_v2) drawn on top of the plan cut
const cadMat = new THREE.LineBasicMaterial({ color: 0x111417 });
function cadLinework() {
  for (const [fl, segs] of Object.entries(CAD_LINES)) {
    const y = (fl === '1F' ? D.LEVELS.ff : 0) + 1.27;
    const pts = [];
    for (const [x1, z1, x2, z2] of segs) pts.push(v(x1, y, z1), v(x2, y, z2));
    A('cad-' + fl).add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), cadMat));
  }
}

export function buildAnnotations(scene, ridge) {
  cadLinework();
  for (const d of D.DIMS) planDim(d);
  for (const s of ['front', 'rear', 'left', 'right']) levelMarks(s, ridge);
  roomLabels();
  for (const g of Object.values(annot)) { g.visible = false; scene.add(g); }
}
