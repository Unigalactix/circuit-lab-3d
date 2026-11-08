/* CircuitLab 3D — Arduino Uno R3 lab boot.
   Data comes from the classic scripts loaded by index.html before this module:
     ../data/pins-uno.js    -> window.PIN_SETS['uno']
     ../data/lessons-uno.js -> window.LESSON_SETS['uno']
   The shared engine (../../js/engine.js) does everything else:
   scene, labels, explorer, wiring and the simulation loop. */
import { initLab } from '../../js/engine.js';

const raw = window.PIN_SETS['uno'];
const pins = Array.isArray(raw) ? raw : raw.pins;
const lessons = window.LESSON_SETS['uno'];

initLab({ boardId: 'uno', accent: '#2dd4bf', lessons, pins });
