# pdwidgets

Python-only widget toolkit for [PyDevices](https://github.com/PyDevices/pydevices) — buttons, lists, themes, navigation, and more on MicroPython, CircuitPython, and CPython. This package has no native C extension; it is published as a pure-Python package on TestPyPI for CPython and through micropython-lib / MIP for MicroPython. Applications and live demos live in [pydevices-examples](https://github.com/PyDevices/pydevices-examples).

## Install

### CPython (TestPyPI)

```bash
pip install \
  -i https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  pydevices-pdwidgets pydevices-displaydev pydevices-pygraphics \
  pydevices-eventsys pydevices-multimer pydevices-palettes
```

Requires a PyDevices-compatible `board_config` and display stack. You can use
your own `board_config.py`, or optionally install a prebuilt one from
pydevices:
[install-workflows](https://pydevices.github.io/pydevices/install-workflows.html).

### MicroPython (MIP)

```python
import mip
mip.install("pdwidgets", index="https://PyDevices.github.io/micropython-lib/mip/PyDevices")
```

## Quick start

```python
import board_config
import eventsys
import pdwidgets as pd

runtime = eventsys.Runtime.from_board_config(board_config)
display = pd.Display(board_config.display_drv, runtime)
screen = pd.Screen(display)
pd.Button(screen, x=10, y=10, w=120, h=40, label="Hello")
runtime.run_forever()
```

Lean imports (MCU-friendly):

```python
from pdwidgets.widgets.button import Button
```

## What you get

- Screens, themes, and a growing widget set (buttons, lists, navigation, …)
- Works with PyDevices `displaydev` + application-owned `eventsys.Runtime`
- Importable icon modules under `pdwidgets.icons` (no binary MIP assets)

## Links

- [Documentation](https://pdwidgets.readthedocs.io)
- [Source](https://github.com/PyDevices/pdwidgets)
- [Issues](https://github.com/PyDevices/pdwidgets/issues)
- [PyScript demos](https://pydevices.github.io/pydevices-examples/pyscript/)
- Related: [pydevices-examples](https://github.com/PyDevices/pydevices-examples), [palettes](https://github.com/PyDevices/palettes)

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
