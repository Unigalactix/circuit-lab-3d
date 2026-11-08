// Circuit Lab 3D — pin reference: ESP32 DevKit V1.
// Original reference text written for this project from the official
// Espressif ESP32 datasheet / DevKitC documentation pinout.
window.PIN_SETS = window.PIN_SETS || {};
window.PIN_SETS['esp32'] = {
  board: 'ESP32 DevKit V1',
  chip: 'ESP32 — dual-core Xtensa LX6 @ 240 MHz, Wi-Fi + Bluetooth',
  logic: '3.3 V logic — GPIO pins are NOT 5 V tolerant. Never feed 5 V into a GPIO.',
  note: 'ADC1 pins (GPIO32–39) keep working while Wi-Fi is on. ADC2 pins (GPIO0, 2, 4, 12–15, 25–27) cannot be read by the ADC while Wi-Fi is running, because the radio shares that hardware. GPIO34, 35, 36 and 39 are input-only and have no internal pull-up/pull-down resistors.',
  pins: [
    { name: 'EN', type: 'control', side: 'left', desc: 'Chip enable / reset. Pull it LOW to reset the ESP32. The RESET button on the board does exactly this.' },
    { name: 'GPIO36 / VP', type: 'adc', side: 'left', desc: 'Input-only. ADC1 channel 0 (Sensor_VP, an amplified sensor input). No internal pull-up, cannot be an output.' },
    { name: 'GPIO39 / VN', type: 'adc', side: 'left', desc: 'Input-only. ADC1 channel 3 (Sensor_VN). No internal pull-up, cannot be an output.' },
    { name: 'GPIO34', type: 'adc', side: 'left', desc: 'Input-only. ADC1 channel 6. A good choice for potentiometers and analog sensors — it can never accidentally drive a load.' },
    { name: 'GPIO35', type: 'adc', side: 'left', desc: 'Input-only. ADC1 channel 7. Input only, no internal pull resistors.' },
    { name: 'GPIO32', type: 'gpio', side: 'left', desc: 'General-purpose I/O. ADC1 channel 4, capacitive touch channel T9, PWM capable.' },
    { name: 'GPIO33', type: 'gpio', side: 'left', desc: 'General-purpose I/O. ADC1 channel 5, capacitive touch channel T8, PWM capable.' },
    { name: 'GPIO25', type: 'dac', side: 'left', desc: 'DAC1 — a true analog voltage output (0–3.3 V), plus ADC2 channel 8 and PWM. Rare among microcontrollers: most boards fake analog out with PWM.' },
    { name: 'GPIO26', type: 'dac', side: 'left', desc: 'DAC2 — second true analog voltage output, plus ADC2 channel 9 and PWM.' },
    { name: 'GPIO27', type: 'gpio', side: 'left', desc: 'General-purpose I/O. ADC2 channel 7, capacitive touch channel T7, PWM capable.' },
    { name: 'GPIO14', type: 'gpio', side: 'left', desc: 'General-purpose I/O. ADC2 channel 6, touch channel T6, PWM capable. May emit a short pulse during boot on some boards.' },
    { name: 'GPIO12', type: 'gpio', side: 'left', desc: 'General-purpose I/O. ADC2 channel 5, touch T5. Strapping pin: it must be LOW at reset, or the flash chip gets the wrong supply voltage and the board will not boot.' },
    { name: 'GPIO13', type: 'gpio', side: 'left', desc: 'General-purpose I/O. ADC2 channel 4, touch channel T4, PWM capable.' },
    { name: 'GND', type: 'ground', side: 'left', desc: 'Ground. Several GND pins are provided; every voltage on the board is measured relative to ground.' },
    { name: 'VIN', type: 'power', side: 'left', desc: '5 V power input. Feed the board from USB or a regulated 5 V supply here; the onboard regulator makes 3.3 V from it.' },
    { name: '3V3', type: 'power', side: 'right', desc: 'Regulated 3.3 V output from the onboard regulator. Use it to power small sensors — budget a few hundred milliamps at most.' },
    { name: 'GPIO23', type: 'spi', side: 'right', desc: 'General-purpose I/O. Default VSPI MOSI for SPI devices, PWM capable.' },
    { name: 'GPIO22', type: 'i2c', side: 'right', desc: 'General-purpose I/O. Default I2C clock (SCL).' },
    { name: 'GPIO21', type: 'i2c', side: 'right', desc: 'General-purpose I/O. Default I2C data (SDA).' },
    { name: 'GPIO19', type: 'spi', side: 'right', desc: 'General-purpose I/O. Default VSPI MISO for SPI devices.' },
    { name: 'GPIO18', type: 'spi', side: 'right', desc: 'General-purpose I/O. Default VSPI clock (SCLK).' },
    { name: 'GPIO5', type: 'spi', side: 'right', desc: 'General-purpose I/O. Default VSPI chip-select (CS). Strapping pin — its level at reset sets SDIO timing, so avoid strong pull-ups on it.' },
    { name: 'GPIO17', type: 'uart', side: 'right', desc: 'General-purpose I/O. Default UART2 TX. PWM capable.' },
    { name: 'GPIO16', type: 'uart', side: 'right', desc: 'General-purpose I/O. Default UART2 RX. PWM capable — handy as a spare LEDC PWM output.' },
    { name: 'GPIO4', type: 'touch', side: 'right', desc: 'Capacitive touch channel T0 — connect a wire or foil pad and sense fingers with no moving parts. Also ADC2 channel 0 and PWM.' },
    { name: 'GPIO2', type: 'gpio', side: 'right', desc: 'Drives the blue onboard LED on most DevKit boards — perfect for a first blink. Also ADC2 channel 2 and touch T2. Strapping pin: leave it unloaded at boot on some board variants.' },
    { name: 'GPIO15', type: 'gpio', side: 'right', desc: 'General-purpose I/O. ADC2 channel 3, touch T3. Strapping pin that selects whether boot messages print to the serial port.' },
    { name: 'GND', type: 'ground', side: 'right', desc: 'Ground. All GND pins are the same node — use whichever is closest to your circuit.' }
  ]
};
