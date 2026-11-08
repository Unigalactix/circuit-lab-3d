// Circuit Lab 3D — pin reference: Raspberry Pi 4 (40-pin GPIO header).
// Original reference text written for this project from the official
// Raspberry Pi GPIO documentation. Numbers are BCM (the numbers Python
// libraries use) with the physical header position alongside.
window.PIN_SETS = window.PIN_SETS || {};
window.PIN_SETS['pi4'] = {
  board: 'Raspberry Pi 4 Model B',
  chip: 'BCM2711 — quad-core Arm Cortex-A72, running Linux',
  logic: '3.3 V logic — the GPIO pins are NOT 5 V tolerant.',
  note: 'WARNING: connecting 5 V to any GPIO pin can destroy the Pi instantly, and shorting the 5 V rail to a GPIO or to 3V3 can kill it too. The 5 V pins (2 and 4) are for powering the Pi or hungry peripherals — never for signals. Python libraries such as gpiozero use BCM numbers (the GPIO number), not physical pin positions.',
  pins: [
    { name: '3V3', phys: '1 & 17', bcm: null, type: 'power', desc: 'Regulated 3.3 V power rail. Use it for sensors and pull-ups; total budget is limited, so do not power motors from it.' },
    { name: '5V', phys: '2 & 4', bcm: null, type: 'power', desc: '5 V straight from the USB-C supply (minus a protection diode). Powers the Pi when fed here, or powers hungry 5 V peripherals. Keep it away from GPIO pins.' },
    { name: 'GPIO2 / SDA', phys: 3, bcm: 2, type: 'i2c', desc: 'I2C data line (bus 1). Has a fixed 1.8 kΩ pull-up to 3.3 V on the board, so it idles HIGH.' },
    { name: 'GPIO3 / SCL', phys: 5, bcm: 3, type: 'i2c', desc: 'I2C clock line (bus 1), also with a fixed 1.8 kΩ pull-up. Waking the Pi from halt: a button to ground on this pin can power it back on.' },
    { name: 'GPIO4', phys: 7, bcm: 4, type: 'gpio', desc: 'General-purpose I/O. Also the default pin for 1-Wire temperature sensors. Used for the PIR motion sensor in the capstone lesson.' },
    { name: 'GPIO14 / TXD', phys: 8, bcm: 14, type: 'uart', desc: 'UART transmit — the Pi sends serial data out here (to a receiver’s RX).' },
    { name: 'GPIO15 / RXD', phys: 10, bcm: 15, type: 'uart', desc: 'UART receive — pair with GPIO14 for a serial console or a GPS/serial module (remember TX→RX crossover).' },
    { name: 'GPIO17', phys: 11, bcm: 17, type: 'gpio', desc: 'General-purpose I/O. The LED pin in most of the Pi lessons — gpiozero examples love this pin.' },
    { name: 'GPIO18 / PWM0', phys: 12, bcm: 18, type: 'pwm', desc: 'Hardware PWM channel 0 — jitter-free pulse-width modulation for LED dimming and servos. Also the PCM clock pin.' },
    { name: 'GPIO27', phys: 13, bcm: 27, type: 'gpio', desc: 'General-purpose I/O next to a ground pin — handy for the button in the lessons.' },
    { name: 'GPIO22', phys: 15, bcm: 22, type: 'gpio', desc: 'General-purpose I/O.' },
    { name: 'GPIO23', phys: 16, bcm: 23, type: 'gpio', desc: 'General-purpose I/O. Used as the ultrasonic trigger pin in the distance lesson.' },
    { name: 'GPIO24', phys: 18, bcm: 24, type: 'gpio', desc: 'General-purpose I/O. Used as the ultrasonic echo input in the distance lesson — level-shift the 5 V echo down to 3.3 V first!' },
    { name: 'GPIO10 / MOSI', phys: 19, bcm: 10, type: 'spi', desc: 'SPI bus 0 data out (master → peripheral).' },
    { name: 'GPIO9 / MISO', phys: 21, bcm: 9, type: 'spi', desc: 'SPI bus 0 data in (peripheral → master).' },
    { name: 'GPIO25', phys: 22, bcm: 25, type: 'gpio', desc: 'General-purpose I/O.' },
    { name: 'GPIO11 / SCLK', phys: 23, bcm: 11, type: 'spi', desc: 'SPI bus 0 clock.' },
    { name: 'GPIO8 / CE0', phys: 24, bcm: 8, type: 'spi', desc: 'SPI bus 0 chip-enable 0 — selects the first SPI peripheral.' },
    { name: 'GPIO7 / CE1', phys: 26, bcm: 7, type: 'spi', desc: 'SPI bus 0 chip-enable 1 — selects the second SPI peripheral.' },
    { name: 'GPIO5', phys: 29, bcm: 5, type: 'gpio', desc: 'General-purpose I/O.' },
    { name: 'GPIO6', phys: 31, bcm: 6, type: 'gpio', desc: 'General-purpose I/O.' },
    { name: 'GPIO12 / PWM0', phys: 32, bcm: 12, type: 'pwm', desc: 'Second pin that can carry hardware PWM channel 0 (same channel as GPIO18 — pick one).' },
    { name: 'GPIO13 / PWM1', phys: 33, bcm: 13, type: 'pwm', desc: 'Hardware PWM channel 1.' },
    { name: 'GPIO19 / PWM1', phys: 35, bcm: 19, type: 'pwm', desc: 'Alternate pin for hardware PWM channel 1; also SPI1 MISO.' },
    { name: 'GPIO16', phys: 36, bcm: 16, type: 'gpio', desc: 'General-purpose I/O; also SPI1 chip-enable 2.' },
    { name: 'GPIO26', phys: 37, bcm: 26, type: 'gpio', desc: 'General-purpose I/O.' },
    { name: 'GPIO20', phys: 38, bcm: 20, type: 'gpio', desc: 'General-purpose I/O; also SPI1 MOSI and the PCM data-in pin.' },
    { name: 'GPIO21', phys: 40, bcm: 21, type: 'gpio', desc: 'General-purpose I/O at the very end of the header; also SPI1 SCLK and PCM data-out.' },
    { name: 'GND', phys: '6, 9, 14, 20, 25, 30, 34, 39', bcm: null, type: 'ground', desc: 'Ground — eight ground pins are spread along the header. Always connect a ground between the Pi and any external circuit so signals share a reference.' }
  ]
};
