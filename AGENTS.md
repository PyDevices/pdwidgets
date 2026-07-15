# AGENTS.md — pdwidgets

Cross-platform widget toolkit for pydisplay (`import pdwidgets`).

## Environment

- Python venv at `.venv` — `.venv/bin/python`, `.venv/bin/ruff`
- Depends on pydisplay packages: `eventsys`, `graphics`, `multimer`, `palettes`
- Source layout: `src/pdwidgets/` (import name `pdwidgets`)

## Tests and lint

```bash
.venv/bin/python -m unittest discover -s tests
.venv/bin/ruff check src tests scripts
```

Headless bench (needs pydisplay `board_config` on path):

```bash
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy \
  .venv/bin/python tools/pdwidgets_bench.py
```

## Publishing

Tag `vX.Y.Z` triggers micropython-lib sync, MIP index rebuild, and TestPyPI upload.
See `PUBLISHING.md`.

## Widget dependency graph

Regenerate after editing widgets:

```bash
.venv/bin/python scripts/pdwidgets_widget_deps.py
```

## Cursor Cloud specific instructions

The Cloud Agent update script creates the repo-root `.venv` (with `ruff`).
`pdwidgets` is source-only and imports `palettes` plus pydisplay's
`eventsys`/`graphics`/`multimer` — none are pip-installed, so the bare
`unittest discover` / bench commands above fail without `PYTHONPATH`. In this
multi-repo workspace `palettes` comes from the sibling `palettes` repo (not
pydisplay's `add_ons`, unlike CI's sparse-checkout):

```bash
PYTHONPATH="src:tests/stubs:/agent/repos/palettes/src:/agent/repos/pydisplay/src/lib:/agent/repos/pydisplay/src/add_ons" \
  .venv/bin/python -m unittest discover -s tests
```

The pydisplay repo's `.venv` also gets a `pydevices_siblings.pth` (added by the
update script) listing `palettes/src` and `pdwidgets/src`, so pydisplay examples
that import them run in the cross-runtime matrix.
