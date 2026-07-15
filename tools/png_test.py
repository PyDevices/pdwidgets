"""PNG decoder smoke tool (pydisplay add_ons/png + DisplayBuffer).

Lives in pdwidgets because it walks a material-design-icons ``png/`` tree used
for icon authoring here. Requires a sibling **pydisplay** checkout (board_config,
``png``, display stack), ``pypng``, and the icons ``png/`` tree (or
``PDWIDGETS_PNG_DIR`` / ``PYDISPLAY_PNG_DIR`` / ``MATERIAL_DESIGN_ICONS_PNG``).

Run from the pdwidgets repo root (or with ``PYDISPLAY_ROOT`` set)::

    SDL_VIDEODRIVER=dummy ../pydisplay/.venv/bin/python tools/png_test.py
"""

from __future__ import annotations

from collections import namedtuple
import os
from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parents[1]


def _resolve_pydisplay_root() -> Path:
    env_root = os.environ.get("PYDISPLAY_ROOT")
    candidates = []
    if env_root:
        candidates.append(Path(env_root))
    candidates.extend(
        (
            _ROOT.parent / "pydisplay",
            Path.home() / "gh" / "pydevices" / "pydisplay",
        )
    )
    for root in candidates:
        if (root / "src" / "lib").is_dir() and (root / "src" / "add_ons").is_dir():
            return root.resolve()
    tried = ", ".join(str(p) for p in candidates)
    raise SystemExit(
        "pydisplay checkout not found (needed for board_config / png). "
        f"Set PYDISPLAY_ROOT. Tried: {tried}"
    )


_pydisplay = _resolve_pydisplay_root()
_src = str(_pydisplay / "src")
if _src not in sys.path:
    sys.path.insert(0, _src)

import lib.path  # noqa: E402, F401, I001
from board_config import runtime  # noqa: E402
from color_setup import ssd  # noqa: E402
from displaybuf import alloc_buffer  # noqa: E402
import png  # noqa: E402

png_image = namedtuple("png_image", ["width", "height", "pixels", "metadata"])  # noqa: PYI024

PNG_DIR = "~/material-design-icons/png"
PNG_REL = "material-design-icons/png"


def _norm_path(path):
    return path.replace("\\", "/")


def _home_dirs():
    seen = set()
    for key in ("HOME", "USERPROFILE"):
        try:
            val = os.environ[key]
        except (AttributeError, ImportError, KeyError, TypeError):
            val = None
        if not val:
            getenv = getattr(os, "getenv", None)
            if getenv is not None:
                val = getenv(key)
        if val:
            val = _norm_path(val).rstrip("/")
            if val not in seen:
                seen.add(val)
                yield val


def _wsl_home_roots():
    yield "U:/home"
    distro = os.getenv("WSL_DISTRO_NAME") if getattr(os, "getenv", None) else None
    if not distro:
        distro = "Ubuntu"
    for prefix in (f"//wsl.localhost/{distro}/home", f"//wsl$/{distro}/home"):
        yield prefix


def _is_dir(path):
    try:
        os.listdir(path)
        return True
    except OSError:
        return False


def _resolve_png_dir():
    getenv = getattr(os, "getenv", None)
    for key in ("PDWIDGETS_PNG_DIR", "PYDISPLAY_PNG_DIR", "MATERIAL_DESIGN_ICONS_PNG"):
        override = getenv(key) if getenv is not None else None
        if override and _is_dir(override):
            return _norm_path(override).rstrip("/") + "/"

    if PNG_DIR.startswith("~/"):
        suffix = PNG_DIR[2:]
        for home in _home_dirs():
            cand = home + "/" + suffix
            if _is_dir(cand):
                return cand.rstrip("/") + "/"

    for root in _wsl_home_roots():
        try:
            for user in os.listdir(root):
                cand = _join_path(_norm_path(root), user + "/" + PNG_REL)
                if _is_dir(cand):
                    return cand.rstrip("/") + "/"
        except OSError:
            continue

    raise RuntimeError(
        "Cannot find material-design-icons/png "
        "(set PDWIDGETS_PNG_DIR or MATERIAL_DESIGN_ICONS_PNG)"
    )


def _join_path(a, b):
    return _norm_path(a).rstrip("/") + "/" + b


def _rel_path(path, base):
    prefix = base.rstrip("/") + "/"
    if path.startswith(prefix):
        return path[len(prefix) :]
    return path


def png_files(directory):
    """Yield .png paths under directory (no os.walk — works on MicroPython)."""
    directory = directory.rstrip("/")
    stack = [directory]
    while stack:
        root = stack.pop()
        try:
            names = os.listdir(root)
        except OSError:
            continue
        for name in sorted(names):
            path = _join_path(root, name)
            if name.endswith(".png"):
                yield path
            else:
                try:
                    os.listdir(path)
                    stack.append(path)
                except OSError:
                    pass


try:
    import pydisplay_test_mode

    _max_pngs = 2 if pydisplay_test_mode.ENABLED else None
except ImportError:
    _max_pngs = None

png_path = _resolve_png_dir()

fg_color = 0xFFFF
bg_color = 0x001F

ssd.fill(bg_color)
ssd.show()

st = {"shown": 0, "phase": "show", "pos": None, "files": iter(png_files(png_path))}


def _show_next(_=None):
    if runtime.quit_requested if runtime else False:
        return
    if _max_pngs is not None and st["shown"] >= _max_pngs:
        return

    if st["phase"] == "clear":
        pos_x, pos_y, pw, ph = st["pos"]
        ssd.fill_rect(pos_x, pos_y, pw, ph, bg_color)
        ssd.fill_rect(0, 0, ssd.width, 32, bg_color)
        ssd.show()
        st["phase"] = "show"
        return

    try:
        file_name = next(st["files"])
    except StopIteration:
        st["files"] = iter(png_files(png_path))
        try:
            file_name = next(st["files"])
        except StopIteration:
            return

    p = png_image(*png.Reader(filename=file_name).read())
    if not p.metadata["greyscale"] or p.metadata["bitdepth"] != 8:
        print(f"Only 8-bit PNGs are supported {file_name}")
        return
    pos_x, pos_y = (ssd.width - p.width) // 2, (ssd.height - p.height) // 2
    offset = 1 if p.metadata["alpha"] else 0
    planes = p.metadata["planes"]
    buf = alloc_buffer(p.width * p.height * 2)
    for y, row in enumerate(p.pixels):
        for x in range(p.width):
            if row[x * planes + offset] > 127:
                buf[(y * p.width + x) * 2 : (y * p.width + x) * 2 + 2] = fg_color.to_bytes(
                    2, "little"
                )
            else:
                buf[(y * p.width + x) * 2 : (y * p.width + x) * 2 + 2] = bg_color.to_bytes(
                    2, "little"
                )
    ssd.blit_rect(buf, pos_x, pos_y, p.width, p.height)
    rel = _rel_path(file_name, png_path)
    lines = rel.rpartition("/")
    ssd.text16(lines[0] + "/", 0, 0, 0xFFFF)
    ssd.text16("    " + lines[2], 0, 16, 0xFFFF)
    ssd.show()
    st["shown"] += 1
    st["pos"] = (pos_x, pos_y, p.width, p.height)
    st["phase"] = "clear"


runtime.on_tick(_show_next, period=1000, async_=runtime.timer_async)
runtime.run_forever()
