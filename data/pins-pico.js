// Circuit Lab 3D — pin reference: Raspberry Pi Pico (RP2040).
// Original reference text written for this project from the official
// Raspberry Pi Pico datasheet and RP2040 pinout documentation.
// Note: pin functions shown are the commonly used defaults from the official
// pinout chart — every GP pin can also do PWM, and most can be re-muxed.
window.PIN_SETS = window.PIN_SETS || {};
window.PIN_SETS['pico'] = {
  board: 'Raspberry Pi Pico',
  chip: 'RP2040 — dual-core Arm Cortex-M0+ @ 133 MHz',
  logic: '3.3 V logic — GPIO pins are NOT 5 V tolerant.',
  note: 'The Pico exposes GP0–GP22 plus the three ADC-capable pins GP26–GP28 on its 40-pin header. The ADC is 12-bit (MicroPython read_u16() scales it to 0–65535). A fourth, internal ADC channel (ADC4) measures the chip temperature sensor and is not on the header.',
  pins: [
    { name: 'GP0', type: 'uart', desc: 'General-purpose I/O. Default UART0 TX; can also be I2C0 SDA or SPI0 RX.' },
    { name: 'GP1', type: 'uart', desc: 'General-purpose I/O. Default UART0 RX; can also be I2C0 SCL or SPI0 CSn.' },
    { name: 'GP2', type: 'spi', desc: 'General-purpose I/O. Commonly SPI0 SCK or I2C1 SDA.' },
    { name: 'GP3', type: 'spi', desc: 'General-purpose I/O. Commonly SPI0 TX or I2C1 SCL.' },
    { name: 'GP4', type: 'uart', desc: 'General-purpose I/O. Default UART1 TX; can also be I2C0 SDA.' },
    { name: 'GP5', type: 'uart', desc: 'General-purpose I/O. Default UART1 RX; can also be I2C0 SCL.' },
    { name: 'GP6', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C1 SDA.' },
    { name: 'GP7', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C1 SCL or SPI0 TX.' },
    { name: 'GP8', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SDA or SPI1 RX.' },
    { name: 'GP9', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SCL or SPI1 CSn.' },
    { name: 'GP10', type: 'spi', desc: 'General-purpose I/O. Commonly SPI1 SCK.' },
    { name: 'GP11', type: 'spi', desc: 'General-purpose I/O. Commonly SPI1 TX.' },
    { name: 'GP12', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SDA or SPI1 RX.' },
    { name: 'GP13', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SCL or SPI1 CSn.' },
    { name: 'GP14', type: 'spi', desc: 'General-purpose I/O. Commonly SPI1 SCK. A convenient input pin for buttons in the lessons.' },
    { name: 'GP15', type: 'gpio', desc: 'General-purpose I/O. Commonly SPI1 TX. Used for the external LED in several lessons — every GP pin can output PWM.' },
    { name: 'GP16', type: 'spi', desc: 'General-purpose I/O. Commonly SPI0 RX or I2C0 SDA. Used as the 50 Hz servo signal pin in the lessons.' },
    { name: 'GP17', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SCL or SPI0 CSn.' },
    { name: 'GP18', type: 'spi', desc: 'General-purpose I/O. Commonly SPI0 SCK.' },
    { name: 'GP19', type: 'spi', desc: 'General-purpose I/O. Commonly SPI0 TX.' },
    { name: 'GP20', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SDA.' },
    { name: 'GP21', type: 'i2c', desc: 'General-purpose I/O. Commonly I2C0 SCL.' },
    { name: 'GP22', type: 'gpio', desc: 'General-purpose I/O near the RUN pin end of the header. PWM capable like all GP pins.' },
    { name: 'GP25', type: 'led', desc: 'Onboard LED on the original Pico — wired internally, not broken out to the header. (On the Pico W the LED hangs off the wireless chip instead.)' },
    { name: 'GP26 / ADC0', type: 'adc', desc: 'ADC channel 0. One of only three pins that can measure analog voltages (0–3.3 V). The potentiometer lesson lives here.' },
    { name: 'GP27 / ADC1', type: 'adc', desc: 'ADC channel 1. Analog input, or a plain digital pin when you do not need the ADC.' },
    { name: 'GP28 / ADC2', type: 'adc', desc: 'ADC channel 2. Analog input next to the ADC ground (AGND) pin, which keeps readings quieter.' },
    { name: 'RUN', type: 'control', desc: 'Chip reset. Pull it LOW (connect to GND) to reset the RP2040 — wire a pushbutton here for a hardware reset.' },
    { name: 'VSYS', type: 'power', desc: 'Main power input, roughly 1.8–5.5 V. Feed the Pico from batteries or an external supply here; an onboard diode ORs it with USB power.' },
    { name: 'VBUS', type: 'power', desc: '5 V from the USB connector. Useful for powering a small servo or other 5 V part while the Pico itself runs at 3.3 V.' },
    { name: '3V3', type: 'power', desc: 'Regulated 3.3 V output (3V3 OUT) from the onboard regulator — power for sensors and pull-ups, up to about 300 mA.' },
    { name: 'GND', type: 'ground', desc: 'Ground — eight GND pins are spread along both header rows so there is always one near your signal pin.' }
  ]
};
