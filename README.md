# LPB-001 3D Viewer — existing building, Option A

Interactive white technical model of the whole building (8.9 m wide, 2 storeys) beside Wat Sensoukharam, Ban Vat Nong, Luang Prabang.
For internal team review.

**Sources:** `exiting_v2.dwg` (site measure 16-11-2026), site photos (Site_Visit_Prep), Street View of the front facade.

## Open it

The page uses ES modules, so it must be served over http (double-clicking `index.html` will not load the model).

```bash
python -m http.server 8765
```

Run this inside this folder, then open http://localhost:8765. It needs internet for three.js (jsDelivr CDN, pinned to `three@0.160.0`) and Google Fonts.

Live: https://anousaksiritham-creator.github.io/beside-vatsan-Existing/. It is deployed from the `main` branch of `beside-vatsan-Existing`, which contains just this folder.

## Views

| View | Projection | Shows |
|---|---|---|
| Perspective | perspective | free orbit, roof, site, context |
| Isometric | parallel | orbit allowed |
| Plan GF / Plan 1F | parallel, cut at +1.20 above floor | CAD linework, column grid A–D / 1–9 with centre-to-centre dimensions, room names + areas |
| Front / Rear / Left / Right | parallel | level lines −0.40 / ±0.00 / +3.50 / +7.00 / ridge |
| Section A-A (long, x = 4.80) / Section B-B (cross, z = 12.00) | parallel | cut poché + roof cut line |

**Style:** *Realistic* (the default) or *White*. The realistic style applies only to Perspective and Isometric. Plans, elevations and sections always stay white technical drawings.
- Realistic materials follow the site photos (16-11-2026): white render front and sides, ochre rear block and annex, dark Lao flat tiles, red-brown fascia, louvred timber shutters, teak folding doors, encaustic veranda tiles, terracotta garden paving, herringbone brick, frangipani and banana.
- Textures are drawn in code (`js/realism.js`), so the folder has no image files.
- The *Time of day* slider moves the sun for Luang Prabang in mid-November. True north comes from the CAD north arrow, 37.6° clockwise from plan up (`SUN` in `building-data.js`).
- Ambient occlusion runs in Perspective on desktop only. Phones get lighter shadows and textures.

Layers panel: roof, ceiling, first floor, landscape, context, dimensions/labels, edges. **Save image** downloads a PNG of the current view.

## Edit

All numbers live in **`js/building-data.js`** (metres):

- `LEVELS`: ground −0.40, GF ±0.00, 1F +3.50, eave, roof pitch
- `WALLS`: axis-aligned wall rectangles; `open` = doors/windows (`s` = range along the wall, `sill`/`head` from the wall base)
- `GRID` (column centres; columns and plan dimensions are generated from it), `SLABS`, `ROOFS`, `STAIR` (20 risers × 175 mm), `SITE`, `ROOMS`, `DIMS`, `LEVEL_MARKS`

CAD → data: `x = (cadX + 106492) / 1000` (upper-floor plan: `cadX + 80922`), `z = (cadY − 12950) / 1000`.
z runs from the road (0) to the rear boundary (28.5).

| File | Role |
|---|---|
| `js/model.js` | builds the geometry and cut poché; each mesh has a white material and a realistic `role` |
| `js/realism.js` | realistic materials by role (procedural textures), sun position, sky |
| `js/dimensions.js` | dimensions, level marks, labels |
| `js/views.js` | camera presets, clipping, layer visibility |
| `js/main.js` | renderer and UI |
| `js/cad-linework.js` | **generated**: exact plan linework from `exiting_v2`, drawn in Plan GF / Plan 1F |
| `tools/cad_to_linework.py` | regenerates `cad-linework.js` from a DXF of `exiting_v2` |

### When the CAD plan changes

1. Save `exiting_v2.dwg` as DXF (AutoCAD `SAVEAS` → DXF 2018).
2. Run:
   ```bash
   python tools/cad_to_linework.py path/to/exiting_v2.dxf
   ```
   This updates the plan linework.
3. If walls moved, update the matching `WALLS` entries in `building-data.js` so the 3D model follows.

## Assumptions (to measure)

- Door/window sizes: door 0.9 × 2.1, windows 0.9 × 1.4 at sill +1.00. Window positions come from photos and are approximate.
- Main roof: two gabled roofs side by side, ridges parallel to the road, gable ends on the left and right walls, 30° (ridges ≈ +9.17). Eave +7.00, overhang 0.6.
- F08 is the rear room projecting over the annex: solid side walls, flat concrete roof slab (+6.35 to +6.65), decorative balustrade on the garden side (photo).
- Rear projecting roof +2.55 to +3.05, on 3 timber posts, fixed below the balustrade.
- Not in CAD, taken from photos: the GF rear-wall door and shutter window right of the annex, and the square opening in the annex side wall.
- Stair as in CAD: treads 0.20 m, width 0.90 m. 10 risers from the front rising toward the rear to a 0.9 × 0.9 landing (+1.75), then 10 risers along +x into the 1F corridor.
- Neighbours and the temple are simple massing only.
