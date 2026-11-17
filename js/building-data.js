// LPB-001 — Existing building, Option A (whole building)
// Source: exiting_v2.dwg, FINAL measure (17-11-2026): "GROUND FLOOR" and "Two FLOOR" plans drawn inside the
// 12.2 × 28.5 m plot box (left of the drawing, around cad x −161k…−124k). Site photos 16/17-11-2026.
// Units: metres. Plan axes: x = left→right seen from the road, z = road (0) → rear (28.5).
// Levels: y = height, ±0.00 = ground-floor finished floor level (FFL).
// CAD → data: x = (cadX + 160932) / 1000   (upper floor: cadX + 136727)   — plot box left edge = 0
//             z = (cadY − 12950) / 1000                                    — plot box front edge = 0
// Edit numbers here; model, plans, elevations and dimensions all update.
// Values marked "to measure" are standard assumptions agreed with the team.

// CAD levels (datum = existing ground): ground +0.00, ground floor +0.30, upper floor +3.20.
// Here the datum is the GF floor, so: ground −0.30, GF ±0.00, 1F +2.90 (floor to floor 2.90).
const FF = 2.90;

export const LEVELS = {
  ground: -0.30,          // existing ground (CAD +0.00)
  gf: 0.00,               // ground floor FFL (CAD +0.30)
  ff: FF,                 // first floor FFL (CAD +3.20)
  ffSlab: 0.25,           // floor build-up below the 1F floor (to measure)
  ffCeiling: FF + 3.30,   // upper ceiling (to measure)
  eave: FF + 3.50,        // wall top / eave (to measure)
  roofPitch: 30,          // degrees (approx.)
  eaveOverhang: 0.60,     // to measure
};

export const PLOT = { x: [0, 12.2], z: [0, 28.5] };   // CAD plot box 12.20 × 28.50 = 347.7 m²

export const STAIR = {
  // From the final CAD: L-shaped stair in x 2.40–4.80, z 6.40–8.40, treads 0.23 m, width 0.90 m.
  // Flight 1 starts at GF near the front (z 6.43) and rises toward the rear to the landing.
  // Landing 0.90 × 0.90 at x 2.40–3.30, z 7.50–8.40.
  // Flight 2 rises toward +x and arrives in the 1F corridor at x 4.80.
  // 6 + 8 = 14 risers over 2.90 m (riser ≈ 0.207).
  risers: 14, riser: FF / 14, width: 0.9,
  flights: [
    { axis: 'z', from: 6.43, to: 7.5, across: [2.4, 3.3], risers: 6 },
    { axis: 'x', from: 3.3, to: 4.8, across: [7.5, 8.4], risers: 8 },
  ],
  landing: { x: [2.4, 3.3], z: [7.5, 8.4] },
  // 1F floor opening (stair + the void marked with a cross beside flight 1)
  ffOpenings: [ { x: [2.4, 4.8], z: [6.4, 8.4] } ],
};

// Opening types: door, fold (front folding glass doors + transom), win (timber louvre window), hole
// s = range along the wall's long axis; sill / head measured from the wall base.
const W = (a, b) => ({ s: [a, b], sill: 1.0, head: 2.4, type: 'win' });   // CAD windows 1.10 wide, sill +1.00
const D = (a, b, head = 2.1) => ({ s: [a, b], sill: 0, head, type: 'door' });
const GF = [0, FF], F1 = [FF, FF + 3.5], F1i = [FF, FF + 3.3];          // wall heights

