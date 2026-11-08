/* CircuitLab 3D — Arduino Mega 2560 lab boot.
   Data comes from the classic scripts loaded by index.html before this module:
     ../data/pins-mega.js    -> window.PIN_SETS['mega']
     ../data/lessons-mega.js -> window.LESSON_SETS['mega']
   The shared engine (../../js/engine.js) does everything else:
   scene, labels, explorer, wiring and the simulation loop. */
import { initLab } from '../../js/engine.js';

const raw = window.PIN_SETS['mega'];
const pins = Array.isArray(raw) ? raw : raw.pins;
const lessons = window.LESSON_SETS['mega'];

initLab({ boardId: 'mega', accent: '#a78bfa', lessons, pins });
