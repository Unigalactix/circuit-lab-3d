/* CircuitLab 3D — boards3d.js
   Original procedural 3D models: microcontroller boards, a breadboard,
   and classroom components. Built with three.js primitives only.
   Convention: PCB lies in the XZ plane, top face is +Y, board origin at
   PCB centre. group.userData.pinAnchors maps pin NAME -> THREE.Vector3
   at the pin's top, in board-local coordinates. */

import * as THREE from 'three';

/* ---------------- shared materials & helpers ---------------- */

const PT = 0.08; // PCB top surface height (PCB is 0.16 thick, centred on y=0)

function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: o.r ?? 0.55,
    metalness: o.m ?? 0.08,
    emissive: o.e ?? 0x000000,
    emissiveIntensity: o.ei ?? 1,
    transparent: o.t ?? false,
    opacity: o.o ?? 1,
  });
}

const MAT = {
  plastic: mat(0x14161a, { r: 0.6 }),
  gold: mat(0xd9b45c, { r: 0.32, m: 0.9 }),
  silver: mat(0xc9ccd4, { r: 0.3, m: 0.9 }),
  darkSilver: mat(0x8f959e, { r: 0.42, m: 0.85 }),
  chip: mat(0x1b1d22, { r: 0.45 }),
  chipTop: mat(0x2c2f36, { r: 0.4 }),
  white: mat(0xf4f4f2, { r: 0.5 }),
  red: mat(0xc22e2e, { r: 0.5 }),
};

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}
function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  return m;
}

/* Flat silkscreen-style text label lying on a surface ( faces +Y ). */
function silk(text, w = 1.8, color = '#ffffff', opacity = 0.92) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 128);
  g.font = '700 58px Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w / 4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, toneMapped: false })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function pcb(w, d, color) {
  const g = new THREE.Group();
  g.add(box(w, 0.16, d, mat(color, { r: 0.5, m: 0.05 })));
  // subtle edge highlight strip
  g.add(box(w - 0.12, 0.02, d - 0.12, mat(color, { r: 0.38, m: 0.05 }), 0, PT + 0.005, 0));
  return g;
}

/* A row of header pins along X. Registers anchors (first name wins). */
function headerRowX(parent, anchors, names, x0, z, spacing = 0.254) {
  const n = names.length;
  const len = n * spacing;
  const cx = x0 + ((n - 1) * spacing) / 2;
  parent.add(box(len, 0.24, 0.3, MAT.plastic, cx, PT + 0.12, z));
  names.forEach((name, i) => {
    const x = x0 + i * spacing;
    parent.add(box(0.09, 0.56, 0.09, MAT.gold, x, PT + 0.3, z));
    if (name && !anchors.has(name)) anchors.set(name, new THREE.Vector3(x, PT + 0.6, z));
  });
}

/* A row of header pins along Z. */
function headerRowZ(parent, anchors, names, x, z0, spacing = 0.254) {
  const n = names.length;
  const len = n * spacing;
  const cz = z0 + ((n - 1) * spacing) / 2;
  parent.add(box(0.3, 0.24, len, MAT.plastic, x, PT + 0.12, cz));
  names.forEach((name, i) => {
    const z = z0 + i * spacing;
    parent.add(box(0.09, 0.56, 0.09, MAT.gold, x, PT + 0.3, z));
    if (name && !anchors.has(name)) anchors.set(name, new THREE.Vector3(x, PT + 0.6, z));
  });
}

function usbB(x, z) { // chunky printer-style USB-B socket
  const g = new THREE.Group();
  g.add(box(1.25, 1.15, 1.25, MAT.silver, 0, PT + 0.57, 0));
  g.add(box(0.8, 0.7, 0.1, MAT.plastic, 0, PT + 0.55, -0.6));
  g.position.set(x, 0, z);
  return g;
}
function usbMicro(x, z) {
  const g = new THREE.Group();
  g.add(box(0.75, 0.32, 0.6, MAT.silver, 0, PT + 0.16, 0));
  g.position.set(x, 0, z);
  return g;
}
function barrelJack(x, z) {
  const g = new THREE.Group();
  const body = cyl(0.52, 0.52, 0.95, MAT.plastic, 0, PT + 0.47, 0);
  g.add(body);
  g.add(cyl(0.2, 0.2, 0.2, MAT.plastic, 0, PT + 0.98, 0));
  g.position.set(x, 0, z);
  return g;
}
function resetButton(x, z, color = 0xd23b3b) {
  const g = new THREE.Group();
  g.add(box(0.55, 0.3, 0.55, MAT.plastic, 0, PT + 0.15, 0));
  g.add(cyl(0.16, 0.16, 0.14, mat(color, { r: 0.45 }), 0, PT + 0.36, 0));
  g.position.set(x, 0, z);
  return g;
}
function crystal(x, z, w = 0.85) {
  return box(w, 0.18, 0.55, MAT.silver, x, PT + 0.09, z);
}
function capCan(x, z, color = 0x22335e) {
  return cyl(0.3, 0.3, 0.75, mat(color, { r: 0.4, m: 0.3 }), x, PT + 0.37, z);
}
function ledDot(x, z, color) {
  const m = box(0.22, 0.1, 0.34, mat(color, { e: color, ei: 1.6, r: 0.35 }), x, PT + 0.05, z);
  return m;
}