export const WALLS = [
  // ---------- GROUND FLOOR (y 0 → 1F) ----------
  { id: 'GF front', floor: 'GF', x: [1.0, 9.7], z: [2.5, 2.6], y: GF,
    open: [ { s: [1.55, 3.35], sill: 0, head: 2.6, type: 'fold' },
            { s: [4.0, 5.8], sill: 0, head: 2.6, type: 'fold' },
            { s: [7.025, 8.825], sill: 0, head: 2.6, type: 'fold' } ] },
  { id: 'GF left',  floor: 'GF', x: [1.0, 1.1], z: [2.6, 17.4], y: GF,
    open: [ W(3.45, 4.55), W(8.777, 9.877), W(10.618, 11.718), W(15.1, 16.2) ] },
  { id: 'GF right', floor: 'GF', x: [9.6, 9.7], z: [2.6, 17.4], y: GF,
    open: [ W(3.45, 4.55), W(6.35, 7.45), W(11.5, 12.6), W(15.1, 16.2) ] },
  // rear: double door to the annex; old door at x 2.1–3.0 is closed with brick (CAD note)
  { id: 'GF rear',  floor: 'GF', x: [1.0, 9.7], z: [17.4, 17.5], y: GF,
    open: [ D(4.95, 5.95), W(7.3, 8.4) ] },
  // long partition on grid B (old unit | side unit), from z 8.50 to the rear
  { id: 'GF long partition', floor: 'GF', x: [6.05, 6.15], z: [8.5, 17.4], y: GF,
    open: [ D(16.2, 17.1) ] },
  // toilet (front left) + stair enclosure
  { id: 'GF toilet front', floor: 'GF', x: [1.1, 2.4], z: [6.3, 6.4], y: GF, open: [] },
  { id: 'GF toilet/stair', floor: 'GF', x: [2.3, 2.4], z: [6.4, 8.4], y: GF, open: [] },
  { id: 'GF stair rear',   floor: 'GF', x: [1.1, 4.8], z: [8.4, 8.5], y: GF, open: [ D(1.4, 2.2) ] },
  // x 4.70–4.80 line: walls removed (CAD), only short stubs remain
  { id: 'GF stub 1', floor: 'GF', x: [4.7, 4.8], z: [8.5, 8.7], y: GF, open: [] },
  { id: 'GF stub 2', floor: 'GF', x: [4.7, 4.8], z: [11.85, 14.2], y: GF, open: [] },
  { id: 'GF stub 3', floor: 'GF', x: [4.7, 4.8], z: [17.2, 17.4], y: GF, open: [] },
  // cross wall in the left bay + septic tank / toilet box
  { id: 'GF cross wall',  floor: 'GF', x: [1.1, 4.7], z: [12.05, 12.15], y: GF, open: [] },
  { id: 'Septic wall L',  floor: 'GF', x: [3.0, 3.1], z: [12.15, 14.0], y: GF, open: [] },
  { id: 'Septic wall R',  floor: 'GF', x: [3.1, 4.7], z: [13.9, 14.0], y: GF, open: [] },
  // rear annex (WC block) — GF
  { id: 'Annex left',  floor: 'GF', x: [1.0, 1.1], z: [17.5, 20.2], y: GF, open: [] },
  { id: 'Annex right', floor: 'GF', x: [6.1, 6.2], z: [17.5, 20.2], y: GF,
    open: [ { s: [18.5, 19.5], sill: 0.9, head: 2.0, type: 'hole' } ] },   // plain square opening (photo)
  { id: 'Annex rear',  floor: 'GF', x: [1.1, 6.1], z: [20.1, 20.2], y: GF, open: [ D(4.95, 5.95) ] },
  { id: 'WC wall A',   floor: 'GF', x: [3.2, 3.3], z: [17.5, 20.1], y: GF, open: [] },
  { id: 'WC wall B',   floor: 'GF', x: [4.7, 4.8], z: [17.5, 20.1], y: GF,
    open: [ D(18.125, 18.9), D(19.225, 20.0) ] },
  { id: 'WC divider',  floor: 'GF', x: [3.3, 4.7], z: [19.0, 19.1], y: GF, open: [] },

  // ---------- FIRST FLOOR (y 1F → eave) ----------
  { id: '1F front', floor: '1F', x: [1.0, 9.7], z: [2.5, 2.6], y: F1,
    open: [ W(2.15, 3.25), W(4.75, 5.85), W(7.494, 8.594) ] },
  { id: '1F left',  floor: '1F', x: [1.0, 1.1], z: [2.6, 17.4], y: F1,
    open: [ W(3.45, 4.55), W(8.768, 9.868), W(10.618, 11.718), W(15.1, 16.2) ] },
  { id: '1F right', floor: '1F', x: [9.6, 9.7], z: [2.6, 17.4], y: F1,
    open: [ W(3.45, 4.55), W(6.35, 7.45), W(8.767, 9.867), W(11.5, 12.6), W(15.1, 16.2) ] },
  { id: '1F rear',  floor: '1F', x: [1.0, 9.7], z: [17.4, 17.5], y: F1,
    open: [ W(1.4, 2.5), D(4.95, 5.95), W(7.3, 8.4) ] },
  // F01 rear wall (door to the landing); the part at the 1F toilet (x 1.1–2.1) is removed
  { id: 'F01 rear wall', floor: '1F', x: [2.1, 6.05], z: [6.3, 6.4], y: F1i, open: [ D(4.95, 5.85) ] },
  { id: '1F toilet/stair', floor: '1F', x: [2.3, 2.4], z: [6.4, 8.4], y: F1i, open: [] },
  { id: '1F stair rear',   floor: '1F', x: [1.1, 4.8], z: [8.4, 8.5], y: F1i, open: [] },
  // corridor wall left (x 4.70–4.80): doors and walls removed beside F02 and F03 (CAD); stub at the store
  { id: 'Corridor stub', floor: '1F', x: [4.7, 4.8], z: [11.9, 14.0], y: F1i, open: [] },
  // corridor wall right on grid B: F01|F05 and F04; open at the lobby (z 8.4–10.2)
  { id: 'Corridor wall R1', floor: '1F', x: [6.05, 6.15], z: [2.6, 8.4],  y: F1i, open: [ D(7.6, 8.4) ] },
  { id: 'Corridor wall R2', floor: '1F', x: [6.05, 6.15], z: [10.2, 17.4], y: F1i, open: [ D(10.2, 11.0) ] },
  { id: 'F05/lobby wall', floor: '1F', x: [6.15, 9.6], z: [8.4, 8.5],   y: F1i, open: [] },
  { id: 'Lobby/F04 wall', floor: '1F', x: [6.15, 9.6], z: [10.1, 10.2], y: F1i, open: [] },
  // F02 | store | F03 (left part of the store/F03 wall removed)
  { id: 'F02/store wall', floor: '1F', x: [1.1, 4.7], z: [11.9, 12.0], y: F1i, open: [ D(3.725, 4.5) ] },
  { id: 'Store divider',  floor: '1F', x: [2.85, 2.95], z: [12.0, 13.9], y: F1i, open: [] },
  { id: 'Store/F03 wall', floor: '1F', x: [2.85, 4.7], z: [13.9, 14.0], y: F1i, open: [] },
  // F08 = rear room over the annex (photo): solid side walls, flat concrete roof slab,
  // decorative balustrade on the garden side, open between balustrade and slab.
  { id: 'F08 side wall L', floor: '1F', x: [1.0, 1.1], z: [17.5, 20.2], y: [FF, FF + 2.85], open: [] },
  { id: 'F08 side wall R', floor: '1F', x: [6.1, 6.2], z: [17.5, 20.2], y: [FF, FF + 2.85], open: [] },
  { id: 'F08 balustrade', floor: '1F', x: [1.1, 6.1], z: [20.1, 20.2], y: [FF, FF + 0.9], open: [], balustrade: true },
];

