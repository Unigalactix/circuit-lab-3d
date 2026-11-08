/* CircuitLab 3D — Breadboard Lab boot.
   The breadboard stage has no pins of its own: the data set's "pins" are
   the board's 8 landmarks (rails, groove, tie-point fields…), and the
   engine uses the Uno beside the breadboard for wiring anchors.
   Data comes from the classic scripts loaded in index.html:
     window.PIN_SETS['breadboard']    — array of {name, type, desc}
     window.LESSON_SETS['breadboard'] — array of lessons
   The pins array already matches the engine's expected shape, so it
   passes straight through. */

import { initLab } from '../../js/engine.js';

const pins = (window.PIN_SETS && Array.isArray(window.PIN_SETS['breadboard']))
  ? window.PIN_SETS['breadboard']
  : [];
const lessons = (window.LESSON_SETS && Array.isArray(window.LESSON_SETS['breadboard']))
  ? window.LESSON_SETS['breadboard']
  : [];

initLab({
  boardId: 'breadboard',
  accent: '#fde047',
  lessons,
  pins,
});
