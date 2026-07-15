# pdwidgets (widget toolkit)

Cross-platform widget toolkit in the **pdwidgets** package — buttons, lists, scrollbars, themes, and more.

## Setup

```python
import lib.path   # pydisplay dev clone: puts lib/, add_ons/, examples/ on sys.path
```

Install from [micropython-lib MIP](installation.md) or [TestPyPI](installation.md):

```python
import mip
mip.install("pdwidgets", index="https://PyDevices.github.io/micropython-lib/mip/PyDevices")
```

Requires a pydisplay `board_config` that exports `display_drv` and `runtime`.

## Event loop

`Display` wires into `eventsys.Runtime` at construction (input dispatch and
periodic render ticks). Build the UI, then keep the app alive with
`runtime.run_forever()`:

```python
import board_config
import pdwidgets as pd

display = pd.Display(board_config.display_drv, board_config.runtime)
screen = pd.Screen(display)
# ... build UI ...
board_config.runtime.run_forever()
```

pdwidgets owns no timer of its own — frames are driven from the shared runtime
selected by `runtime.timer_async`. During setup bursts before `run_forever()`,
call `pd.tick()` each iteration so draws flush to the display:

```python
while i < 60:
    console.write(f"{i}\n")
    pd.tick()
board_config.runtime.run_forever()
```

## Examples

Demo scripts live in the **pydisplay** repo under `src/examples/` (not in this
package):

| Script | Description |
|--------|-------------|
| `widgets_demo.py` | Align enum smoke |
| `calc_widgets.py` | Calculator UI |
| `widgets_percent.py` | Progress/percent |
| `widgets_smartwatch.py` | Showcase: watch face / pages |
| `widgets_settings.py` | Showcase: settings form |
| `joystick_list_select.py` | List + joystick navigation |
| `console_simpletest.py` / `console_advanced_demo.py` | Console demos (`mpconsole`; `pdwidgets.Console` also exists) |

## Icons

Runtime widget icons live under [`src/pdwidgets/icons/`](https://github.com/PyDevices/pdwidgets/tree/main/src/pdwidgets/icons)
as importable ``.py`` modules. Regenerate with the Material Design scripts plus
`scripts/assets_icons_to_py.py` (see the [repo README](https://github.com/PyDevices/pdwidgets#icon-assets)).

## PyScript note

Themes module has a PyScript workaround (`os.sep` unavailable).