/* ---------------- Arduino Uno ---------------- */

function buildUno() {
  const g = pcb(6.8, 5.3, 0x0a7f84);
  const anchors = new Map();
  g.add(usbB(-2.55, -1.55));
  g.add(barrelJack(-2.6, 1.75));
  g.add(capCan(-1.75, 1.9)); g.add(capCan(-1.1, 1.95, 0x3a3f47));
  // ATmega328P in socket
  g.add(box(3.3, 0.22, 0.95, MAT.plastic, 0.55, PT + 0.11, 0.45));
  g.add(box(3.1, 0.2, 0.8, MAT.chip, 0.55, PT + 0.3, 0.45));
  g.add(crystal(0.2, -0.65));
  g.add(box(0.85, 0.3, 0.85, MAT.chip, -1.7, PT + 0.15, -0.7)); // USB-serial chip
  g.add(resetButton(-2.95, -2.25));
  g.add(ledDot(1.85, -1.7, 0xffb02e)); // "L" LED by pin 13
  g.add(ledDot(-1.5, -1.85, 0x39d353)); // power LED
  const title = silk('ARDUINO UNO', 2.6); title.position.set(0.6, PT + 0.02, -1.15); g.add(title);
  // headers
  headerRowX(g, anchors, ['D0','D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','GND','AREF'], -1.7, -2.38);
  headerRowX(g, anchors, ['IOREF','RST','3V3','5V','GND','GND2','VIN'], -3.05, 2.38);
  headerRowX(g, anchors, ['A0','A1','A2','A3','A4','A5'], 0.75, 2.38);
  anchors.delete('GND2');
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 6.8, d: 5.3 };
  g.userData.boardName = 'Arduino Uno';
  return g;
}

/* ---------------- Arduino Mega 2560 ---------------- */

function buildMega() {
  const g = pcb(10.15, 5.35, 0x0a7379);
  const anchors = new Map();
  g.add(usbB(-4.15, -1.5));
  g.add(barrelJack(-4.25, 1.8));
  g.add(capCan(-3.4, 1.95)); g.add(capCan(-2.75, 2.0, 0x3a3f47));
  g.add(box(1.5, 0.22, 1.5, MAT.chip, 0.6, PT + 0.11, 0.1)); // ATmega2560
  g.add(box(1.3, 0.06, 1.3, MAT.chipTop, 0.6, PT + 0.25, 0.1));
  g.add(crystal(1.9, -0.9));
  g.add(box(0.85, 0.3, 0.85, MAT.chip, -2.6, PT + 0.15, -0.6));
  g.add(resetButton(-4.55, -2.2));
  g.add(ledDot(2.6, -1.75, 0xffb02e));
  g.add(ledDot(-2.2, -1.9, 0x39d353));
  const title = silk('ARDUINO MEGA 2560', 3.4); title.position.set(0.4, PT + 0.02, -1.2); g.add(title);
  const dig = [];
  for (let i = 0; i <= 21; i++) dig.push('D' + i);
  headerRowX(g, anchors, dig, -2.75, -2.4);
  headerRowX(g, anchors, ['RST','3V3','5V','GND','GND2','VIN'], -4.55, 2.4);
  const ana = [];
  for (let i = 0; i <= 15; i++) ana.push('A' + i);
  headerRowX(g, anchors, ana, 0.35, 2.4);
  const end = [];
  for (let i = 44; i <= 53; i++) end.push('D' + i);
  headerRowZ(g, anchors, end, 4.75, -1.15);
  anchors.delete('GND2');
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 10.15, d: 5.35 };
  g.userData.boardName = 'Arduino Mega 2560';
  return g;
}

