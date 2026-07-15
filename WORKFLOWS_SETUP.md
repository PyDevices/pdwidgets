# GitHub Actions setup

Workflow files live in `.github/workflows/`. Org secrets used by publish:

- `TESTPYPI_API_TOKEN`
- `MICROPYTHON_LIB_DEPLOY_TOKEN`

PATs that push workflow YAML need the **`workflow`** scope.

## Manual follow-up status

| # | Task | Status |
|---|------|--------|
| 1 | Push workflow YAML to `.github/workflows/` | Done |
| 2 | Publish v0.0.1 → micropython-lib + TestPyPI + MIP | Done (see notes) |
| 3 | Read the Docs → `pdwidgets.readthedocs.io` | **Pending** (admin) |
| 4 | Enable GitHub Pages (`gh-pages` branch) | **Pending** (admin) |

### #2 publish notes

- **TestPyPI:** https://test.pypi.org/project/pdwidgets/0.0.1/
- **MIP index:** https://PyDevices.github.io/micropython-lib/mip/PyDevices/package/6/pdwidgets/latest.json
- **micropython-lib `PyDevices` branch:** `micropython/pdwidgets/` (commit `f890c42`+)

The first automated tag publish skipped the micropython-lib commit because
`publish_micropython_lib.sh` used `git diff --quiet` (untracked files are
invisible). Fixed in PR #4 on `main`; re-synced manually.

To republish a release:

```bash
./scripts/publish_release_tag.sh 0.0.2 --push
```

Or Actions → **Publish micropython-lib** → Run workflow.

### #3 Read the Docs (one-time)

1. Sign in at https://readthedocs.org with the PyDevices GitHub org account.
2. **Import a Project** → `PyDevices/pdwidgets`.
3. Confirm `.readthedocs.yaml` at repo root (MkDocs, Python 3.13).
4. Default version `latest` → public URL `https://pdwidgets.readthedocs.io/`.

The **Documentation** workflow only runs `mkdocs build` in CI; RTD hosting is separate.

### #4 GitHub Pages (one-time)

The **Deploy Pages site** workflow pushes `web/` to the `gh-pages` branch. Enable
the site in repo settings:

**Settings → Pages → Deploy from branch → `gh-pages` / root**

Target URL: https://pydevices.github.io/pdwidgets/

### CI tests workflow

Copy `ci/github-workflows/tests.yml` → `.github/workflows/tests.yml` after PR #4
(checks out a shallow `pydisplay` dep tree for import tests). Requires `workflow`
scope on the pushing PAT.
