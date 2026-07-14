# Publishing and releases

How changes in this repo become versioned **`pdwidgets`** wheels on [TestPyPI](https://test.pypi.org/project/pdwidgets/) and MIP packages on [micropython-lib gh-pages](https://PyDevices.github.io/micropython-lib/mip/PyDevices).

## Pipeline

```text
pdwidgets (commit on main)
  ./scripts/publish_release_tag.sh 0.0.1 --push
           │
           ▼
publish-micropython-lib.yml
  sync → micropython/pdwidgets/
  hatch + twine → TestPyPI
  rebuild mip/PyDevices → gh-pages
```

## Version numbers

Format: **`0.0.x`** semver until promoted. TestPyPI rejects duplicate versions.

```bash
./scripts/publish_release_tag.sh 0.0.1 --push
```

## Secrets (repository or org)

| Secret | Purpose |
|--------|---------|
| `TESTPYPI_API_TOKEN` | TestPyPI upload |
| `MICROPYTHON_LIB_DEPLOY_TOKEN` | PAT with `contents:write` on PyDevices/micropython-lib |

## Install from TestPyPI

```bash
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ pdwidgets
```

## MIP install

```python
mip.install("pdwidgets", index="https://PyDevices.github.io/micropython-lib/mip/PyDevices")
```

`pdwidgets` is **not** part of `pydisplay-bundle`.
