# Publishing

See [PUBLISHING.md](https://github.com/PyDevices/pdwidgets/blob/main/PUBLISHING.md) in the repository for the release checklist.

Releases are tagged `vX.Y.Z` on this repo. CI syncs into [micropython-lib](https://github.com/PyDevices/micropython-lib), rebuilds the [MIP index](https://PyDevices.github.io/micropython-lib/mip/PyDevices), and uploads wheels to TestPyPI.

```bash
./scripts/publish_release_tag.sh 0.0.1 --push
```

Version **0.0.x** until promoted otherwise.
