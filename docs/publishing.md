# Publishing and releases

How changes in this repo become versioned **`pydevices-pdwidgets`** CPython wheels on [TestPyPI](https://test.pypi.org/project/pydevices-pdwidgets/) and unprefixed **`pdwidgets`** MicroPython packages on [micropython-lib gh-pages](https://PyDevices.github.io/mip).

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

## Secrets

Requires repository authentication secrets for package uploads and index syncing.

## Install from TestPyPI

```bash
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ pydevices-pdwidgets
```

## MIP install

```python
mip.install("pdwidgets", index="https://PyDevices.github.io/mip")
```

`pdwidgets` is **not** part of `pydevices-bundle`.
