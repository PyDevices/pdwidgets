# Installation

## MicroPython — micropython-lib MIP (recommended)

Precompiled `.mpy` packages from the [PyDevices micropython-lib](https://github.com/PyDevices/micropython-lib) fork:

```text
https://PyDevices.github.io/micropython-lib/mip/PyDevices
```

```python
import mip
mip.install("pdwidgets", index="https://PyDevices.github.io/micropython-lib/mip/PyDevices")
```

`pdwidgets` declares MIP dependencies on `eventsys`, `pygraphics`, `multimer`, and `palettes` — `mip` installs them from the same index when needed.

## CPython — TestPyPI

Pure-Python CPython wheels are published as [`pydevices-pdwidgets`](https://test.pypi.org/project/pydevices-pdwidgets/) for development and CI (not production PyPI). Use the two-index pattern:

```bash
pip install \
  -i https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  pydevices-pdwidgets pydevices-displaydev pydevices-pygraphics \
  pydevices-eventsys pydevices-multimer pydevices-palettes
```

You also need a pydisplay-compatible `board_config` for your display backend.
You can provide your own `board_config.py` or optionally install a prebuilt
board package from micropython-hardware:
[install-workflows](https://pydevices.github.io/micropython-hardware/install-workflows.html).
For desktop setup details, see [pydisplay desktop quick start](https://pydisplay.readthedocs.io/en/latest/guides/desktop-cpython/).

## PyScript (browser)

Widget gallery examples in [pydisplay PyScript](https://pydevices.github.io/pydisplay/pyscript/) install `pdwidgets` at runtime via the micropython-lib MIP index (`# pyscript mip: pdwidgets` in example headers).

On the Pyodide (CPython) loader, examples may use `# pyodide wheels: pdwidgets` to `micropip`-install from TestPyPI.

## Full source clone

```bash
git clone https://github.com/PyDevices/pdwidgets.git
```

Add `src/` to `sys.path` alongside a pydisplay checkout or installed wheels.

## Not in pydisplay-bundle

`pdwidgets` is a separate package and is **not** included in the `pydisplay-bundle` MIP metapackage. Install it explicitly when you need widgets.
