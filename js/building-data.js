// LPB-001 — Existing building, Option A (whole building)
// Source: exiting_v2.dwg (site measure 16-11-2026) + site photos + Street View.
// Units: metres. Plan axes: x = left→right seen from the road, z = road (0) → rear (28.5).
// Levels: y = height, ±0.00 = ground-floor finished floor level (FFL).
// CAD → data: x = (cadX + 106492) / 1000   (upper floor: cadX + 80922)
//             z = (cadY − 12950) / 1000
// Edit numbers here; model, plans, elevations and dimensions all update.
// Values marked "to measure" are standard assumptions agreed with the team.

export const LEVELS = {
  ground: -0.40,          // existing ground
  gf: 0.00,               // ground floor FFL
  ff: 3.50,               // first floor FFL (20 risers × 175 mm)
  ffSlab: 0.25,           // floor build-up below +3.50 (to measure)
  ffCeiling: 6.80,        // upper ceiling (to measure)
  eave: 7.00,             // wall top / eave (to measure)
  roofPitch: 30,          // degrees (approx.)
  eaveOverhang: 0.60,     // to measure
};

export const PLOT = { x: [0, 11.9], z: [0, 28.5] };

export const STAIR = {
  risers: 20, riser: 0.175, width: 0.9,
  // From exiting_v2 (CAD): treads 0.20 m, width 0.90 m, 10 + 10 risers.
  // Flight 1 starts at GF near the front (z 6.70) and rises toward the rear to the landing.
  // Landing 0.90 × 0.90 at x 1.20–2.10, z 8.50–9.40 (+1.75).
  // Flight 2 rises toward +x and arrives in the 1F corridor at x 3.90.
  flights: [
    { axis: 'z', from: 6.7, to: 8.5, across: [1.2, 2.1], risers: 10 },
    { axis: 'x', from: 2.1, to: 3.9, across: [8.5, 9.4], risers: 10 },
  ],
  landing: { x: [1.2, 2.1], z: [8.5, 9.4] },
  // 1F floor openings (void over the stair)
  ffOpenings: [ { x: [0.6, 2.2], z: [6.6, 9.4] }, { x: [2.2, 3.9], z: [8.5, 9.4] } ],
};

// Opening types: door, fold (front folding glass doors + transom), win (timber louvre window)
// s = range along the wall's long axis; sill / head measured from the wall base.
const W = (a, b) => ({ s: [a, b], sill: 1.0, head: 2.4, type: 'win' });   // sill +1.00, 0.9×1.4 (to measure)
const D = (a, b, head = 2.1) => ({ s: [a, b], sill: 0, head, type: 'door' });

