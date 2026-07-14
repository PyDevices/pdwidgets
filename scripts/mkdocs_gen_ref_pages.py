"""Generate mkdocstrings API reference stubs for pdwidgets."""

from pathlib import Path

import mkdocs_gen_files

nav = mkdocs_gen_files.Nav()
root = Path(__file__).parent.parent
src = root / "src" / "pdwidgets"

for path in sorted(src.rglob("*.py")):
    if path.name.startswith("_") and path.name != "__init__.py":
        continue
    rel = path.relative_to(src).with_suffix("")
    parts = list(rel.parts)
    if parts[-1] == "__init__":
        parts = parts[:-1]
    doc_path = Path("reference", *parts).with_suffix(".md")
    nav[parts] = doc_path.as_posix()
    with mkdocs_gen_files.open(doc_path, "w") as fd:
        ident = ".".join(["pdwidgets", *parts])
        fd.write(f"::: {ident}\n")
    mkdocs_gen_files.set_edit_path(doc_path, path.relative_to(root))

with mkdocs_gen_files.open("reference/SUMMARY.md", "w") as nav_file:
    nav_file.writelines(nav.build_literate_nav())
