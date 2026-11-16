import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildModel, clippedMaterials } from './model.js';
import { buildAnnotations } from './dimensions.js';
import { ViewManager, VIEWS } from './views.js';
import { MOBILE, sunPosition, sunVector, skyTexture } from './realism.js';
import * as D from './building-data.js';

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
stage.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const WHITE_BG = new THREE.Color(0xf4f5f3), SKY = skyTexture();
scene.background = WHITE_BG;
const hemi = new THREE.HemisphereLight(0xffffff, 0xd9dcd6, 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(30, 45, 20); sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 150 });
sun.target.position.set(6, 0, -13); scene.add(sun, sun.target);

const { ridge } = buildModel(scene);
buildAnnotations(scene, ridge);

const vm = new ViewManager(renderer, labelRenderer, stage, scene, sun);

// ---- lighting per style ----
let hour = D.SUN.hour;
function placeSun() {
  if (!vm.isReal) {                                   // white technical light
    sun.position.set(36, 45, 8); sun.color.set(0xffffff); sun.intensity = 1.6;
    hemi.color.set(0xffffff); hemi.groundColor.set(0xd9dcd6); hemi.intensity = 1.6;
    return;
  }
  const { az, el } = sunPosition(hour, D.SUN.day, D.SUN.lat, D.SUN.lon, D.SUN.tz);
  const dir = sunVector(az, Math.max(el, 2), D.SUN.north);
  sun.position.copy(sun.target.position).addScaledVector(dir, 70);
  const day = THREE.MathUtils.clamp(el / 25, 0, 1);
  sun.intensity = el > 0 ? 0.6 + 2.6 * day : 0;
  sun.color.setHSL(0.1, 0.75, 0.62 + 0.3 * day);      // warmer when the sun is low
  hemi.color.set(0xcfe2f4); hemi.groundColor.set(0x8a7a62);
  hemi.intensity = 0.35 + 0.75 * THREE.MathUtils.clamp((el + 6) / 30, 0, 1);
  const lbl = document.getElementById('sunlbl');
  if (lbl) lbl.textContent = `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')} · sun ${el.toFixed(0)}° high`;
}
vm.onStyle = (isReal) => {
  scene.background = isReal ? SKY : WHITE_BG;
  const tm = isReal ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  if (renderer.toneMapping !== tm) {
    renderer.toneMapping = tm; renderer.toneMappingExposure = 1.0;
    clippedMaterials.forEach(m => (m.needsUpdate = true));
  }
  document.getElementById('sunrow').classList.toggle('off', !isReal);
  placeSun();
};

// ---- ambient occlusion (perspective, realistic, desktop only) ----
let composer = null, gtao = null;
function aoActive() { return !MOBILE && vm.isReal && vm.camera.isPerspectiveCamera; }
function ensureComposer() {
  if (composer) return;
  composer = new EffectComposer(renderer);
  const rp = new RenderPass(scene, vm.persp);
  gtao = new GTAOPass(scene, vm.persp, stage.clientWidth, stage.clientHeight);
  gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.0, scale: 1.2, samples: 16 });
  gtao.blendIntensity = 0.9;
  composer.addPass(rp); composer.addPass(gtao); composer.addPass(new OutputPass());
  composer.setSize(stage.clientWidth, stage.clientHeight);
}
function render() {
  if (aoActive()) { ensureComposer(); composer.render(); }
  else renderer.render(scene, vm.camera);
}

// ---- UI ----
const viewBox = document.getElementById('views');
for (const [k, v] of Object.entries(VIEWS)) {
  const b = document.createElement('button');
  b.dataset.view = k; b.textContent = v.en;
  b.onclick = () => setView(k);
  viewBox.appendChild(b);
}
function setView(k) {
  vm.set(k);
  viewBox.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.view === k));
  document.getElementById('viewname').textContent = VIEWS[k].en;
  document.getElementById('proj').textContent = VIEWS[k].cam === 'p' ? 'perspective' : 'parallel (orthographic)';
  try { localStorage.setItem('lpb-view', k); } catch {}
}
document.querySelectorAll('#layers input').forEach(inp => {
  inp.onchange = () => { vm.overrides[inp.dataset.layer] = inp.checked; vm.applyVisibility(); };
});
// style toggle
const styleBtns = document.querySelectorAll('#style button');
function setStyle(real) {
  vm.realistic = real;
  styleBtns.forEach(b => b.classList.toggle('on', (b.dataset.style === 'real') === real));
  vm.applyVisibility();
  try { localStorage.setItem('lpb-style', real ? 'real' : 'white'); } catch {}
}
styleBtns.forEach(b => (b.onclick = () => setStyle(b.dataset.style === 'real')));
const slider = document.getElementById('sun');
slider.value = hour;
slider.oninput = () => { hour = +slider.value; placeSun(); };

document.getElementById('shot').onclick = () => {
  render();
  const a = document.createElement('a');
  a.download = `LPB-001_${vm.key}${vm.isReal ? '_real' : ''}.png`; a.href = renderer.domElement.toDataURL('image/png'); a.click();
};
window.addEventListener('resize', () => {
  vm.resize();
  if (composer) { composer.setSize(stage.clientWidth, stage.clientHeight); gtao.setSize(stage.clientWidth, stage.clientHeight); }
});

let start = 'persp', startReal = true;
try {
  const s = localStorage.getItem('lpb-view'); if (s && VIEWS[s]) start = s;
  if (localStorage.getItem('lpb-style') === 'white') startReal = false;
} catch {}
vm.realistic = startReal;
styleBtns.forEach(b => b.classList.toggle('on', (b.dataset.style === 'real') === startReal));
setView(start);

renderer.setAnimationLoop(() => {
  vm.update();
  render();
  labelRenderer.render(scene, vm.camera);
});
window.__lpb = { vm, scene, setView, setStyle };   // for debugging