export const WALLS = [
  // ---------- GROUND FLOOR (y 0 → 3.50) ----------
  { id: 'GF front', floor: 'GF', x: [0.5, 9.4], z: [2.5, 2.6], y: [0, 3.5],
    open: [ { s: [1.03, 3.38], sill: 0, head: 3.0, type: 'fold' },
            { s: [3.94, 5.66], sill: 0, head: 3.0, type: 'fold' },
            { s: [6.38, 8.73], sill: 0, head: 3.0, type: 'fold' } ] },
  { id: 'GF left',  floor: 'GF', x: [0.5, 0.6], z: [2.6, 17.4], y: [0, 3.5],
    open: [ W(3.6, 4.5), W(10.8, 11.7), W(13.6, 14.5), W(15.8, 16.7) ] },
  { id: 'GF right', floor: 'GF', x: [9.3, 9.4], z: [2.6, 17.4], y: [0, 3.5],
    open: [ W(3.6, 4.5), W(5.9, 6.8), W(10.8, 11.7), W(13.6, 14.5) ] },
  { id: 'GF rear',  floor: 'GF', x: [0.5, 9.4], z: [17.4, 17.5], y: [0, 3.5],
    open: [ D(4.7, 5.6), D(6.6, 7.5), W(8.0, 8.9) ] },   // door + shutter window at right: from photo, not in CAD
  { id: 'GF long partition', floor: 'GF', x: [5.7, 5.8], z: [8.5, 17.4], y: [0, 3.5],
    open: [ D(16.1, 17.0) ] },
  // rear annex (WC block) — GF
  { id: 'Annex left',  floor: 'GF', x: [0.5, 0.6], z: [17.5, 20.5], y: [0, 3.5], open: [] },
  { id: 'Annex right', floor: 'GF', x: [5.8, 5.9], z: [17.5, 20.5], y: [0, 3.5],
    open: [ { s: [18.5, 19.5], sill: 0.9, head: 2.0, type: 'hole' } ] },   // plain square opening (photo)
  { id: 'Annex rear',  floor: 'GF', x: [0.6, 5.8], z: [20.4, 20.5], y: [0, 3.5], open: [ D(4.7, 5.6) ] },
  { id: 'WC wall A',   floor: 'GF', x: [2.9, 3.0], z: [17.5, 20.4], y: [0, 3.5], open: [] },
  { id: 'WC wall B',   floor: 'GF', x: [4.5, 4.6], z: [17.5, 20.4], y: [0, 3.5],
    open: [ D(17.95, 18.75), D(19.45, 20.25) ] },
  { id: 'WC divider',  floor: 'GF', x: [3.0, 4.5], z: [18.9, 19.0], y: [0, 3.5], open: [] },

  // ---------- FIRST FLOOR (y 3.50 → 7.00) ----------
  { id: '1F front', floor: '1F', x: [0.5, 9.4], z: [2.5, 2.6], y: [3.5, 7.0],
    open: [ W(1.75, 2.65), W(4.35, 5.25), W(7.0, 7.9) ] },
  { id: '1F left',  floor: '1F', x: [0.5, 0.6], z: [2.6, 17.4], y: [3.5, 7.0],
    open: [ W(4.3, 5.2), W(11.2, 12.1), W(15.2, 16.1) ] },
  { id: '1F right', floor: '1F', x: [9.3, 9.4], z: [2.6, 17.4], y: [3.5, 7.0],
    open: [ W(4.0, 4.9), W(12.8, 13.7), W(15.2, 16.1) ] },
  { id: '1F rear',  floor: '1F', x: [0.5, 9.4], z: [17.4, 17.5], y: [3.5, 7.0],
    open: [ W(1.75, 2.65), D(4.35, 5.25), W(7.0, 7.9) ] },
  { id: 'Corridor wall L', floor: '1F', x: [3.8, 3.9], z: [2.6, 17.4], y: [3.5, 6.8],
    open: [ D(7.2, 8.1), D(12.7, 13.6), D(16.2, 17.1) ] },
  { id: 'Corridor wall R1', floor: '1F', x: [5.7, 5.8], z: [2.6, 8.5],  y: [3.5, 6.8], open: [] },
  { id: 'Corridor wall R2', floor: '1F', x: [5.7, 5.8], z: [10.1, 17.4], y: [3.5, 6.8], open: [] },
  { id: 'F01/F02 wall', floor: '1F', x: [0.6, 3.8], z: [9.4, 9.5],   y: [3.5, 6.8], open: [] },
  { id: 'F02/F03 wall', floor: '1F', x: [0.6, 3.8], z: [13.8, 13.9], y: [3.5, 6.8], open: [] },
  { id: 'Stair wall',   floor: '1F', x: [0.6, 2.2], z: [6.55, 6.65], y: [3.5, 6.8], open: [] },
  { id: 'Stair/F01 wall A', floor: '1F', x: [2.1, 2.2], z: [6.65, 8.5], y: [3.5, 6.8], open: [] },
  { id: 'Stair/F01 wall B', floor: '1F', x: [2.2, 3.8], z: [8.4, 8.5], y: [3.5, 6.8], open: [] },
  { id: 'F05/lobby wall', floor: '1F', x: [5.8, 9.3], z: [8.4, 8.5],   y: [3.5, 6.8], open: [ D(6.0, 6.9) ] },
  { id: 'Lobby/F04 wall', floor: '1F', x: [5.8, 9.3], z: [10.1, 10.2], y: [3.5, 6.8], open: [ D(6.0, 6.9) ] },
  { id: 'Bath wall A', floor: '1F', x: [7.0, 9.3], z: [6.7, 6.8], y: [3.5, 6.8], open: [] },
  { id: 'Bath wall B', floor: '1F', x: [7.0, 7.1], z: [6.8, 8.4], y: [3.5, 6.8], open: [ D(7.2, 7.9) ] },
  // F08 = rear room projecting over the annex (photo): solid side walls, flat concrete roof slab,
  // decorative balustrade on the garden side, open between balustrade and slab.
  { id: 'F08 side wall L', floor: '1F', x: [0.5, 0.6], z: [17.5, 20.5], y: [3.5, 6.35], open: [] },
  { id: 'F08 side wall R', floor: '1F', x: [5.75, 5.9], z: [17.5, 20.5], y: [3.5, 6.35], open: [] },
  { id: 'F08 balustrade', floor: '1F', x: [0.6, 5.75], z: [20.35, 20.5], y: [3.5, 4.4], open: [], balustrade: true },
];

// Ex-bathroom: walls demolished — shown as a dashed footprint only.
export const DEMOLISHED = [ { x: [7.0, 9.3], z: [10.2, 11.9], y: 3.5 } ];
// Ceiling open to roof structure (photos 1, 2, 14, 15, 19) — in F04, over the ex-bathroom.
export const CEILING_HOLE = { x: [7.0, 9.3], z: [10.2, 13.0] };

