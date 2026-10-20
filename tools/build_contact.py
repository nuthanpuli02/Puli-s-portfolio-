"""Build contact.html from src/contact.src.html. Run from the repo root.

    python3 tools/build_contact.py            # contact.html, three.js from the CDN (what gets published)
    python3 tools/build_contact.py local      # contact.test.html, three.js from ./node_modules (offline testing)

The two yaw values turn each model so its head points the way the steering code expects;
they only change if a model is swapped. Override with --fish-yaw / --bird-yaw.
"""
import argparse
import json
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("mode", nargs="?", default="cdn", choices=["cdn", "local"])
ap.add_argument("--fish-yaw", default="3.14159")
ap.add_argument("--bird-yaw", default="0")
a = ap.parse_args()

src = (root / "src" / "contact.src.html").read_text(encoding="utf-8")
if a.mode == "local":
    imports = {"three": "./node_modules/three/build/three.module.js", "three/addons/": "./node_modules/three/examples/jsm/"}
    out = root / "contact.test.html"
else:
    imports = {"three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
               "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}
    out = root / "contact.html"
html = (src.replace("__IMPORTMAP__", json.dumps({"imports": imports}))
           .replace("__FISH_YAW__", a.fish_yaw)
           .replace("__BIRD_YAW__", a.bird_yaw))
out.write_text(html, encoding="utf-8")
print("wrote", out.name)