// Walls removed (CAD "Door and walls removed" / "Was be Toilet") — shown as dashed footprints only.
export const DEMOLISHED = [
  { x: [7.3, 9.6], z: [6.7, 8.4], y: FF },     // ex-toilet in F05
  { x: [7.3, 9.6], z: [10.2, 11.9], y: FF },   // ex-toilet in F04
];
// Ceiling open to roof structure (photos 1, 2, 14, 15, 19) — in F04, over the ex-toilet.
export const CEILING_HOLE = { x: [7.3, 9.6], z: [10.2, 13.0] };

const G0 = -0.30;   // = LEVELS.ground
export const SLABS = [
  { id: 'GF floor + plinth', x: [1.0, 9.7], z: [0.8, 17.5], y: [G0, 0] },
  { id: 'Veranda plinth L', x: [1.0, 4.0], z: [0.0, 0.8], y: [G0, 0] },
  { id: 'Veranda plinth R', x: [6.7, 9.7], z: [0.0, 0.8], y: [G0, 0] },
  { id: 'Front step 1', x: [4.0, 6.7], z: [0.0, 0.4], y: [G0, -0.2] },
  { id: 'Front step 2', x: [4.0, 6.7], z: [0.4, 0.8], y: [G0, -0.1] },
  { id: 'Annex floor', x: [1.0, 6.2], z: [17.5, 20.2], y: [G0, 0] },
  { id: 'Covered terrace', x: [1.0, 6.2], z: [20.2, 21.8], y: [G0, -0.05] },
  { id: 'F08 floor (annex roof)', x: [1.0, 6.2], z: [17.5, 20.2], y: [FF - 0.25, FF] },
  { id: 'F08 flat roof slab', x: [0.9, 6.3], z: [17.45, 20.3], y: [FF + 2.85, FF + 3.15] },
];
// Upper floor slab is built separately (it has the stair opening).
export const FF_SLAB = { x: [1.0, 9.7], z: [2.5, 17.5] };