export const SLABS = [
  { id: 'GF floor + plinth', x: [0.5, 9.4], z: [0.5, 17.5], y: [-0.4, 0] },
  { id: 'Front step 1', x: [0.5, 9.4], z: [0.0, 0.25], y: [-0.4, -0.2] },
  { id: 'Front step 2', x: [0.5, 9.4], z: [0.25, 0.5], y: [-0.4, -0.05] },
  { id: 'Annex floor', x: [0.5, 5.9], z: [17.5, 20.5], y: [-0.4, 0] },
  { id: 'Covered terrace', x: [0.5, 5.9], z: [20.5, 23.0], y: [-0.4, -0.05] },
  { id: 'F08 floor (annex roof)', x: [0.5, 5.9], z: [17.5, 20.5], y: [3.25, 3.5] },
  { id: 'F08 flat roof slab', x: [0.4, 6.0], z: [17.45, 20.6], y: [6.35, 6.65] },
];
// Upper floor slab is built separately (it has the stair opening).
export const FF_SLAB = { x: [0.5, 9.4], z: [2.5, 17.5] };

// Column grid from exiting_v2 (200 × 200 columns, centre lines). Plan dimensions follow this grid.
export const GRID = {
  x: [ { id: 'A', v: 0.6 }, { id: 'B', v: 3.8 }, { id: 'C', v: 5.8 }, { id: 'D', v: 9.3 } ],
  z: [ { id: '1', v: 0.6 }, { id: '2', v: 2.6 }, { id: '3', v: 5.4 }, { id: '4', v: 8.4 }, { id: '5', v: 10.2 },
       { id: '6', v: 13.9 }, { id: '7', v: 17.4 }, { id: '8', v: 20.4 }, { id: '9', v: 22.4 } ],
  zFF: ['2', '3', '4', '5', '6', '7', '8'],        // grid lines that exist on the upper floor
};
const gx = (id) => GRID.x.find(g => g.id === id).v, gz = (id) => GRID.z.find(g => g.id === id).v;

// columns at grid intersections (from CAD). h = top of column above its floor.
export const COLUMNS = [
  // front veranda posts, grid 1
  ...['A', 'B', 'C', 'D'].map(c => ({ x: gx(c), z: gz('1'), h: 2.9, s: 0.2 })),
  // ground floor grid 2–7, all four lines (hall columns on B and C)
  ...['2', '3', '4', '5', '6', '7'].flatMap(r => ['A', 'B', 'C', 'D'].map(c => ({ x: gx(c), z: gz(r), h: 3.25, s: 0.2 }))),
  // annex corners, grid 8
  ...['A', 'B', 'C'].map(c => ({ x: gx(c), z: gz('8'), h: 3.25, s: 0.2 })),
  // rear projecting-roof posts, grid 9 (middle post at x 3.20 per CAD)
  { x: 0.6, z: gz('9'), h: 2.7, s: 0.2 }, { x: 3.2, z: gz('9'), h: 2.7, s: 0.2 }, { x: 5.8, z: gz('9'), h: 2.7, s: 0.2 },
  // upper floor columns (in walls), floor: '1F'
  ...['2', '3', '4', '5', '6', '7'].flatMap(r => ['A', 'B', 'C', 'D'].map(c => ({ x: gx(c), z: gz(r), h: 3.3, s: 0.2, floor: '1F' }))),
  { x: gx('A'), z: gz('8'), h: 2.85, s: 0.2, floor: '1F' }, { x: gx('C'), z: gz('8'), h: 2.85, s: 0.2, floor: '1F' },
];

export const ROOFS = [
  // main roof: two gabled roofs side by side, ridges run across the plot (parallel to the road),
  // gable ends on the left and right walls (aerial photo). wallZ = wall lines under each roof.
  { id: 'Front gable roof', type: 'gable', x: [-0.1, 10.0], z: [1.9, 10.0], wallZ: [2.5, 10.0], wallX: [0.5, 9.4] },
  { id: 'Rear gable roof',  type: 'gable', x: [-0.1, 10.0], z: [10.0, 18.1], wallZ: [10.0, 17.5], wallX: [0.5, 9.4] },
  // lean-to roofs: y0 at z0 edge, y1 at z1 edge
  { id: 'Front veranda roof', type: 'lean', x: [0.2, 9.7], z: [0.3, 2.55], y: [2.85, 3.40] },
  // timber lean-to on posts, fixed to the annex rear wall below the terrace balustrade (photo)
  { id: 'Rear projecting roof', type: 'lean', x: [0.3, 6.1], z: [20.5, 23.3], y: [3.05, 2.55] },
];

export const SINK = { x: [8.8, 9.3], z: [16.2, 17.4], h: 0.85 };
export const WC_PANS = [ { x: 3.2, z: 18.3 }, { x: 3.2, z: 19.8 } ];

