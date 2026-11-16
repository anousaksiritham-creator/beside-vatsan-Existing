// Builds the white technical model from building-data.js.
// Data z (road → rear) is mapped to three.js −z so the road is in front (+z).
import * as THREE from 'three';
import * as D from './building-data.js';

export const clipPlanes = [];            // shared, mutated by views.js
export const clippedMaterials = [];

function mat(color, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
    clippingPlanes: clipPlanes, clipShadows: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...opts,
  });
  clippedMaterials.push(m);
  return m;
}
const lineMat = new THREE.LineBasicMaterial({ color: 0x3a3f45, clippingPlanes: clipPlanes });
const lineMatLight = new THREE.LineBasicMaterial({ color: 0x9aa1a8, clippingPlanes: clipPlanes });
clippedMaterials.push(lineMat, lineMatLight);

export const M = {
  wall: mat(0xffffff),
  floor: mat(0xf1f1ee),
  roof: mat(0xf6f6f6),
  timber: mat(0xe9e4dc),
  glass: mat(0xcfe0ea, { transparent: true, opacity: 0.35, depthWrite: false }),
  site: mat(0xe6e7e4),
  road: mat(0xd5d7d8),
  context: mat(0xdedfdd),
  tree: mat(0xeef2ec, { flatShading: true }),
  ghost: new THREE.LineDashedMaterial({ color: 0xc0392b, dashSize: 0.15, gapSize: 0.1, clippingPlanes: clipPlanes }),
};
clippedMaterials.push(M.ghost);

export const groups = {};
const G = (name) => (groups[name] ||= new THREE.Group());

function addEdges(mesh, light = false) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), light ? lineMatLight : lineMat);
  e.userData.isEdge = true;
  mesh.add(e);
}

// axis-aligned box from data coords
export function box(x0, x1, y0, y1, z0, z1, material, group, edges = true) {
  const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
  if (w < 1e-4 || h < 1e-4 || d < 1e-4) return null;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -(z0 + z1) / 2);
  m.castShadow = m.receiveShadow = true;
  if (edges) addEdges(m, material === M.site || material === M.road || material === M.context);
  group.add(m);
  if ((group === groups.gf || group === groups.ff) && (material === M.wall || material === M.floor || material === M.timber) && w > 0.06 && d > 0.06)
    cutBoxes.push({ x: [Math.min(x0, x1), Math.max(x0, x1)], y: [Math.min(y0, y1), Math.max(y0, y1)], z: [Math.min(z0, z1), Math.max(z0, z1)] });
  return m;
}

// ---------- section / plan poché (solid fill where elements are cut) ----------
export const cutBoxes = [];
export const roofTris = [];
const pocheMat = new THREE.MeshBasicMaterial({ color: 0x2f3438, side: THREE.DoubleSide });
const cutLineMat = new THREE.LineBasicMaterial({ color: 0x2f3438 });
// axis: 'x' | 'y' | 'z' (data axes), c: cut value (data), towardCam: +1/−1 small offset sign in three coords
export function makePoche(axis, c, eps) {
  const grp = new THREE.Group();
  for (const b of cutBoxes) {
    const r = b[axis]; if (c <= r[0] || c >= r[1]) continue;
    let m;
    if (axis === 'y') {
      m = new THREE.Mesh(new THREE.PlaneGeometry(b.x[1] - b.x[0], b.z[1] - b.z[0]), pocheMat);
      m.rotation.x = -Math.PI / 2; m.position.set((b.x[0] + b.x[1]) / 2, c + eps, -(b.z[0] + b.z[1]) / 2);
    } else if (axis === 'x') {
      m = new THREE.Mesh(new THREE.PlaneGeometry(b.z[1] - b.z[0], b.y[1] - b.y[0]), pocheMat);
      m.rotation.y = Math.PI / 2; m.position.set(c + eps, (b.y[0] + b.y[1]) / 2, -(b.z[0] + b.z[1]) / 2);
    } else {
      m = new THREE.Mesh(new THREE.PlaneGeometry(b.x[1] - b.x[0], b.y[1] - b.y[0]), pocheMat);
      m.position.set((b.x[0] + b.x[1]) / 2, (b.y[0] + b.y[1]) / 2, -c + eps);
    }
    grp.add(m);
  }
  // roof cut lines (sections only)
  if (axis !== 'y') {
    const k = axis === 'x' ? 0 : 2;
    const pts = [];
    for (const t of roofTris) {
      const hits = [];
      for (let i = 0; i < 3; i++) {
        const p = t[i], q = t[(i + 1) % 3], a = p[k] - c, bq = q[k] - c;
        if ((a < 0) !== (bq < 0)) { const s = a / (a - bq); hits.push(p.map((v, j) => v + (q[j] - v) * s)); }
      }
      if (hits.length === 2) for (const h of hits) pts.push(new THREE.Vector3(h[0] + (k === 0 ? eps : 0), h[1], -h[2] + (k === 2 ? eps : 0)));
    }
    grp.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), cutLineMat));
  }
  grp.visible = false;
  return grp;
}

