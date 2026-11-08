/* CircuitLab 3D — Arduino Nano lab boot.
   Data comes from the classic scripts loaded by index.html before this module:
     ../data/pins-nano.js    -> window.PIN_SETS['nano']
     ../data/lessons-nano.js -> window.LESSON_SETS['nano']
   The shared engine (../../js/engine.js) does everything else:
   scene, labels, explorer, wiring and the simulation loop. */
import { initLab } from '../../js/engine.js';

const raw = window.PIN_SETS['nano'];
const pins = Array.isArray(raw) ? raw : raw.pins;
const lessons = window.LESSON_SETS['nano'];

initLab({ boardId: 'nano', accent: '#38bdf8', lessons, pins });
