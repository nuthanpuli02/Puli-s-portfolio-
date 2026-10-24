# render a glb unlit with the exact ortho framing of a reference view, then crop + compare. usage: cmp.py glb view x0 y0 x1 y1 out [head]
import sys, json, subprocess, numpy as np
from PIL import Image
glb, view = sys.argv[1], sys.argv[2]; x0, y0, x1, y1 = map(int, sys.argv[3:7]); out = sys.argv[7]
usehead = len(sys.argv) > 8
YAW = {'front': 0, 'back': 180, 'right': -90, 'left': 90}
if usehead: s, ox, oy = json.load(open('headfit.json'))[view]; sx = sy = s
else: sx, sy, ox, oy = json.load(open('fit.json'))[view]
W, H = 768, 1366
cy = (oy - H / 2) / sy; half = (H / 2) / sy; cx = (W / 2 - ox) / sx
# view.html: screen x = (P.ax) ; its cx shifts camera along its right vector
subprocess.run(['python3', 'shot.py', glb, 'cmp_tmp', str(W), str(H), '0', f'{YAW[view]},{cx},{cy},{half}'], check=True)
r = Image.open('cmp_tmp_0.png').convert('RGB'); ref = Image.open(f'ref_{view}.png').convert('RGB')
r = r.crop((x0, y0, x1, y1)); f = ref.crop((x0, y0, x1, y1))
b = Image.blend(r, f, 0.5)
w = x1 - x0; c = Image.new('RGB', (w * 3, y1 - y0)); c.paste(f, (0, 0)); c.paste(r, (w, 0)); c.paste(b, (2 * w, 0))
k = 900 / c.width; c.resize((900, int(c.height * k))).save(out)
