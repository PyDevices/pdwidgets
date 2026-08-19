# pdwidgets

**Pure-Python, portable widget toolkit for [PyDevices](https://github.com/PyDevices/pydevices)**

`pdwidgets` provides a complete, 100% pure-Python GUI toolkit for building touchscreen and desktop interfaces without requiring native C bindings or complex build toolchains. It runs seamlessly on **MicroPython**, **CircuitPython**, **CPython desktop**, and **PyScript (Web)**.

### Where pdwidgets fits

PyDevices offers several GUI approaches; `pdwidgets` is the pure-Python one. See
[pydevices — choosing a GUI layer](https://github.com/PyDevices/pydevices/blob/main/docs/architecture.md#choosing-a-gui-layer).

---

## Quick Start: Interactive Button & Screen

```python
import board_config
import appdev
import pdwidgets as pd
from pdwidgets.icons import touch_app  # Pure-Python icon bytecode

# 1. Initialize display and event runtime
runtime = appdev.App(board_config)
display = pd.Display(board_config.display_drv, runtime)
screen = pd.Screen(display)

_taps = 0

# 2. Add an interactive button with a click handler
btn = pd.Button(
    screen,
    x=40,
    y=60,
    w=160,
    h=50,
    label="Tap me (0)",
    icon=touch_app,
)

def on_button_click(event):
    global _taps
    _taps += 1
    btn.set_label(f"Tap me ({_taps})")
    display.refresh()

btn.on_click(on_button_click)

# 3. Draw initial screen and start event loop
display.show(screen)
runtime.run_forever()
```

---

## Key Features

- **100% Pure Python & Portable**: Zero native C extensions or compilation steps required.
- **Zero-File Icon System (`pdwidgets.icons`)**: Material Design icons packaged directly as importable Python bytecode modules (`bytearray` bitmaps)—no SD card assets, binary file I/O, or asset path management needed.
- **MCU Memory-Friendly (Lean Imports)**: Import individual widgets to minimize RAM footprint on microcontrollers:
  ```python
  from pdwidgets.widgets.button import Button
  from pdwidgets.widgets.screen import Screen
  ```
- **Integrated Theming**: Customizable color schemes, border radii, and visual states using [`palettes`](https://github.com/PyDevices/palettes).

---

## Installation

```python
import mip
mip.install("pdwidgets", index="https://PyDevices.github.io/mip")
```

```bash
pip install -i https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ pydevices-pdwidgets
```

Full dependency chain and `board_config` requirements:
[docs/getting-started.md](docs/getting-started.md).

## Links & Demos

- [Documentation](https://pdwidgets.readthedocs.io)
- [Source Code](https://github.com/PyDevices/pdwidgets)
- [PyScript Live Demos](https://pydevices.github.io/pydevices-examples/pyscript/)
- Related: [pydevices](https://github.com/PyDevices/pydevices), [palettes](https://github.com/PyDevices/palettes), [pydevices-examples](https://github.com/PyDevices/pydevices-examples)

## License

MIT — see [LICENSE](LICENSE).


---

## Icon assets (maintainers)

Runtime icons are **importable Python modules** under [`lib/pdwidgets/icons/`](lib/pdwidgets/icons/)
(no binary mip). Authoring:

```bash
# 1) Optional: regenerate mono .pbm / color .bmp from Material Design
.venv/bin/python scripts/assets_generate_pdwidgets_icons.py
.venv/bin/python scripts/assets_make_color_icons.py
# 2) Convert binaries → .py modules (BITMAP = bytearray; uses sibling or TestPyPI pygraphics)
.venv/bin/python scripts/assets_icons_to_py.py --delete-binaries
# Optional bulk dump into assets/icons/
.venv/bin/python scripts/assets_convert_md_png_to_pbm.py
# PNG smoke probe (PyDevices display stack + material-design-icons png/)
SDL_VIDEODRIVER=dummy ../pydevices-examples/.venv/bin/python tools/png_test.py
```