/* ---------------- Arduino Nano ---------------- */

function buildNano() {
  const g = pcb(4.3, 1.8, 0x0a7f84);
  const anchors = new Map();
  g.add(usbMicro(-1.95, 0));
  g.add(box(1.05, 0.2, 1.05, MAT.chip, 0.35, PT + 0.1, 0)); // ATmega328P QFN
  g.add(crystal(1.15, 0, 0.5));
  g.add(box(0.3, 0.16, 0.42, MAT.plastic, -1.35, PT + 0.08, 0.45)); // reset button
  g.add(ledDot(1.75, -0.55, 0x39d353));
  const title = silk('NANO', 0.95); title.position.set(0.3, PT + 0.02, 0); g.add(title);
  headerRowX(g, anchors, ['RST','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'], -1.8, -0.68, 0.3);
  headerRowX(g, anchors, ['A0','A1','A2','A3','A4','A5','A6','A7','AREF','3V3','5V','GND','VIN'], -1.8, 0.68, 0.3);
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 4.3, d: 1.8 };
  g.userData.boardName = 'Arduino Nano';
  return g;
}


/* ---------------- ESP32 DevKit ---------------- */

function buildEsp32() {
  const g = pcb(5.2, 2.85, 0x17181c);
  const anchors = new Map();
  // antenna keep-out zone at the far end
  g.add(box(2.0, 0.03, 2.5, mat(0x23252b, { r: 0.6 }), -1.55, PT + 0.015, 0));
  // metal RF shield can
  const can = box(1.9, 0.42, 1.9, MAT.silver, 0.1, PT + 0.21, 0);
  g.add(can);
  const canLabel = silk('ESP32', 1.05, '#3a3f47'); canLabel.position.set(0.1, PT + 0.43, 0); g.add(canLabel);
  g.add(box(0.7, 0.16, 0.7, MAT.chip, 1.35, PT + 0.08, 0.6)); // flash chip
  g.add(usbMicro(2.45, 0));
  g.add(box(0.42, 0.22, 0.42, MAT.plastic, 1.95, PT + 0.11, -0.85)); // EN button
  g.add(box(0.42, 0.22, 0.42, MAT.plastic, 1.95, PT + 0.11, 0.85));  // BOOT button
  g.add(ledDot(1.6, -0.95, 0xe23b3b));
  headerRowX(g, anchors,
    ['EN','GPIO36','GPIO39','GPIO34','GPIO35','GPIO32','GPIO33','GPIO25','GPIO26','GPIO27','GPIO14','GPIO12','GND','GPIO13','VIN'],
    -2.42, -1.26, 0.325);
  headerRowX(g, anchors,
    ['GPIO23','GPIO22','GPIO21','GPIO19','GPIO18','GPIO5','GPIO17','GPIO16','GPIO4','GPIO2','GPIO15','GND2','GPIO0','CLK','3V3'],
    -2.42, 1.26, 0.325);
  anchors.delete('GND2');
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 5.2, d: 2.85 };
  g.userData.boardName = 'ESP32 DevKit';
  return g;
}

/* ---------------- Raspberry Pi Pico ---------------- */

function buildPico() {
  const g = pcb(5.1, 2.1, 0x0a7a3d);
  const anchors = new Map();
  g.add(usbMicro(-2.35, 0));
  g.add(box(0.95, 0.2, 0.95, MAT.chip, -0.5, PT + 0.1, 0)); // RP2040
  const chipLbl = silk('RP2040', 0.7); chipLbl.position.set(-0.5, PT + 0.21, 0); g.add(chipLbl);
  g.add(crystal(0.35, 0, 0.5));
  g.add(box(0.62, 0.24, 0.5, MAT.white, 1.35, PT + 0.12, 0)); // BOOTSEL button
  g.add(box(0.8, 0.16, 0.8, MAT.chip, 0.9, PT + 0.08, 0.55)); // flash
  g.add(ledDot(-1.35, -0.6, 0x39d353));
  const title = silk('PICO', 0.85); title.position.set(1.5, PT + 0.02, -0.55); g.add(title);
  headerRowX(g, anchors,
    ['GP0','GP1','GND','GP2','GP3','GP4','GP5','GND2','GP6','GP7','GP8','GP9','GND3','GP10','GP11','GP12','GP13','GND4','GP14','GP15'],
    -2.28, -0.88, 0.24);
  headerRowX(g, anchors,
    ['VBUS','VSYS','GND5','3V3_EN','3V3','ADC_VREF','GP28','AGND','GP27','GP26','RUN','GP22','GND6','GP21','GP20','GP19','GP18','GND7','GP17','GP16'],
    -2.28, 0.88, 0.24);
  ['GND2','GND3','GND4','GND5','GND6','GND7'].forEach((k) => anchors.delete(k));
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 5.1, d: 2.1 };
  g.userData.boardName = 'Raspberry Pi Pico';
  return g;
}