function quad(pts, material, group) {           // pts: 4 × [x,y,z] in data coords
  const g = new THREE.BufferGeometry();
  const v = pts.map(([x, y, z]) => [x, y, -z]).flat();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(pts.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  addEdges(m);
  group.add(m);
  if (group === groups.roof) {
    const p = pts.map(([x, y, z]) => [x, y, z]);
    roofTris.push([p[0], p[1], p[2]]); if (p.length === 4) roofTris.push([p[0], p[2], p[3]]);
  }
  return m;
}

// ---------- walls with openings ----------
function buildWall(w) {
  const grp = G(w.floor === '1F' ? 'ff' : 'gf');
  if (w.balustrade) return buildBalustrade(w, grp);
  const alongX = (w.x[1] - w.x[0]) >= (w.z[1] - w.z[0]);
  const [s0, s1] = alongX ? w.x : w.z;
  const [y0, y1] = w.y;
  const piece = (a, b, ya, yb) => alongX
    ? box(a, b, ya, yb, w.z[0], w.z[1], M.wall, grp)
    : box(w.x[0], w.x[1], ya, yb, a, b, M.wall, grp);
  const ops = [...w.open].sort((p, q) => p.s[0] - q.s[0]);
  let cur = s0;
  for (const o of ops) {
    piece(cur, o.s[0], y0, y1);
    if (o.sill > 0) piece(o.s[0], o.s[1], y0, y0 + o.sill);
    if (y0 + o.head < y1) piece(o.s[0], o.s[1], y0 + o.head, y1);
    fillOpening(w, o, alongX, grp);
    cur = o.s[1];
  }
  piece(cur, s1, y0, y1);
}

function fillOpening(w, o, alongX, grp) {
  const yb = w.y[0] + o.sill, yt = w.y[0] + o.head;
  const mid = alongX ? (w.z[0] + w.z[1]) / 2 : (w.x[0] + w.x[1]) / 2;
  const t = 0.04, f = 0.05;
  const pane = (a, b, ya, yb2, m = M.glass) => alongX
    ? box(a, b, ya, yb2, mid - t / 2, mid + t / 2, m, grp, m !== M.glass)
    : box(mid - t / 2, mid + t / 2, ya, yb2, a, b, m, grp, m !== M.glass);
  const frame = (a, b, ya, yb2) => pane(a, b, ya, yb2, M.timber);
  const [a, b] = o.s;
  if (o.type === 'win') {
    frame(a, b, yb, yb + f); frame(a, b, yt - f, yt);
    frame(a, a + f, yb, yt); frame(b - f, b, yb, yt); frame((a + b) / 2 - 0.02, (a + b) / 2 + 0.02, yb, yt);
    pane(a + f, b - f, yb + f, yt - f);
    // louvre lines (shutters)
    for (let y = yb + 0.15; y < yt - 0.1; y += 0.12) frame(a + f, b - f, y, y + 0.012);
  } else if (o.type === 'fold') {
    const tr = yb + 2.4;
    frame(a, b, tr - 0.03, tr + 0.03); frame(a, b, yt - f, yt);
    const n = 4; for (let i = 0; i <= n; i++) { const s = a + (b - a) * i / n; frame(s - 0.025, s + 0.025, yb, yt); }
    pane(a, b, yb, yt);
  } else if (o.type === 'hole') {
    // plain opening, no frame
  } else {
    frame(a, a + f, yb, yt); frame(b - f, b, yb, yt); frame(a, b, yt - f, yt);
  }
}

// ---------- roofs ----------
// decorative concrete balustrade: plinth, top rail, balusters every 0.22 m
function buildBalustrade(w, grp) {
  const alongX = (w.x[1] - w.x[0]) >= (w.z[1] - w.z[0]);
  const [s0, s1] = alongX ? w.x : w.z, [y0, y1] = w.y;
  const part = (a, b, ya, yb, inset = 0) => alongX
    ? box(a, b, ya, yb, w.z[0] + inset, w.z[1] - inset, M.wall, grp)
    : box(w.x[0] + inset, w.x[1] - inset, ya, yb, a, b, M.wall, grp);
  part(s0, s1, y0, y0 + 0.18);                 // plinth
  part(s0, s1, y1 - 0.12, y1);                 // top rail
  part(s0, s0 + 0.2, y0, y1); part(s1 - 0.2, s1, y0, y1);   // end posts
  for (let s = s0 + 0.32; s < s1 - 0.25; s += 0.22) part(s - 0.05, s + 0.05, y0 + 0.18, y1 - 0.12, 0.03);
}

// gabled roof, ridge parallel to x (across the plot), gable walls at wallX
function gableRoof(r) {
  const tan = Math.tan(THREE.MathUtils.degToRad(D.LEVELS.roofPitch));
  const [x0, x1] = r.x, [z0, z1] = r.z, [wz0, wz1] = r.wallZ, zm = (wz0 + wz1) / 2;
  const top = D.LEVELS.eave + (zm - wz0) * tan;                 // ridge level
  const yAt = (z) => top - Math.abs(z - zm) * tan;
  const g = G('roof');
  quad([[x0, yAt(z0), z0], [x1, yAt(z0), z0], [x1, top, zm], [x0, top, zm]], M.roof, g);
  quad([[x0, top, zm], [x1, top, zm], [x1, yAt(z1), z1], [x0, yAt(z1), z1]], M.roof, g);
  // gable wall triangles above the eave on both side walls
  for (const xw of r.wallX) quad([[xw, D.LEVELS.eave, wz0], [xw, D.LEVELS.eave, wz1], [xw, top, zm]], M.wall, g);
  // barge boards
  for (const xe of [x0, x1]) {
    quad([[xe, yAt(z0) - 0.15, z0], [xe, top - 0.15, zm], [xe, top, zm], [xe, yAt(z0), z0]], M.timber, g);
    quad([[xe, top - 0.15, zm], [xe, yAt(z1) - 0.15, z1], [xe, yAt(z1), z1], [xe, top, zm]], M.timber, g);
  }
  return top;
}

function hipRoof(r) {
  const tan = Math.tan(THREE.MathUtils.degToRad(D.LEVELS.roofPitch));
  const e = D.LEVELS.eave - D.LEVELS.eaveOverhang * tan;
  const [x0, x1] = r.x, [z0, z1] = r.z;
  const hw = (x1 - x0) / 2, h = hw * tan, xm = (x0 + x1) / 2;
  const R1 = [xm, e + h, z0 + hw], R2 = [xm, e + h, z1 - hw];
  const A = [x0, e, z0], B = [x1, e, z0], C = [x1, e, z1], Dd = [x0, e, z1];
  const g = G('roof');
  quad([A, B, R1], M.roof, g); quad([B, C, R2, R1], M.roof, g);
  quad([C, Dd, R2], M.roof, g); quad([Dd, A, R1, R2], M.roof, g);
  // soffit
  quad([A, B, C, Dd], M.roof, g);
  return e + h;
}
function leanRoof(r) {
  const [x0, x1] = r.x, [z0, z1] = r.z, [ya, yb] = r.y;
  const g = G('roof');
  quad([[x0, ya, z0], [x1, ya, z0], [x1, yb, z1], [x0, yb, z1]], M.roof, g);
  quad([[x0, ya - 0.12, z0], [x1, ya - 0.12, z0], [x1, ya, z0], [x0, ya, z0]], M.roof, g); // fascia
}

// ---------- stair ----------
function stair() {
  // each flight: (risers − 1) treads; the last riser steps onto the landing / upper floor
  const s = D.STAIR, g = G('gf'), r = s.riser;
  let y = 0;
  s.flights.forEach((f, k) => {
    const n = f.risers - 1, run = (f.to - f.from) / n;
    for (let i = 0; i < n; i++) {
      const a = f.from + i * run, b = a + run, top = y + (i + 1) * r;
      const bottom = k === 0 ? 0 : top - r - 0.06;          // solid first flight, open treads above
      if (f.axis === 'z') box(f.across[0], f.across[1], bottom, top, Math.min(a, b), Math.max(a, b), M.timber, g);
      else box(Math.min(a, b), Math.max(a, b), bottom, top, f.across[0], f.across[1], M.timber, g);
    }
    y += f.risers * r;
    if (k === 0) box(s.landing.x[0], s.landing.x[1], 0, y, s.landing.z[0], s.landing.z[1], M.timber, g);
  });
}

// ---------- upper floor slab with stair opening ----------
function ffSlab() {
  // slab split into strips along z so the stair openings stay open
  const { x, z } = D.FF_SLAB, ops = D.STAIR.ffOpenings, y0 = D.LEVELS.ff - D.LEVELS.ffSlab, y1 = D.LEVELS.ff;
  const g = G('ff');
  const zs = [...new Set([z[0], z[1], ...ops.flatMap(o => o.z)])].sort((p, q) => p - q);
  for (let i = 0; i < zs.length - 1; i++) {
    const za = zs[i], zb = zs[i + 1], zm = (za + zb) / 2;
    const holes = ops.filter(o => o.z[0] <= zm && zm <= o.z[1]).map(o => o.x).sort((p, q) => p[0] - q[0]);
    let cx = x[0];
    for (const h of holes) { box(cx, h[0], y0, y1, za, zb, M.floor, g); cx = Math.max(cx, h[1]); }
    box(cx, x[1], y0, y1, za, zb, M.floor, g);
  }
  // ceiling under roof with the opening (F04)
  const c = D.CEILING_HOLE, yc = D.LEVELS.ffCeiling, cg = G('ceiling');
  box(0.6, 9.3, yc, yc + 0.03, 2.6, c.z[0], M.floor, cg);
  box(0.6, 9.3, yc, yc + 0.03, c.z[1], 17.4, M.floor, cg);
  box(0.6, c.x[0], yc, yc + 0.03, c.z[0], c.z[1], M.floor, cg);
}

function demolished() {
  const g = G('ff');
  for (const d of D.DEMOLISHED) {
    const y = d.y + 0.02;
    const pts = [[d.x[0], d.z[0]], [d.x[1], d.z[0]], [d.x[1], d.z[1]], [d.x[0], d.z[1]], [d.x[0], d.z[0]]]
      .map(([x, z]) => new THREE.Vector3(x, y, -z));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), M.ghost);
    l.computeLineDistances(); g.add(l);
  }
}

