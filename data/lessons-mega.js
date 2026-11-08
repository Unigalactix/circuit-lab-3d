(window.LESSON_SETS = window.LESSON_SETS || {});
window.LESSON_SETS['mega'] = [
  {
    id: 1,
    title: 'LED Chaser',
    level: 'Beginner',
    mins: 20,
    goal: 'Control eight LEDs on D2 through D9 as a running light that moves forward and then backward.',
    parts: ['Arduino Mega 2560', 'Solderless breadboard', '8 LEDs', '8 × 220 Ω resistors', 'Jumper wires'],
    wiring: [
      'Connect D2 through D9, one pin at a time, through separate 220 Ω resistors to eight LED anodes.',
      'Connect every LED cathode to a common ground rail.',
      'Connect the ground rail to a Mega GND pin.',
      'Keep the resistor with its LED so no output pin drives an LED directly.'
    ],
    codeLang: 'cpp',
    code: `const int ledPins[8] = {2, 3, 4, 5, 6, 7, 8, 9};

void showOnly(int index) {
  for (int i = 0; i < 8; i++) {
    digitalWrite(ledPins[i], i == index ? HIGH : LOW);
  }
}

void setup() {
  for (int i = 0; i < 8; i++) {
    pinMode(ledPins[i], OUTPUT);
  }
}

void loop() {
  for (int i = 0; i < 8; i++) {
    showOnly(i);
    delay(120);
  }
  for (int i = 6; i > 0; i--) {
    showOnly(i);
    delay(120);
  }
}`,
    serial: [],
    sim: { device: 'led', mode: 'blink', pin: 'D2', pins: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'] },
    explain: 'An array lets one loop configure and control all eight channels. Only one LED is on at a time in this pattern, but the wiring still gives every LED its own resistor because a later pattern could turn several on together. Total supply current is the sum of all active branch currents, not just the current in one pin.',
    watch: 'Build and test one LED channel first. With eight similar rows, a repeated wiring mistake is much harder to find after the whole circuit is built.'
  },
  {
    id: 2,
    title: 'Seven-Segment Counter',
    level: 'Intermediate',
    mins: 30,
    goal: 'Drive a common-cathode seven-segment display from D2 through D8 and count repeatedly from 0 to 9.',
    parts: ['Arduino Mega 2560', 'Common-cathode seven-segment display', '7 × 220 Ω resistors', 'Solderless breadboard', 'Jumper wires'],
    wiring: [
      'Connect the display common cathode pins to GND.',
      'Connect segment a to D2 through a 220 Ω resistor.',
      'Connect segment b to D3 through a 220 Ω resistor.',
      'Connect segment c to D4 through a 220 Ω resistor.',
      'Connect segment d to D5 through a 220 Ω resistor.',
      'Connect segment e to D6 through a 220 Ω resistor.',
      'Connect segment f to D7 through a 220 Ω resistor.',
      'Connect segment g to D8 through a 220 Ω resistor.'
    ],
    codeLang: 'cpp',
    code: `const int segmentPins[7] = {2, 3, 4, 5, 6, 7, 8};
const bool digitPatterns[10][7] = {
  {1, 1, 1, 1, 1, 1, 0},
  {0, 1, 1, 0, 0, 0, 0},
  {1, 1, 0, 1, 1, 0, 1},
  {1, 1, 1, 1, 0, 0, 1},
  {0, 1, 1, 0, 0, 1, 1},
  {1, 0, 1, 1, 0, 1, 1},
  {1, 0, 1, 1, 1, 1, 1},
  {1, 1, 1, 0, 0, 0, 0},
  {1, 1, 1, 1, 1, 1, 1},
  {1, 1, 1, 1, 0, 1, 1}
};

void showDigit(int digit) {
  for (int segment = 0; segment < 7; segment++) {
    digitalWrite(segmentPins[segment], digitPatterns[digit][segment] ? HIGH : LOW);
  }
}

void setup() {
  for (int segment = 0; segment < 7; segment++) {
    pinMode(segmentPins[segment], OUTPUT);
  }
}

void loop() {
  for (int digit = 0; digit <= 9; digit++) {
    showDigit(digit);
    delay(1000);
  }
}`,
    serial: [],
    sim: { device: 'seven-seg', mode: 'count', pin: 'D2', pins: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'] },
    explain: 'The pattern table stores which of the seven LED segments must be lit for each decimal digit. Each segment is effectively a separate LED and needs its own current-limiting resistor. A common-cathode display uses HIGH for on; a common-anode display needs the opposite logic and its common terminal connected to 5V.',
    watch: 'Check the display datasheet for its exact pinout. Seven-segment packages place the common pins and segment pins differently between models.'
  },
  {
    id: 3,
    title: 'Traffic Light Controller',
    level: 'Beginner+',
    mins: 20,
    goal: 'Sequence red, yellow, and green LEDs on D13, D12, and D11 with realistic road-signal timing.',
    parts: ['Arduino Mega 2560', 'Red LED', 'Yellow LED', 'Green LED', '3 × 220 Ω resistors', 'Solderless breadboard', 'Jumper wires'],
    wiring: [
      'Connect D11 through a 220 Ω resistor to the green LED anode.',
      'Connect D12 through a 220 Ω resistor to the yellow LED anode.',
      'Connect D13 through a 220 Ω resistor to the red LED anode.',
      'Connect all three LED cathodes to a ground rail and connect that rail to Mega GND.'
    ],
    codeLang: 'cpp',
    code: `const int redPin = 13;
const int yellowPin = 12;
const int greenPin = 11;

void setLights(bool red, bool yellow, bool green) {
  digitalWrite(redPin, red ? HIGH : LOW);
  digitalWrite(yellowPin, yellow ? HIGH : LOW);
  digitalWrite(greenPin, green ? HIGH : LOW);
}

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(yellowPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
}

void loop() {
  setLights(false, false, true);
  delay(5000);
  setLights(false, true, false);
  delay(1500);
  setLights(true, false, false);
  delay(5000);
  setLights(true, true, false);
  delay(1000);
}`,
    serial: [],
    sim: { device: 'led', mode: 'blink', pin: 'D11', pins: ['D11', 'D12', 'D13'] },
    explain: 'The controller is a simple state sequence: green, yellow, red, then red plus yellow before returning to green. A helper function makes each state explicit and prevents accidental combinations. Real traffic controllers add sensor inputs, fail-safe flashing modes, and hardware interlocks so conflicting greens cannot be shown.',
    watch: 'D13 also drives the Mega onboard LED, so the red channel may appear in two places. That is expected and can help with debugging.'
  },
  {
    id: 4,
    title: 'Four-Servo Robot Arm Intro',
    level: 'Intermediate',
    mins: 35,
    goal: 'Coordinate four hobby servos on D6, D7, D8, and D9 as the base, shoulder, elbow, and gripper of a small robot arm.',
    parts: ['Arduino Mega 2560', '4 SG90 or similar micro servos', 'Suitable separate 5 V servo supply', 'Solderless breadboard or power distribution rail', 'Jumper wires'],
    wiring: [
      'Connect the four servo signal wires to D6, D7, D8, and D9.',
      'Connect all servo power wires to a suitable separate 5 V supply rail, not directly to the Mega 5V pin.',
      'Connect all servo ground wires to the servo supply ground.',
      'Connect the servo supply ground to Mega GND so the signal pulses share a reference.'
    ],
    codeLang: 'cpp',
    code: `#include <Servo.h>

const int servoPins[4] = {6, 7, 8, 9};
Servo armServos[4];

void moveServo(int index, int fromAngle, int toAngle) {
  int step = fromAngle < toAngle ? 1 : -1;
  for (int angle = fromAngle; angle != toAngle; angle += step) {
    armServos[index].write(angle);
    delay(15);
  }
  armServos[index].write(toAngle);
}

void setup() {
  for (int i = 0; i < 4; i++) {
    armServos[i].attach(servoPins[i]);
    armServos[i].write(90);
  }
  delay(1000);
}

void loop() {
  moveServo(0, 90, 130);
  moveServo(1, 90, 120);
  moveServo(2, 90, 60);
  moveServo(3, 90, 130);
  delay(500);
  moveServo(3, 130, 90);
  moveServo(2, 60, 90);
  moveServo(1, 120, 90);
  moveServo(0, 130, 90);
  delay(1000);
}`,
    serial: [],
    sim: { device: 'servo', mode: 'servo-sweep', pin: 'D6', pins: ['D6', 'D7', 'D8', 'D9'] },
    explain: 'Each servo receives a position pulse from a different Mega pin, but all four motors draw their working current from the external supply. Moving one joint at a time makes the motion easier to observe and reduces simultaneous starting current. Mechanical limits vary, so a real arm should be calibrated before commanding the full 0 to 180 degree range.',
    watch: 'Never power four moving servos from a USB port or the Mega regulator. A stalled hobby servo can draw hundreds of milliamps, and four together can reset or damage the supply.'
  },
  {
    id: 5,
    title: 'Sensor Dashboard',
    level: 'Intermediate',
    mins: 30,
    goal: 'Read a potentiometer on A0 and an ultrasonic sensor using D7 and D8, then publish both measurements as a formatted serial dashboard.',
    parts: ['Arduino Mega 2560', '10 kΩ potentiometer', 'HC-SR04 ultrasonic sensor', 'Solderless breadboard', 'Jumper wires'],
    wiring: [
      'Connect one outer potentiometer terminal to 5V and the other outer terminal to GND.',
      'Connect the potentiometer centre wiper to A0.',
      'Connect HC-SR04 VCC to 5V and GND to GND.',
      'Connect HC-SR04 Trig to D7 and Echo to D8.'
    ],
    codeLang: 'cpp',
    code: `const int potPin = A0;
const int trigPin = 7;
const int echoPin = 8;

float readDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long durationUs = pulseIn(echoPin, HIGH, 30000);
  if (durationUs == 0) return -1.0;
  return durationUs * 0.0343 / 2.0;
}

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
  Serial.println("time_ms,pot_raw,pot_percent,distance_cm");
}

void loop() {
  int potRaw = analogRead(potPin);
  int potPercent = map(potRaw, 0, 1023, 0, 100);
  float distance = readDistanceCm();
  Serial.print(millis());
  Serial.print(",");
  Serial.print(potRaw);
  Serial.print(",");
  Serial.print(potPercent);
  Serial.print(",");
  if (distance < 0) Serial.println("out-of-range");
  else Serial.println(distance, 1);
  delay(500);
}`,
    serial: ['time_ms,pot_raw,pot_percent,distance_cm', '0,128,12,64.2', '500,256,25,63.8', '1000,512,50,41.5', '1500,768,75,22.4', '2000,1023,100,12.7'],
    sim: { device: 'ultrasonic', mode: 'distance', pin: 'D7', pins: ['A0', 'D7', 'D8'] },
    explain: 'The dashboard combines an analog measurement and a time-based digital measurement in one record. Comma-separated output is easy to paste into a spreadsheet or read with a plotting tool. Blocking in pulseIn() for up to 30 ms is acceptable here, but faster control systems often use interrupts or non-blocking timing.',
    watch: 'Use the Serial Plotter or a spreadsheet after collecting a few rows. Trends and sudden jumps are much easier to see graphically than in raw numbers.'
  }
];
