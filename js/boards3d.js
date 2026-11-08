/* CircuitLab 3D — boards3d.js
   Original procedural 3D models: microcontroller boards, a breadboard,
   and classroom components. Built with three.js primitives only.
   Convention: PCB lies in the XZ plane, top face is +Y, board origin at
   PCB centre. group.userData.pinAnchors maps pin NAME -> THREE.Vector3
   at the pin's top, in board-local coordinates.
   Detail pass: every board carries a canvas silkscreen (board name,
   per-pin labels computed from the same layout constants that place the
   header pins, zone captions, pin-1 markers) plus procedural dressing
   matched to the real hardware (sockets, crystals, caps, regulators,
   connectors, mounting holes, SMD sprinkles). */

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
    envMapIntensity: o.env ?? 1,
  });
}

const MAT = {
  plastic: mat(0x14161a, { r: 0.5, env: 1.1 }),
  gold: mat(0xd9b45c, { r: 0.35, m: 0.85 }),
  silver: mat(0xc9ccd4, { r: 0.35, m: 0.85 }),
  darkSilver: mat(0x8f959e, { r: 0.38, m: 0.85 }),
  chip: mat(0x1b1d22, { r: 0.4, env: 1.1 }),
  chipTop: mat(0x2c2f36, { r: 0.38, env: 1.1 }),
  white: mat(0xf4f4f2, { r: 0.45 }),
  red: mat(0xc22e2e, { r: 0.45 }),
};
const TAN = () => mat(0xc9a86a, { r: 0.5 });

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

/* ---------- canvas silkscreen for a PCB top ----------
   Board coords -> canvas px: px(x) grows with +x, py(z) grows with +z
   (canvas top edge is the board's -z edge), matching a plane rotated
   -90° about X. s = px per board unit on both axes. */
function makeTop(w, d, baseCss) {
  const W = 1024;
  const H = Math.max(64, Math.round((W * d) / w));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseCss; ctx.fillRect(0, 0, W, H);
  const s = W / w;
  return { canvas: c, ctx, s, W, H, px: (x) => (x + w / 2) * s, py: (z) => (z + d / 2) * s };
}
function topTex(t) {
  const tex = new THREE.CanvasTexture(t.canvas);
  tex.anisotropy = 8;
  return tex;
}
function tText(t, txt, x, z, sizePx, o = {}) {
  const { ctx } = t;
  ctx.save();
  ctx.fillStyle = o.color || 'rgba(255,255,255,0.95)';
  ctx.font = `${o.weight || 700} ${sizePx}px Arial, sans-serif`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  if (o.rotate) {
    ctx.translate(t.px(x), t.py(z));
    ctx.rotate(o.rotate);
    ctx.fillText(txt, 0, 0);
  } else {
    ctx.fillText(txt, t.px(x), t.py(z));
  }
  ctx.restore();
}
/* Shorten long anchor names so every pin still gets a readable label. */
const SHORT_LABEL = {
  ADC_VREF: 'VREF', '3V3_EN': '3V3E', '3V3B': '3V3', '5VB': '5V',
  GND2: 'GND', GND3: 'GND', GND4: 'GND', GND5: 'GND', GND6: 'GND', GND7: 'GND',
  GNDB: 'GND', GNDC: 'GND', GNDD: 'GND', GNDE: 'GND', GNDF: 'GND', GNDG: 'GND', GNDH: 'GND',
};
function shortLabel(n) {
  if (SHORT_LABEL[n]) return SHORT_LABEL[n];
  if (n.startsWith('GPIO')) return n.slice(4);
  return n;
}
/* Labels for a header row along X. off = signed z offset toward the
   board interior. Dense rows (pitch < 30 px) rotate labels 90°. */