function fixtures() {
  const g = G('gf'), s = D.SINK;
  box(s.x[0], s.x[1], 0, s.h, s.z[0], s.z[1], M.timber, g);
  for (const p of D.WC_PANS) box(p.x - 0.2, p.x + 0.2, 0, 0.4, p.z - 0.28, p.z + 0.28, M.wall, g);
}

// ---------- site ----------
function site() {
  const S = D.SITE; let g = G('site'), yg = D.LEVELS.ground;
  box(-30, 45, yg - 0.3, yg, -45, 15, M.site, g, false);                              // ground
  box(-30, 45, yg - 0.05, yg + 0.12, S.sidewalk.z[0], S.sidewalk.z[1], M.site, g);   // sidewalk
  box(-30, 45, yg - 0.1, yg - 0.02, S.road.z[0], S.road.z[1], M.road, g);            // road
  const p = S.passage; box(p.x[0], p.x[1], yg, yg + 0.03, p.z[0], p.z[1], M.floor, g);
  const pa = S.patio; box(pa.x[0], pa.x[1], yg, yg + 0.03, pa.z[0], pa.z[1], M.floor, g);
  // plot boundary (dashed)
  const pl = D.PLOT, y = yg + 0.06;
  const pts = [[pl.x[0], pl.z[0]], [pl.x[1], pl.z[0]], [pl.x[1], pl.z[1]], [pl.x[0], pl.z[1]], [pl.x[0], pl.z[0]]]
    .map(([x, z]) => new THREE.Vector3(x, y, -z));
  const bl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineDashedMaterial({ color: 0x2e86c1, dashSize: 0.5, gapSize: 0.25 }));
  bl.computeLineDistances(); g.add(bl);
  g = G('landscape');
  // timber gate (slats)
  const gt = S.gate;
  for (let x = gt.x[0] + 0.05; x < gt.x[1]; x += 0.16) box(x, x + 0.09, yg, yg + gt.h, gt.z - 0.03, gt.z + 0.03, M.timber, g);
  // temple wall with pointed crenels
  const tw = S.templeWall, gc = G('context');
  box(tw.x[0], tw.x[1], yg, yg + tw.h, tw.z[0], tw.z[1], M.wall, gc);
  for (let z = tw.z[0] + 0.25; z < tw.z[1]; z += 0.5) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 4), M.wall);
    c.position.set((tw.x[0] + tw.x[1]) / 2, yg + tw.h + 0.2, -z); c.rotation.y = Math.PI / 4;
    addEdges(c); gc.add(c);
  }
  // rear lattice fence
  const rf = S.rearFence;
  for (let x = rf.x[0]; x <= rf.x[1]; x += 0.3) box(x, x + 0.04, yg, yg + rf.h, rf.z[0], rf.z[1], M.timber, g);
  for (let h = 0.3; h <= rf.h; h += 0.3) box(rf.x[0], rf.x[1], yg + h - 0.02, yg + h, rf.z[0], rf.z[1], M.timber, g);
  // trees (frangipani)
  for (const t of S.trees) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 8), M.timber);
    tr.position.set(t.x, yg + 1.2, -t.z); g.add(tr);
    const cn = new THREE.Mesh(new THREE.IcosahedronGeometry(t.r * 0.8, 1), M.tree);
    cn.scale.set(1, 0.55, 1); cn.position.set(t.x, yg + 2.4 + t.r * 0.35, -t.z);
    addEdges(cn, true); g.add(cn);
  }
  // spirit house
  const sh = S.spiritHouse;
  box(sh.x - 0.06, sh.x + 0.06, yg, yg + 1.2, sh.z - 0.06, sh.z + 0.06, M.timber, g);
  box(sh.x - 0.3, sh.x + 0.3, yg + 1.2, yg + 1.6, sh.z - 0.25, sh.z + 0.25, M.wall, g);
  quad([[sh.x - 0.35, yg + 1.6, sh.z - 0.3], [sh.x + 0.35, yg + 1.6, sh.z - 0.3], [sh.x, yg + 1.95, sh.z]], M.roof, g);
}

