// Circuit Lab 3D — lessons: Raspberry Pi 4 (Python + gpiozero).
// All lesson text and code written fresh for this project, following the
// standard gpiozero beginner curriculum. gpiozero uses BCM pin numbers
// (the "GPIO n" names), never physical header positions.
window.LESSON_SETS = window.LESSON_SETS || {};
window.LESSON_SETS['pi4'] = [
  {
    id: 'pi4-blink',
    title: 'Blink an LED',
    level: 'Beginner',
    mins: 15,
    goal: 'Blink an LED on GPIO17 from Python and gpiozero, and learn the difference between BCM pin numbers and physical header positions before it bites you.',
    parts: ['Raspberry Pi 4 (running Raspberry Pi OS)', 'Breadboard', 'LED', '220 Ω resistor', 'Female-to-male jumper wires'],
    wiring: [
      { from: 'GPIO17 (physical pin 11)', to: '220 Ω resistor', color: 'orange' },
      { from: '220 Ω resistor', to: 'LED long leg (anode, +)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND (physical pin 6)', color: 'black' }
    ],
    codeLang: 'python',
    code: `from gpiozero import LED
from time import sleep

led = LED(17)   # BCM GPIO17 — that is physical pin 11 on the header

while True:
    led.on()
    sleep(0.5)
    led.off()
    sleep(0.5)`,
    serial: `(Run it in a terminal with:  python3 blink.py
No output — the LED blinking once a second is the output.
Press Ctrl+C to stop.)`,
    sim: { device: 'led', mode: 'blink' },
    explain: 'The Pi has two pin numbering schemes: BCM numbers name the signals inside the Broadcom chip, while physical (BOARD) numbers just count header positions. gpiozero always uses BCM, so LED(17) means GPIO17, which happens to sit at physical pin 11. The header’s pins also carry fixed alternate functions — I2C, SPI, UART, PWM — printed in any pinout chart, and a GPIO is "borrowed" back to plain I/O when you use it like this.',
    watch: 'The Pi’s 3.3 V GPIO pins can only source about 16 mA each — one LED through a resistor is fine, but motors, relays and LED strips need a transistor and their own supply. And never let a GPIO meet the 5 V pins: that mistake is permanent.'
  },
  {
    id: 'pi4-button-led',
    title: 'Button + LED',
    level: 'Beginner',
    mins: 20,
    goal: 'Add a pushbutton on GPIO27 and control the LED with gpiozero’s event callbacks instead of a polling loop.',
    parts: ['Raspberry Pi 4', 'Breadboard', 'LED', '220 Ω resistor', 'Pushbutton', 'Jumper wires'],
    wiring: [
      { from: 'GPIO17 (physical pin 11)', to: '220 Ω resistor, then LED long leg (+)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND (physical pin 6)', color: 'black' },
      { from: 'GPIO27 (physical pin 13)', to: 'Pushbutton leg A', color: 'yellow' },
      { from: 'Pushbutton leg B', to: 'GND (physical pin 14)', color: 'black' }
    ],
    codeLang: 'python',
    code: `from gpiozero import LED, Button
from signal import pause

led = LED(17)
button = Button(27)   # wired to GND; gpiozero enables the internal pull-up

button.when_pressed = led.on
button.when_released = led.off

pause()   # sleep forever while events do the work`,
    serial: `(Terminal stays quiet. The LED follows the button with no
visible loop in the code — that is the point of this lesson.)`,
    sim: { device: 'button-led', mode: 'on' },
    explain: 'The button connects GPIO27 to ground when pressed, and gpiozero configures the pin’s internal pull-up resistor so it reads 1 when released and 0 when pressed — active-low logic, the norm for buttons. Instead of spinning in a loop asking "pressed yet?", the program registers callbacks: when_pressed and when_released run on a background thread when the edge arrives. pause() then just parks the main thread so the script does not exit.',
    watch: 'Real buttons bounce, and gpiozero already debounces in its input handling — but if you ever read raw GPIO in a tight loop, expect one press to look like a dozen. Match your code to the physics of the contact.'
  },
  {
    id: 'pi4-pwm',
    title: 'PWM Brightness',
    level: 'Beginner',
    mins: 15,
    goal: 'Drive the LED with PWMLED on GPIO18 — a hardware PWM pin — and ramp its brightness as a smooth 0.0 to 1.0 value.',
    parts: ['Raspberry Pi 4', 'Breadboard', 'LED', '220 Ω resistor', 'Jumper wires'],
    wiring: [
      { from: 'GPIO18 (physical pin 12)', to: '220 Ω resistor', color: 'orange' },
      { from: '220 Ω resistor', to: 'LED long leg (anode, +)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND (physical pin 20)', color: 'black' }
    ],
    codeLang: 'python',
    code: `from gpiozero import PWMLED
from time import sleep

led = PWMLED(18)   # GPIO18 can carry true hardware PWM

while True:
    for value in range(0, 101, 2):        # 0.00 .. 1.00
        led.value = value / 100
        sleep(0.02)
    for value in range(100, -1, -2):      # and back down
        led.value = value / 100
        sleep(0.02)`,
    serial: `(No terminal output. The LED breathes: roughly two
seconds up, two seconds down. Try printing led.value
inside the loop if you want numbers with the glow.)`,
    sim: { device: 'led', mode: 'fade' },
    explain: 'PWMLED treats brightness as a normalised float: value 0.35 means a 35% duty cycle. GPIO18 is special on the Pi — it can source PWM from a dedicated hardware peripheral rather than from software timing, so the waveform stays rock-steady even while Linux is busy with other processes. Software-timed PWM on a non-real-time OS jitters whenever the scheduler gets distracted, which motors forgive and audio never does.',
    watch: 'Two pins carry each hardware PWM channel (GPIO18/GPIO12 share channel 0, GPIO13/GPIO19 channel 1). Drive both pins of one channel and they mirror each other — a classic source of "haunted" second LEDs.'
  },
  {
    id: 'pi4-ultrasonic',
    title: 'Ultrasonic Distance Sensor',
    level: 'Intermediate',
    mins: 30,
    goal: 'Measure distance with an HC-SR04 ultrasonic module on GPIO23/GPIO24 using gpiozero’s DistanceSensor, and level-shift its 5 V echo safely down to 3.3 V.',
    parts: ['Raspberry Pi 4', 'Breadboard', 'HC-SR04 ultrasonic module', '1 kΩ and 2 kΩ resistors (voltage divider)', 'Jumper wires'],
    wiring: [
      { from: '5V (physical pin 2)', to: 'HC-SR04 VCC', color: 'red' },
      { from: 'GND (physical pin 6)', to: 'HC-SR04 GND', color: 'black' },
      { from: 'GPIO23 (physical pin 16)', to: 'HC-SR04 TRIG', color: 'yellow' },
      { from: 'HC-SR04 ECHO', to: '1 kΩ resistor', color: 'orange' },
      { from: '1 kΩ resistor', to: 'GPIO24 (physical pin 18)', color: 'orange' },
      { from: 'GPIO24 (physical pin 18)', to: '2 kΩ resistor to GND (divider lower leg)', color: 'purple' }
    ],
    codeLang: 'python',
    code: `from gpiozero import DistanceSensor
from time import sleep

sensor = DistanceSensor(echo=24, trigger=23)

while True:
    cm = sensor.distance * 100   # gpiozero reports metres
    print("Distance:", round(cm, 1), "cm")
    sleep(0.5)`,
    serial: `Distance: 84.2 cm
Distance: 83.7 cm
Distance: 41.0 cm
Distance: 18.3 cm
Distance: 12.1 cm
(Sample output — the numbers shrink as a hand approaches.)`,
    sim: { device: 'ultrasonic', mode: 'distance' },
    explain: 'The HC-SR04 shouts and listens: a 10 µs pulse on TRIG launches a burst of 40 kHz sound, and ECHO stays HIGH for exactly the time the burst takes to reach a surface and bounce back. Distance is then speed × time ÷ 2 (the ÷2 because the sound makes a round trip) — at 343 m/s, every 58 µs of echo means a centimetre. The catch is electrical: the module runs at 5 V and its ECHO output swings to 5 V, which would harm the Pi, so the 1 kΩ/2 kΩ divider taps off two-thirds of it — a safe 3.3 V.',
    watch: 'Always do that divider maths before connecting any 5 V sensor output to a Pi GPIO: Vout = Vin × R2 ÷ (R1 + R2). Soft, angled or very close (under ~2 cm) surfaces also give flaky readings — sound is a physical signal, not a laser.'
  },
  {
    id: 'pi4-motion-light',
    title: 'Capstone: Motion-Activated Light',
    level: 'Intermediate',
    mins: 35,
    goal: 'Combine a PIR motion sensor on GPIO4 with the LED on GPIO17 to build the classic hallway night-light — and a template for thousands of real automation products.',
    parts: ['Raspberry Pi 4', 'Breadboard', 'HC-SR501 PIR motion sensor', 'LED', '220 Ω resistor', 'Jumper wires'],
    wiring: [
      { from: '5V (physical pin 2)', to: 'PIR VCC', color: 'red' },
      { from: 'GND (physical pin 6)', to: 'PIR GND', color: 'black' },
      { from: 'PIR OUT', to: 'GPIO4 (physical pin 7)', color: 'yellow' },
      { from: 'GPIO17 (physical pin 11)', to: '220 Ω resistor, then LED long leg (+)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND (physical pin 9)', color: 'black' }
    ],
    codeLang: 'python',
    code: `from gpiozero import LED, MotionSensor
from signal import pause

led = LED(17)
pir = MotionSensor(4)   # PIR OUT pin -> GPIO4

pir.when_motion = led.on
pir.when_no_motion = led.off

print("Motion light armed — walk past the sensor.")
pause()`,
    serial: `Motion light armed — walk past the sensor.
(Then nothing more to read: the LED answers movement
faster than the terminal ever could.)`,
    sim: { device: 'pir', mode: 'sensor' },
    explain: 'A PIR sensor does not see people — it watches the room’s infrared glow through a segmented lens and fires when the heat pattern changes between segments, which is why it detects motion rather than presence. Its OUT pin is a clean 3.3 V digital signal (safe for the Pi directly), and gpiozero’s MotionSensor adds queueing and smoothing on top. Wiring sensor → event → actuator like this, with no polling loop, is the exact architecture of burglar alarms, camera triggers and automatic doors.',
    watch: 'Give a PIR a minute to settle after power-up: it calibrates to the room and will false-trigger while it warms up and whenever it faces radiators, sunny windows or air-conditioning vents. The two orange pots on the module set sensitivity and hold-time — tune them before blaming the code.'
  }
];