export const SITE = {
  sidewalk: { z: [-1.2, 0] },
  road: { z: [-7.2, -1.2], name: 'Sakkaline Rd' },
  passage: { x: [9.4, 11.9], z: [2.7, 23.0] },
  gate: { x: [9.4, 11.9], z: 2.55, h: 1.8 },   // flush with the front wall
  templeWall: { x: [11.9, 12.2], z: [0, 28.5], h: 1.6 },
  rearFence: { x: [0, 11.9], z: [28.4, 28.5], h: 1.8 },
  patio: { x: [0, 11.9], z: [23.0, 26.0] },
  trees: [ { x: 10.33, z: 25.15, r: 2.2 }, { x: 8.33, z: 27.25, r: 1.9 }, { x: 11.03, z: 27.65, r: 1.5 } ],
  spiritHouse: { x: 11.45, z: 26.8 },
  neighbours: [
    { id: 'Left neighbour', x: [-9.5, -0.05], z: [2.0, 16.0], h: 6.5 },
    { id: 'Left neighbour rear', x: [-9.5, -0.05], z: [17.0, 27.0], h: 3.5 },
  ],
  temple: { x: [17.0, 26.0], z: [6.0, 20.0], h: 4.5, label: 'Wat Sensoukharam' },
};

export const ROOMS = [
  { code: 'G01', en: 'Front veranda', area: 17.4, floor: 'GF', x: 4.95, z: 1.5 },
  { code: 'G02', en: 'Main hall', area: 65.6, floor: 'GF', x: 3.0, z: 13.0 },
  { code: 'G03', en: 'Side bay', area: 51.8, floor: 'GF', x: 7.55, z: 11.0 },
  { code: 'G04', en: 'Stair', area: 9.9, floor: 'GF', x: 2.4, z: 7.6 },
  { code: 'G06', en: 'WC ×2', area: 4.4, floor: 'GF', x: 3.75, z: 19.6 },
  { code: '—',   en: 'Rear room (annex)', area: 6.7, floor: 'GF', x: 1.75, z: 19.0 },
  { code: 'G05', en: 'Covered rear terrace', area: 13.5, floor: 'GF', x: 3.2, z: 21.7 },
  { code: 'G07', en: 'Rear terrace + garden', area: 0, floor: 'GF', x: 4.0, z: 25.5 },
  { code: '—',   en: 'Side passage', area: 0, floor: 'GF', x: 10.65, z: 10.0 },
  { code: 'F01', en: 'Room, empty', area: 12.5, floor: '1F', x: 2.2, z: 4.4 },
  { code: 'F02', en: 'Room, empty', area: 13.8, floor: '1F', x: 2.2, z: 11.6 },
  { code: 'F03', en: 'Room, empty', area: 11.2, floor: '1F', x: 2.2, z: 15.6 },
  { code: 'F04', en: 'Room, ceiling open', area: 25.2, floor: '1F', x: 7.4, z: 15.0 },
  { code: 'F05', en: 'Room, empty', area: 20.0, floor: '1F', x: 6.6, z: 4.6 },
  { code: 'F06', en: 'Corridor', area: 26.5, floor: '1F', x: 4.8, z: 12.0 },
  { code: 'F07', en: 'Stair', area: 4.5, floor: '1F', x: 1.4, z: 7.9 },
  { code: 'F08', en: 'Rear room, projecting', area: 15.5, floor: '1F', x: 3.15, z: 19.0 },
  { code: '—',   en: 'Bathroom', area: 3.9, floor: '1F', x: 8.2, z: 7.6 },
  { code: '—',   en: 'Lobby', area: 5.6, floor: '1F', x: 7.5, z: 9.3 },
  { code: '—',   en: 'Ex-bathroom, demolished', area: 3.9, floor: '1F', x: 8.15, z: 11.05 },
];

// Plan dimensions: from/to points (x,z), offset direction, floor tag.
// Extra plan dimensions (grid dimensions are generated from GRID in dimensions.js).
export const DIMS = [
  { tag: 'GF', a: [9.4, 15.0], b: [11.9, 15.0], off: [0, 0], t: '2.50 passage' },
  { tag: 'GF', a: [0, 28.5], b: [11.9, 28.5], off: [0, 1.0], t: '11.90 (plot)' },
  { tag: 'GF', a: [11.9, 0], b: [11.9, 28.5], off: [2.6, 0], t: '28.50 (plot)' },
];

export const LEVEL_MARKS = [
  { y: -0.40, t: '−0.40 existing ground' },
  { y: 0.00, t: '±0.00 GF finished floor' },
  { y: 3.50, t: '+3.50 1F finished floor' },
  { y: 7.00, t: '+7.00 eave (to measure)' },
  { y: null, t: 'ridges, 2 gables (approx.)' }, // y computed from roof
];