/* ---------------- Raspberry Pi 4 ---------------- */

function buildPi4() {
  const g = pcb(8.5, 5.6, 0x0b6e35);
  const anchors = new Map();
  // SoC with metal heat-spreader top + RAM
  g.add(box(1.45, 0.28, 1.45, MAT.chip, -0.7, PT + 0.14, 0.1));
  g.add(box(1.25, 0.08, 1.25, MAT.silver, -0.7, PT + 0.32, 0.1));
  g.add(box(1.3, 0.24, 1.3, MAT.chip, 0.95, PT + 0.12, 0.35));
  g.add(box(0.8, 0.2, 0.8, MAT.chip, -2.1, PT + 0.1, 1.2)); // USB-C power controller area
  // USB-C port (front edge), 2x micro-HDMI, audio jack
  g.add(box(0.95, 0.4, 0.55, MAT.silver, -1.5, PT + 0.2, 2.72));
  g.add(box(0.8, 0.3, 0.45, MAT.darkSilver, -0.35, PT + 0.15, 2.74));
  g.add(box(0.8, 0.3, 0.45, MAT.darkSilver, 0.55, PT + 0.15, 2.74));
  g.add(cyl(0.32, 0.32, 0.5, MAT.plastic, 1.55, PT + 0.25, 2.6));
  // 2x USB-A stacks + Ethernet on the right edge
  g.add(box(1.5, 1.35, 1.45, MAT.silver, 3.65, PT + 0.67, 1.55));
  g.add(box(1.5, 1.35, 1.45, MAT.silver, 3.65, PT + 0.67, -0.15));
  g.add(box(1.6, 1.5, 1.9, MAT.silver, 3.6, PT + 0.75, -1.75));
  g.add(box(1.35, 0.25, 1.65, MAT.plastic, 3.6, PT + 0.12, -1.75));
  // micro-SD slot hint under the front edge
  g.add(box(1.3, 0.09, 1.2, MAT.plastic, -0.6, -0.12, 1.6));
  g.add(ledDot(-3.6, 2.35, 0xe23b3b));
  g.add(ledDot(-3.25, 2.35, 0x39d353));
  const title = silk('RASPBERRY PI 4', 2.8); title.position.set(-1.2, PT + 0.02, -1.5); g.add(title);
  // 2x20 GPIO header along the back edge (odd row outer, even row inner)
  headerRowX(g, anchors,
    ['3V3','GPIO2','GPIO3','GPIO4','GND','GPIO17','GPIO27','GPIO22','3V3B','GPIO10','GPIO9','GPIO11','GNDB','GPIO0','GPIO5','GPIO6','GPIO13','GPIO19','GPIO26','GNDC'],
    -4.0, -2.52);
  headerRowX(g, anchors,
    ['5V','5VB','GNDD','GPIO14','GPIO15','GPIO18','GNDE','GPIO23','GPIO24','GNDF','GPIO25','GPIO8','GPIO7','GPIO1','GNDG','GPIO12','GNDH','GPIO16','GPIO20','GPIO21'],
    -4.0, -2.26);
  ['3V3B','5VB','GNDB','GNDC','GNDD','GNDE','GNDF','GNDG','GNDH'].forEach((k) => anchors.delete(k));
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 8.5, d: 5.6 };
  g.userData.boardName = 'Raspberry Pi 4';
  return g;
}

/* ---------------- board factory ---------------- */

export function buildBoard(id) {
  switch (id) {
    case 'uno': return buildUno();
    case 'mega': return buildMega();
    case 'nano': return buildNano();
    case 'esp32': return buildEsp32();
    case 'pico': return buildPico();
    case 'pi4': return buildPi4();
    default: return buildUno();
  }
}

/* ---------------- 830-point breadboard ---------------- */

