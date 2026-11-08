(window.LESSON_SETS = window.LESSON_SETS || {});
window.LESSON_SETS['nano'] = [
  {
    id: 1,
    title: 'Blink on a Breadboard',
    level: 'Beginner',
    mins: 10,
    goal: 'Seat a Nano across the breadboard centre channel, upload a sketch, and blink the built-in LED on D13.',
    parts: ['Arduino Nano (classic ATmega328P)', 'Solderless breadboard', 'USB cable'],
    wiring: [
      'Push the Nano pins into the breadboard so its two rows sit on opposite sides of the centre channel.',
      'Leave the USB connector accessible at the end of the board.',
      'No external LED is required because D13 already drives the onboard LED.'
    ],
    codeLang: 'cpp',
    code: `const int ledPin = LED_BUILTIN;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(750);
  digitalWrite(ledPin, LOW);
  delay(750);
}`,
    serial: [],
    sim: { device: 'led', mode: 'blink', pin: 'D13' },
    explain: 'The Nano uses the same ATmega328P family and 5 V logic as the Uno, but its dual in-line package is designed to plug directly into a breadboard. Keeping the two pin rows separated by the centre channel prevents the left and right pins from being shorted by the breadboard internal strips.',
    watch: 'Press the Nano down evenly at both ends. A tilted board can leave one row of pins outside their contacts.'
  },
  {
    id: 2,
    title: 'Button with Debounce',
    level: 'Beginner+',
    mins: 20,
    goal: 'Use a D2 pushbutton to toggle the D13 LED once per press, even though the mechanical contacts bounce.',
    parts: ['Arduino Nano (classic ATmega328P)', 'Solderless breadboard', 'Tactile pushbutton', '3 jumper wires'],
    wiring: [
      'Place the pushbutton across the breadboard centre channel.',
      'Connect one side of the button to D2.',
      'Connect the opposite side of the button to GND.',
      'Use the built-in D13 LED as the toggle indicator.'
    ],
    codeLang: 'cpp',
    code: `const int buttonPin = 2;
const int ledPin = LED_BUILTIN;

int ledState = LOW;
int lastReading = HIGH;
int stableState = HIGH;
unsigned long lastChangeTime = 0;
const unsigned long debounceDelay = 30;

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, ledState);
}

void loop() {
  int reading = digitalRead(buttonPin);
  if (reading != lastReading) {
    lastChangeTime = millis();
    lastReading = reading;
  }
  if (millis() - lastChangeTime >= debounceDelay && reading != stableState) {
    stableState = reading;
    if (stableState == LOW) {
      ledState = !ledState;
      digitalWrite(ledPin, ledState);
    }
  }
}`,
    serial: [],
    sim: { device: 'button-led', mode: 'on', pin: 'D2', outputPin: 'D13' },
    explain: 'Mechanical contacts do not make one clean transition. They bounce for a few milliseconds, so a naive program may see several presses. This code accepts a new state only after it has remained unchanged for 30 ms, while INPUT_PULLUP makes the released button read HIGH and the pressed button read LOW.',
    watch: 'If the LED toggles many times, increase the debounce delay slightly; very small or worn switches can bounce longer than expected.'
  },
  {
    id: 3,
    title: 'Pot Controls a Servo',
    level: 'Beginner+',
    mins: 20,
    goal: 'Read a potentiometer on A0 and map its 0 to 1023 ADC range to a 0 to 180 degree servo command on D9.',
    parts: ['Arduino Nano (classic ATmega328P)', 'Solderless breadboard', '10 kΩ potentiometer', 'SG90 or similar micro servo', 'Jumper wires'],
    wiring: [
      'Connect one outer potentiometer terminal to 5V and the other outer terminal to GND.',
      'Connect the potentiometer centre wiper to A0.',
      'Connect the servo power wire to 5V and its ground wire to GND.',
      'Connect the servo signal wire to D9.'
    ],
    codeLang: 'cpp',
    code: `#include <Servo.h>

Servo pointerServo;
const int potPin = A0;
const int servoPin = 9;

void setup() {
  pointerServo.attach(servoPin);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(potPin);
  int angle = map(raw, 0, 1023, 0, 180);
  pointerServo.write(angle);
  Serial.print("ADC: ");
  Serial.print(raw);
  Serial.print("  Angle: ");
  Serial.println(angle);
  delay(20);
}`,
    serial: ['ADC: 0  Angle: 0', 'ADC: 341  Angle: 59', 'ADC: 512  Angle: 90', 'ADC: 782  Angle: 137', 'ADC: 1023  Angle: 180'],
    sim: { device: 'servo', mode: 'servo-sweep', pin: 'D9', inputPin: 'A0' },
    explain: 'The potentiometer produces a voltage, the ADC converts it into a number, and map() rescales that number into the servo angle range. The signal pin sends position commands, but the servo motor current comes from the 5 V rail, which is why supply quality matters.',
    watch: 'Do not force the servo horn past a mechanical stop. If it buzzes at either end, reduce the command range to about 10 to 170 degrees.'
  },
  {
    id: 4,
    title: 'Room Sensor Readings',
    level: 'Beginner+',
    mins: 15,
    goal: 'Format simulated temperature and humidity readings associated with a DHT sensor on D4 and print a clear room-status report.',
    parts: ['Arduino Nano (classic ATmega328P)', 'Solderless breadboard', 'DHT22 sensor for the physical version', '10 kΩ resistor for the physical version', 'Jumper wires'],
    wiring: [
      'For the physical version, connect DHT22 VCC to 5V and GND to GND.',
      'Connect DHT22 DATA to D4.',
      'For the physical version, connect a 10 kΩ pull-up resistor between DATA and 5V.',
      'The code in this lesson intentionally generates simulated readings, so it does not require the sensor library.'
    ],
    codeLang: 'cpp',
    code: `const int sensorPin = 4;

void setup() {
  Serial.begin(9600);
  Serial.print("Simulated DHT input on D");
  Serial.println(sensorPin);
}

void loop() {
  float phase = millis() / 1000.0;
  float temperatureC = 23.4 + 1.1 * sin(phase / 18.0);
  float humidity = 46.0 + 4.0 * cos(phase / 23.0);
  Serial.print("Temperature: ");
  Serial.print(temperatureC, 1);
  Serial.print(" C  Humidity: ");
  Serial.print(humidity, 1);
  Serial.println(" %");
  delay(2000);
}`,
    serial: ['Simulated DHT input on D4', 'Temperature: 23.4 C  Humidity: 50.0 %', 'Temperature: 24.1 C  Humidity: 48.7 %', 'Temperature: 24.5 C  Humidity: 46.9 %', 'Temperature: 24.2 C  Humidity: 45.2 %'],
    sim: { device: 'ldr', mode: 'sensor', pin: 'D4' },
    explain: 'These values are simulated in the sketch so you can practise formatting and logging without depending on a sensor library. A real DHT22 uses a timed digital protocol on D4 and normally a library to decode it; never treat the simulated numbers in this exercise as actual room measurements.',
    watch: 'When you move to the real sensor, allow about two seconds between DHT22 readings and check for failed reads before printing the values.'
  },
  {
    id: 5,
    title: 'Mini Buzzer Piano',
    level: 'Intermediate',
    mins: 25,
    goal: 'Turn three momentary buttons on D2, D3, and D4 into piano keys that play C, D, and E on a buzzer connected to D8.',
    parts: ['Arduino Nano (classic ATmega328P)', 'Solderless breadboard', '3 tactile pushbuttons', 'Passive buzzer', 'Jumper wires'],
    wiring: [
      'Connect one side of the three buttons to D2, D3, and D4 respectively.',
      'Connect the opposite side of every button to GND.',
      'Connect the buzzer positive terminal to D8.',
      'Connect the buzzer negative terminal to GND.'
    ],
    codeLang: 'cpp',
    code: `const int keyPins[3] = {2, 3, 4};
const int noteFrequencies[3] = {262, 294, 330};
const int buzzerPin = 8;

void setup() {
  for (int i = 0; i < 3; i++) {
    pinMode(keyPins[i], INPUT_PULLUP);
  }
  pinMode(buzzerPin, OUTPUT);
}

void loop() {
  bool anyKeyPressed = false;
  for (int i = 0; i < 3; i++) {
    if (digitalRead(keyPins[i]) == LOW) {
      tone(buzzerPin, noteFrequencies[i]);
      anyKeyPressed = true;
    }
  }
  if (!anyKeyPressed) {
    noTone(buzzerPin);
  }
}`,
    serial: [],
    sim: { device: 'buzzer', mode: 'tone', pin: 'D8', pins: ['D2', 'D3', 'D4', 'D8'] },
    explain: 'A passive buzzer converts the frequency of a square wave into pitch. The three notes are C4 at about 262 Hz, D4 at 294 Hz, and E4 at 330 Hz. INPUT_PULLUP means each key is active-low, and tone() continues until the program calls noTone() or changes the frequency.',
    watch: 'Use a passive buzzer for variable notes. An active buzzer contains its own oscillator and mostly produces one fixed sound when powered.'
  }
];
