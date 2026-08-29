# pdwidgets

**Pure-Python, portable widget toolkit for [PyDevices](https://github.com/PyDevices/pydevices)**

`pdwidgets` provides a complete, 100% pure-Python GUI toolkit for building touchscreen and desktop interfaces without requiring native C bindings or complex build toolchains. It runs seamlessly on **MicroPython**, **CircuitPython**, **CPython desktop**, and **PyScript (Web)**.

### Where pdwidgets fits

PyDevices offers several GUI approaches; `pdwidgets` is the pure-Python one. See
[pydevices — choosing a GUI layer](https://github.com/PyDevices/pydevices/blob/main/docs/architecture.md#choosing-a-gui-layer).

---

## Quick Start: Interactive Button & Screen

> **Note:** `import board_config` isn't satisfied by the install commands
> below. On desktop, `board_config` ships with `pydevices-desktop`
> (`pip install -i https://test.pypi.org/simple/ pydevices-desktop`). On a
> board, it comes from a `PyDevices/pydevices` board config, installed with
> `mip.install("github:PyDevices/pydevices/board_configs/<path-to-board>",
> index="https://PyDevices.github.io/mip")`.

```python
import board_config
import appdev
import pdwidgets as pd

# 1. Initialize display and the event app
app = appdev.App(board_config)
display = pd.Display(board_config.display_drv, app)
screen = pd.Screen(display, bg=0x0000)

# 2. Add a label and an interactive button with a click handler
label = pd.Label(screen, value="Taps: 0", x=40, y=30)
btn = pd.Button(screen, label="Tap me", x=40, y=60, w=160, h=50)

_taps = 0

def on_button_click(sender, event):
    global _taps
    _taps += 1
    label.value = f"Taps: {_taps}"

btn.add_event_cb(pd.events.MOUSEBUTTONUP, on_button_click)

# 3. That's it -- the app keeps itself alive and handles input from here.
# No app.run() is needed; call it only to block at this point or to get an
# exit code.
```

---

## Key Features

- **100% Pure Python & Portable**: Zero native C extensions or compilation steps required.
- **Zero-File Icon System (`pdwidgets.icons`)**: Material Design icons packaged directly as importable Python bytecode modules (`bytearray` bitmaps)—no SD card assets, binary file I/O, or asset path management needed.
- **MCU Memory-Friendly (Lean Imports)**: Import individual widgets to minimize RAM footprint on microcontrollers:
  ```python
  from pdwidgets.widgets.button import Button
  from pdwidgets.screen import Screen
  ```
- **Integrated Theming**: Customizable color schemes, border radii, and visual states using [`palettes`](https://github.com/PyDevices/palettes).

---

## Installation

```python
import mip
# pdwidgets does not pull its dependencies on MIP -- install them too.
mip.install("pydevices", index="https://PyDevices.github.io/mip")
mip.install("pygraphics", index="https://PyDevices.github.io/mip")
mip.install("palettes", index="https://PyDevices.github.io/mip")
mip.install("pdwidgets", index="https://PyDevices.github.io/mip")
```

```bash
pip install -i https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ pydevices-pdwidgets
```

Full dependency chain and `board_config` requirements:
[docs/index.md](docs/index.md).

## Support and platforms

`pdwidgets` runs on **MicroPython**, **CircuitPython**, **CPython desktop**,
and **PyScript** (browser). The CPython desktop and PyScript paths depend on
`pydevices-pygraphics` wheels, which currently cover manylinux x86_64,
Windows amd64, Android, and Emscripten (Pyodide/PyScript) — there are no
macOS or ARM-Linux wheels yet. Publication to TestPyPI only (rather than
PyPI) is deliberate.

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