// Column grid from the final CAD (200 × 200 columns, centre lines). Plan dimensions follow this grid.
// Three lines across: A (left wall), B (long partition / corridor), C (right wall).
export const GRID = {
  x: [ { id: 'A', v: 1.1 }, { id: 'B', v: 6.1 }, { id: 'C', v: 9.6 } ],
  z: [ { id: '1', v: 0.89 }, { id: '2', v: 2.6 }, { id: '3', v: 5.4 }, { id: '4', v: 8.4 }, { id: '5', v: 10.2 },
       { id: '6', v: 13.9 }, { id: '7', v: 17.4 }, { id: '8', v: 20.1 }, { id: '9', v: 21.7 } ],
  zFF: ['2', '3', '4', '5', '6', '7', '8'],        // grid lines that exist on the upper floor
};
const gx = (id) => GRID.x.find(g => g.id === id).v, gz = (id) => GRID.z.find(g => g.id === id).v;

// front veranda posts (400 × 400 bases), not on the A–C grid
export const VERANDA_POSTS = [1.1, 3.8, 6.9, 9.6];

// columns (from CAD). h = top of column above its floor.
export const COLUMNS = [
  ...VERANDA_POSTS.map(x => ({ x, z: gz('1'), h: FF - 0.05, s: 0.2 })),
  // ground floor grid 2–7
  ...['2', '3', '4', '5', '6', '7'].flatMap(r => ['A', 'B', 'C'].map(c => ({ x: gx(c), z: gz(r), h: FF - 0.25, s: 0.2 }))),
  // annex corners, grid 8
  ...['A', 'B'].map(c => ({ x: gx(c), z: gz('8'), h: FF - 0.25, s: 0.2 })),
  // rear projecting-roof posts, grid 9 (middle post at x 3.50 per CAD)
  { x: 1.1, z: gz('9'), h: FF - 0.45, s: 0.2 }, { x: 3.5, z: gz('9'), h: FF - 0.45, s: 0.2 }, { x: 6.1, z: gz('9'), h: FF - 0.45, s: 0.2 },
  // upper floor columns (in walls), floor: '1F'
  ...['2', '3', '4', '5', '6', '7'].flatMap(r => ['A', 'B', 'C'].map(c => ({ x: gx(c), z: gz(r), h: 3.3, s: 0.2, floor: '1F' }))),
  { x: gx('A'), z: gz('8'), h: 2.85, s: 0.2, floor: '1F' }, { x: gx('B'), z: gz('8'), h: 2.85, s: 0.2, floor: '1F' },
];