function context() {
  const S = D.SITE, g = G('context'), yg = D.LEVELS.ground;
  for (const n of S.neighbours) {
    box(n.x[0], n.x[1], yg, yg + n.h, n.z[0], n.z[1], M.context, g);
    hipBlock(n.x, n.z, yg + n.h, 25, g);
  }
  const t = S.temple;
  box(t.x[0], t.x[1], yg + 0.6, yg + t.h, t.z[0], t.z[1], M.context, g);
  box(t.x[0] - 0.5, t.x[1] + 0.5, yg, yg + 0.6, t.z[0] - 0.5, t.z[1] + 0.5, M.context, g);
  hipBlock([t.x[0] - 0.8, t.x[1] + 0.8], [t.z[0] - 0.8, t.z[1] + 0.8], yg + t.h, 35, g);
}
function hipBlock(xr, zr, e, pitch, g) {
  const tan = Math.tan(THREE.MathUtils.degToRad(pitch));
  const [x0, x1] = xr, [z0, z1] = zr, w = x1 - x0, d = z1 - z0;
  const A = [x0, e, z0], B = [x1, e, z0], C = [x1, e, z1], Dd = [x0, e, z1];
  if (d >= w) {
    const hw = w / 2, xm = (x0 + x1) / 2, R1 = [xm, e + hw * tan, z0 + hw], R2 = [xm, e + hw * tan, z1 - hw];
    quad([A, B, R1], M.context, g); quad([B, C, R2, R1], M.context, g); quad([C, Dd, R2], M.context, g); quad([Dd, A, R1, R2], M.context, g);
  } else {
    const hd = d / 2, zm = (z0 + z1) / 2, R1 = [x0 + hd, e + hd * tan, zm], R2 = [x1 - hd, e + hd * tan, zm];
    quad([A, B, R2, R1], M.context, g); quad([B, C, R2], M.context, g); quad([C, Dd, R1, R2], M.context, g); quad([Dd, A, R1], M.context, g);
  }
}

export function buildModel(scene) {
  for (const w of D.WALLS) buildWall(w);
  for (const s of D.SLABS) box(s.x[0], s.x[1], s.y[0], s.y[1], s.z[0], s.z[1], M.floor, G(s.y[0] >= 3 ? 'ff' : 'gf'));
  ffSlab(); stair(); demolished(); fixtures();
  for (const c of D.COLUMNS) {
    const y0 = c.floor === '1F' ? D.LEVELS.ff : 0;
    box(c.x - c.s / 2, c.x + c.s / 2, y0, y0 + c.h, c.z - c.s / 2, c.z + c.s / 2, M.wall, G(c.floor === '1F' ? 'ff' : 'gf'));
  }
  let ridge = 0;
  for (const r of D.ROOFS) {
    if (r.type === 'hip') ridge = Math.max(ridge, hipRoof(r));
    else if (r.type === 'gable') ridge = Math.max(ridge, gableRoof(r));
    else leanRoof(r);
  }
  site(); context();
  for (const k of ['gf', 'ff', 'ceiling', 'roof', 'site', 'landscape', 'context']) scene.add(G(k));
  return { ridge };
}
