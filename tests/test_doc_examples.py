# SPDX-FileCopyrightText: 2026 Brad Barnett
# SPDX-License-Identifier: MIT
"""Static verification of every ```python``` example in README.md and docs/*.md.

This is a *static* check: it never executes the extracted code (many blocks
import ``board_config``, which only exists on a real board or with
``pydevices-desktop`` installed). Instead it AST-parses each block and checks
its claims against the real ``pdwidgets`` package:

- ``from pdwidgets... import X`` -- X must actually exist at that import path.
- module-level attribute access ``pd.X`` / ``pdwidgets.X`` -- X must exist on
  the real (possibly aliased) ``pdwidgets`` package.
- keyword arguments passed to a call resolved to a ``pdwidgets`` class
  constructor -- each keyword must be a real parameter of that class's
  ``__init__`` (unless the signature accepts ``**kwargs``).
"""

import ast
import importlib
import inspect
import re
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC_FILES = [ROOT / "README.md", *sorted((ROOT / "docs").glob("*.md"))]

# ```python fences are sometimes indented (mkdocs tabs, list items); allow a
# common leading-whitespace prefix on both fence lines and dedent the body.
FENCE_RE = re.compile(r"^[ \t]*```python\n(.*?)^[ \t]*```", re.DOTALL | re.MULTILINE)


def _extract_python_blocks(path: Path):
    text = path.read_text(encoding="utf-8")
    return [textwrap.dedent(block) for block in FENCE_RE.findall(text)]


def _resolve_module(dotted):
    """Import a dotted module path (e.g. 'pdwidgets.widgets.button')."""
    return importlib.import_module(dotted)


class _BlockChecker:
    """Statically checks one extracted code block against real pdwidgets."""

    def __init__(self, source, doc, index):
        self.source = source
        self.doc = doc
        self.index = index
        self.errors = []
        # alias -> real dotted module path, for `import X as Y` / `import X`
        self.module_aliases = {}
        # local name -> (module path, attr name), for `from X import Y [as Z]`
        self.imported_names = {}

    def label(self):
        return f"{self.doc.name} block #{self.index}"

    def check(self):
        try:
            tree = ast.parse(self.source)
        except SyntaxError as exc:
            self.errors.append(f"{self.label()}: not valid Python ({exc})")
            return self.errors

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                self._handle_import(node)
            elif isinstance(node, ast.ImportFrom):
                self._handle_import_from(node)
            elif isinstance(node, ast.Attribute):
                self._handle_attribute(node)
            elif isinstance(node, ast.Call):
                self._handle_call(node)
        return self.errors

    def _handle_import(self, node):
        for alias in node.names:
            if alias.name == "pdwidgets" or alias.name.startswith("pdwidgets."):
                local = alias.asname or alias.name.split(".")[0]
                self.module_aliases[local] = alias.name

    def _handle_import_from(self, node):
        module = node.module or ""
        if not (module == "pdwidgets" or module.startswith("pdwidgets.")):
            return
        try:
            mod = _resolve_module(module)
        except ImportError as exc:
            self.errors.append(
                f"{self.label()}: `from {module} import ...` -- module does not exist ({exc})"
            )
            return
        for alias in node.names:
            name = alias.name
            if name == "*":
                continue
            local = alias.asname or name
            if not hasattr(mod, name):
                self.errors.append(
                    f"{self.label()}: `from {module} import {name}` -- "
                    f"no such attribute on {module}"
                )
                continue
            self.imported_names[local] = (module, name)

    def _handle_attribute(self, node):
        base = node.value
        if not isinstance(base, ast.Name):
            return
        alias = base.id
        module_path = self.module_aliases.get(alias)
        if module_path is None and alias in ("pd", "pdwidgets"):
            # Bare `pd`/`pdwidgets` names used without a matching `import`
            # statement in this block still resolve to the real package --
            # docs commonly show only the relevant fragment of a script.
            module_path = "pdwidgets"
        if module_path is None:
            return
        try:
            mod = _resolve_module(module_path)
        except ImportError:
            return
        if not hasattr(mod, node.attr):
            self.errors.append(
                f"{self.label()}: `{alias}.{node.attr}` -- no such attribute on {module_path}"
            )

    def _resolve_callee(self, func_node):
        """Return the real object a Call's func expression refers to, or None."""
        if isinstance(func_node, ast.Name):
            entry = self.imported_names.get(func_node.id)
            if entry is None:
                return None
            module, name = entry
            try:
                mod = _resolve_module(module)
            except ImportError:
                return None
            return getattr(mod, name, None)
        if isinstance(func_node, ast.Attribute):
            base = func_node.value
            if not isinstance(base, ast.Name):
                return None
            alias = base.id
            module_path = self.module_aliases.get(alias)
            if module_path is None and alias in ("pd", "pdwidgets"):
                module_path = "pdwidgets"
            if module_path is None:
                return None
            try:
                mod = _resolve_module(module_path)
            except ImportError:
                return None
            return getattr(mod, func_node.attr, None)
        return None

    def _handle_call(self, node):
        keywords = [kw for kw in node.keywords if kw.arg is not None]
        if not keywords:
            return
        target = self._resolve_callee(node.func)
        if target is None or not inspect.isclass(target):
            return
        # Only police classes that actually live under the pdwidgets package.
        module_name = getattr(target, "__module__", "")
        if not (module_name == "pdwidgets" or module_name.startswith("pdwidgets.")):
            return
        try:
            sig = inspect.signature(target.__init__)
        except (TypeError, ValueError):
            return
        params = sig.parameters
        accepts_kwargs = any(
            p.kind is inspect.Parameter.VAR_KEYWORD for p in params.values()
        )
        if accepts_kwargs:
            return
        valid = {
            name
            for name, p in params.items()
            if p.kind
            in (inspect.Parameter.POSITIONAL_OR_KEYWORD, inspect.Parameter.KEYWORD_ONLY)
        }
        for kw in keywords:
            if kw.arg not in valid:
                self.errors.append(
                    f"{self.label()}: {target.__qualname__}(..., {kw.arg}=...) -- "
                    f"no such keyword argument (valid: {sorted(valid)})"
                )


class TestDocExamples(unittest.TestCase):
    """Every fenced ```python``` block in README.md / docs/*.md must be accurate."""

    @classmethod
    def setUpClass(cls):
        # Make sure the real package is importable before we start resolving
        # dotted paths against it.
        importlib.import_module("pdwidgets")

    def test_all_doc_blocks_match_real_api(self):
        all_errors = []
        checked = 0
        for doc in DOC_FILES:
            blocks = _extract_python_blocks(doc)
            for i, block in enumerate(blocks, start=1):
                checked += 1
                checker = _BlockChecker(block, doc, i)
                all_errors.extend(checker.check())
        self.assertGreater(checked, 0, "no python blocks were found to check")
        if all_errors:
            self.fail("Documentation examples reference a nonexistent API:\n" + "\n".join(all_errors))


if __name__ == "__main__":
    unittest.main()