export const ROOFS = [
  // main roof: two gabled roofs side by side, ridges run across the plot (parallel to the road),
  // gable ends on the left and right walls (aerial photo). wallZ = wall lines under each roof.
  { id: 'Front gable roof', type: 'gable', x: [0.4, 10.3], z: [1.9, 10.0], wallZ: [2.5, 10.0], wallX: [1.0, 9.7] },
  { id: 'Rear gable roof',  type: 'gable', x: [0.4, 10.3], z: [10.0, 18.1], wallZ: [10.0, 17.5], wallX: [1.0, 9.7] },
  // lean-to roofs: y0 at z0 edge, y1 at z1 edge
  { id: 'Front veranda roof', type: 'lean', x: [0.7, 10.0], z: [0.3, 2.55], y: [FF - 0.05, FF + 0.5] },
  // timber lean-to on posts, fixed to the annex rear wall below the terrace balustrade (photo); CAD edge z 22.30
  { id: 'Rear projecting roof', type: 'lean', x: [0.9, 6.3], z: [20.2, 22.3], y: [FF - 0.1, FF - 0.5] },
];

export const SINK = { x: [9.1, 9.6], z: [16.2, 17.4], h: 0.85 };   // CAD "Washing Sign"
export const WC_PANS = [ { x: 3.7, z: 18.42 }, { x: 3.7, z: 19.57 } ];

export const SITE = {
  sidewalk: { z: [-1.2, 0] },
  road: { z: [-7.2, -1.2], name: 'Sakkaline Rd' },
  passage: { x: [9.7, 12.2], z: [2.65, 22.3] },   // 2.50 m side passage (ramp "Slope" at the front)
  gate: { x: [9.7, 12.2], z: 2.6, h: 1.8 },       // flush with the front wall
  templeWall: { x: [12.2, 12.5], z: [0, 28.5], h: 1.6 },
  rearFence: { x: [0, 12.2], z: [28.4, 28.5], h: 1.8 },
  patio: { x: [0, 12.2], z: [22.3, 25.3] },
  // frangipani (photos: several in the rear garden) and a banana plant
  trees: [ { x: 10.63, z: 25.15, r: 2.2 }, { x: 8.63, z: 27.25, r: 1.9 }, { x: 11.33, z: 27.65, r: 1.5 },
          { x: 2.5, z: 27.0, r: 1.8 } ],
  bananas: [ { x: 1.1, z: 25.2 }, { x: 5.9, z: 27.8 } ],
  spiritHouse: { x: 11.75, z: 26.8 },
  neighbours: [
    { id: 'Left neighbour', x: [-9.5, -0.05], z: [2.0, 16.0], h: 6.5 },
    { id: 'Left neighbour rear', x: [-9.5, -0.05], z: [17.0, 27.0], h: 3.5 },
  ],
  temple: { x: [17.3, 26.3], z: [6.0, 20.0], h: 4.5, label: 'Wat Sensoukharam' },
};

// Sun for the realistic style. north: angle of true north clockwise from plan "up" (data +z, toward the rear),
// from the CAD north arrow (EX-NORTH) ≈ 37.6°. Default time: mid-November, 10:00 local (UTC+7), when the front (south-east) is in sun.
export const SUN = { lat: 19.89, lon: 102.135, tz: 7, north: 37.6, day: 320, hour: 10 };

