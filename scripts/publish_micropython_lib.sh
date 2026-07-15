#!/usr/bin/env bash
# Sync pdwidgets into PyDevices/micropython-lib, build TestPyPI wheels, push MIP index.
#
# CI: MICROPYTHON_LIB_DIR=../micropython-lib ./scripts/publish_micropython_lib.sh --push
# MIP: mip.install("pdwidgets", index="https://PyDevices.github.io/micropython-lib/mip/PyDevices")

set -euo pipefail

SKIP_PYPI=0
DO_PUSH=0
COMMIT_MESSAGE=""
INTERACTIVE_COMMIT=0
CLI_VERSION=""

usage() {
    cat <<'EOF'
Usage: ./scripts/publish_micropython_lib.sh [OPTION]

Copy pdwidgets src/ into micropython-lib, optionally upload TestPyPI wheels,
then commit (and optionally push) on the PyDevices branch.

Options:
  --skip-pypi           Sync manifests only; skip hatch/twine TestPyPI uploads.
  --version X.Y.Z       Release version (overrides tag / PDWIDGETS_VERSION).
  --commit-message MSG  Commit micropython-lib changes (non-interactive).
  --push                Push micropython-lib after commit.
  --help, -h            Show this message.

Environment:
  MICROPYTHON_LIB_DIR   micropython-lib checkout (default: ../micropython-lib)
  PDWIDGETS_VERSION     Release version (overrides git tag on current commit)
  TESTPYPI_API_TOKEN    TestPyPI token for twine (when not using --skip-pypi)
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-pypi) SKIP_PYPI=1; shift ;;
        --version) CLI_VERSION=$2; shift 2 ;;
        --commit-message) COMMIT_MESSAGE=$2; shift 2 ;;
        --push) DO_PUSH=1; shift ;;
        --help | -h) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
    esac
done

if [[ -z "$COMMIT_MESSAGE" ]] && [[ -t 0 ]]; then
    INTERACTIVE_COMMIT=1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

normalize_version() {
    local v="${1#v}"
    v="$(echo "$v" | tr -d '[:space:]')"
    if [[ ! "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
        echo "Error: invalid semver: $1 (expected X.Y.Z)" >&2
        return 1
    fi
    echo "$v"
}

resolve_version() {
    if [[ -n "$CLI_VERSION" ]]; then
        normalize_version "$CLI_VERSION"
        return
    fi
    if [[ -n "${PDWIDGETS_VERSION:-}" ]]; then
        normalize_version "$PDWIDGETS_VERSION"
        return
    fi
    local tag
    tag="$(git -C "$SOURCE_REPO" describe --tags --exact-match 2>/dev/null || true)"
    if [[ -n "$tag" ]]; then
        normalize_version "$tag"
        return
    fi
    echo "Error: no release version. Tag HEAD (vX.Y.Z), pass --version, or set PDWIDGETS_VERSION." >&2
    return 1
}

VERSION="$(resolve_version)" || exit 1
echo "Release version: $VERSION"

DESCRIPTION_PREFIX="pdwidgets"
AUTHOR="Brad Barnett <contact@pydevices.com>"
LICENSE="MIT"
BASENAME=pdwidgets
DEST_REPO="${MICROPYTHON_LIB_DIR:-$SOURCE_REPO/../micropython-lib}"
DEST_REPO="$(cd "$DEST_REPO" 2>/dev/null && pwd || echo "$DEST_REPO")"
export MICROPYTHON_LIB_DIR="$DEST_REPO"
SOURCE_DIR=$SOURCE_REPO/src/pdwidgets
DEST_DIR=$DEST_REPO/micropython/$BASENAME
PYPI_DIR=$SOURCE_REPO/wheels
README_FULL_PATH=$SOURCE_REPO/README.md

RSYNC_EXCLUDES=(
    --exclude '__pycache__/'
    --exclude '*.pyc'
    --exclude '*.pyo'
    --exclude '.git/'
)

build_and_upload_pypi() {
    if [[ "$SKIP_PYPI" -eq 1 ]]; then
        return 0
    fi
    rm -rf dist
    hatch build
    if [[ -n "${TESTPYPI_API_TOKEN:-}" ]]; then
        TWINE_USERNAME=__token__ TWINE_PASSWORD="$TESTPYPI_API_TOKEN" \
            twine upload --repository testpypi --verbose dist/*
    else
        twine upload --repository testpypi --verbose dist/*
    fi
}

echo
echo "Processing $BASENAME"
mkdir -p "$DEST_DIR/$BASENAME"
rsync -a "${RSYNC_EXCLUDES[@]}" "$SOURCE_DIR/" "$DEST_DIR/$BASENAME/"

cat <<EOF > "$DEST_DIR/manifest.py"
metadata(
    description="$DESCRIPTION_PREFIX widget toolkit for pydisplay",
    version="$VERSION",
    author="$AUTHOR",
    license="$LICENSE",
    pypi_publish="$BASENAME",
)
require("eventsys")
require("graphics", pypi="pydisplay-graphics")
require("multimer")
require("palettes")
package("$BASENAME")
EOF

cp "$README_FULL_PATH" "$DEST_DIR/README.md"

if [[ "$SKIP_PYPI" -eq 0 ]]; then
    ./scripts/publish_make_pyproject.py --output "$PYPI_DIR/$BASENAME" "$DEST_DIR/manifest.py"
    pushd "$PYPI_DIR/$BASENAME"
    build_and_upload_pypi
    popd
fi

find "$DEST_DIR" \( \
    -type d \( -name __pycache__ -o -name .mypy_cache -o -name .ruff_cache \) \
    -o -type f \( -name '*.pyc' -o -name '*.pyo' \) \
\) -print0 2>/dev/null | xargs -0 rm -rf 2>/dev/null || true

if [[ "$INTERACTIVE_COMMIT" -eq 1 ]] || [[ -n "$COMMIT_MESSAGE" ]]; then
    if [[ "$INTERACTIVE_COMMIT" -eq 1 ]] && [[ -z "$COMMIT_MESSAGE" ]]; then
        read -r -p "Enter micropython-lib commit message: " COMMIT_MESSAGE
    fi
    if [[ -n "$COMMIT_MESSAGE" ]]; then
        if [[ -z "$(git -C "$DEST_REPO" status --porcelain)" ]]; then
            echo "No changes to commit in $DEST_REPO"
        else
            git -C "$DEST_REPO" add .
            git -C "$DEST_REPO" commit -s -m "$COMMIT_MESSAGE"
            if [[ "$DO_PUSH" -eq 1 ]]; then
                git -C "$DEST_REPO" push
            fi
        fi
    fi
fi
