# CircuitLab 3D

A free, interactive electronics lab for ECE students. Explore real boards in 3D, learn what every pin does, follow pin-by-pin wiring lessons, and run circuit simulations right in the browser — no hardware, no installs, no sign-up.

**Boards covered**

| Lab | Board | Chip |
|---|---|---|
| `uno/` | Arduino Uno R3 | ATmega328P |
| `nano/` | Arduino Nano | ATmega328P |
| `mega/` | Arduino Mega 2560 | ATmega2560 |
| `esp32/` | ESP32 DevKit | ESP32 (Wi-Fi + Bluetooth) |
| `pico/` | Raspberry Pi Pico | RP2040 |
| `pi4/` | Raspberry Pi 4 | BCM2711 (Linux + 40-pin GPIO) |
| `breadboard/` | Breadboard Lab | 830 tie-point solderless breadboard |

38 guided lessons across the seven labs, each with wiring steps, example code, and a runnable simulation with a serial monitor.

## Project structure

```
circuit-lab-3d/
├── index.html              Hub: board cards, stats, how-it-works
├── css/
│   └── lab.css             Shared stylesheet for every lab page
│                           (three-section layout + premium design system,
│                            per-page accent via the --acc CSS variable)
├── js/
│   ├── boards3d.js         Procedural Three.js board builders (module)
│   └── engine.js           Wiring + simulation engine, initLab() (module)
├── data/
│   ├── pins-<board>.js     Pin data per board → window.PINS_<BOARD>
│   └── lessons-<board>.js  Lesson data per board → window.LESSONS_<BOARD>
├── template/
│   └── lab-template.html   The exact DOM every lab page is built from
├── uno/  nano/  mega/  esp32/  pico/  pi4/  breadboard/
│   ├── index.html          A lab page built from the template
│   └── js/main.js          Page boot code; ends in initLab({ ... })
└── README.md
```

Every lab page uses the same three-section layout: board info and lesson
content on the left, the 3D stage in the centre, and the lesson/pin
switcher plus simulation controls on the right. On mobile the layout
stacks into a single scrolling column.

## Run it locally

It's a plain static site — no build step. From the project root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> for the hub, or
<http://localhost:8000/uno/> to jump straight into a lab.

> Serve it over HTTP (as above) rather than opening the files directly:
> the pages load ES modules and an import map for Three.js, which
> browsers block on `file://` URLs.

Three.js is loaded from the jsDelivr CDN via an import map pinned to
`three@0.160.0`, so an internet connection is needed for the 3D stage.

## Adding or editing a lab page

1. Copy `template/lab-template.html` into the board folder as `index.html`.
2. Replace the `BOARDID` tokens, set the `--acc` accent colour, and fill
   in the header card (board name, subtitle, spec list).
3. Add `data/pins-<board>.js` and `data/lessons-<board>.js` following the
   existing files' shape.
4. Write the folder's `js/main.js` so it ends with
   `initLab({ board, pins, lessons })`.

Do not rename any element id in the template — `js/engine.js` and every
page's `main.js` are written against that DOM contract (see the comments
at the top of the template).

## Content & attribution

All lesson text, explanations, 3D models and code in this repository are
**original educational content written for this project**. Board pin
assignments, electrical limits and specifications are factual data
summarized from the official documentation published by
[Arduino](https://docs.arduino.cc/), [Espressif](https://docs.espressif.com/)
and the [Raspberry Pi Foundation](https://www.raspberrypi.com/documentation/).

CircuitLab 3D is an independent learning project. It is **not affiliated
with, endorsed by, or sponsored by** Arduino, Espressif, or Raspberry Pi.
Arduino, Raspberry Pi, ESP32 and related names and logos are trademarks
of their respective owners, used here only to identify the hardware the
lessons teach.
