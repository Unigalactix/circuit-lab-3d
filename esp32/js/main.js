/* CircuitLab 3D — ESP32 DevKit lab boot.
   Data files define window.PIN_SETS['esp32'] (an object: {board, chip, logic,
   note, pins[]}) and window.LESSON_SETS['esp32'] (an array). The engine wants
   a plain pins array, so normalize here. */
import { initLab } from '../../js/engine.js';

const raw = window.PIN_SETS ? window.PIN_SETS['esp32'] : null;
const pins = raw && Array.isArray(raw.pins) ? raw.pins : [];
const lessons = window.LESSON_SETS && Array.isArray(window.LESSON_SETS['esp32'])
  ? window.LESSON_SETS['esp32'] : [];

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

initLab({ boardId: 'esp32', accent: '#fbbf24', lessons, pins });
