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
