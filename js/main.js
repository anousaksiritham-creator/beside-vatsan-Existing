import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildModel } from './model.js';
import { buildAnnotations } from './dimensions.js';
import { ViewManager, VIEWS } from './views.js';

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
stage.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f5f3);
scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dcd6, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(30, 45, 20); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 150 });
sun.target.position.set(6, 0, -13); scene.add(sun, sun.target);

const { ridge } = buildModel(scene);
buildAnnotations(scene, ridge);

const vm = new ViewManager(renderer, labelRenderer, stage, scene, sun);

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
document.getElementById('shot').onclick = () => {
  renderer.render(scene, vm.camera);
  const a = document.createElement('a');
  a.download = `LPB-001_${vm.key}.png`; a.href = renderer.domElement.toDataURL('image/png'); a.click();
};
window.addEventListener('resize', () => vm.resize());

let start = 'persp';
try { const s = localStorage.getItem('lpb-view'); if (s && VIEWS[s]) start = s; } catch {}
setView(start);

renderer.setAnimationLoop(() => {
  vm.update();
  renderer.render(scene, vm.camera);
  labelRenderer.render(scene, vm.camera);
});
window.__lpb = { vm, scene, setView };   // for debugging
