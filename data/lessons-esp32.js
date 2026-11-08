// Circuit Lab 3D — lessons: ESP32 DevKit V1 (Arduino C++).
// All lesson text and code written fresh for this project, following the
// standard ESP32 beginner curriculum. Serial outputs marked "simulated"
// are illustrative samples, not captured logs.
window.LESSON_SETS = window.LESSON_SETS || {};
window.LESSON_SETS['esp32'] = [
  {
    id: 'esp32-blink',
    title: 'Blink the Onboard LED',
    level: 'Beginner',
    mins: 10,
    goal: 'Make the blue LED built into the DevKit board blink once per second — the "hello world" of hardware, proving your toolchain, board and upload path all work.',
    parts: ['ESP32 DevKit V1 board', 'USB cable (data-capable)'],
    wiring: [],
    codeLang: 'cpp',
    code: `// Blink the onboard LED wired to GPIO2
const int LED_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);  // LED on
  delay(500);                   // wait 500 ms
  digitalWrite(LED_PIN, LOW);   // LED off
  delay(500);
}`,
    serial: `(Nothing appears — this sketch never prints.
That is expected. The Serial Monitor joins the story in the next lessons.)`,
    sim: { device: 'led', mode: 'blink' },
    explain: 'setup() runs once at power-up and loop() repeats forever — that split is the skeleton of nearly every embedded program. pinMode() configures the GPIO pad as a push-pull output, and digitalWrite() drives it to 3.3 V (HIGH) or 0 V (LOW). The LED and its series resistor are already soldered between GPIO2 and ground on the DevKit, so HIGH means current flows and the LED lights.',
    watch: 'If the LED stays dark, check the board variant: a few DevKit clones put the LED on a different pin. Also make sure your USB cable carries data — charge-only cables silently ruin first uploads.'
  },
  {
    id: 'esp32-touch',
    title: 'Capacitive Touch Read',
    level: 'Beginner',
    mins: 15,
    goal: 'Turn a bare wire on GPIO4 into a touch sensor, watch the raw values in the Serial Monitor, and light the onboard LED when a finger touches it.',
    parts: ['ESP32 DevKit V1 board', 'One jumper wire or a small piece of foil', 'USB cable'],
    wiring: [
      { from: 'GPIO4 (touch T0)', to: 'Bare wire end / foil pad', color: 'yellow' }
    ],
    codeLang: 'cpp',
    code: `// Read capacitive touch channel T0 on GPIO4
const int TOUCH_PIN = 4;
const int LED_PIN = 2;
const int THRESHOLD = 40;   // touched readings fall below this

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int value = touchRead(TOUCH_PIN);
  Serial.println(value);
  digitalWrite(LED_PIN, value < THRESHOLD ? HIGH : LOW);
  delay(100);
}`,
    serial: `62
63
61
64
62
29
26
27
28
63
62
(Values idle around 60-65, then dive when the finger touches the wire.)`,
    sim: { device: 'led', mode: 'on' },
    explain: 'The ESP32 has a capacitive touch peripheral built into ten of its pins. touchRead() charges the pin and times how long it takes to discharge through the tiny capacitance of the pad — your finger adds capacitance to ground, which slows the discharge and lowers the reported number. There is no switch and nothing moves: it is pure electric-field sensing, the same principle behind phone screens and touch lamps.',
    watch: 'Thresholds are not universal: humidity, pad size and wire length all shift the idle reading. Always print the raw values first and pick a threshold halfway between the untouched and touched numbers you actually see.'
  },
  {
    id: 'esp32-pwm-fade',
    title: 'PWM Fade with LEDC',
    level: 'Beginner',
    mins: 20,
    goal: 'Fade an external LED smoothly up and down using the ESP32 LEDC hardware PWM peripheral on GPIO16.',
    parts: ['ESP32 DevKit V1 board', 'Breadboard', 'LED (any colour)', '220 Ω resistor', 'Jumper wires'],
    wiring: [
      { from: 'GPIO16', to: '220 Ω resistor', color: 'orange' },
      { from: '220 Ω resistor', to: 'LED long leg (anode, +)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND', color: 'black' }
    ],
    codeLang: 'cpp',
    code: `// Fade an LED on GPIO16 with the LEDC PWM peripheral
const int LED_PIN = 16;
const int FREQ = 5000;       // 5 kHz PWM — far above flicker fusion
const int RESOLUTION = 8;    // 8-bit duty: 0 (off) to 255 (full on)

void setup() {
  ledcAttach(LED_PIN, FREQ, RESOLUTION);
}

void loop() {
  for (int duty = 0; duty <= 255; duty++) {
    ledcWrite(LED_PIN, duty);
    delay(8);
  }
  for (int duty = 255; duty >= 0; duty--) {
    ledcWrite(LED_PIN, duty);
    delay(8);
  }
}`,
    serial: `(Nothing printed — open the Serial Monitor later lessons.
Watch the LED breathe instead: about 2 seconds up, 2 seconds down.)`,
    sim: { device: 'led', mode: 'fade' },
    explain: 'Pulse-width modulation switches the pin fully on and off thousands of times per second; the fraction of time spent on — the duty cycle — sets the average voltage and therefore the brightness. The LEDC peripheral generates this waveform in hardware across up to 16 channels, so the CPU only updates one number per step. At 5 kHz the switching is far too fast for your eye to see as flicker, so brightness looks continuous.',
    watch: 'Human brightness perception is logarithmic, not linear: the fade will look like it rushes at the dim end and crawls at the bright end. Real products correct this with a gamma curve — try duty*duty/255 in ledcWrite() and feel the difference.'
  },
  {
    id: 'esp32-wifi-scan',
    title: 'Wi-Fi Scan',
    level: 'Intermediate',
    mins: 20,
    goal: 'Put the ESP32 radio into station mode and list every Wi-Fi network it can hear, with signal strengths, in the Serial Monitor.',
    parts: ['ESP32 DevKit V1 board', 'USB cable'],
    wiring: [],
    codeLang: 'cpp',
    code: `#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);     // station mode: a client, not an access point
  WiFi.disconnect();       // make sure we are not connected to anything
  delay(100);
  Serial.println("Starting scan...");
}

void loop() {
  int n = WiFi.scanNetworks();
  Serial.printf("Found %d networks:\n", n);
  for (int i = 0; i < n; i++) {
    Serial.printf("  %-20s %d dBm\n", WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  }
  Serial.println("---- rescanning in 5 s ----");
  delay(5000);
}`,
    serial: `Starting scan...
Found 4 networks:
  CampusNet            -52 dBm
  Library-IoT          -67 dBm
  xfinitywifi          -78 dBm
  DormRoom-5G          -84 dBm
---- rescanning in 5 s ----
(Simulated network list — your real scan shows whatever radios are near you.)`,
    sim: { device: 'led', mode: 'blink' },
    explain: 'Before it can join a network, a Wi-Fi station must listen for the beacon frames access points broadcast about ten times per second; a scan simply collects those beacons on each channel in turn. RSSI is received signal strength in dBm — negative numbers where closer to zero means stronger: -50 dBm is a strong signal, -90 dBm is barely usable. Note the radio and ADC2 share hardware on the ESP32, which is why analog reads on ADC2 pins fail while Wi-Fi is active.',
    watch: 'The ESP32 is a 2.4 GHz-only radio: 5 GHz-only networks will never appear in a scan, no matter how strong they are. If your network is missing, check which band it is on.'
  },
  {
    id: 'esp32-wifi-led',
    title: 'Wi-Fi LED Web Switch',
    level: 'Intermediate',
    mins: 30,
    goal: 'Connect the ESP32 to your Wi-Fi, run a tiny web server on it, and switch the onboard LED from any browser on the same network.',
    parts: ['ESP32 DevKit V1 board', 'USB cable', 'A phone or computer on the same Wi-Fi'],
    wiring: [],
    codeLang: 'cpp',
    code: `#include <WiFi.h>

const char* SSID = "YourWiFiName";
const char* PASS = "YourWiFiPassword";
const int LED_PIN = 2;

WiFiServer server(80);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! Browse to http://");
  Serial.println(WiFi.localIP());
  server.begin();
}

void loop() {
  WiFiClient client = server.available();
  if (!client) return;                       // nobody waiting: loop again

  String req = client.readStringUntil('\\r');
  if (req.indexOf("GET /on") >= 0)  digitalWrite(LED_PIN, HIGH);
  if (req.indexOf("GET /off") >= 0) digitalWrite(LED_PIN, LOW);

  client.println("HTTP/1.1 200 OK");
  client.println("Content-type:text/html");
  client.println();
  client.println("<h1>ESP32 LED</h1>");
  client.println("<a href='/on'>Turn ON</a> | <a href='/off'>Turn OFF</a>");
  client.stop();
}`,
    serial: `.........
Connected! Browse to http://192.168.1.87
(Simulated address — your board prints whatever IP your router gives it.)
Each browser tap then toggles the LED with no new serial output.`,
    sim: { device: 'led', mode: 'on' },
    explain: 'This is the whole client–server idea on a two-dollar chip: the ESP32 joins the LAN as a station, the router leases it an IP address, and the board listens on TCP port 80. A browser request is just text — the first line, "GET /on HTTP/1.1", carries everything the sketch needs, and the reply is equally plain text with an HTTP status line and an HTML body. Real frameworks hide these strings, but nothing about the web is more magical than this.',
    watch: 'Hard-coding Wi-Fi passwords in source is fine for a classroom demo and terrible for anything you ship or push to GitHub. For real projects, keep credentials in a separate header file that .gitignore excludes.'
  },
  {
    id: 'esp32-analog-dac',
    title: 'Analog Read + DAC Wave',
    level: 'Intermediate',
    mins: 25,
    goal: 'Read a potentiometer on input-only GPIO34, print the values, and mirror them as a true analog voltage out of the DAC on GPIO25.',
    parts: ['ESP32 DevKit V1 board', 'Breadboard', '10 kΩ potentiometer', 'LED', '220 Ω resistor', 'Jumper wires'],
    wiring: [
      { from: '3V3', to: 'Potentiometer outer leg 1', color: 'red' },
      { from: 'Potentiometer wiper (middle leg)', to: 'GPIO34', color: 'yellow' },
      { from: 'Potentiometer outer leg 2', to: 'GND', color: 'black' },
      { from: 'GPIO25 (DAC1)', to: '220 Ω resistor', color: 'green' },
      { from: '220 Ω resistor', to: 'LED long leg (anode, +)', color: 'green' },
      { from: 'LED short leg (cathode, −)', to: 'GND', color: 'black' }
    ],
    codeLang: 'cpp',
    code: `// Read a potentiometer (ADC) and mirror it as analog out (DAC)
const int POT_PIN = 34;   // ADC1 — input-only pin, works with Wi-Fi on
const int DAC_PIN = 25;   // DAC1 — true analog output

void setup() {
  Serial.begin(115200);
}

void loop() {
  int raw = analogRead(POT_PIN);          // 0..4095 (12-bit ADC)
  int level = map(raw, 0, 4095, 0, 255);  // rescale to the DAC's 8 bits
  dacWrite(DAC_PIN, level);               // 0..255 -> 0..3.3 V
  Serial.printf("ADC %4d  ->  DAC %3d\n", raw, level);
  delay(100);
}`,
    serial: `ADC    0  ->  DAC   0
ADC 1180  ->  DAC  73
ADC 2047  ->  DAC 127
ADC 3102  ->  DAC 193
ADC 4095  ->  DAC 255
(Simulated readings — turning the knob sweeps the whole range.)`,
    sim: { device: 'potentiometer', mode: 'sensor' },
    explain: 'The potentiometer is a variable voltage divider: the wiper picks off a fraction of 3.3 V set by the knob angle, and the 12-bit ADC quantises that voltage into 0–4095. GPIO34 belongs to ADC1, so readings stay valid while Wi-Fi runs. The DAC does the reverse journey — dacWrite() converts an 8-bit number back into a genuine steady voltage, which is why the LED brightness here is smooth in a way a digital pin alone could never manage.',
    watch: 'The ESP32 ADC is famously non-linear near the rails: readings compress close to 0 V and 3.3 V. For measurement-grade work, stay in the middle range or apply a calibration curve — and never exceed 3.3 V on the pin.'
  }
];
