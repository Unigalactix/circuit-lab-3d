/* CircuitLab 3D — engine.js
   Shared lab engine: scene, pin labels, lesson/pin explorer wiring,
   wiring visualisation and the device simulation loop.
   Page contract (DOM ids): #stage, #list, #panel-content, #search,
   #btn-run, #btn-stop, #btn-reset-view, #tgl-labels, #tgl-rotate,
   #loading, #webgl-fail, serial: #serial-body (or #serial-output / #serial / #serial-log).
   Tabs (optional): [data-tab="lessons"|"pins"] buttons. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBoard, buildBreadboard, buildComponent } from './boards3d.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const POWER_PINS = new Set(['5V', '3V3', 'GND', 'VIN', 'VBUS', 'VSYS', '3V3_EN', 'RUN']);

function injectLabelStyles() {
  if (document.getElementById('cl3d-label-styles')) return;
  const st = document.createElement('style');
  st.id = 'cl3d-label-styles';
  st.textContent = `
    .cl3d-labels { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:5; }
    .cl3d-label { position:absolute; left:0; top:0; transform:translate(-50%,-160%);
      padding:2px 8px; border-radius:999px; font:600 11px/1.5 Inter, system-ui, sans-serif;
      letter-spacing:.01em; color:#faf4e8; background:#2c2015;
      border:1px solid rgba(44,32,21,.55); white-space:nowrap; will-change:transform; }
    .cl3d-label.power { color:#f2a65a; }
  `;
  document.head.appendChild(st);
}

export function initLab(config) {
  const cfg = config || {};
  const boardId = cfg.boardId || 'uno';
  const accent = cfg.accent || '#ffb02e';
  const lessons = Array.isArray(cfg.lessons) ? cfg.lessons : [];
  const pins = Array.isArray(cfg.pins) ? cfg.pins : [];

  const stage = $('stage') || $('canvas-wrap') || $('viewport') || document.body;
  const listEl = $('list');
  const panelEl = $('panel-content');
  const searchEl = $('search');
  const serialEl = $('serial-body') || $('serial-output') || $('serial') || $('serial-log');
  injectLabelStyles();

  const state = {
    tab: 'lessons',
    query: '',
    lesson: null,
    lessonIndex: -1,
    pin: null,
    running: false,
    simT0: 0,
    serialTimer: null,
    serialIdx: 0,
    labelsOn: true,
  };

  /* ---------- renderer / scene ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    const fail = $('webgl-fail');
    if (fail) { fail.hidden = false; fail.removeAttribute('hidden'); }
    const load = $('loading'); if (load) load.hidden = true;
    return { ok: false, error: e };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
  stage.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070912);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(6, 12, 7);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x8899bb, 0.35));

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 48),
    new THREE.MeshStandardMaterial({ color: 0xa08c66, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.14;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 4;
  controls.maxDistance = 45;

  /* ---------- stage contents ---------- */
  const world = new THREE.Group();
  scene.add(world);

  let anchorSource = null;   // board group whose pinAnchors drive labels/wires
  let simBoard = null;       // breadboard components sit on
  let simSlot = new THREE.Vector3(); // where the sim component goes (world)

  if (boardId === 'breadboard') {
    simBoard = buildBreadboard();
    world.add(simBoard);
    const uno = buildBoard('uno');
    uno.position.set(-(16.5 / 2 + 6.8 / 2 + 1.6), 0, -0.6);
    world.add(uno);
    anchorSource = uno;
    simSlot.set(1.5, simBoard.userData.topY, 0);
  } else {
    const board = buildBoard(boardId);
    world.add(board);
    anchorSource = board;
    simBoard = buildBreadboard();
    simBoard.scale.setScalar(0.8);
    const bw = board.userData.size ? board.userData.size.w : 7;
    simBoard.position.set(bw / 2 + 7.6, 0, 2.2);
    world.add(simBoard);
    simSlot.set(simBoard.position.x, simBoard.userData.topY * 0.8, simBoard.position.z);
  }
  world.updateMatrixWorld(true);

  const pinAnchors = anchorSource.userData.pinAnchors || new Map();
  const anchorWorld = (name) => {
    const v = pinAnchors.get(name);
    if (!v) return null;
    return anchorSource.localToWorld(v.clone());
  };

  // camera home, framed on the anchor board + breadboard
  const boardSize = anchorSource.userData.size || { w: 7, d: 5 };
  const homeDist = (Math.max(boardSize.w, boardSize.d) * 2.1 + 7) * 0.85;
  const homeTarget = new THREE.Vector3(anchorSource.position.x + 1.2, 0.5, 0.4);
  if (boardId === 'breadboard') homeTarget.set(-5.2, 0.5, 0); // frame Uno + main breadboard together
  const homePos = homeTarget.clone().add(new THREE.Vector3(homeDist * 0.55, homeDist * 0.62, homeDist * 0.72));
  camera.position.copy(homePos);
  controls.target.copy(homeTarget);

  /* ---------- pin highlight ring ---------- */
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.3, 36),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  /* ---------- labels ---------- */
  const labelLayer = document.createElement('div');
  labelLayer.className = 'cl3d-labels';
  stage.appendChild(labelLayer);
  const labelEntries = [];
  pinAnchors.forEach((v, name) => {
    const el = document.createElement('span');
    el.className = 'cl3d-label' + (POWER_PINS.has(name) ? ' power' : '');
    el.textContent = name;
    labelLayer.appendChild(el);
    labelEntries.push({ name, el, world: anchorSource.localToWorld(v.clone()), priority: POWER_PINS.has(name) ? 2 : 1 });
  });

  /* ---------- wires + sim component ---------- */
  const wireGroup = new THREE.Group();
  scene.add(wireGroup);
  let simComp = null;
  let simKind = null;

  function clearWires() {
    wireGroup.children.forEach((m) => { if (m.geometry) m.geometry.dispose(); });
    wireGroup.clear();
  }

  function compAnchorWorld(comp, keyName) {
    if (!comp || !comp.userData.anchors) return null;
    const a = comp.userData.anchors;
    const hit = a[keyName] || a[keyName.toUpperCase()] || a[keyName.toLowerCase()];
    if (!hit) return null;
    return comp.localToWorld(hit.clone());
  }

  function ensureComponent(kind) {
    if (!kind) { if (simComp) { world.remove(simComp); simComp = null; simKind = null; } return null; }
    if (simComp && simKind === kind) return simComp;
    if (simComp) world.remove(simComp);
    simComp = buildComponent(kind);
    simKind = kind;
    simComp.position.copy(simSlot);
    world.add(simComp);
    world.updateMatrixWorld(true);
    return simComp;
  }

  function buildWires(lesson) {
    clearWires();
    if (!lesson || !Array.isArray(lesson.wiring)) return;
    const comp = lesson.sim && lesson.sim.device ? ensureComponent(lesson.sim.device) : simComp;
    lesson.wiring.forEach((w) => {
      const a = anchorWorld(w.from);
      if (!a) return; // pin not exposed on this board — skip silently
      const toKey = String(w.to || '').includes('.') ? String(w.to).split('.').slice(1).join('.') : String(w.to || '');
      const b = compAnchorWorld(comp, toKey);
      if (!b) return;
      const color = new THREE.Color(w.color || accent);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += 1.0 + a.distanceTo(b) * 0.14;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(18));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
      wireGroup.add(line);
      [a, b].forEach((p) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color }));
        s.position.copy(p);
        wireGroup.add(s);
      });
    });
    // refresh label priorities: lesson pins first
    const wired = new Set(lesson.wiring.map((w) => w.from));
    labelEntries.forEach((e) => { e.priority = wired.has(e.name) ? 3 : (POWER_PINS.has(e.name) ? 2 : 1); });
  }

  /* ---------- panel + list UI ---------- */
  function pulsePanel() {
    if (!panelEl) return;
    panelEl.classList.remove('panel-in');
    void panelEl.offsetWidth;
    panelEl.classList.add('panel-in');
  }

  function fillLessonPanel(lesson, idx) {
    if (!panelEl) return;
    const parts = (lesson.parts || []).map((p) => `<li>${esc(p)}</li>`).join('');
    const showCode = lesson.codeLang !== 'none' && String(lesson.code || '').trim().length > 0;
    const wires = (lesson.wiring || []).map((w) =>
      `<tr><td><code>${esc(w.from)}</code></td><td>→</td><td><code>${esc(w.to)}</code></td></tr>`).join('');
    panelEl.innerHTML = `
      <p class="panel-kicker">Lesson ${idx + 1} / ${esc(lesson.level || '')} / ${esc(lesson.mins ?? '')} min</p>
      <h2>${esc(lesson.title)}</h2>
      ${lesson.goal ? `<p class="p-tag">${esc(lesson.goal)}</p>` : ''}
      ${parts ? `<h3 class="panel-h3">You will need</h3><ul class="p-parts">${parts}</ul>` : ''}
      ${wires ? `<h3 class="panel-h3">Wiring</h3><table class="wire-table"><tbody>${wires}</tbody></table>` : ''}
      ${showCode ? `<h3 class="panel-h3">Code / ${esc(lesson.codeLang || 'Arduino C++')}</h3>
      <div class="code-wrap"><button type="button" class="copy-btn" data-copy>Copy code</button><pre class="code-block"><code>${esc(lesson.code || '')}</code></pre></div>` : ''}
      <p class="p-desc">${esc(lesson.explain || '')}</p>
      ${lesson.watch ? `<div class="p-fact"><strong>Watch for:</strong> ${esc(lesson.watch)}</div>` : ''}
      <p class="sim-note" data-sim-note hidden></p>`;
    const copyBtn = panelEl.querySelector('[data-copy]');
    if (copyBtn) copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(lesson.code || ''); copyBtn.textContent = 'Copied ✓'; }
      catch (e) {
        const ta = document.createElement('textarea');
        ta.value = lesson.code || ''; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); copyBtn.textContent = 'Copied ✓'; } catch (e2) { copyBtn.textContent = 'Copy failed'; }
        ta.remove();
      }
      setTimeout(() => { copyBtn.textContent = 'Copy code'; }, 1600);
    });
    pulsePanel();
  }

  function fillPinPanel(pin) {
    if (!panelEl) return;
    const has = pinAnchors.has(pin.name);
    const isBb = boardId === 'breadboard';
    const fact = has
      ? 'This pin is highlighted on the board — look for the pulsing ring.'
      : (isBb ? '' : 'This pin is not broken out as a header anchor on the 3D model.');
    panelEl.innerHTML = `
      <p class="panel-kicker">${isBb ? 'Breadboard landmark' : `Pin reference / ${esc(anchorSource.userData.boardName || boardId)}`}</p>
      <h2>${esc(pin.name)}</h2>
      <p class="p-tag">${esc(pin.type || '')}</p>
      <p class="p-desc">${esc(pin.desc || '')}</p>
      ${fact ? `<div class="p-fact">${fact}</div>` : ''}`;
    pulsePanel();
  }

  function renderList() {
    if (!listEl) return;
    const q = state.query.trim().toLowerCase();
    listEl.innerHTML = '';
    if (state.tab === 'lessons') {
      lessons.forEach((lesson, idx) => {
        if (q && !(lesson.title + ' ' + (lesson.level || '')).toLowerCase().includes(q)) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'item' + (state.lesson === lesson ? ' active' : '');
        b.innerHTML = `<span class="item-name">${esc(lesson.title)}</span><span class="item-meta"><span class="chip">${esc(lesson.level || '')}</span> ${esc(lesson.mins ?? '')} min</span>`;
        b.addEventListener('click', () => selectLesson(idx));
        listEl.appendChild(b);
      });
      if (!listEl.children.length) listEl.innerHTML = '<p class="list-empty">No lessons match your search.</p>';
    } else {
      pins.forEach((pin) => {
        if (q && !(pin.name + ' ' + (pin.type || '') + ' ' + (pin.desc || '')).toLowerCase().includes(q)) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'item' + (state.pin === pin ? ' active' : '');
        b.innerHTML = `<span class="item-name">${esc(pin.name)}</span><span class="item-meta"><span class="chip">${esc(pin.type || '')}</span></span><span class="item-sub">${esc(pin.desc || '')}</span>`;
        b.addEventListener('click', () => selectPin(pin));
        listEl.appendChild(b);
      });
      if (!listEl.children.length) listEl.innerHTML = '<p class="list-empty">No pins match your search.</p>';
    }
  }

  function selectLesson(idx) {
    const lesson = lessons[idx];
    if (!lesson) return;
    stopSim(false);
    state.lesson = lesson;
    state.lessonIndex = idx;
    state.pin = null;
    ring.visible = false;
    if (lesson.sim && lesson.sim.device) ensureComponent(lesson.sim.device);
    buildWires(lesson);
    fillLessonPanel(lesson, idx);
    renderList();
  }

  function selectPin(pin) {
    state.pin = pin;
    const w = anchorWorld(pin.name);
    if (w) {
      ring.position.copy(w).y += 0.06;
      ring.visible = true;
    } else {
      ring.visible = false;
    }
    fillPinPanel(pin);
    renderList();
  }

  // tabs (optional in markup)
  const tabBtns = Array.from(document.querySelectorAll('[data-tab]'))
    .concat([$('tab-lessons'), $('tab-pins')].filter(Boolean));
  tabBtns.forEach((btn) => {
    const t = btn.getAttribute('data-tab') || (btn.id === 'tab-pins' ? 'pins' : 'lessons');
    btn.addEventListener('click', () => {
      state.tab = t;
      tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderList();
    });
  });
  if (searchEl) searchEl.addEventListener('input', () => { state.query = searchEl.value; renderList(); });

  /* ---------- serial monitor ---------- */
  function serialPrint(text) {
    if (!serialEl) return;
    const line = document.createElement('div');
    line.className = 'serial-line';
    line.textContent = text;
    serialEl.appendChild(line);
    while (serialEl.children.length > 220) serialEl.removeChild(serialEl.firstChild);
    serialEl.scrollTop = serialEl.scrollHeight;
  }
  function serialClear() { if (serialEl) serialEl.innerHTML = ''; }

  // serial header controls (template chrome around #serial-body)
  const serialSection = $('serial');
  const serialStatus = $('serial-status');
  function setSerialOpen(open) {
    if (!serialSection) return;
    serialSection.classList.toggle('collapsed', !open);
    serialSection.setAttribute('aria-expanded', String(open));
    const tgl = $('btn-serial-toggle');
    if (tgl) tgl.setAttribute('aria-expanded', String(open));
  }
  const btnSerialClear = $('btn-serial-clear');
  if (btnSerialClear) btnSerialClear.addEventListener('click', (ev) => { ev.stopPropagation(); serialClear(); });
  const btnSerialToggle = $('btn-serial-toggle');
  if (btnSerialToggle && serialSection) btnSerialToggle.addEventListener('click', () => {
    setSerialOpen(serialSection.classList.contains('collapsed'));
  });
  function setSerialStatus(text, live) {
    if (!serialStatus) return;
    serialStatus.textContent = text;
    serialStatus.classList.toggle('live', !!live);
  }

  function generatedReading(lesson) {
    const mode = lesson.sim && lesson.sim.mode;
    if (mode === 'distance') return `Distance: ${8 + Math.round(Math.random() * 132)} cm`;
    if (mode === 'sensor') {
      if (simKind === 'pir') return Math.random() > 0.45 ? 'Motion detected!' : 'No motion';
      return `Light level: ${120 + Math.round(Math.random() * 780)}`;
    }
    return null;
  }

  function pushSerialLine() {
    const lesson = state.lesson;
    if (!lesson) return;
    const lines = Array.isArray(lesson.serial) ? lesson.serial : [];
    if (state.serialIdx < lines.length) {
      let text = lines[state.serialIdx++];
      if (/\{v|value\}/i.test(text)) {
        const gen = generatedReading(lesson) || '';
        const val = gen.replace(/^[^:]*:\s*/, '');
        text = text.replace(/\{v\}|\{value\}/gi, val.replace(/\s*cm$/, ''));
        if (!text.includes(':') && gen.includes(':')) text = gen;
      }
      serialPrint(text);
      return;
    }
    const gen = generatedReading(lesson);
    if (gen) { serialPrint(gen); return; }
    state.serialIdx = 0; // loop the scripted lines
    if (lines.length) pushSerialLine();
  }

  /* ---------- simulation ---------- */
  const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  function setSimNote(text) {
    const n = panelEl && panelEl.querySelector('[data-sim-note]');
    if (n) { n.hidden = !text; n.textContent = text || ''; }
  }

  function resetComponent() {
    if (!simComp) return;
    const kind = simKind;
    if (kind === 'led') simComp.userData.setState({ on: false, brightness: 0 });
    else if (kind === 'rgb-led') simComp.userData.setState({ on: false });
    else if (kind === 'servo') simComp.userData.setState({ angle: 90 });
    else if (kind === 'dc-motor') simComp.userData.setState({ spinning: false });
    else if (kind === 'buzzer') simComp.userData.setState({ active: false });
    else if (kind === 'ultrasonic') simComp.userData.setState({ ping: false });
    else if (kind === 'seven-seg') simComp.userData.setState({ value: 8 });
    else if (kind === 'button') simComp.userData.setState({ pressed: false });
    else if (kind === 'pir') simComp.userData.setState({ motion: false });
    else if (kind === 'ldr') simComp.userData.setState({ level: 0 });
  }

  function runSim() {
    const lesson = state.lesson;
    if (!lesson) return;
    stopSim(false);
    if (lesson.sim && lesson.sim.device) ensureComponent(lesson.sim.device);
    buildWires(lesson);
    state.running = true;
    state.simT0 = performance.now();
    state.serialIdx = 0;
    setSerialOpen(true);
    setSerialStatus('Running', true);
    serialClear();
    serialPrint(`CircuitLab 3D / ${anchorSource.userData.boardName || boardId} ready`);
    serialPrint(`> Running: ${lesson.title}`);
    const mode = lesson.sim && lesson.sim.mode;
    if (mode === 'lcd-text' && simComp) {
      simComp.userData.setState({ text: (lesson.sim.text || (lesson.serial && lesson.serial[0]) || lesson.title) });
    }
    if (mode === 'distance' && simComp) simComp.userData.setState({ ping: true });
    if (mode === 'motor-spin' && simComp) simComp.userData.setState({ spinning: true });
    if (mode === 'tone' && simComp) simComp.userData.setState({ active: true });
    state.serialTimer = setInterval(pushSerialLine, 480);
    pushSerialLine();
  }

  function stopSim(announce = true) {
    if (state.serialTimer) { clearInterval(state.serialTimer); state.serialTimer = null; }
    if (state.running && announce) serialPrint('Stopped.');
    state.running = false;
    setSerialStatus('Stopped', false);
    setSimNote('');
    resetComponent();
  }

  function updateSim(now) {
    if (!state.running || !state.lesson || !simComp) return;
    const sim = state.lesson.sim || {};
    const period = sim.periodMs || 1000;
    const t = (now - state.simT0) / 1000;
    switch (sim.mode) {
      case 'blink':
        simComp.userData.setState({ on: ((now - state.simT0) % period) < period / 2 });
        break;
      case 'fade':
        simComp.userData.setState({ on: true, brightness: 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / (period / 1000)) });
        break;
      case 'on':
        if (simKind === 'led') simComp.userData.setState({ on: true, brightness: 1 });
        else if (simKind === 'rgb-led') simComp.userData.setState({ on: true });
        else if (simKind === 'button') simComp.userData.setState({ pressed: ((now - state.simT0) % 1600) < 800 });
        break;
      case 'rgb-cycle': {
        const c = new THREE.Color().setHSL((t * 0.12) % 1, 0.85, 0.55);
        simComp.userData.setState({ on: true, color: '#' + c.getHexString() });
        break;
      }
      case 'servo-sweep':
        simComp.userData.setState({ angle: 90 - 90 * Math.cos((t * Math.PI * 2) / ((sim.periodMs || 3600) / 1000)) });
        break;
      case 'tone': {
        const idx = Math.floor(t / ((sim.periodMs || 420) / 1000)) % NOTES.length;
        setSimNote(`♪ Now playing: ${NOTES[idx]}`);
        break;
      }
      case 'count':
        simComp.userData.setState({ value: Math.floor(t / (period / 1000)) % 10 });
        break;
      case 'sensor':
        if (simKind === 'pir') simComp.userData.setState({ motion: Math.sin(t * 0.7) > 0.1 });
        else if (simKind === 'ldr') simComp.userData.setState({ level: 0.5 + 0.5 * Math.sin(t * 0.8) });
        else if (simKind === 'potentiometer') simComp.userData.setState({ value: 0.5 + 0.5 * Math.sin(t * 0.6) });
        break;
      default:
        break; // 'motor-spin', 'distance', 'lcd-text' are state-driven, set in runSim
    }
  }

  /* ---------- chrome controls ---------- */
  const btnRun = $('btn-run'); if (btnRun) btnRun.addEventListener('click', runSim);
  const btnStop = $('btn-stop'); if (btnStop) btnStop.addEventListener('click', () => stopSim(true));
  const btnReset = $('btn-reset-view');
  if (btnReset) btnReset.addEventListener('click', () => { camera.position.copy(homePos); controls.target.copy(homeTarget); });
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.9;
  const tglRotate = $('tgl-rotate');
  if (tglRotate) tglRotate.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    tglRotate.setAttribute('aria-pressed', String(controls.autoRotate));
    tglRotate.classList.toggle('active', controls.autoRotate);
  });
  const tglLabels = $('tgl-labels');
  if (tglLabels) {
    tglLabels.setAttribute('aria-pressed', 'true');
    tglLabels.addEventListener('click', () => {
      state.labelsOn = !state.labelsOn;
      tglLabels.setAttribute('aria-pressed', String(state.labelsOn));
      tglLabels.classList.toggle('active', state.labelsOn);
      labelLayer.style.display = state.labelsOn ? '' : 'none';
    });
  }
  if (reduced && tglRotate) tglRotate.setAttribute('aria-pressed', 'false');

  /* ---------- resize ---------- */
  function resize() {
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------- labels projection ---------- */
  const projV = new THREE.Vector3();
  function updateLabels() {
    if (!state.labelsOn) return;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    const dist = camera.position.distanceTo(controls.target);
    const far = dist > homeDist * 1.05;
    const sorted = labelEntries.slice().sort((a, b) => b.priority - a.priority);
    const shown = new Set(far ? sorted.filter((e) => e.priority >= 2).slice(0, 40).map((e) => e.name)
                               : sorted.slice(0, 40).map((e) => e.name));
    labelEntries.forEach((e) => {
      if (!shown.has(e.name)) { e.el.style.display = 'none'; return; }
      projV.copy(e.world).project(camera);
      if (projV.z > 1 || projV.z < -1) { e.el.style.display = 'none'; return; }
      e.el.style.display = '';
      e.el.style.transform = `translate(-50%,-160%) translate(${((projV.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-projV.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
    });
  }

  /* ---------- main loop ---------- */
  const clock = new THREE.Clock();
  let firstFrame = true;
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    controls.update();
    if (simComp && simComp.userData.tick) simComp.userData.tick(dt, t);
    updateSim(performance.now());
    if (ring.visible) {
      const s = 1 + 0.18 * Math.sin(t * 5);
      ring.scale.set(s, s, s);
      ring.material.opacity = 0.65 + 0.3 * Math.sin(t * 5);
    }
    renderer.render(scene, camera);
    updateLabels();
    if (firstFrame) {
      firstFrame = false;
      const load = $('loading');
      if (load) { load.classList.add('done'); setTimeout(() => { load.hidden = true; }, 650); }
    }
  }

  renderList();
  if (lessons.length) selectLesson(0);
  animate();

  return {
    ok: true,
    selectLesson,
    run: runSim,
    stop: () => stopSim(true),
    scene, camera, renderer,
  };
}