export function buildBreadboard() {
  const g = new THREE.Group();
  const W = 16.5, D = 5.5, H = 0.85;
  const body = box(W, H, D, mat(0xefe9da, { r: 0.65 }), 0, H / 2, 0);
  g.add(body);
  // top texture: hole grid + red/blue power rails
  const c = document.createElement('canvas');
  c.width = 1650; c.height = 550;
  const x = c.getContext('2d');
  x.fillStyle = '#f4efe3'; x.fillRect(0, 0, 1650, 550);
  const rail = (y, col, sign) => {
    x.strokeStyle = col; x.lineWidth = 5;
    x.beginPath(); x.moveTo(30, y); x.lineTo(1620, y); x.stroke();
    x.fillStyle = col; x.font = '700 30px Arial'; x.fillText(sign, 8, y + 10);
  };
  rail(38, '#c22e2e', '+'); rail(78, '#27408f', '−');
  rail(472, '#27408f', '−'); rail(512, '#c22e2e', '+');
  x.fillStyle = 'rgba(60,58,50,0.55)';
  const dot = (cx, cy) => { x.beginPath(); x.arc(cx, cy, 5.5, 0, Math.PI * 2); x.fill(); };
  for (let col = 0; col < 63; col++) {
    const cx = 45 + col * 25;
    for (let r = 0; r < 5; r++) { dot(cx, 130 + r * 26); dot(cx, 320 + r * 26); }
    for (let r = 0; r < 2; r++) { dot(cx, 34 + r * 44); dot(cx, 468 + r * 44); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, D - 0.1),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = H + 0.006;
  g.add(top);
  // centre groove
  g.add(box(W - 0.4, 0.05, 0.5, mat(0xd9d2bf, { r: 0.8 }), 0, H + 0.01, 0));
  g.userData.topY = H + 0.02;
  g.userData.size = { w: W, d: D };
  g.userData.boardName = 'Breadboard · 830 points';
  return g;
}

/* ---------------- components ---------------- */

function leg(x, z, h = 0.55, color = 0xb9bec7) {
  return box(0.055, h, 0.055, mat(color, { r: 0.35, m: 0.85 }), x, h / 2, z);
}
function baseComponent(anchors) {
  const g = new THREE.Group();
  g.userData.anchors = anchors;
  g.userData.state = {};
  g.userData.setState = (s) => { Object.assign(g.userData.state, s || {}); };
  g.userData.tick = () => {};
  return g;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function buildLed() {
  const g = baseComponent({ '+': V3(0.13, 0.1, 0), '-': V3(-0.13, 0.1, 0), anode: V3(0.13, 0.1, 0), cathode: V3(-0.13, 0.1, 0) });
  const domeMat = mat(0xe23b3b, { r: 0.25, t: true, o: 0.88, e: 0xe23b3b, ei: 0 });
  g.add(leg(0.13, 0)); g.add(leg(-0.13, 0));
  const bodyGeo = cyl(0.26, 0.28, 0.5, domeMat, 0, 0.72, 0);
  g.add(bodyGeo);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), domeMat);
  dome.scale.y = 0.75; dome.position.y = 0.97; g.add(dome);
  g.add(cyl(0.3, 0.3, 0.07, domeMat, 0, 0.5, 0)); // flange
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    const st = g.userData.state;
    if (st.color) { domeMat.color.set(st.color); domeMat.emissive.set(st.color); }
    const b = st.brightness ?? 1;
    domeMat.emissiveIntensity = st.on ? 0.5 + 2.4 * b : 0;
    domeMat.opacity = st.on ? 1 : 0.82;
  };
  return g;
}

function buildRgbLed() {
  const anchors = { COM: V3(-0.2, 0.1, 0), '+': V3(-0.2, 0.1, 0), R: V3(-0.07, 0.1, 0), G: V3(0.07, 0.1, 0), B: V3(0.2, 0.1, 0) };
  const g = baseComponent(anchors);
  const domeMat = mat(0xf2f2f2, { r: 0.2, t: true, o: 0.75, e: 0x000000, ei: 0 });
  [-0.2, -0.07, 0.07, 0.2].forEach((x) => g.add(leg(x, 0)));
  g.add(cyl(0.27, 0.29, 0.5, domeMat, 0, 0.72, 0));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 12), domeMat);
  dome.scale.y = 0.75; dome.position.y = 0.97; g.add(dome);
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    const st = g.userData.state;
    if (st.color) { domeMat.emissive.set(st.color); domeMat.color.set(st.color); }
    domeMat.emissiveIntensity = st.on === false ? 0 : 2.2;
    domeMat.opacity = st.on === false ? 0.7 : 0.95;
  };
  return g;
}