function pinLabelsX(t, names, x0, z, spacing, off, o = {}) {
  const pitchPx = spacing * t.s;
  const fs = o.fs ?? Math.min(19, Math.max(11, pitchPx * 0.6));
  const rotate = o.rotate ?? (pitchPx < 30);
  names.forEach((name, i) => {
    if (!name) return;
    tText(t, shortLabel(name), x0 + i * spacing, z + off, fs,
      { rotate: rotate ? -Math.PI / 2 : 0, color: o.color });
  });
}
/* Labels for a header row along Z. off = signed x offset. */
function pinLabelsZ(t, names, x, z0, spacing, off, o = {}) {
  const pitchPx = spacing * t.s;
  const fs = o.fs ?? Math.min(19, Math.max(11, pitchPx * 0.6));
  names.forEach((name, i) => {
    if (!name) return;
    tText(t, shortLabel(name), x + off, z0 + i * spacing, fs, { color: o.color });
  });
}
/* Pin-1 marker: small filled dot beside the first pin of a header. */
function pin1(t, x, z) {
  const { ctx } = t;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(t.px(x), t.py(z), Math.max(4, t.s * 0.045), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
/* Small caution triangle (near power entry points). */
function caution(t, x, z, r = 0.16) {
  const { ctx } = t;
  const X = t.px(x), Y = t.py(z), R = r * t.s;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,213,79,0.95)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(X, Y - R); ctx.lineTo(X + R * 0.9, Y + R * 0.75); ctx.lineTo(X - R * 0.9, Y + R * 0.75);
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,213,79,0.95)';
  ctx.font = `700 ${Math.round(R)}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', X, Y + R * 0.3);
  ctx.restore();
}

function pcb(w, d, color, tex) {
  const g = new THREE.Group();
  g.add(box(w, 0.16, d, mat(color, { r: 0.55, m: 0.05 })));
  if (tex) {
    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.03, d - 0.03),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05, envMapIntensity: 1.1 })
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = PT + 0.012;
    g.add(top);
  } else {
    // subtle edge highlight strip
    g.add(box(w - 0.12, 0.02, d - 0.12, mat(color, { r: 0.38, m: 0.05 }), 0, PT + 0.005, 0));
  }
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
  g.add(box(0.55, 0.14, 0.08, MAT.plastic, 0, PT + 0.15, -0.3));
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
  g.add(box(0.55, 0.26, 0.55, mat(0x9aa0a8, { r: 0.5, m: 0.3 }), 0, PT + 0.13, 0)); // grey tactile base
  g.add(cyl(0.17, 0.17, 0.16, mat(color, { r: 0.45 }), 0, PT + 0.34, 0)); // red plunger
  g.position.set(x, 0, z);
  return g;
}
function crystal(x, z, w = 0.85, d = 0.55) {
  return box(w, 0.18, d, MAT.silver, x, PT + 0.09, z);
}
/* Electrolytic capacitor: dark can, silver scored top (vent cross). */
function capCan(x, z, color = 0x22335e, r = 0.3, h = 0.75) {
  const g = new THREE.Group();
  g.add(cyl(r, r, h, mat(color, { r: 0.42, m: 0.25 }), 0, PT + h / 2, 0));
  g.add(cyl(r * 0.96, r * 0.96, 0.045, MAT.silver, 0, PT + h + 0.02, 0));
  g.add(box(r * 1.25, 0.02, 0.05, MAT.darkSilver, 0, PT + h + 0.045, 0));
  g.add(box(0.05, 0.02, r * 1.25, MAT.darkSilver, 0, PT + h + 0.045, 0));
  g.position.set(x, 0, z);
  return g;
}
function ledDot(x, z, color) {
  const m = box(0.22, 0.1, 0.34, mat(color, { e: color, ei: 1.6, r: 0.35 }), x, PT + 0.05, z);
  return m;
}
/* Mounting hole: silver annular ring + dark inset barrel. */
function mountHole(x, z, r = 0.145) {
  const g = new THREE.Group();
  g.add(cyl(r + 0.055, r + 0.055, 0.025, MAT.darkSilver, 0, PT + 0.004, 0));
  g.add(cyl(r, r, 0.2, mat(0x0a0b0d, { r: 0.95 }), 0, PT - 0.04, 0));
  g.position.set(x, 0, z);
  return g;
}
/* Tiny SMD part (0603-ish) dropped on the PCB. */
function smd(parent, x, z, material, w = 0.17, d = 0.1) {
  parent.add(box(w, 0.07, d, material || MAT.chip, x, PT + 0.035, z));
}
function smdRow(parent, x0, z, n, dx = 0.34) {
  for (let i = 0; i < n; i++) smd(parent, x0 + i * dx, z, i % 3 === 2 ? TAN() : MAT.chip);
}
/* SOT-223-style voltage regulator with metal tab. */
function regulator(x, z) {
  const g = new THREE.Group();
  g.add(box(0.52, 0.24, 0.46, MAT.chip, 0, PT + 0.12, 0));
  g.add(box(0.52, 0.05, 0.34, MAT.silver, 0, PT + 0.265, 0));
  g.add(box(0.56, 0.04, 0.22, MAT.darkSilver, 0, PT + 0.02, 0.32));
  g.position.set(x, 0, z);
  return g;
}
/* Yellow resettable polyfuse disc with two strap feet. */
function polyfuse(x, z) {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.3, 0.13, mat(0xd9a821, { r: 0.45, m: 0.3 }), 0, PT + 0.065, 0));
  g.add(box(0.4, 0.03, 0.08, MAT.darkSilver, 0, PT + 0.02, 0.3));
  g.add(box(0.4, 0.03, 0.08, MAT.darkSilver, 0, PT + 0.02, -0.3));
  g.position.set(x, 0, z);
  return g;
}
/* DIP chip in a socket: socket body, pin strips, chip with end notch,
   pin-1 dot and faint top print. */
function dipSocket(x, z, len = 3.5, wid = 1.05, label = 'ATmega328P') {
  const g = new THREE.Group();
  g.add(box(len, 0.16, wid, MAT.plastic, 0, PT + 0.08, 0));
  g.add(box(len - 0.15, 0.06, 0.1, MAT.darkSilver, 0, PT + 0.05, -(wid / 2 - 0.02)));
  g.add(box(len - 0.15, 0.06, 0.1, MAT.darkSilver, 0, PT + 0.05, (wid / 2 - 0.02)));
  g.add(box(len - 0.25, 0.17, wid - 0.22, MAT.chip, 0, PT + 0.245, 0));
  g.add(box(0.16, 0.03, 0.4, MAT.plastic, -(len / 2 - 0.32), PT + 0.345, 0)); // notch
  g.add(cyl(0.05, 0.05, 0.02, MAT.white, -(len / 2 - 0.58), PT + 0.345, -(wid / 2 - 0.3), 10)); // pin-1 dot
  if (label) {
    const l = silk(label, len * 0.42, 'rgba(255,255,255,0.55)');
    l.position.set(0.28, PT + 0.35, 0);
    g.add(l);
  }
  g.position.set(x, 0, z);
  return g;
}
/* QFP/QFN chip with pin skirts on all four sides + pin-1 dot. */
function qfp(x, z, w = 1.0, d = 1.0, label = null) {
  const g = new THREE.Group();
  g.add(box(w, 0.18, d, MAT.chip, 0, PT + 0.09, 0));
  g.add(box(w * 0.86, 0.05, d * 0.86, MAT.chipTop, 0, PT + 0.2, 0));
  const ox = w / 2 + 0.045, oz = d / 2 + 0.045;
  g.add(box(w * 0.92, 0.05, 0.09, MAT.darkSilver, 0, PT + 0.03, -oz));
  g.add(box(w * 0.92, 0.05, 0.09, MAT.darkSilver, 0, PT + 0.03, oz));
  g.add(box(0.09, 0.05, d * 0.92, MAT.darkSilver, -ox, PT + 0.03, 0));
  g.add(box(0.09, 0.05, d * 0.92, MAT.darkSilver, ox, PT + 0.03, 0));
  g.add(cyl(0.055, 0.055, 0.02, MAT.white, -w * 0.32, PT + 0.235, -d * 0.32, 10));
  if (label) {
    const l = silk(label, w * 0.78, 'rgba(255,255,255,0.6)');
    l.position.set(0, PT + 0.235, d * 0.14);
    g.add(l);
  }
  g.position.set(x, 0, z);
  return g;
}

/* ---------------- Arduino Uno ---------------- */

function buildUno() {
  const DIG = ['D0','D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','GND','AREF'];
  const PWR = ['IOREF','RST','3V3','5V','GND','GND2','VIN'];
  const ANA = ['A0','A1','A2','A3','A4','A5'];
  // --- silkscreen (labels use the exact header constants below) ---
  const t = makeTop(6.8, 5.3, '#0a7f84');
  tText(t, 'UNO R3', 0.55, -1.3, 47);
  tText(t, 'ATMEGA328P', 0.55, -0.92, 15, { color: 'rgba(255,255,255,0.72)', weight: 600 });
  pinLabelsX(t, DIG, -1.7, -2.38, 0.254, 0.34);
  pinLabelsX(t, PWR, -3.05, 2.38, 0.254, -0.34);
  pinLabelsX(t, ANA, 0.75, 2.38, 0.254, -0.34);
  tText(t, 'DIGITAL · PWM~', 0.3, -1.72, 15, { color: 'rgba(255,255,255,0.78)' });
  tText(t, 'POWER', -0.52, 2.04, 14, { color: 'rgba(255,255,255,0.78)' });
  tText(t, 'ANALOG IN', 1.38, 1.68, 14, { color: 'rgba(255,255,255,0.78)' });
  tText(t, '+', -3.27, 1.48, 19);
  tText(t, '−', -3.27, 2.02, 19);
  pin1(t, -2.02, -2.38);
  caution(t, -3.14, 0.9, 0.15);

  const g = pcb(6.8, 5.3, 0x0a7f84, topTex(t));
  const anchors = new Map();
  g.add(usbB(-2.55, -1.55));
  g.add(cyl(0.07, 0.07, 0.05, MAT.silver, -1.78, PT + 0.025, -2.02, 10)); // USB solder anchors
  g.add(cyl(0.07, 0.07, 0.05, MAT.silver, -1.78, PT + 0.025, -1.08, 10));
  g.add(barrelJack(-2.6, 1.75));
  g.add(capCan(-1.78, 1.6));
  g.add(capCan(-1.08, 1.64, 0x3a3f47, 0.26, 0.65));
  g.add(regulator(-0.3, 1.48));
  g.add(polyfuse(-1.45, -1.38));
  g.add(dipSocket(0.55, 0.45));
  g.add(crystal(0.2, -0.65));
  smd(g, -0.3, -0.65, TAN()); smd(g, 0.7, -0.65, TAN()); // crystal load caps
  g.add(box(0.85, 0.3, 0.85, MAT.chip, -1.7, PT + 0.15, -0.7)); // ATmega16U2 USB-serial
  g.add(box(0.42, 0.14, 0.3, MAT.silver, -2.42, PT + 0.07, -0.7)); // its crystal
  g.add(resetButton(-2.72, -2.24));
  g.add(ledDot(1.85, -1.7, 0xffb02e)); // "L" LED by pin 13
  smd(g, 2.12, -1.7, MAT.chip, 0.14, 0.09); // its series resistor
  g.add(ledDot(-1.5, -1.88, 0x39d353)); // power LED
  smdRow(g, -1.55, -1.6, 4, 0.32); // SMD sprinkles, left field
  smdRow(g, 0.0, 1.18, 5, 0.34); // SMD sprinkles, below the socket
  g.add(mountHole(3.08, 2.28));
  g.add(mountHole(3.08, -2.28));
  g.add(mountHole(-3.22, 0.5));
  g.add(mountHole(-3.22, -2.28));
  // headers (anchor layout unchanged)
  headerRowX(g, anchors, DIG, -1.7, -2.38);
  headerRowX(g, anchors, PWR, -3.05, 2.38);
  headerRowX(g, anchors, ANA, 0.75, 2.38);
  anchors.delete('GND2');
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 6.8, d: 5.3 };
  g.userData.boardName = 'Arduino Uno';
  return g;
}

/* ---------------- Arduino Mega 2560 ---------------- */

function buildMega() {
  const DIG = [];
  for (let i = 0; i <= 21; i++) DIG.push('D' + i);
  const PWR = ['RST','3V3','5V','GND','GND2','VIN'];
  const ANA = [];
  for (let i = 0; i <= 15; i++) ANA.push('A' + i);
  const END = [];
  for (let i = 44; i <= 53; i++) END.push('D' + i);
  // --- silkscreen ---
  const t = makeTop(10.15, 5.35, '#0a7379');
  tText(t, 'MEGA 2560', 0.4, -1.5, 42);
  tText(t, 'ATMEGA2560 · 54 DIGITAL · 16 ANALOG', 0.2, -1.14, 14, { color: 'rgba(255,255,255,0.72)', weight: 600 });
  pinLabelsX(t, DIG, -2.75, -2.4, 0.254, 0.48); // dense row -> labels auto-rotate
  pinLabelsX(t, PWR, -4.55, 2.4, 0.254, -0.34);
  pinLabelsX(t, ANA, 0.35, 2.4, 0.254, -0.34);
  pinLabelsZ(t, END, 4.75, -1.15, 0.254, -0.38);
  tText(t, 'DIGITAL', 3.65, -1.92, 15, { color: 'rgba(255,255,255,0.78)' });
  tText(t, 'POWER', -2.3, 2.04, 14, { color: 'rgba(255,255,255,0.78)' });
  tText(t, 'ANALOG IN', 2.3, 1.68, 14, { color: 'rgba(255,255,255,0.78)' });
  pin1(t, -3.05, -2.4);
  caution(t, -4.85, 0.92, 0.15);

  const g = pcb(10.15, 5.35, 0x0a7379, topTex(t));
  const anchors = new Map();
  g.add(usbB(-4.15, -1.5));
  g.add(cyl(0.07, 0.07, 0.05, MAT.silver, -3.38, PT + 0.025, -1.95, 10)); // USB solder anchors
  g.add(cyl(0.07, 0.07, 0.05, MAT.silver, -3.38, PT + 0.025, -1.05, 10));
  g.add(barrelJack(-4.25, 1.8));
  g.add(capCan(-3.35, 1.72));
  g.add(capCan(-2.68, 1.74, 0x3a3f47, 0.26, 0.65));
  g.add(capCan(-2.05, 1.76, 0x22335e, 0.22, 0.55)); // row of electrolytics by the jack
  g.add(regulator(-1.3, 1.7));
  g.add(polyfuse(-3.15, -1.42));
  g.add(qfp(0.6, 0.1, 1.5, 1.5, 'ATmega2560')); // QFP-100 main MCU
  g.add(box(0.85, 0.3, 0.85, MAT.chip, -2.6, PT + 0.15, -0.6)); // ATmega16U2
  g.add(box(0.42, 0.14, 0.3, MAT.silver, -3.32, PT + 0.07, -0.6));
  g.add(crystal(1.9, -0.9));
  smd(g, 1.42, -0.9, TAN()); smd(g, 2.38, -0.9, TAN());
  g.add(resetButton(-4.35, -2.15));
  g.add(ledDot(2.6, -1.75, 0xffb02e)); // "L" LED
  smd(g, 2.86, -1.75, MAT.chip, 0.14, 0.09);
  g.add(ledDot(-2.2, -1.9, 0x39d353)); // power LED
  // rear double-row header dressing (visual twin of the D44-D53 row, no anchors)
  g.add(box(0.3, 0.24, 2.54, MAT.plastic, 4.28, PT + 0.12, -0.007));
  END.forEach((_, i) => {
    g.add(box(0.09, 0.56, 0.09, MAT.gold, 4.28, PT + 0.3, -1.15 + i * 0.254));
  });
  smdRow(g, -0.5, 1.18, 5, 0.34);
  smdRow(g, 2.6, 0.95, 4, 0.34);
  g.add(mountHole(-4.92, 1.2));
  g.add(mountHole(4.85, 2.38));
  g.add(mountHole(4.85, -2.38));
  g.add(mountHole(-4.88, -2.38));
  // headers (anchor layout unchanged)
  headerRowX(g, anchors, DIG, -2.75, -2.4);
  headerRowX(g, anchors, PWR, -4.55, 2.4);
  headerRowX(g, anchors, ANA, 0.35, 2.4);
  headerRowZ(g, anchors, END, 4.75, -1.15);
  anchors.delete('GND2');
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 10.15, d: 5.35 };
  g.userData.boardName = 'Arduino Mega 2560';
  return g;
}

/* ---------------- Arduino Nano ---------------- */

function buildNano() {
  const ROW1 = ['RST','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'];
  const ROW2 = ['A0','A1','A2','A3','A4','A5','A6','A7','AREF','3V3','5V','GND','VIN'];
  // --- silkscreen ---
  const t = makeTop(4.3, 1.8, '#0a7f84');
  pinLabelsX(t, ROW1, -1.8, -0.68, 0.3, 0.45, { rotate: true });
  pinLabelsX(t, ROW2, -1.8, 0.68, 0.3, -0.45, { rotate: true });
  tText(t, 'NANO', -1.22, 0, 20);
  pin1(t, -2.06, -0.68);

  const g = pcb(4.3, 1.8, 0x0a7f84, topTex(t));
  const anchors = new Map();
  g.add(usbMicro(-1.95, 0)); // mini-USB
  g.add(qfp(0.35, 0, 0.9, 0.62, 'ATmega328P')); // QFP MCU, kept narrow so labels stay visible
  // resistor array (black pack with silver end caps)
  g.add(box(0.5, 0.09, 0.22, MAT.chip, -0.72, PT + 0.045, 0));
  g.add(box(0.07, 0.1, 0.22, MAT.silver, -0.99, PT + 0.05, 0));
  g.add(box(0.07, 0.1, 0.22, MAT.silver, -0.45, PT + 0.05, 0));
  smd(g, 1.3, 0, MAT.silver, 0.32, 0.2); // crystal can (SMD)
  smd(g, 1.3, 0.32, TAN(), 0.14, 0.09); smd(g, 1.3, -0.32, TAN(), 0.14, 0.09);
  g.add(box(0.3, 0.16, 0.42, MAT.plastic, -1.35, PT + 0.08, 0.45)); // reset micro-button
  g.add(cyl(0.09, 0.09, 0.08, mat(0xd23b3b, { r: 0.45 }), -1.35, PT + 0.2, 0.45));
  g.add(ledDot(1.35, -0.45, 0x39d353)); // power LED
  g.add(ledDot(1.62, -0.45, 0xffb02e)); // L / Rx-Tx style SMD LEDs
  g.add(ledDot(1.89, -0.45, 0xe23b3b));
  smd(g, -0.72, 0.42, MAT.chip, 0.14, 0.09);
  smd(g, -0.72, -0.42, MAT.chip, 0.14, 0.09);
  g.add(mountHole(2.04, 0.6, 0.11));
  g.add(mountHole(2.04, -0.6, 0.11));
  // headers (anchor layout unchanged)
  headerRowX(g, anchors, ROW1, -1.8, -0.68, 0.3);
  headerRowX(g, anchors, ROW2, -1.8, 0.68, 0.3);
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 4.3, d: 1.8 };
  g.userData.boardName = 'Arduino Nano';
  return g;
}

/* ---------------- ESP32 DevKit ---------------- */

/* Printed label for the ESP32 module's metal can. */
function canLabel(lines, w = 1.7, h = 1.7) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#d7dae0'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#2c2f36'; x.textAlign = 'center';
  x.font = '700 29px Arial, sans-serif';
  x.fillText(lines[0], 128, 82);
  x.font = '500 18px Arial, sans-serif';
  lines.slice(1).forEach((ln, i) => x.fillText(ln, 128, 126 + i * 30));
  x.strokeStyle = '#9aa0a8'; x.lineWidth = 4; x.strokeRect(8, 8, 240, 240);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.4 })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}
/* Copper meander antenna trace in the board's keep-out zone. */
function meander(t, x0, x1, z0, z1) {
  const { ctx } = t;
  ctx.save();
  ctx.strokeStyle = 'rgba(200,162,74,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(t.px(x0), t.py(z0), (x1 - x0) * t.s, (z1 - z0) * t.s);
  ctx.strokeStyle = 'rgba(200,162,74,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const rows = 7, dz = (z1 - z0) / rows;
  for (let i = 0; i <= rows; i++) {
    const z = z0 + i * dz, y = t.py(z);
    if (i % 2 === 0) { ctx.moveTo(t.px(x0), y); ctx.lineTo(t.px(x1), y); }
    else { ctx.moveTo(t.px(x1), y); ctx.lineTo(t.px(x0), y); }
    if (i < rows) { const nx = i % 2 === 0 ? x1 : x0; ctx.lineTo(t.px(nx), t.py(z + dz)); }
  }
  ctx.stroke();
  ctx.restore();
}

function buildEsp32() {
  const ROW1 = ['EN','GPIO36','GPIO39','GPIO34','GPIO35','GPIO32','GPIO33','GPIO25','GPIO26','GPIO27','GPIO14','GPIO12','GND','GPIO13','VIN'];
  const ROW2 = ['GPIO23','GPIO22','GPIO21','GPIO19','GPIO18','GPIO5','GPIO17','GPIO16','GPIO4','GPIO2','GPIO15','GND2','GPIO0','CLK','3V3'];
  // --- silkscreen ---
  const t = makeTop(5.2, 2.85, '#17181c');
  meander(t, -2.32, -0.95, -1.02, 1.02);
  tText(t, 'ESP32 DEVKIT V1', -2.47, 0, 15, { rotate: -Math.PI / 2, color: 'rgba(255,255,255,0.85)' });
  pinLabelsX(t, ROW1, -2.42, -1.26, 0.325, 0.3);
  pinLabelsX(t, ROW2, -2.42, 1.26, 0.325, -0.3);
  pin1(t, -2.42, -0.78);

  const g = pcb(5.2, 2.85, 0x17181c, topTex(t));
  const anchors = new Map();
  // metal RF shield can with printed module label (depth kept clear of the pin labels)
  g.add(box(1.9, 0.42, 1.7, MAT.silver, 0.1, PT + 0.21, 0));
  const canLbl = canLabel(['ESP32-WROOM-32', 'WiFi · BT/BLE SoC', 'FCC ID 2AC7Z-ESP32', 'SN 2408 · ESP32'], 1.65, 1.45);
  canLbl.position.set(0.1, PT + 0.43, 0);
  g.add(canLbl);
  g.add(box(0.7, 0.16, 0.7, MAT.chip, 1.3, PT + 0.08, -0.55)); // flash chip
  g.add(qfp(1.42, 0.55, 0.55, 0.55)); // CP2102 USB-UART bridge
  g.add(usbMicro(2.45, 0));
  // EN / BOOT tactile buttons
  [[1.95, -0.85], [1.95, 0.85]].forEach(([bx, bz]) => {
    g.add(box(0.42, 0.22, 0.42, MAT.plastic, bx, PT + 0.11, bz));
    g.add(cyl(0.1, 0.1, 0.08, MAT.darkSilver, bx, PT + 0.26, bz));
  });
  g.add(ledDot(2.3, -0.52, 0xe23b3b)); // red power LED
  smd(g, 1.28, 0.02, TAN(), 0.14, 0.09);
  smd(g, 2.28, 0.62, MAT.chip, 0.14, 0.09);
  smd(g, 2.28, -0.9, MAT.chip, 0.14, 0.09);
  // headers (anchor layout unchanged; gold pins read as gold tips)
  headerRowX(g, anchors, ROW1, -2.42, -1.26, 0.325);
  headerRowX(g, anchors, ROW2, -2.42, 1.26, 0.325);
  anchors.delete('GND2');
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 5.2, d: 2.85 };
  g.userData.boardName = 'ESP32 DevKit';
  return g;
}

/* ---------------- Raspberry Pi Pico ---------------- */

function buildPico() {
  const ROW1 = ['GP0','GP1','GND','GP2','GP3','GP4','GP5','GND2','GP6','GP7','GP8','GP9','GND3','GP10','GP11','GP12','GP13','GND4','GP14','GP15'];
  const ROW2 = ['VBUS','VSYS','GND5','3V3_EN','3V3','ADC_VREF','GP28','AGND','GP27','GP26','RUN','GP22','GND6','GP21','GP20','GP19','GP18','GND7','GP17','GP16'];
  // --- silkscreen ---
  const t = makeTop(5.1, 2.1, '#0a7a3d');
  pinLabelsX(t, ROW1, -2.28, -0.88, 0.24, 0.27, { fs: 17 });
  pinLabelsX(t, ROW2, -2.28, 0.88, 0.24, -0.27, { fs: 17 });
  tText(t, 'PICO', 1.82, -0.62, 19);
  // generic ring mark (no logos)
  t.ctx.save();
  t.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  t.ctx.lineWidth = 3;
  t.ctx.beginPath(); t.ctx.arc(t.px(2.2), t.py(0.58), 0.13 * t.s, 0, Math.PI * 2); t.ctx.stroke();
  t.ctx.beginPath(); t.ctx.arc(t.px(2.2), t.py(0.58), 0.05 * t.s, 0, Math.PI * 2); t.ctx.stroke();
  t.ctx.restore();
  pin1(t, -2.5, -0.88);

  const g = pcb(5.1, 2.1, 0x0a7a3d, topTex(t));
  const anchors = new Map();
  g.add(usbMicro(-2.35, 0));
  g.add(qfp(-0.5, 0, 0.95, 0.95, 'RP2040'));
  g.add(crystal(0.35, 0, 0.5, 0.34));
  smd(g, 0.35, 0.42, TAN(), 0.14, 0.09); smd(g, 0.35, -0.42, TAN(), 0.14, 0.09);
  g.add(box(0.46, 0.15, 0.4, MAT.chip, 0.88, PT + 0.075, 0.38)); // W25Q flash
  // white BOOTSEL button
  g.add(box(0.62, 0.24, 0.5, MAT.white, 1.42, PT + 0.12, 0));
  g.add(cyl(0.11, 0.11, 0.07, mat(0xd8d8d4, { r: 0.4 }), 1.42, PT + 0.27, 0));
  g.add(ledDot(-1.55, -0.38, 0x39d353)); // power LED
  smd(g, -1.85, 0.45, MAT.chip, 0.14, 0.09);
  smd(g, -1.85, -0.45, MAT.chip, 0.14, 0.09);
  // castellated edge half-holes along both long edges (at pin pitch)
  const castMat = mat(0x6a7078, { r: 0.45, m: 0.7 });
  for (let i = 0; i < 20; i++) {
    const x = -2.28 + i * 0.24;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.17, 10, 1, false, -Math.PI / 2, Math.PI), castMat);
    top.position.set(x, 0, 1.04);
    g.add(top);
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.17, 10, 1, false, Math.PI / 2, Math.PI), castMat);
    bot.position.set(x, 0, -1.04);
    g.add(bot);
  }
  // 3-pin debug header at the end
  g.add(box(0.24, 0.2, 0.85, MAT.plastic, 2.32, PT + 0.1, 0));
  [-0.24, 0, 0.24].forEach((dz) => {
    g.add(box(0.08, 0.5, 0.08, MAT.gold, 2.32, PT + 0.25, dz));
  });
  // headers (anchor layout unchanged)
  headerRowX(g, anchors, ROW1, -2.28, -0.88, 0.24);
  headerRowX(g, anchors, ROW2, -2.28, 0.88, 0.24);
  ['GND2','GND3','GND4','GND5','GND6','GND7'].forEach((k) => anchors.delete(k));
  g.userData.pinAnchors = anchors;
  g.userData.size = { w: 5.1, d: 2.1 };
  g.userData.boardName = 'Raspberry Pi Pico';
  return g;
}

/* ---------------- Raspberry Pi 4 ---------------- */

function buildPi4() {
  const ROW1 = ['3V3','GPIO2','GPIO3','GPIO4','GND','GPIO17','GPIO27','GPIO22','3V3B','GPIO10','GPIO9','GPIO11','GNDB','GPIO0','GPIO5','GPIO6','GPIO13','GPIO19','GPIO26','GNDC'];
  const ROW2 = ['5V','5VB','GNDD','GPIO14','GPIO15','GPIO18','GNDE','GPIO23','GPIO24','GNDF','GPIO25','GPIO8','GPIO7','GPIO1','GNDG','GPIO12','GNDH','GPIO16','GPIO20','GPIO21'];
  // --- silkscreen ---
  const t = makeTop(8.5, 5.6, '#0b6e35');
  tText(t, 'RASPBERRY PI 4 MODEL B', -1.15, -1.42, 31);
  tText(t, 'BCM2711 · QUAD CORTEX-A72', -1.15, -1.06, 13, { color: 'rgba(255,255,255,0.72)', weight: 600 });
  pinLabelsX(t, ROW1, -4.0, -2.52, 0.254, -0.22, { fs: 14 });
  pinLabelsX(t, ROW2, -4.0, -2.26, 0.254, 0.3, { fs: 15 });
  tText(t, 'GPIO · BCM', 1.75, -2.0, 13, { color: 'rgba(255,255,255,0.78)' });
  pin1(t, -4.18, -2.52);

  const g = pcb(8.5, 5.6, 0x0b6e35, topTex(t));
  const anchors = new Map();
  // SoC with metal heat-spreader top, etched part number
  g.add(box(1.45, 0.28, 1.45, MAT.chip, -0.7, PT + 0.14, 0.1));
  g.add(box(1.25, 0.08, 1.25, MAT.silver, -0.7, PT + 0.32, 0.1));
  const socLbl = silk('BCM2711', 0.95, '#4c5158');
  socLbl.position.set(-0.7, PT + 0.37, 0.1);
  g.add(socLbl);
  // LPDDR4 RAM chip
  g.add(box(1.3, 0.24, 1.3, MAT.chip, 0.95, PT + 0.12, 0.35));
  g.add(box(1.14, 0.05, 1.14, MAT.chipTop, 0.95, PT + 0.265, 0.35));
  g.add(box(0.8, 0.2, 0.8, MAT.chip, -2.1, PT + 0.1, 1.2)); // power-management IC area
  smdRow(g, -1.9, -0.85, 4, 0.3);
  smdRow(g, -2.6, 0.35, 3, 0.3);
  // USB-C port, 2x micro-HDMI, AV jack along the front edge
  g.add(box(0.95, 0.4, 0.55, MAT.silver, -1.5, PT + 0.2, 2.72));
  g.add(box(0.8, 0.3, 0.45, MAT.darkSilver, -0.35, PT + 0.15, 2.74));
  g.add(box(0.8, 0.3, 0.45, MAT.darkSilver, 0.55, PT + 0.15, 2.74));
  g.add(cyl(0.32, 0.32, 0.5, MAT.plastic, 1.55, PT + 0.25, 2.6));
  // CSI + DSI flat-flex connectors
  g.add(box(1.7, 0.16, 0.42, MAT.plastic, 0.2, PT + 0.08, 1.75));
  g.add(box(1.7, 0.06, 0.42, MAT.chipTop, 0.2, PT + 0.19, 1.75));
  g.add(box(0.42, 0.16, 1.7, MAT.plastic, -3.35, PT + 0.08, 0.3));
  g.add(box(0.42, 0.06, 1.7, MAT.chipTop, -3.35, PT + 0.19, 0.3));
  // 2x USB-A stacks on the right edge: dark interiors + tongues (blue = USB 3.0)
  const tongueBlue = mat(0x2456c8, { r: 0.5 });
  const tongueBlk = mat(0x17181c, { r: 0.5 });
  [[1.55, tongueBlue], [-0.15, tongueBlk]].forEach(([sz, tongue]) => {
    g.add(box(1.5, 1.35, 1.45, MAT.silver, 3.65, PT + 0.67, sz));
    g.add(box(0.05, 1.15, 1.32, MAT.plastic, 4.41, PT + 0.62, sz));
    g.add(box(0.16, 0.3, 1.1, tongue, 4.36, PT + 0.35, sz));
    g.add(box(0.16, 0.3, 1.1, tongue, 4.36, PT + 0.95, sz));
  });
  // Ethernet jack: silver can, translucent front, link/activity LEDs
  g.add(box(1.6, 1.5, 1.9, MAT.silver, 3.6, PT + 0.75, -1.75));
  g.add(box(1.35, 0.25, 1.65, MAT.plastic, 3.6, PT + 0.12, -1.75));
  g.add(box(0.08, 1.15, 1.65, mat(0xdfe8dd, { r: 0.15, t: true, o: 0.35 }), 4.42, PT + 0.68, -1.75));
  g.add(box(0.06, 0.14, 0.3, mat(0x39d353, { e: 0x39d353, ei: 1.4, r: 0.4 }), 4.44, PT + 1.32, -2.45));
  g.add(box(0.06, 0.14, 0.3, mat(0xffb02e, { e: 0xffb02e, ei: 1.4, r: 0.4 }), 4.44, PT + 1.32, -1.05));
  // PoE 4-pin header (2x2), no anchors
  g.add(box(0.55, 0.22, 0.3, MAT.plastic, 1.75, PT + 0.11, -2.39));
  [[1.68, -2.48], [1.86, -2.48], [1.68, -2.3], [1.86, -2.3]].forEach(([px2, pz2]) => {
    g.add(box(0.07, 0.5, 0.07, MAT.gold, px2, PT + 0.25, pz2));
  });
  // micro-SD slot: underside hint + thin slot on the front edge face
  g.add(box(1.3, 0.09, 1.2, MAT.plastic, -0.6, -0.12, 1.6));
  g.add(box(1.3, 0.1, 0.07, MAT.plastic, -0.6, -0.03, 2.81));
  g.add(ledDot(-3.9, 2.52, 0xe23b3b)); // PWR
  g.add(ledDot(-3.55, 2.52, 0x39d353)); // ACT
  g.add(mountHole(-3.95, -1.75));
  g.add(mountHole(-3.55, 1.9));
  g.add(mountHole(2.55, -2.42));
  g.add(mountHole(3.5, 2.5));
  // GPIO header (anchor layout unchanged)
  headerRowX(g, anchors, ROW1, -4.0, -2.52);
  headerRowX(g, anchors, ROW2, -4.0, -2.26);
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
  // stepped base plate under the body (softens the block silhouette)
  g.add(box(W + 0.2, 0.07, D + 0.2, mat(0x3c3a36, { r: 0.8 }), 0, -0.035, 0));
  const body = box(W, H, D, mat(0xefe9da, { r: 0.65 }), 0, H / 2, 0);
  g.add(body);
  // top texture: shaded holes, printed row numbers + column letters, rails
  const c = document.createElement('canvas');
  c.width = 1650; c.height = 550;
  const x = c.getContext('2d');
  x.fillStyle = '#f4efe3'; x.fillRect(0, 0, 1650, 550);
  const rail = (y, col, sign) => {
    x.strokeStyle = col; x.lineWidth = 5;
    x.beginPath(); x.moveTo(30, y); x.lineTo(1620, y); x.stroke();
    x.fillStyle = col; x.font = '700 30px Arial'; x.textAlign = 'left';
    x.fillText(sign, 8, y + 10);
    x.fillText(sign, 1632, y + 10);
  };
  rail(38, '#c22e2e', '+'); rail(78, '#27408f', '−');
  rail(472, '#27408f', '−'); rail(512, '#c22e2e', '+');
  // one shaded hole: dark socket, deep centre, tiny top-left highlight
  const dot = (cx, cy) => {
    x.fillStyle = 'rgba(70,66,58,0.5)';
    x.beginPath(); x.arc(cx, cy, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(40,38,34,0.8)';
    x.beginPath(); x.arc(cx, cy, 4.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.28)';
    x.beginPath(); x.arc(cx - 2, cy - 2, 1.5, 0, Math.PI * 2); x.fill();
  };
  for (let col = 0; col < 63; col++) {
    const cx = 45 + col * 25;
    for (let r = 0; r < 5; r++) { dot(cx, 130 + r * 26); dot(cx, 320 + r * 26); }
    for (let r = 0; r < 2; r++) { dot(cx, 34 + r * 44); dot(cx, 468 + r * 44); }
  }
  // row numbers 1-30 along both terminal strips
  x.fillStyle = 'rgba(60,58,50,0.62)';
  x.font = '700 19px Arial'; x.textAlign = 'center';
  for (let n = 1; n <= 30; n++) {
    const nx = 45 + (n - 1) * 52.5 + 25;
    x.fillText(String(n), nx, 112);
    x.fillText(String(n), nx, 452);
  }
  // column letters a-e / f-j down the left side of each strip
  x.font = '700 20px Arial'; x.textAlign = 'left';
  'abcde'.split('').forEach((ch, r) => x.fillText(ch, 10, 137 + r * 26));
  'fghij'.split('').forEach((ch, r) => x.fillText(ch, 10, 327 + r * 26));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, D - 0.1),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = H + 0.006;
  g.add(top);
  // centre groove + a soft shadow strip inside it
  g.add(box(W - 0.4, 0.05, 0.5, mat(0xd9d2bf, { r: 0.8 }), 0, H + 0.01, 0));
  g.add(box(W - 0.4, 0.03, 0.62, mat(0x8a8474, { r: 0.9, t: true, o: 0.32 }), 0, H + 0.015, 0));
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
