# pdwidgets

A pure-Python PyDevices add-on for building GUIs on microcontrollers and desktop
Python. There is no native C extension; it publishes to TestPyPI and the MIP index.

pdwidgets is the UI layer used by pydevices-examples for building screen-sized apps on
MicroPython, CircuitPython, and CPython. The public API is intentionally small:
create a root :class:`Display`, add a :class:`Screen`, and compose widgets such
as labels, buttons, lists, and dialogs around that tree.

## Setup

For a local pydevices-examples checkout, make sure the repo libraries are on the import
path before you start:

```python
import utils.path   # adds lib/, utils/, and examples/ for a pydevices-examples dev clone
```

```python
# MicroPython — mip resolves the dependency chain from the same index
import mip
# pdwidgets does not pull its dependencies on MIP -- install them too.
mip.install("pydevices", index="https://PyDevices.github.io/mip")
mip.install("pygraphics", index="https://PyDevices.github.io/mip")
mip.install("palettes", index="https://PyDevices.github.io/mip")
mip.install("pdwidgets", index="https://PyDevices.github.io/mip")
```

```bash
# CPython — the two-index pattern, since dependencies span both registries
pip install -i https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ pydevices-pdwidgets
```

pdwidgets depends on `appdev`, `pygraphics`, and `multimer`, plus `palettes`
for theming. You also need a PyDevices-compatible `board_config` for your display
backend — see
[pydevices install workflows](https://github.com/PyDevices/pydevices/blob/main/docs/install-workflows.md).

A PyDevices `board_config` module exports hardware endpoints such as
`display_drv` and input-reader aliases. The application chooses its traffic
controller; the example below uses the optional `appdev` package.

## A practical app skeleton

The most common pattern is: create the display, create a screen, build the
widgets, then hand control to the app:

```python
import board_config
import appdev
import pdwidgets as pd

app = appdev.App(board_config)
display = pd.Display(board_config.display_drv, app)
screen = pd.Screen(display, bg=0x0000)

pd.Label(screen, value="Hello", x=8, y=8)

button = pd.Button(screen, label="Tap me", x=8, y=40)
button.add_event_cb(pd.events.MOUSEBUTTONUP, lambda sender, event: setattr(sender, "value", "Tapped"))

app.run()
```

The important detail is that `Display` wires itself into the shared app at
construction. That means input events and redraw ticks are driven by the app,
not by a separate background loop in pdwidgets — pdwidgets owns no timer of its
own, and frames follow whichever provider `app.timer_async` selected. During
a setup burst *before* `app.run()`, call `pd.tick()` to flush pending draws.

## Layout and state updates

Use alignment instead of hard-coded absolute coordinates when possible:

```python
screen = pd.Screen(display)
bar = pd.Widget(screen, w=screen.width, h=24, bg=0xFFFF, align=pd.ALIGN.TOP)
label = pd.Label(screen, value="Status", align=pd.ALIGN.CENTER)
```

Widget values and callbacks are the main state hooks:

```python
label.value = "Updated"
label.set_change_cb(lambda widget: print(widget.value))
```

If you are doing a lot of work before `app.run()`, call `pd.tick()` in a
short loop so the display flushes intermediate updates.

## Examples worth reading

The best examples live in the pydevices-examples repo under `src/examples/` and show how
real applications use the toolkit:

| Script | Description |
|--------|-------------|
| `calc_widgets.py` | Calculator UI with nested widgets |
| `widgets_settings.py` | Settings form with cards and controls |
| `widgets_smartwatch.py` | Multi-page navigation and layout |
| `joystick_list_select.py` | List navigation with input events |
| `widgets_device_panel.py` | Composite control panel built from shared widgets |

## Icons and theming

Runtime widget icons live under [`lib/pdwidgets/icons/`](https://github.com/PyDevices/pdwidgets/tree/main/lib/pdwidgets/icons) as importable Python modules. Regenerate them with the Material Design export scripts and `scripts/assets_icons_to_py.py` when the icon set changes.

## PyScript note

The theming module has a PyScript-specific workaround for `os.sep`, so some
browser-based demos use a slightly different import path than desktop builds.

## See also

- [Widget dependencies](https://github.com/PyDevices/pdwidgets/blob/main/lib/pdwidgets/widget-dependencies.md)
- [pydevices documentation](https://github.com/PyDevices/pydevices/tree/main/docs) — the board contract and core packages
- [Browser demos](https://pydevices.github.io/pydevices-examples/pyscript/)
