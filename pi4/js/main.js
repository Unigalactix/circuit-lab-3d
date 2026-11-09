/* CircuitLab 3D — Raspberry Pi 4 lab boot.
   Data files define window.PIN_SETS['pi4'] (an object: {board, chip, logic,
   note, pins[]}) and window.LESSON_SETS['pi4'] (an array). The engine wants
   a plain pins array, so normalize here. */
import { initLab } from '../../js/engine.js';

const raw = window.PIN_SETS ? window.PIN_SETS['pi4'] : null;
const pins = raw && Array.isArray(raw.pins) ? raw.pins : [];
const lessons = window.LESSON_SETS && Array.isArray(window.LESSON_SETS['pi4'])
  ? window.LESSON_SETS['pi4'] : [];

/* Surface the dataset's board note as a small line under the header card. */
if (raw && raw.note) {
  const hdr = document.querySelector('.hud-top');
  if (hdr) {
    const p = document.createElement('p');
    p.className = 'p-hook';
    p.textContent = raw.note;
    hdr.appendChild(p);
  }
}

initLab({ boardId: 'pi4', accent: '#a03a44', lessons, pins });
