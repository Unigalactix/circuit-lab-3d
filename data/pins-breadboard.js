// CircuitLab 3D — Breadboard landmarks ("pins" for the breadboard stage).
// All text is original to CircuitLab 3D.
window.PIN_SETS = window.PIN_SETS || {};
window.PIN_SETS['breadboard'] = [
  {
    name: '+ rail (red)',
    type: 'power',
    desc: 'One of two long bus strips running down each side of the board, marked with a red line and + signs. Every hole along the strip is connected to every other hole in it, lengthwise. Feed it once from a supply pin (for example the Uno\u2019s 5V) and you have power available at every row \u2014 no need to run a separate wire back to the board for each part.'
  },
  {
    name: '\u2212 rail (blue)',
    type: 'ground',
    desc: 'The companion bus strip, marked with a blue line and \u2212 signs. It is the common return path for the whole circuit: connect it once to GND and every component that needs ground can reach it locally. Power only flows in a loop, so the \u2212 rail is every bit as important as the + rail \u2014 a circuit with power but no return path does nothing at all.'
  },
  {
    name: 'Terminal strips A\u2013E',
    type: 'terminal',
    desc: 'The main working area on the upper half of the board. Each numbered row has five holes \u2014 A, B, C, D, E \u2014 joined together by a hidden metal clip, and no connection to any other row. Anything plugged into the same row of five is electrically the same point, which is how a component lead, a resistor leg and a jumper wire all meet without soldering.'
  },
  {
    name: 'Terminal strips F\u2013J',
    type: 'terminal',
    desc: 'The mirror working area below the centre groove: five connected holes per row, F through J. It behaves exactly like A\u2013E but is electrically separate, so a row on this side has no connection to the same-numbered row above the groove unless you deliberately bridge them with a wire or a component lead.'
  },
  {
    name: 'Centre groove (DIP channel)',
    type: 'structure',
    desc: 'The notch running down the middle of the board. It exists for DIP integrated circuits: the chip straddles the groove so each pin lands in its own row, and the groove guarantees the pins on opposite sides are NOT connected to each other. It is also handy for any two-lead part \u2014 an LED spanning the groove has its two legs in separate rows, safe from shorting.'
  },
  {
    name: 'Row numbers 1\u201330',
    type: 'marking',
    desc: 'The printed coordinates of the board. A \u201chole address\u201d is a row number plus a column letter \u2014 B12 means row 12, column B. Quoting addresses in your lab notes (\u201cLED anode in E14, cathode in F14\u201d) is how you rebuild, debug and hand over a circuit exactly, the same way a schematic names every net.'
  },
  {
    name: 'Power rail split',
    type: 'power',
    desc: 'On many 830-point boards each side rail is actually two half-length strips with a small gap around row 30 of the rail (often shown by a break in the red and blue lines). The top half and bottom half are NOT connected until you add a short jumper across the gap. If the far end of your board seems dead, this split is the first suspect.'
  },
  {
    name: 'Tie-point clips (830)',
    type: 'structure',
    desc: 'The 830 springy metal clips hidden under the plastic: 630 of them form the terminal strips\u2019 connected groups of five, and 200 more line the four power rails. Each clip grips a component lead or jumper wire firmly enough for a solid connection, yet releases it undamaged \u2014 that grip-and-release trick is the whole point of solderless prototyping.'
  }
];