function buildButton() {
  const g = baseComponent({ '1': V3(-0.3, 0.1, 0), '2': V3(0.3, 0.1, 0), a: V3(-0.3, 0.1, 0), b: V3(0.3, 0.1, 0) });
  g.add(leg(-0.3, -0.18)); g.add(leg(0.3, -0.18)); g.add(leg(-0.3, 0.18)); g.add(leg(0.3, 0.18));
  g.add(box(0.72, 0.3, 0.72, MAT.plastic, 0, 0.42, 0));
  const plunger = cyl(0.2, 0.2, 0.22, mat(0xe2b13c, { r: 0.45 }), 0, 0.66, 0);
  g.add(plunger);
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    plunger.position.y = g.userData.state.pressed ? 0.58 : 0.66;
  };
  return g;
}

function buildPot() {
  const g = baseComponent({ VCC: V3(-0.35, 0.1, 0), '1': V3(-0.35, 0.1, 0), WIPER: V3(0, 0.1, 0), '2': V3(0, 0.1, 0), GND: V3(0.35, 0.1, 0), '3': V3(0.35, 0.1, 0) });
  g.add(leg(-0.35, 0)); g.add(leg(0, 0)); g.add(leg(0.35, 0));
  g.add(box(0.95, 0.35, 0.95, mat(0x27408f, { r: 0.5 }), 0, 0.42, 0));
  const shaft = cyl(0.11, 0.11, 0.4, MAT.silver, 0, 0.78, 0);
  g.add(shaft);
  const knob = new THREE.Group();
  const kBody = cyl(0.34, 0.36, 0.34, MAT.plastic, 0, 0, 0);
  knob.add(kBody);
  knob.add(box(0.07, 0.36, 0.2, MAT.white, 0, 0, -0.22)); // pointer mark
  knob.position.y = 1.1;
  g.add(knob);
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    const v = g.userData.state.value ?? 0.5;
    knob.rotation.y = -2.35 + v * 4.7;
  };
  g.userData.setState({ value: 0.5 });
  return g;
}

function buildServo() {
  const g = baseComponent({ SIG: V3(-0.16, 0.1, 0.3), signal: V3(-0.16, 0.1, 0.3), VCC: V3(0, 0.1, 0.3), '+': V3(0, 0.1, 0.3), GND: V3(0.16, 0.1, 0.3), '-': V3(0.16, 0.1, 0.3) });
  g.add(box(1.15, 0.95, 0.6, mat(0x27408f, { r: 0.5 }), 0, 0.48, 0));
  g.add(box(1.55, 0.14, 0.6, mat(0x27408f, { r: 0.5 }), 0, 0.75, 0)); // mounting flange
  g.add(cyl(0.3, 0.3, 0.25, mat(0x1d2f66, { r: 0.5 }), 0, 1.05, 0)); // output boss
  const horn = new THREE.Group();
  horn.add(box(1.15, 0.09, 0.24, MAT.white, 0, 0, 0));
  horn.add(box(0.24, 0.09, 0.7, MAT.white, 0, 0, 0));
  horn.position.y = 1.22;
  g.add(horn);
  let cur = 90;
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    if (g.userData.state.angle == null) g.userData.state.angle = 90;
  };
  g.userData.tick = (dt) => {
    const target = g.userData.state.angle ?? 90;
    cur += (target - cur) * Math.min(1, dt * 7);
    horn.rotation.y = THREE.MathUtils.degToRad(90 - cur);
  };
  return g;
}

function buildDcMotor() {
  const g = baseComponent({ '+': V3(-0.15, 0.1, 0.35), '-': V3(0.15, 0.1, 0.35) });
  const can = cyl(0.42, 0.42, 0.95, MAT.darkSilver, 0, 0.45, 0);
  can.rotation.x = Math.PI / 2;
  g.add(can);
  g.add(box(0.5, 0.5, 0.12, mat(0x3a3f47, { r: 0.5 }), 0, 0.45, -0.5)); // rear cap mount
  const fan = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = box(0.16, 0.62, 0.04, mat(0xe2b13c, { r: 0.5 }), 0, 0.34, 0);
    const holder = new THREE.Group();
    holder.add(blade);
    holder.rotation.z = (i * Math.PI * 2) / 3;
    fan.add(holder);
  }
  fan.add(cyl(0.11, 0.11, 0.14, MAT.plastic, 0, 0, 0));
  fan.children.forEach((h) => { if (h.geometry && h.geometry.type === 'CylinderGeometry') h.rotation.x = Math.PI / 2; });
  fan.position.set(0, 0.45, 0.62);
  g.add(fan);
  const hub = cyl(0.07, 0.07, 0.3, MAT.silver, 0, 0.45, 0.48);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  let speed = 0;
  g.userData.tick = (dt) => {
    const target = g.userData.state.spinning ? 26 : 0;
    speed += (target - speed) * Math.min(1, dt * 2.2);
    fan.rotation.z += speed * dt;
  };
  return g;
}

