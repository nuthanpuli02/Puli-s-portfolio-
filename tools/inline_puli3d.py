"""Copy src/puli3d.js into index.html.

index.html carries its own inlined copy of the voxel character / forest / game module,
so the page works as a single file. After editing src/puli3d.js, run from the repo root:

    python3 tools/inline_puli3d.py

It replaces everything from the module's first line ("/* Puli, voxel edition.") up to the
closing </script> tag, and refuses to run if that marker is missing.
"""
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
page = root / "index.html"
module = root / "src" / "puli3d.js"
MARK = "/* Puli, voxel edition."

html = page.read_text(encoding="utf-8")
src = module.read_text(encoding="utf-8")
if not src.startswith(MARK):
    sys.exit("src/puli3d.js no longer starts with the marker comment; inline it by hand")
i = html.find(MARK)
if i < 0:
    sys.exit("index.html has no inlined module to replace (marker not found)")
j = html.find("</script>", i)
if j < 0:
    sys.exit("no </script> after the inlined module")
page.write_text(html[:i] + src.rstrip() + "\n" + html[j:], encoding="utf-8")
print(f"inlined {len(src):,} characters of src/puli3d.js into index.html")
