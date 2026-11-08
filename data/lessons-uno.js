(window.LESSON_SETS = window.LESSON_SETS || {});
window.LESSON_SETS['uno'] = [
  {
    id: 1,
    title: 'Meet Your Uno',
    level: 'Beginner',
    mins: 10,
    goal: 'Identify the Uno power pins, digital pins, analog inputs, reset button, USB port, and the built-in LED connected to D13.',
    parts: ['Arduino Uno R3', 'USB cable'],
    wiring: [],
    codeLang: 'cpp',
    code: `const int ledPin = LED_BUILTIN;

void setup() {
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH);
  Serial.begin(9600);
  Serial.println("Uno pin tour");
  Serial.println("D0-D13: digital pins");
  Serial.println("A0-A5: analog inputs");
  Serial.println("5V and GND power the circuit");
}

void loop() {
}`,
    serial: ['Uno pin tour', 'D0-D13: digital pins', 'A0-A5: analog inputs', '5V and GND power the circuit'],
    sim: { device: 'led', mode: 'on', pin: 'D13' },
    explain: 'The ATmega328P is the microcontroller that runs your sketch. Digital pins are either HIGH or LOW, while A0 to A5 can measure a changing voltage with a 10-bit analog-to-digital converter. The LED on D13 gives you an output device that is already wired to the board.',
    watch: 'Find the pin labels printed on the board before connecting anything; a wire in the wrong header is the most common beginner fault.'
  },
  {
    id: 2,
    title: 'Blink',
    level: 'Beginner',
    mins: 10,
    goal: 'Make the built-in D13 LED turn on and off once per second while learning setup(), loop(), pinMode(), and digitalWrite().',
    parts: ['Arduino Uno R3', 'USB cable'],
    wiring: ['No external wiring is needed because the test LED is already connected to D13 on the Uno.'],
    codeLang: 'cpp',
    code: `const int ledPin = LED_BUILTIN;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  delay(1000);
}`,
    serial: [],
    sim: { device: 'led', mode: 'blink', pin: 'D13' },
    explain: 'setup() runs once after reset and configures D13 as an output. loop() then repeats forever: HIGH applies about 5 V to the pin, LOW returns it to 0 V, and delay() pauses the program in milliseconds.',
    watch: 'If nothing blinks, check that the board and port selected in the IDE match the Uno you connected.'
  },
  {
    id: 3,
    title: 'Blink an External LED',
    level: 'Beginner',
    mins: 15,
    goal: 'Build your first breadboard circuit and blink an external LED from D9 through a current-limiting resistor.',
    parts: ['Arduino Uno R3', 'Solderless breadboard', 'Red LED', '220 Ω resistor', '3 jumper wires'],
    wiring: [
      'Connect D9 to one end of the 220 Ω resistor.',
      'Connect the other end of the resistor to the LED anode, the longer leg.',
      'Connect the LED cathode, the shorter leg, to a ground rail.',
      'Connect the ground rail to an Uno GND pin.'
    ],
    codeLang: 'cpp',
    code: `const int ledPin = 9;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(500);
  digitalWrite(ledPin, LOW);
  delay(500);
}`,
    serial: [],
    sim: { device: 'led', mode: 'blink', pin: 'D9' },
    explain: 'The resistor is not optional: it limits LED current and protects both the LED and the microcontroller pin. With a red LED near 2 V, a 220 Ω resistor gives roughly (5 - 2) / 220 = 14 mA, below the sensible 20 mA design target for an Uno output pin even though 40 mA is the absolute maximum.',
    watch: 'LEDs are polarised. If the circuit is correct but dark, turn the LED around and check that its flat edge faces the cathode side.'
  },
  {
    id: 4,
    title: 'Fade with PWM',
    level: 'Beginner',
    mins: 15,
    goal: 'Use analogWrite() on D9 to fade an LED smoothly up and down instead of only switching it on and off.',
    parts: ['Arduino Uno R3', 'Solderless breadboard', 'LED', '220 Ω resistor', '3 jumper wires'],
    wiring: [
      'Connect D9 to one end of the 220 Ω resistor.',
      'Connect the other end of the resistor to the LED anode, the longer leg.',
      'Connect the LED cathode to a ground rail.',
      'Connect the ground rail to an Uno GND pin.'
    ],
    codeLang: 'cpp',
    code: `const int ledPin = 9;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  for (int brightness = 0; brightness <= 255; brightness++) {
    analogWrite(ledPin, brightness);
    delay(8);
  }
  for (int brightness = 255; brightness >= 0; brightness--) {
    analogWrite(ledPin, brightness);
    delay(8);
  }
}`,
    serial: [],
    sim: { device: 'led', mode: 'fade', pin: 'D9' },
    explain: 'analogWrite() does not create a true analog voltage on a standard Uno. It creates pulse-width modulation: the pin switches rapidly and the duty cycle sets the average power. A value of 0 is always off, 128 is about 50 percent duty cycle, and 255 is always on.',
    watch: 'Only pins marked with a tilde on the board provide PWM: D3, D5, D6, D9, D10, and D11 on the Uno.'
  },
  {
    id: 5,
    title: 'Pushbutton Input',
    level: 'Beginner',
    mins: 15,
    goal: 'Read a pushbutton on D2 using the internal pull-up resistor and use it to control the built-in LED.',
    parts: ['Arduino Uno R3', 'Solderless breadboard', 'Tactile pushbutton', '3 jumper wires'],
    wiring: [
      'Place the pushbutton across the breadboard centre channel.',
      'Connect one side of the button to D2.',
      'Connect the opposite side of the button to GND.',
      'Use the built-in D13 LED as the indicator, so no LED wiring is needed.'
    ],
    codeLang: 'cpp',
    code: `const int buttonPin = 2;
const int ledPin = LED_BUILTIN;

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(buttonPin);
  digitalWrite(ledPin, buttonState == LOW ? HIGH : LOW);
}`,
    serial: [],
    sim: { device: 'button-led', mode: 'on', pin: 'D2', outputPin: 'D13' },
    explain: 'INPUT_PULLUP enables a weak resistor inside the microcontroller that holds D2 HIGH when the button is open. Pressing the button connects D2 to ground, so the code treats LOW as pressed. This active-low arrangement removes the need for an external pull-down resistor.',
    watch: 'A four-leg tactile button has internally connected pairs of legs; use legs on opposite sides of the centre channel for the two circuit nodes.'
  },
  {
    id: 6,
    title: 'Read a Potentiometer',
    level: 'Beginner',
    mins: 15,
    goal: 'Measure a changing voltage on A0, convert the ADC reading to volts, and print useful values to the Serial Monitor.',
    parts: ['Arduino Uno R3', 'Solderless breadboard', '10 kΩ potentiometer', '3 jumper wires'],
    wiring: [
      'Connect one outer potentiometer terminal to 5V.',
      'Connect the other outer potentiometer terminal to GND.',
      'Connect the centre wiper terminal to A0.'
    ],
    codeLang: 'cpp',
    code: `const int potPin = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(potPin);
  float voltage = raw * 5.0 / 1023.0;
  Serial.print("ADC: ");
  Serial.print(raw);
  Serial.print("  Voltage: ");
  Serial.print(voltage, 2);
  Serial.println(" V");
  delay(200);
}`,
    serial: ['ADC: 0  Voltage: 0.00 V', 'ADC: 256  Voltage: 1.25 V', 'ADC: 512  Voltage: 2.50 V', 'ADC: 767  Voltage: 3.75 V', 'ADC: 1023  Voltage: 5.00 V'],
    sim: { device: 'potentiometer', mode: 'sensor', pin: 'A0' },
    explain: 'The potentiometer is an adjustable voltage divider. Its wiper moves between ground and 5 V, and the 10-bit ADC divides that range into 1024 codes, so one step is about 4.9 mV with a 5 V reference. Turning the shaft changes the divided voltage rather than sending digital data.',
    watch: 'If the reading jumps between extremes, the wiper is probably not on A0 or one of the supply wires is in the wrong breadboard row.'
  },
  {
    id: 7,
    title: 'RGB LED Colour Mix',
    level: 'Beginner+',
    mins: 20,
    goal: 'Control the red, green, and blue channels of a common-cathode RGB LED with three PWM outputs.',
    parts: ['Arduino Uno R3', 'Solderless breadboard', 'Common-cathode RGB LED', '3 × 220 Ω resistors', '5 jumper wires'],
    wiring: [
      'Connect the longest RGB LED leg, the common cathode, to GND.',
      'Connect D9 through a 220 Ω resistor to the red leg.',
      'Connect D10 through a 220 Ω resistor to the green leg.',
      'Connect D11 through a 220 Ω resistor to the blue leg.'
    ],
    codeLang: 'cpp',
    code: `const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;

void setColour(int red, int green, int blue) {
  analogWrite(redPin, red);
  analogWrite(greenPin, green);
  analogWrite(bluePin, blue);
}

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
}

void loop() {
  setColour(255, 0, 0);
  delay(700);
  setColour(0, 255, 0);
  delay(700);
  setColour(0, 0, 255);
  delay(700);
  setColour(255, 180, 0);
  delay(700);
  setColour(120, 0, 255);
  delay(700);
}`,
    serial: [],
    sim: { device: 'rgb-led', mode: 'rgb-cycle', pin: 'D9', pins: ['D9', 'D10', 'D11'] },
    explain: 'An RGB LED packages three LED junctions in one housing. Separate PWM duty cycles control the average current in each colour channel, and your eye integrates the rapidly switched light into a mixed colour. Each channel still needs its own resistor because the three junctions have different forward voltages.',
    watch: 'This sketch is for a common-cathode device. A common-anode RGB LED connects its shared leg to 5V and uses inverted PWM values.'
  },
  {
    id: 8,
    title: 'Servo Sweep',
    level: 'Beginner+',
    mins: 20,
    goal: 'Drive a small hobby servo from D9 and sweep its shaft smoothly from 0 to 180 degrees and back.',
    parts: ['Arduino Uno R3', 'SG90 or similar micro servo', '3 jumper wires', 'USB or suitable 5 V supply'],
    wiring: [
      'Connect the servo brown or black wire to GND.',
      'Connect the servo red wire to 5V.',
      'Connect the servo orange or yellow signal wire to D9.'
    ],
    codeLang: 'cpp',
    code: `#include <Servo.h>

Servo myServo;
const int servoPin = 9;

void setup() {
  myServo.attach(servoPin);
}

void loop() {
  for (int angle = 0; angle <= 180; angle++) {
    myServo.write(angle);
    delay(15);
  }
  for (int angle = 180; angle >= 0; angle--) {
    myServo.write(angle);
    delay(15);
  }
}`,
    serial: [],
    sim: { device: 'servo', mode: 'servo-sweep', pin: 'D9' },
    explain: 'A hobby servo contains a motor, gears, position sensor, and control electronics. The Arduino sends a repeating pulse whose width represents the requested angle; it does not use analogWrite() directly. The power wire carries the motor current, while D9 carries only the position signal.',
    watch: 'If the Uno resets when the servo starts, the servo is browning out the supply. Use a suitable separate 5 V supply for the servo and connect its ground to Uno ground.'
  },
  {
    id: 9,
    title: 'Ultrasonic Distance Sensor',
    level: 'Intermediate',
    mins: 25,
    goal: 'Measure distance with an HC-SR04 by timing its echo pulse and printing the result in centimetres.',
    parts: ['Arduino Uno R3', 'HC-SR04 ultrasonic sensor', 'Solderless breadboard', '4 jumper wires'],
    wiring: [
      'Connect HC-SR04 VCC to 5V.',
      'Connect HC-SR04 GND to GND.',
      'Connect HC-SR04 Trig to D7.',
      'Connect HC-SR04 Echo to D6.'
    ],
    codeLang: 'cpp',
    code: `const int trigPin = 7;
const int echoPin = 6;

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
}

void loop() {
  float distance = readDistanceCm();
  if (distance < 0) {
    Serial.println("No echo received");
  } else {
    Serial.print("Distance: ");
    Serial.print(distance, 1);
    Serial.println(" cm");
  }
  delay(200);
}`,
    serial: ['Distance: 42.6 cm', 'Distance: 31.4 cm', 'Distance: 18.9 cm', 'Distance: 12.3 cm', 'No echo received'],
    sim: { device: 'ultrasonic', mode: 'distance', pin: 'D7', pins: ['D7', 'D6'] },
    explain: 'The sensor emits a short burst of 40 kHz sound and raises Echo for the round-trip time. Dividing by two converts the round trip to one-way distance. The calculation assumes sound travels at about 0.0343 cm per microsecond, so temperature and target angle can affect accuracy.',
    watch: 'Aim the two round transducers at a flat, hard object. Soft fabric, sharp angles, and objects closer than about 2 cm produce unreliable echoes.'
  },
  {
    id: 10,
    title: 'Capstone: Parking Sensor',
    level: 'Intermediate',
    mins: 35,
    goal: 'Combine an ultrasonic sensor, warning LED, and buzzer to create a distance alarm that reacts when an object comes within 20 cm.',
    parts: ['Arduino Uno R3', 'HC-SR04 ultrasonic sensor', 'LED', '220 Ω resistor', 'Active or passive buzzer', 'Solderless breadboard', 'Jumper wires'],
    wiring: [
      'Connect HC-SR04 VCC to 5V and GND to GND.',
      'Connect HC-SR04 Trig to D7 and Echo to D6.',
      'Connect D12 through a 220 Ω resistor to the LED anode; connect the LED cathode to GND.',
      'Connect the buzzer positive terminal to D8 and its negative terminal to GND.'
    ],
    codeLang: 'cpp',
    code: `const int trigPin = 7;
const int echoPin = 6;
const int ledPin = 12;
const int buzzerPin = 8;

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
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  float distance = readDistanceCm();
  bool tooClose = distance > 0 && distance < 20.0;
  digitalWrite(ledPin, tooClose ? HIGH : LOW);
  if (tooClose) {
    tone(buzzerPin, 1400, 100);
  }
  Serial.print("Distance: ");
  if (distance < 0) Serial.println("out of range");
  else {
    Serial.print(distance, 1);
    Serial.println(" cm");
  }
  delay(180);
}`,
    serial: ['Distance: 48.2 cm', 'Distance: 29.7 cm', 'Distance: 19.4 cm', 'Distance: 14.1 cm', 'Distance: 9.8 cm'],
    sim: { device: 'ultrasonic', mode: 'distance', pin: 'D7', pins: ['D7', 'D6', 'D12', 'D8'] },
    explain: 'This capstone separates the design into sensing, decision, and actuation. The HC-SR04 provides a measurement, the program compares it with a 20 cm threshold, and the LED and buzzer provide immediate feedback while Serial reports the numerical value for debugging.',
    watch: 'Set the threshold with a little margin for sensor noise. A real parking product would add hysteresis so the alarm does not chatter when the distance hovers at the boundary.'
  }
];