function buildBuzzer() {
  const g = baseComponent({ '+': V3(0.28, 0.1, 0), '-': V3(-0.28, 0.1, 0) });
  g.add(leg(0.28, 0)); g.add(leg(-0.28, 0));
  const bodyG = new THREE.Group();
  bodyG.add(cyl(0.42, 0.42, 0.55, MAT.plastic, 0, 0, 0));
  bodyG.add(cyl(0.12, 0.12, 0.06, mat(0x05060a, { r: 0.6 }), 0, 0.3, 0)); // sound hole
  bodyG.position.y = 0.6;
  g.add(bodyG);
  g.userData.tick = (dt, t) => {
    const s = g.userData.state.active ? 1 + 0.07 * Math.sin((t || 0) * 55) : 1;
    bodyG.scale.set(s, 1, s);
  };
  return g;
}

function buildLdr() {
  const g = baseComponent({ '1': V3(-0.13, 0.1, 0), A: V3(-0.13, 0.1, 0), '2': V3(0.13, 0.1, 0), B: V3(0.13, 0.1, 0) });
  g.add(leg(-0.13, 0)); g.add(leg(0.13, 0));
  const faceMat = mat(0xb3541e, { r: 0.4, e: 0xff9a3c, ei: 0 });
  const disc = cyl(0.3, 0.3, 0.16, faceMat, 0, 0.6, 0);
  g.add(disc);
  g.add(box(0.4, 0.03, 0.07, mat(0xd8c26a, { r: 0.4, m: 0.6 }), 0, 0.69, 0)); // squiggle trace hint
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    faceMat.emissiveIntensity = (g.userData.state.level ?? 0) * 0.7;
  };
  return g;
}

function buildUltrasonic() {
  const g = baseComponent({ VCC: V3(-0.45, 0.1, 0.2), TRIG: V3(-0.15, 0.1, 0.2), ECHO: V3(0.15, 0.1, 0.2), GND: V3(0.45, 0.1, 0.2) });
  g.add(box(1.9, 0.95, 0.12, mat(0x1d4e9e, { r: 0.5 }), 0, 0.55, 0));
  [-0.48, 0.48].forEach((x) => {
    const canM = cyl(0.36, 0.36, 0.3, MAT.silver, x, 0.6, 0.18);
    canM.rotation.x = Math.PI / 2;
    g.add(canM);
    const face = cyl(0.27, 0.27, 0.04, mat(0x6a7078, { r: 0.6 }), x, 0.6, 0.34);
    face.rotation.x = Math.PI / 2;
    g.add(face);
  });
  g.add(box(0.4, 0.3, 0.1, MAT.chip, 0, 0.28, 0.1));
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7db4ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.95, 40), ringMat);
  ring.position.set(0, 0.6, 0.4);
  g.add(ring);
  let phase = 0;
  g.userData.tick = (dt) => {
    if (g.userData.state.ping) {
      phase = (phase + dt * 0.9) % 1;
      const s = 0.4 + phase * 2.6;
      ring.scale.set(s, s, s);
      ringMat.opacity = 0.55 * (1 - phase);
    } else {
      ringMat.opacity = 0;
    }
  };
  return g;
}

