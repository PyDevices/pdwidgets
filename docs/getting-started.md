# pdwidgets (widget toolkit)

pdwidgets is the UI layer used by pydisplay for building screen-sized apps on
MicroPython, CircuitPython, and CPython. The public API is intentionally small:
create a root :class:`Display`, add a :class:`Screen`, and compose widgets such
as labels, buttons, lists, and dialogs around that tree.

## Setup

For a local pydisplay checkout, make sure the repo libraries are on the import
path before you start:

```python
import utils.path   # adds lib/, utils/, and examples/ for a pydisplay dev clone
```

Install from [micropython-lib MIP](installation.md) or [TestPyPI](installation.md):

```python
import mip
mip.install("pdwidgets", index="https://PyDevices.github.io/micropython-lib/mip/PyDevices")
```

A pydisplay-compatible `board_config` module must export `display_drv` and
`runtime` so the UI can connect to the hardware and event loop.

## A practical app skeleton

The most common pattern is: create the display, create a screen, build the
widgets, then hand control to the runtime:

```python
import board_config
import pdwidgets as pd


display = pd.Display(board_config.display_drv, board_config.runtime)
screen = pd.Screen(display, bg=0x0000)

pd.Label(screen, value="Hello", x=8, y=8)

button = pd.Button(screen, label="Tap me", x=8, y=40)
button.add_event_cb(pd.events.MOUSEBUTTONUP, lambda sender, event: setattr(sender, "value", "Tapped"))

board_config.runtime.run_forever()
```

The important detail is that `Display` wires itself into the shared runtime at
construction. That means input events and redraw ticks are driven by the runtime,
not by a separate background loop in pdwidgets.

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

If you are doing a lot of work before `run_forever()`, call `pd.tick()` in a
short loop so the display flushes intermediate updates.

## Examples worth reading

The best examples live in the pydisplay repo under `src/examples/` and show how
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
