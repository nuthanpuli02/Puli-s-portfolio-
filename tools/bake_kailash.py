"""Bake the Mt. Kailash maps used by the sharp mountain layer (shader fsM in index.html). Run from the repo root:

    python3 tools/bake_kailash.py

Runs tools/bake_kailash.js (needs node), which upsamples the 256² SRTM heightmap embedded in index.html (HM_B64)
to 1024² and adds strata terraces, ribs, flow-routed gullies, the south-face gash, cavity and snow cover.
Writes, both lossless WebP, same orientation as the source (row 0 = north):
    assets/kailash-h.webp   R,G = 16-bit height (high, low byte), B = cavity
    assets/kailash-s.webp   snow cover (grey)
Needs numpy and Pillow.
"""
import pathlib, subprocess, tempfile
import numpy as np
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
N = 1024
with tempfile.TemporaryDirectory() as d:
    subprocess.run(["node", str(root / "tools" / "bake_kailash.js"), d], check=True)
    h = np.fromfile(pathlib.Path(d) / "h.bin", np.uint8).reshape(N, N, 2)
    a = np.fromfile(pathlib.Path(d) / "a.bin", np.uint8).reshape(N, N, 4)
Image.fromarray(np.dstack([h[..., 0], h[..., 1], a[..., 2]])).save(root / "assets" / "kailash-h.webp", lossless=True, quality=100, method=6)
s = a[..., 3]
Image.fromarray(np.dstack([s, s, s])).save(root / "assets" / "kailash-s.webp", lossless=True, quality=100, method=6)
print("wrote assets/kailash-h.webp and assets/kailash-s.webp")