const SEG_MAP = {
  0: ['a','b','c','d','e','f'], 1: ['b','c'], 2: ['a','b','g','e','d'],
  3: ['a','b','g','c','d'], 4: ['f','g','b','c'], 5: ['a','f','g','c','d'],
  6: ['a','f','g','e','c','d'], 7: ['a','b','c'], 8: ['a','b','c','d','e','f','g'],
  9: ['a','b','c','d','f','g'],
};
function buildSevenSeg() {
  const g = baseComponent({ VCC: V3(-0.4, 0.1, 0.25), COM: V3(-0.4, 0.1, 0.25), GND: V3(0.4, 0.1, 0.25), DIN: V3(0, 0.1, 0.25) });
  g.add(leg(-0.4, 0.25)); g.add(leg(0.4, 0.25)); g.add(leg(0, 0.25));
  g.add(box(1.0, 0.22, 1.35, MAT.plastic, 0, 0.45, 0));
  const onMat = mat(0x30060a, { r: 0.35, e: 0xff2a1e, ei: 0 });
  const segs = {};
  const segH = (x, z) => { const m = box(0.4, 0.07, 0.11, onMat, x, 0.58, z); g.add(m); return m; };
  const segV = (x, z) => { const m = box(0.11, 0.07, 0.36, onMat, x, 0.58, z); g.add(m); return m; };
  segs.a = segH(0, -0.48); segs.g = segH(0, 0); segs.d = segH(0, 0.48);
  segs.f = segV(-0.26, -0.25); segs.b = segV(0.26, -0.25);
  segs.e = segV(-0.26, 0.25); segs.c = segV(0.26, 0.25);
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    const v = g.userData.state.value;
    const lit = v == null ? [] : (SEG_MAP[v] || []);
    Object.entries(segs).forEach(([k, m]) => { m.material = onMat; m.visible = true; });
    onMat.emissiveIntensity = 2.4;
    Object.entries(segs).forEach(([k, m]) => { m.userData.lit = lit.includes(k); });
    // per-segment intensity via scale trick: unlit segments shrink to near-invisible
    Object.values(segs).forEach((m) => { const s2 = m.userData.lit ? 1 : 0.25; m.scale.set(s2, 0.4, s2); });
    onMat.color.set(0x30060a);
  };
  g.userData.setState({ value: 8 });
  return g;
}

function buildLcd() {
  const g = baseComponent({ VCC: V3(-0.6, 0.1, 0.2), GND: V3(-0.3, 0.1, 0.2), SDA: V3(0.3, 0.1, 0.2), SCL: V3(0.6, 0.1, 0.2) });
  g.add(box(2.6, 1.05, 0.14, mat(0x1d4e9e, { r: 0.5 }), 0, 0.55, 0));
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const tex = new THREE.CanvasTexture(c);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.7),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, 0.58, 0.08);
  g.add(screen);
  const draw = (text) => {
    const x = c.getContext('2d');
    x.fillStyle = '#14418f'; x.fillRect(0, 0, 512, 160);
    x.fillStyle = '#eaf4ff';
    x.font = '700 44px "Courier New", monospace';
    x.textBaseline = 'middle';
    const lines = String(text || 'CircuitLab 3D').split('\n');
    x.fillText((lines[0] || '').slice(0, 16), 22, 42);
    x.fillText((lines[1] || '').slice(0, 16), 22, 112);
    tex.needsUpdate = true;
  };
  draw('CircuitLab 3D\nReady');
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    if (g.userData.state.text != null) draw(g.userData.state.text);
  };
  return g;
}

function buildPir() {
  const g = baseComponent({ VCC: V3(-0.35, 0.1, 0), OUT: V3(0, 0.1, 0), GND: V3(0.35, 0.1, 0) });
  g.add(leg(-0.35, 0)); g.add(leg(0, 0)); g.add(leg(0.35, 0));
  g.add(box(1.05, 0.14, 1.05, mat(0x8a2f2f, { r: 0.55 }), 0, 0.35, 0));
  const domeMat = mat(0xf6f3ec, { r: 0.35, e: 0xff3b30, ei: 0 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.y = 0.42;
  g.add(dome);
  g.add(cyl(0.14, 0.14, 0.12, mat(0xe2b13c, { r: 0.4 }), 0.62, 0.45, 0.3)); // sensitivity pot hint
  g.userData.setState = (s) => {
    Object.assign(g.userData.state, s || {});
    domeMat.emissiveIntensity = g.userData.state.motion ? 1.5 : 0;
  };
  return g;
}

export function buildComponent(kind) {
  switch (kind) {
    case 'led': return buildLed();
    case 'rgb-led': return buildRgbLed();
    case 'button': return buildButton();
    case 'potentiometer': return buildPot();
    case 'servo': return buildServo();
    case 'dc-motor': return buildDcMotor();
    case 'buzzer': return buildBuzzer();
    case 'ldr': return buildLdr();
    case 'ultrasonic': return buildUltrasonic();
    case 'seven-seg': return buildSevenSeg();
    case 'lcd': return buildLcd();
    case 'pir': return buildPir();
    default: return buildLed();
  }
}