// Net areas (inside walls) from the final CAD. See AREAS below for the totals.
export const ROOMS = [
  { code: 'G01', en: 'Front veranda', area: 21.8, floor: 'GF', x: 5.35, z: 1.7 },
  { code: 'G02', en: 'Main hall (old unit)', area: 61.6, floor: 'GF', x: 3.6, z: 4.4 },
  { code: 'G03', en: 'Side bay (side unit)', area: 51.1, floor: 'GF', x: 7.9, z: 11.0 },
  { code: 'G04', en: 'Stair', area: 4.8, floor: 'GF', x: 3.6, z: 7.0 },
  { code: 'G08', en: 'Toilet', area: 2.4, floor: 'GF', x: 1.7, z: 7.4 },
  { code: '—',   en: 'Left bay (walls removed)', area: 0, floor: 'GF', x: 2.9, z: 10.3 },
  { code: 'G09', en: 'Septic tank + toilet', area: 2.8, floor: 'GF', x: 3.9, z: 13.0 },
  { code: 'G06', en: 'WC ×2', area: 3.5, floor: 'GF', x: 4.0, z: 19.6 },
  { code: '—',   en: 'Rear room (annex)', area: 5.5, floor: 'GF', x: 2.15, z: 18.8 },
  { code: 'G05', en: 'Covered rear terrace', area: 10.9, floor: 'GF', x: 3.6, z: 21.2 },
  { code: 'G07', en: 'Rear terrace + garden', area: 0, floor: 'GF', x: 4.0, z: 25.5 },
  { code: '—',   en: 'Side passage 2.50', area: 0, floor: 'GF', x: 10.95, z: 10.0 },
  { code: 'F01', en: 'Room, empty', area: 18.3, floor: '1F', x: 3.6, z: 4.4 },
  { code: 'F02', en: 'Room, open to corridor', area: 12.2, floor: '1F', x: 2.9, z: 10.2 },
  { code: 'F03', en: 'Room, open to corridor', area: 15.6, floor: '1F', x: 2.9, z: 15.7 },
  { code: 'F04', en: 'Room, ceiling open', area: 24.8, floor: '1F', x: 7.9, z: 14.5 },
  { code: 'F05', en: 'Room, empty', area: 20.0, floor: '1F', x: 7.9, z: 4.6 },
  { code: 'F06', en: 'Corridor', area: 13.8, floor: '1F', x: 5.4, z: 12.5 },
  { code: 'F07', en: 'Stair', area: 4.8, floor: '1F', x: 3.6, z: 7.0 },
  { code: 'F08', en: 'Rear room, projecting', area: 13.0, floor: '1F', x: 3.6, z: 18.8 },
  { code: '—',   en: 'Toilet (walls removed)', area: 2.4, floor: '1F', x: 1.7, z: 7.4 },
  { code: '—',   en: 'Store', area: 3.3, floor: '1F', x: 3.8, z: 12.95 },
  { code: '—',   en: 'Lobby', area: 5.5, floor: '1F', x: 7.9, z: 9.3 },
];

// Area totals (m²) from the final CAD.
export const AREAS = {
  plot: 347.7,              // 12.20 × 28.50
  footprintMain: 128.8,     // 8.70 × 14.80 (outer faces x 1.00–9.70, z 2.60–17.40, excl. veranda)
  footprintAnnex: 14.0,     // 5.20 × 2.70
  gfInternal: 125.8,        // 8.50 × 14.80 inside the outer walls
  ffInternal: 125.8,
  veranda: 21.8,            // 8.70 × 2.50
};

// Plan dimensions: from/to points (x,z), offset direction, floor tag.
// Extra plan dimensions (grid dimensions are generated from GRID in dimensions.js).
export const DIMS = [
  { tag: 'GF', a: [9.7, 15.0], b: [12.2, 15.0], off: [0, 0], t: '2.50 passage' },
  { tag: 'GF', a: [0, 15.0], b: [1.0, 15.0], off: [0, 0], t: '1.00' },
  { tag: 'GF', a: [1.0, 0], b: [9.7, 0], off: [0, -1.6], t: '8.70 (building)' },
  { tag: 'GF', a: [0, 28.5], b: [12.2, 28.5], off: [0, 1.0], t: '12.20 (plot)' },
  { tag: 'GF', a: [12.2, 0], b: [12.2, 28.5], off: [2.6, 0], t: '28.50 (plot)' },
];

export const LEVEL_MARKS = [
  { y: -0.30, t: '−0.30 existing ground (CAD +0.00)' },
  { y: 0.00, t: '±0.00 GF finished floor (CAD +0.30)' },
  { y: FF, t: `+${FF.toFixed(2)} 1F finished floor (CAD +3.20)` },
  { y: FF + 3.5, t: `+${(FF + 3.5).toFixed(2)} eave (to measure)` },
  { y: null, t: 'ridges, 2 gables (approx.)' }, // y computed from roof
];
