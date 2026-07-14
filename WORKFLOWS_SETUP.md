# GitHub Actions setup

Workflow files live in `.github/workflows/` locally but could not be pushed
automatically — the cloud agent PAT lacks the `workflow` scope.

**One-time fix (repo admin):** from a machine with a PAT that includes
`workflow` (or via the GitHub web UI), push:

- `tests.yml` — ruff + unittest
- `docs.yml` — mkdocs build
- `deploy-pages.yml` — `pydevices.github.io/pdwidgets/`
- `publish-micropython-lib.yml` — tag `v*.*.*` → micropython-lib + TestPyPI + MIP

Or copy workflow YAML from this commit onto `main` using the GitHub UI
(**Add file** → paste from `.github/workflows/*.yml`).

Ensure org secrets grant this repo:

- `TESTPYPI_API_TOKEN`
- `MICROPYTHON_LIB_DEPLOY_TOKEN`

Then re-run publish:

```bash
git tag -f v0.0.1 && git push -f origin v0.0.1
```
