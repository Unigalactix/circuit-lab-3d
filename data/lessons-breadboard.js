// CircuitLab 3D — Breadboard lesson set (solderless prototyping with an Arduino Uno).
// All text, code and explanations are original to CircuitLab 3D.
window.LESSON_SETS = window.LESSON_SETS || {};
window.LESSON_SETS['breadboard'] = [
  {
    id: 'bb-anatomy',
    title: 'Anatomy of a Breadboard',
    level: 'Beginner',
    mins: 10,
    goal: 'Understand how the holes of a solderless breadboard are secretly connected before you plug in a single component.',
    parts: ['830 tie-point solderless breadboard', 'DIP integrated circuit (for the groove demo)', '1\u00d7 LED (visual marker across the groove)'],
    wiring: [
      { from: 'LED anode (long leg)', to: 'Row 14, column E', color: 'red' },
      { from: 'LED cathode (short leg)', to: 'Row 14, column F', color: 'black' }
    ],
    codeLang: 'none',
    code: '',
    serial: [],
    sim: { device: 'led', mode: 'on' },
    explain: 'A breadboard is a grid of spring clips hidden under plastic. In the two terminal strips, the five holes of each numbered row (A\u2013E, and separately F\u2013J) are wired together \u2014 plug two leads into the same row and they are connected, whether or not a wire is visible. Rows are NOT connected to each other, and the centre groove keeps the A\u2013E side isolated from the F\u2013J side, which is exactly the gap a DIP chip needs so its two columns of pins never touch. Along both edges, the power rails run the other way: every hole in a rail strip is one long conductor, ideal for distributing 5V and GND down the whole board. There is no circuit in this lesson and no code \u2014 the LED straddling the groove is only a marker. Its two legs sit in different rows on opposite sides of the groove, which is why a part placed across the groove can never short itself out.',
    watch: 'Never trust a rail by eye: on many boards the rails are split in the middle, so check continuity with a multimeter (or an LED test) before assuming the far half is powered.'
  },
  {
    id: 'bb-first-led',
    title: 'Your First LED Circuit',
    level: 'Beginner',
    mins: 15,
    goal: 'Power the rails from the Uno, then light an LED through a current-limiting resistor \u2014 and be able to prove the resistor value is right.',
    parts: ['Arduino Uno', 'Breadboard', '1\u00d7 red LED', '1\u00d7 220\u03a9 resistor', 'Jumper wires (red and black)'],
    wiring: [
      { from: 'Uno 5V', to: 'Rail +', color: 'red' },
      { from: 'Uno GND', to: 'Rail \u2212', color: 'black' },
      { from: 'Rail +', to: 'Resistor leg 1 (row 10)', color: 'red' },
      { from: 'Resistor leg 2 (row 12)', to: 'LED anode (row 12)', color: 'orange' },
      { from: 'LED cathode (row 16)', to: 'Rail \u2212', color: 'black' }
    ],
    codeLang: 'cpp',
    code: '// No code needed \u2014 this circuit is pure hardware.\n// The LED is lit whenever the Uno has power.\nvoid setup() {}\nvoid loop() {}',
    serial: [],
    sim: { device: 'led', mode: 'on' },
    explain: 'The loop is: 5V rail \u2192 resistor \u2192 LED \u2192 ground rail \u2192 back to the Uno. The resistor is not optional decoration. An LED holds an almost fixed voltage across itself (about 2V for a red one) and will happily pass destructive current trying to maintain it. The resistor absorbs the remaining voltage and sets the current by Ohm\u2019s law: I = (5V \u2212 2V) / 220\u03a9 \u2248 0.014A, about 14mA \u2014 bright, and safely under the typical 20mA rating. Remove the resistor and the same maths gives a current limited only by the wiring and the supply, which is how LEDs die with a faint pop. Note also that the resistor\u2019s row and the LED anode share row 12\u2019s five holes: that shared row IS the connection.',
    watch: 'LEDs are polarised: the long leg (anode) faces the positive side and the short leg (cathode, flat edge of the rim) faces ground. Backwards, it simply stays dark \u2014 a free first debugging clue.'
  },
  {
    id: 'bb-series-parallel',
    title: 'Series vs Parallel LEDs',
    level: 'Beginner',
    mins: 20,
    goal: 'Wire two LEDs in series, then in parallel, and explain the brightness and current differences from first principles.',
    parts: ['Arduino Uno', 'Breadboard', '2\u00d7 red LEDs', '1\u00d7 220\u03a9 resistor', '1\u00d7 100\u03a9 resistor', 'Jumper wires'],
    wiring: [
      { from: 'Uno 5V', to: 'Rail +', color: 'red' },
      { from: 'Uno GND', to: 'Rail \u2212', color: 'black' },
      { from: 'Rail +', to: '220\u03a9 resistor \u2192 LED 1 anode (series build)', color: 'orange' },
      { from: 'LED 1 cathode', to: 'LED 2 anode (series link)', color: 'yellow' },
      { from: 'LED 2 cathode', to: 'Rail \u2212', color: 'black' },
      { from: 'Rail +', to: '100\u03a9 resistor \u2192 both LED anodes (parallel build)', color: 'orange' },
      { from: 'Both LED cathodes', to: 'Rail \u2212 (parallel build)', color: 'black' }
    ],
    codeLang: 'cpp',
    code: '// Hardware-only again: rebuild the wiring between the\n// series and parallel versions and compare brightness.\nvoid setup() {}\nvoid loop() {}',
    serial: [],
    sim: { device: 'led', mode: 'on' },
    explain: 'In series, the two LEDs share one current path and their forward voltages add: the resistor only has to drop 5V \u2212 2V \u2212 2V = 1V, so I = 1V / 220\u03a9 \u2248 4.5mA flows through BOTH \u2014 the same modest current lights each of them, and the supply only delivers 4.5mA in total. In parallel, each LED gets the full rail voltage across its own branch. With one shared 100\u03a9 resistor the pair draw roughly (5V \u2212 2V) / 100\u03a9 = 30mA between them \u2014 noticeably brighter, but the supply now does three times the work of the series version, and a shared resistor cannot guarantee the current splits evenly (the slightly \u201cweaker\u201d LED hogs more). That trade \u2014 series is thrifty and self-balancing, parallel is bright but current-hungry and needs a resistor per branch \u2014 is one of the most reused decisions in circuit design.',
    watch: 'Compare fairly: judge brightness side by side in the same lighting, and remember your eyes are logarithmic \u2014 a doubling of current never looks twice as bright.'
  },
  {
    id: 'bb-divider-pot',
    title: 'Voltage Divider with a Potentiometer',
    level: 'Intermediate',
    mins: 25,
    goal: 'Build a voltage divider, predict its output with the divider equation, then sweep it with a potentiometer and read the result on A0.',
    parts: ['Arduino Uno', 'Breadboard', '1\u00d7 10k\u03a9 potentiometer', 'Jumper wires'],
    wiring: [
      { from: 'Uno 5V', to: 'Potentiometer pin 1 (outer)', color: 'red' },
      { from: 'Potentiometer pin 3 (outer)', to: 'Uno GND', color: 'black' },
      { from: 'Potentiometer pin 2 (wiper)', to: 'Uno A0', color: 'yellow' }
    ],
    codeLang: 'cpp',
    code: 'void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int raw = analogRead(A0);            // 0\u20131023 across 0\u20135V\n  float volts = raw * (5.0 / 1023.0);  // convert counts to volts\n  Serial.print("A0 = ");\n  Serial.print(raw);\n  Serial.print("  ->  ");\n  Serial.print(volts);\n  Serial.println(" V");\n  delay(200);\n}',
    serial: ['A0 = 0  ->  0.00 V', 'A0 = 256  ->  1.25 V', 'A0 = 512  ->  2.50 V', 'A0 = 768  ->  3.75 V', 'A0 = 1023  ->  5.00 V'],
    sim: { device: 'potentiometer', mode: 'sensor' },
    explain: 'Two resistors in series across a supply split the voltage in proportion to their values: Vout = Vin \u00d7 R2 / (R1 + R2), measured at the middle node. A potentiometer is that divider in one package \u2014 a fixed resistive track (R1 + R2 = 10k\u03a9 total) with a sliding wiper that chooses where the \u201cmiddle\u201d is. At one end of the knob the wiper sits at ground (Vout = 0V); at the other it sits at 5V; halfway, R1 = R2 and Vout = 2.5V \u2014 exactly what the serial monitor shows as A0 = 512, since the Uno\u2019s 10-bit ADC maps 0\u20135V onto 0\u20131023. This one circuit \u2014 a variable divider read by an ADC \u2014 is the ancestor of almost every knob, joystick and resistive sensor you will ever meet.',
    watch: 'The two outer pot pins are interchangeable for a plain divider, but swapping them reverses the knob direction (clockwise = up vs down). Pick the convention you want before you solder anything permanent.'
  },
  {
    id: 'bb-button-pulldown',
    title: 'Buttons and Pull-Down Resistors',
    level: 'Beginner',
    mins: 20,
    goal: 'Read a pushbutton on D2 reliably by giving the input pin a defined idle state with a 10k\u03a9 pull-down resistor.',
    parts: ['Arduino Uno', 'Breadboard', '1\u00d7 tactile pushbutton', '1\u00d7 10k\u03a9 resistor', 'Jumper wires'],
    wiring: [
      { from: 'Uno 5V', to: 'Rail +', color: 'red' },
      { from: 'Uno GND', to: 'Rail \u2212', color: 'black' },
      { from: 'Rail +', to: 'Button leg 1 (row 20)', color: 'red' },
      { from: 'Button leg 2 (row 22)', to: 'Uno D2', color: 'yellow' },
      { from: 'Uno D2 node (row 22)', to: '10k\u03a9 resistor \u2192 Rail \u2212', color: 'black' }
    ],
    codeLang: 'cpp',
    code: 'const int buttonPin = 2;\n\nvoid setup() {\n  pinMode(buttonPin, INPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int state = digitalRead(buttonPin);\n  Serial.println(state);   // 0 = released, 1 = pressed\n  delay(100);\n}',
    serial: ['0', '0', '0', '1', '1', '1', '0', '0'],
    sim: { device: 'button-led', mode: 'on' },
    explain: 'A digital input left unconnected is \u201cfloating\u201d: its voltage wanders with stray electric fields, nearby wiring and even your hand, so digitalRead returns random 0s and 1s. The 10k\u03a9 pull-down resistor fixes that by tying D2 gently to ground \u2014 with the button open, the pin sits at a definite 0V and reads 0. Press the button and the pin connects straight to 5V, reading 1; the pull-down now has 5V across it and passes a harmless 0.5mA (5V / 10k\u03a9). Why 10k\u03a9 and not 100\u03a9 or 1M\u03a9? Too small wastes current and fights the supply when pressed; too large is too weak to hold the pin steady against noise. 10k\u03a9 is the classic compromise, and the button straddles the centre groove so its two sides land in separate rows, exactly as its internal contacts require.',
    watch: 'Tactile buttons have two pairs of internally-joined legs. If your button reads pressed forever (or never), rotate it 90\u00b0 \u2014 you have probably bridged a joined pair instead of switching across the open contacts.'
  },
  {
    id: 'bb-capstone-flasher',
    title: 'Capstone: Two-LED Alternating Flasher',
    level: 'Intermediate',
    mins: 30,
    goal: 'Combine everything \u2014 powered rails, two resistor-protected LED branches and real code \u2014 into a tidy alternating flasher driven by D8 and D9.',
    parts: ['Arduino Uno', 'Breadboard', '1\u00d7 red LED', '1\u00d7 green LED', '2\u00d7 220\u03a9 resistors', 'Jumper wires (red, black, and two signal colours)'],
    wiring: [
      { from: 'Uno 5V', to: 'Rail + (not used by outputs, kept for tidy power)', color: 'red' },
      { from: 'Uno GND', to: 'Rail \u2212', color: 'black' },
      { from: 'Uno D9', to: '220\u03a9 resistor \u2192 red LED anode', color: 'orange' },
      { from: 'Red LED cathode', to: 'Rail \u2212', color: 'black' },
      { from: 'Uno D8', to: '220\u03a9 resistor \u2192 green LED anode', color: 'green' },
      { from: 'Green LED cathode', to: 'Rail \u2212', color: 'black' }
    ],
    codeLang: 'cpp',
    code: 'const int redPin = 9;\nconst int greenPin = 8;\n\nvoid setup() {\n  pinMode(redPin, OUTPUT);\n  pinMode(greenPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(redPin, HIGH);\n  digitalWrite(greenPin, LOW);\n  delay(400);\n  digitalWrite(redPin, LOW);\n  digitalWrite(greenPin, HIGH);\n  delay(400);\n}',
    serial: [],
    sim: { device: 'led', mode: 'blink' },
    explain: 'Each output pin now drives its own copy of the lesson-2 branch: pin \u2192 220\u03a9 resistor \u2192 LED \u2192 shared ground rail. When D9 is HIGH it sources about (5V \u2212 2V) / 220\u03a9 \u2248 14mA \u2014 comfortably inside a Uno pin\u2019s 20mA recommended limit, which is why each LED keeps its own resistor even though they never light at full brightness together. The code is a two-state machine written out longhand: set the pair, wait 400ms, flip the pair, wait again. Because both cathodes return through one rail, the ground side stays a single short black wire instead of a tangle back to the Uno \u2014 the rails have quietly done the distribution work for the whole project. This is the complete prototyping loop: power distribution, protected outputs, readable code, tidy wiring.',
    watch: 'Build like you will debug it later (you will): red jumpers for power, black for ground, a different colour per signal, jumpers trimmed short and lying flat so the circuit reads like the schematic at a glance.'
  }
];
