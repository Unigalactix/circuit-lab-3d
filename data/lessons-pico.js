// Circuit Lab 3D — lessons: Raspberry Pi Pico (MicroPython).
// All lesson text and code written fresh for this project, following the
// standard RP2040 beginner curriculum. Serial outputs are illustrative
// samples of what the REPL/serial console shows.
window.LESSON_SETS = window.LESSON_SETS || {};
window.LESSON_SETS['pico'] = [
  {
    id: 'pico-blink',
    title: 'Blink the Onboard LED',
    level: 'Beginner',
    mins: 10,
    goal: 'Blink the Pico’s onboard LED (GP25) from MicroPython — your first proof that code you write is really running on the RP2040.',
    parts: ['Raspberry Pi Pico', 'Micro-USB cable (data-capable)'],
    wiring: [],
    codeLang: 'micropython',
    code: `from machine import Pin
import time

led = Pin(25, Pin.OUT)   # onboard LED on the original Pico

while True:
    led.toggle()         # on if it was off, off if it was on
    time.sleep(0.5)      # 500 ms between flips`,
    serial: `(The console stays silent — this program prints nothing.
The green LED on the board blinks twice a second instead.)`,
    sim: { device: 'led', mode: 'blink' },
    explain: 'machine.Pin wraps one RP2040 GPIO pad; Pin.OUT configures it as a push-pull digital output that sources 3.3 V or sinks to ground. Unlike a desktop script, a microcontroller program usually ends in an infinite loop — there is no operating system to return to, so "run forever" is the correct shape. time.sleep() blocks the core doing nothing, which later lessons replace with timers and interrupts.',
    watch: 'On a Pico W, Pin(25) does nothing — its LED hangs off the Wi-Fi chip, so use Pin("LED", Pin.OUT) there. Same board family, different wiring: always check which Pico you hold.'
  },
  {
    id: 'pico-button-led',
    title: 'External LED + Button',
    level: 'Beginner',
    mins: 20,
    goal: 'Wire a real LED on GP15 and a pushbutton on GP14, and make the button control the LED — your first complete input-to-output circuit.',
    parts: ['Raspberry Pi Pico', 'Breadboard', 'LED', '220 Ω resistor', 'Pushbutton', 'Jumper wires'],
    wiring: [
      { from: 'GP15', to: '220 Ω resistor', color: 'orange' },
      { from: '220 Ω resistor', to: 'LED long leg (anode, +)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND', color: 'black' },
      { from: 'GP14', to: 'Pushbutton leg A', color: 'yellow' },
      { from: 'Pushbutton leg B', to: '3V3 (OUT)', color: 'red' }
    ],
    codeLang: 'micropython',
    code: `from machine import Pin
import time

led = Pin(15, Pin.OUT)
button = Pin(14, Pin.IN, Pin.PULL_DOWN)

while True:
    if button.value() == 1:   # pressed: GP14 pulled up to 3.3 V
        led.on()
    else:
        led.off()
    time.sleep(0.01)          # small pause keeps the loop polite`,
    serial: `(Nothing printed — add print(button.value()) inside the loop
if you want to watch the input change in the console.)`,
    sim: { device: 'button-led', mode: 'on' },
    explain: 'A floating input pin is an antenna — it picks up stray fields and reads random values. Pin.PULL_DOWN enables a weak internal resistor (tens of kΩ) that holds GP14 at 0 V until the button connects it firmly to 3.3 V, giving clean 0/1 readings. The LED side is the classic series circuit: the resistor limits current to roughly (3.3 − 2) / 220 ≈ 6 mA, bright enough to see and safe for both the LED and the pin.',
    watch: 'Buttons bounce: the contacts rattle for a few milliseconds, so one press can look like several. This LED does not care, but a press-counter will — the fix is debouncing, in software (ignore changes for ~20 ms) or hardware (a small capacitor).'
  },
  {
    id: 'pico-potentiometer',
    title: 'Read a Potentiometer',
    level: 'Beginner',
    mins: 20,
    goal: 'Measure a continuously varying voltage with the ADC on GP26 and convert raw counts into volts in the console.',
    parts: ['Raspberry Pi Pico', 'Breadboard', '10 kΩ potentiometer', 'Jumper wires'],
    wiring: [
      { from: '3V3 (OUT)', to: 'Potentiometer outer leg 1', color: 'red' },
      { from: 'Potentiometer wiper (middle leg)', to: 'GP26 / ADC0', color: 'yellow' },
      { from: 'Potentiometer outer leg 2', to: 'GND', color: 'black' }
    ],
    codeLang: 'micropython',
    code: `from machine import ADC, Pin
import time

pot = ADC(Pin(26))   # GP26 is ADC channel 0

while True:
    raw = pot.read_u16()              # 0..65535
    volts = raw * 3.3 / 65535         # scale counts back to volts
    print(raw, "->", round(volts, 2), "V")
    time.sleep(0.2)`,
    serial: `128 -> 0.01 V
16420 -> 0.83 V
32768 -> 1.65 V
49160 -> 2.48 V
65472 -> 3.3 V
(Sample readings — the numbers follow your knob.)`,
    sim: { device: 'potentiometer', mode: 'sensor' },
    explain: 'The potentiometer is a voltage divider whose ratio your fingers set: the wiper voltage equals 3.3 V × (resistance below the wiper ÷ total resistance). The RP2040 ADC is 12-bit hardware, but read_u16() scales it to a 16-bit range for cross-platform consistency, which is why full scale reads 65535 rather than 4095. Dividing by 65535 and multiplying by the 3.3 V reference simply undoes that scaling.',
    watch: 'Never let an ADC input exceed 3.3 V — the conversion saturates at the rail and higher voltages can damage the pin. If a sensor runs from 5 V, divide its output down with two resistors first.'
  },
  {
    id: 'pico-pwm-fade',
    title: 'PWM Fade an LED',
    level: 'Beginner',
    mins: 15,
    goal: 'Reuse the LED circuit from the button lesson and fade it smoothly with hardware PWM on GP15.',
    parts: ['Raspberry Pi Pico', 'Breadboard', 'LED', '220 Ω resistor', 'Jumper wires'],
    wiring: [
      { from: 'GP15', to: '220 Ω resistor', color: 'orange' },
      { from: '220 Ω resistor', to: 'LED long leg (anode, +)', color: 'orange' },
      { from: 'LED short leg (cathode, −)', to: 'GND', color: 'black' }
    ],
    codeLang: 'micropython',
    code: `from machine import Pin, PWM
import time

led = PWM(Pin(15))
led.freq(1000)          # switch at 1 kHz — no visible flicker

while True:
    for duty in range(0, 65536, 512):       # ramp up
        led.duty_u16(duty)
        time.sleep_ms(10)
    for duty in range(65535, -1, -512):     # ramp down
        led.duty_u16(duty)
        time.sleep_ms(10)`,
    serial: `(Silent again — the show is the LED breathing:
about 1.3 s up, 1.3 s down, forever.)`,
    sim: { device: 'led', mode: 'fade' },
    explain: 'Every RP2040 GPIO can be driven by one of the chip’s eight PWM slices, each producing two outputs. duty_u16() sets the fraction of each 1 ms period the pin spends HIGH, from 0 (always off) to 65535 (always on); the LED and your eye average those pulses into steady brightness. Because the waveform is generated by hardware counters, the fade stays smooth even while the CPU is busy elsewhere.',
    watch: 'Keep PWM frequency in the right universe for the load: ~1 kHz suits LEDs, but motors whine audibly below ~20 kHz and standard hobby servos demand exactly 50 Hz — frequency is part of the signal’s meaning, not a detail.'
  },
  {
    id: 'pico-servo',
    title: 'Servo Sweep',
    level: 'Intermediate',
    mins: 25,
    goal: 'Drive a hobby servo from GP16 with a 50 Hz PWM signal and sweep it smoothly from 0° to 180° and back.',
    parts: ['Raspberry Pi Pico', 'Breadboard', 'SG90-style hobby servo', 'Jumper wires'],
    wiring: [
      { from: 'VBUS (5 V)', to: 'Servo red wire (power)', color: 'red' },
      { from: 'GND', to: 'Servo brown/black wire (ground)', color: 'black' },
      { from: 'GP16', to: 'Servo orange/yellow wire (signal)', color: 'yellow' }
    ],
    codeLang: 'micropython',
    code: `from machine import Pin, PWM
import time

servo = PWM(Pin(16))
servo.freq(50)          # servos expect a 50 Hz frame (20 ms period)

def set_angle(deg):
    # 0.5 ms pulse -> 0 deg, 2.5 ms pulse -> 180 deg
    pulse_ms = 0.5 + (deg / 180) * 2.0
    duty = int(65535 * pulse_ms / 20)
    servo.duty_u16(duty)

while True:
    for angle in range(0, 181, 5):
        set_angle(angle)
        time.sleep_ms(20)
    for angle in range(180, -1, -5):
        set_angle(angle)
        time.sleep_ms(20)`,
    serial: `(Nothing printed. The servo arm sweeps like a windscreen
wiper — add print(angle) in the loops to see the commands.)`,
    sim: { device: 'servo', mode: 'servo-sweep' },
    explain: 'A hobby servo is a feedback system in a box: a DC motor, gears, a potentiometer on the output shaft and a control chip that drives the shaft until the measured angle matches the commanded one. The command is encoded as pulse width — roughly 0.5 ms of HIGH in every 20 ms frame means 0°, 2.5 ms means 180°, and the servo holds position between frames. Note the power wiring: servos are fed from VBUS 5 V, not a GPIO, because they can draw an amp or more when stalled.',
    watch: 'A stalled or large servo can brown-out the Pico and reset it mid-sweep. For anything bigger than an SG90, power the servo from its own 5–6 V supply and just share the ground with the Pico.'
  },
  {
    id: 'pico-temperature',
    title: 'Internal Temperature Sensor',
    level: 'Intermediate',
    mins: 15,
    goal: 'Read the RP2040’s built-in temperature sensor on ADC channel 4 and convert the voltage into degrees Celsius.',
    parts: ['Raspberry Pi Pico', 'Micro-USB cable'],
    wiring: [],
    codeLang: 'micropython',
    code: `from machine import ADC
import time

sensor = ADC(4)   # channel 4 is the internal temperature sensor

while True:
    raw = sensor.read_u16()
    volts = raw * 3.3 / 65535
    # Datasheet relation: V = 0.706 V at 27 C, slope -1.721 mV per degree
    temp = 27 - (volts - 0.706) / 0.001721
    print("Chip temperature:", round(temp, 1), "deg C")
    time.sleep(1)`,
    serial: `Chip temperature: 28.4 deg C
Chip temperature: 28.5 deg C
Chip temperature: 28.6 deg C
Chip temperature: 29.1 deg C
(Sample output — it creeps up as the chip warms itself.)`,
    sim: { device: 'potentiometer', mode: 'sensor' },
    explain: 'ADC channel 4 is wired inside the chip to a diode junction whose voltage falls predictably as temperature rises — about 1.721 mV per °C, passing through 0.706 V at 27 °C (both figures from the RP2040 datasheet). The code is just that straight line rearranged: measure V, subtract the 27 °C reference, divide by the slope. It is the same two-point linear calibration used for countless real sensors.',
    watch: 'This measures the chip’s own die temperature, which runs a few degrees above room temperature — it is a fine demo and a decent overheat alarm, but a poor weather station. Pinch the board and watch your fingers register.'
  }
];
