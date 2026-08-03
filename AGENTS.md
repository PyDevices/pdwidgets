# AGENTS.md — pdwidgets

Cross-platform widget toolkit for pydisplay (`import pdwidgets`).

## Environment

- Python venv at `.venv` — `.venv/bin/python`, `.venv/bin/ruff`
- Depends on pydisplay packages: `eventsys`, `pygraphics`, `multimer`, `palettes`
- Source layout: `lib/pdwidgets/` (import name `pdwidgets`)

## Tests and lint

```bash
.venv/bin/python -m unittest discover -s tests
.venv/bin/ruff check lib tests scripts
```

Headless bench (needs pydisplay `board_config` on path):

```bash
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy \
  .venv/bin/python tools/pdwidgets_bench.py
```

## Publishing

Tag `vX.Y.Z` triggers micropython-lib sync, MIP index rebuild, and TestPyPI upload for this Python-only package.
See `docs/publishing.md`.

## Widget API (agent contract)

- **Content kwargs**: Labels use `value=`; buttons use `label=`. There is no
  `text=` kwarg and no class-name aliases (`ListTile`, `Tag`, `TabBar`, etc.).
- **`radius`**: Stored on every `Widget` (default `0`). Rounded faces (`Button`,
  `Card`, `Chip`, …) read `self.radius`; the base `draw()` fill ignores it.
- **Detach / empty**: `widget.remove()` detaches from the parent;
  `widget.clear()` removes all children. Both use `remove_child` under the hood.
  Hiding without detaching: `widget.hide()` or `widget.visible = False`.
- **Event callbacks**: `add_event_cb` invokes
  `callback(data_or_sender, event)` — sender/data first, event second. Default
  `data` is the widget that registered the callback.

## Widget dependency graph

Regenerate after editing widgets:

```bash
.venv/bin/python scripts/pdwidgets_widget_deps.py
```

## Cursor Cloud specific instructions

The Cloud Agent update script creates the repo-root `.venv` (with `ruff`).
`pdwidgets` is source-only and imports `palettes` plus pydisplay's
`eventsys`/`pygraphics`/`multimer` — none are pip-installed, so the bare
`unittest discover` / bench commands above fail without `PYTHONPATH`. In this
multi-repo workspace `palettes` comes from the sibling `palettes` repo (not
pydisplay's `utils`, unlike CI's sparse-checkout):

```bash
PYTHONPATH="lib:tests/stubs:/agent/repos/palettes/lib:/agent/repos/pygraphics/lib:/agent/repos/pydisplay/src/lib" \
  .venv/bin/python -m unittest discover -s tests
```

The pydisplay repo's `.venv` also gets a `pydevices_siblings.pth` (added by the
update script) listing `palettes/lib`, `pdwidgets/lib`, and `pygraphics/lib`, so
pydisplay examples that import them run in the cross-runtime matrix.
