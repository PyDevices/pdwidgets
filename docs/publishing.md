# Publishing and releases

How a published GitHub Release becomes versioned **`pydevices-pdwidgets`**
artifacts on [TestPyPI](https://test.pypi.org/project/pydevices-pdwidgets/)
and the unprefixed **`pdwidgets`** package in the PyDevices MIP index.

## Pipeline

```text
published GitHub Release vX.Y.Z
  publish-release-packages.yml
    ├─ shared build + clean dependency/import test
    ├─ Trusted Publishing → TestPyPI
    └─ exact ref → serialized PyDevices/mip queue → Pages artifact
```

## Version numbers

Format: **`0.0.x`** semver until promoted. TestPyPI rejects duplicate versions.

Update and commit `VERSION`, then create and publish a GitHub Release whose tag
is exactly `vX.Y.Z`. To retry a failed channel, manually run
`publish-release-packages.yml` with that tag.

## Authentication

TestPyPI uses Trusted Publishing with the `testpypi` GitHub environment. The
existing `MICROPYTHON_LIB_DEPLOY_TOKEN` dispatches the central MIP queue.

## Install from TestPyPI

```bash
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ pydevices-pdwidgets
```

## MIP install

```python
mip.install("pdwidgets", index="https://PyDevices.github.io/mip")
```

`pdwidgets` is independent of the `pydevices` and `pydevices-desktop`
meta-packages.
