# SPDX-FileCopyrightText: 2026 Brad Barnett
# SPDX-License-Identifier: MIT
"""Minimal CPython shim for ``from micropython import const`` in unit tests."""


def const(x):
    return x
