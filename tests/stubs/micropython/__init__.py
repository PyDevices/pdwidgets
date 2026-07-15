# SPDX-FileCopyrightText: 2026 Brad Barnett
# SPDX-License-Identifier: MIT
"""Minimal CPython shim for ``from micropython import const`` in unit tests.

pydisplay deps (``graphics``, ``palettes``, ``framebuf``) come from the CI
sparse checkout; see ``ci/github-workflows/tests.yml``.
"""


def const(x):
    return x
