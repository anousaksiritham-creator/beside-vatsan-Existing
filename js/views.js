// Camera presets: perspective, isometric, plans, elevations, sections (parallel projection).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clipPlanes, clippedMaterials, groups, makePoche } from './model.js';
import { annot } from './dimensions.js';
import { applyStyle } from './realism.js';

const C = new THREE.Vector3(5.95, 3.5, -12.5);   // building centre (three coords)

// show: model groups visible; ann: annotation groups visible
export const VIEWS = {
  persp:  { en: 'Perspective', cam: 'p', pos: [26, 18, 22], target: [5.95, 2.5, -12], rotate: true,
            show: ['gf', 'ff', 'ceiling', 'roof', 'site', 'landscape', 'context'], ann: ['ctx-labels'] },
  iso:    { en: 'Isometric', cam: 'o', dir: [1, 1, 1], size: 34, rotate: true,
            show: ['gf', 'ff', 'ceiling', 'roof', 'site', 'landscape', 'context'], ann: [] },
  planGF: { en: 'Plan GF', cam: 'o', plan: true, size: 38, clip: [[0, -1, 0], 1.2],
            show: ['gf', 'site', 'landscape', 'context'], ann: ['cad-GF', 'dim-GF', 'rooms-GF', 'ctx-labels'] },
  planFF: { en: 'Plan 1F', cam: 'o', plan: true, size: 38, clip: [[0, -1, 0], 3.5 + 1.2],
            show: ['gf', 'ff', 'site', 'landscape', 'context'], ann: ['cad-1F', 'dim-1F', 'rooms-1F'] },
  front:  { en: 'Front', cam: 'o', dir: [0, 0, 1], size: 18, target: [5.95, 4.2, -12],
            show: ['gf', 'ff', 'roof', 'site'], ann: ['lvl-front'] },
  rear:   { en: 'Rear', cam: 'o', dir: [0, 0, -1], size: 18, target: [5.95, 4.2, -12],
            show: ['gf', 'ff', 'roof', 'site'], ann: ['lvl-rear'] },
  left:   { en: 'Left side', cam: 'o', dir: [-1, 0, 0], size: 25, target: [5.95, 4.2, -11],
            show: ['gf', 'ff', 'roof', 'site'], ann: ['lvl-left'] },
  right:  { en: 'Right side', cam: 'o', dir: [1, 0, 0], size: 25, target: [5.95, 4.2, -11],
            show: ['gf', 'ff', 'roof', 'site'], ann: ['lvl-right'] },
  secA:   { en: 'Section A-A (long)', cam: 'o', dir: [1, 0, 0], size: 25, target: [5.95, 4.2, -11],
            clip: [[-1, 0, 0], 4.8], poche: ['x', 4.8, 0.01], show: ['gf', 'ff', 'ceiling', 'roof', 'site'], ann: ['lvl-right'] },
  secB:   { en: 'Section B-B (cross)', cam: 'o', dir: [0, 0, 1], size: 18, target: [5.95, 4.2, -12],
            clip: [[0, 0, -1], -12.0], poche: ['z', 12.0, 0.01], show: ['gf', 'ff', 'ceiling', 'roof', 'site'], ann: ['lvl-front'] },
};

export class ViewManager {
  constructor(renderer, labelRenderer, dom, scene, sun) {
    this.scene = scene; this.sun = sun; this.poches = {};
    this.renderer = renderer; this.labelRenderer = labelRenderer; this.dom = dom;
    this.persp = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 500);
    this.camera = this.persp; this.controls = null; this.size = 30;
    this.overrides = {};       // user layer toggles: name → bool
    this.realistic = true;     // realistic style in perspective / isometric (technical views stay white)
    this.onStyle = null;       // callback(isReal) for lights / sky
  }
  aspect() { return this.dom.clientWidth / Math.max(1, this.dom.clientHeight); }
  resize() {
    const w = this.dom.clientWidth, h = this.dom.clientHeight;
    this.renderer.setSize(w, h); this.labelRenderer.setSize(w, h);
    this.persp.aspect = w / h; this.persp.updateProjectionMatrix();
    const a = this.aspect(), s = this.size / 2;
    Object.assign(this.ortho, { left: -s * a, right: s * a, top: s, bottom: -s });
    this.ortho.updateProjectionMatrix();
  }
  set(key) {
    const V = VIEWS[key]; this.key = key;
    this.controls?.dispose();
    const cam = V.cam === 'p' ? this.persp : this.ortho;
    this.camera = cam; cam.zoom = 1;
    const target = new THREE.Vector3(...(V.target || (V.plan ? [5.95, 0, -12.5] : [C.x, C.y, C.z])));
    if (V.plan) {
      cam.up.set(0, 0, -1); cam.position.set(target.x, 60, target.z);
    } else if (V.cam === 'p') {
      cam.up.set(0, 1, 0); cam.position.set(...V.pos);
    } else {
      cam.up.set(0, 1, 0);
      const d = new THREE.Vector3(...V.dir).normalize().multiplyScalar(80);
      cam.position.copy(target).add(d);
    }
    cam.lookAt(target);
    this.size = V.size || 30; this.resize();
    const c = new OrbitControls(cam, this.renderer.domElement);
    c.target.copy(target); c.enableRotate = !!V.rotate; c.enableDamping = true; c.dampingFactor = 0.12;
    c.screenSpacePanning = true; c.zoomToCursor = true; c.enablePan = true; c.enableZoom = true;
    c.minZoom = 0.3; c.maxZoom = 12;
    // fixed technical views pan with left drag too
    if (!V.rotate) c.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    c.touches = V.rotate ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN } : { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    if (V.cam === 'p') { c.maxPolarAngle = Math.PI * 0.495; c.minDistance = 4; c.maxDistance = 140; }
    c.update(); this.controls = c;
    // clipping
    clipPlanes.length = 0;
    if (V.clip) clipPlanes.push(new THREE.Plane(new THREE.Vector3(...V.clip[0]), V.clip[1]));
    clippedMaterials.forEach(m => (m.needsUpdate = true));
    for (const p of Object.values(this.poches)) p.visible = false;
    if (V.poche) {
      const pk = V.poche.join('|');
      if (!this.poches[pk]) { this.poches[pk] = makePoche(...V.poche); this.scene.add(this.poches[pk]); }
      this.poches[pk].visible = true;
    }
    this.sun.castShadow = V.cam === 'p' || key === 'iso';
    this.applyVisibility();
  }
  applyVisibility() {
    const V = VIEWS[this.key];
    for (const [name, g] of Object.entries(groups)) {
      let vis = V.show.includes(name);
      if (name in this.overrides && V.show.includes(name)) vis = this.overrides[name];
      g.visible = vis;
    }
    const showAnn = this.overrides.annotations !== false;
    for (const [name, g] of Object.entries(annot)) {
      const vis = showAnn && V.ann.includes(name);
      g.visible = vis;
      g.traverse(o => { if (o.isCSS2DObject) o.visible = vis; });   // CSS2D ignores parent visibility
    }
    // style: realistic materials only in the free (rotating) views
    const edges = this.overrides.edges !== false;
    this.isReal = this.realistic && !!V.rotate;
    for (const g of Object.values(groups)) applyStyle(g, this.isReal, edges);
    this.onStyle?.(this.isReal);
  }
  update() { this.controls?.update(); }
}
