"""Darken only the skin a little: pick texels whose colour is skin (orange-brown, saturated, not dark), feather the
selection, and lower their brightness by K while keeping the hue. usage: skin.py K in.png out.png"""
import sys, numpy as np, cv2
K = float(sys.argv[1]); src, dst = sys.argv[2], sys.argv[3]
im = cv2.imread(src); hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)  # H 0-180
h, s, v = hsv[..., 0], hsv[..., 1] / 255, hsv[..., 2] / 255
m = ((h >= 5) & (h <= 15) & (s > 0.38) & (v > 0.42)).astype(np.float32)
m = cv2.GaussianBlur(m, (0, 0), 1.2)
out = im.astype(np.float32) * (1 - K * m[..., None])
cv2.imwrite(dst, np.clip(out, 0, 255).astype(np.uint8))
cv2.imwrite('skin_mask.png', (m * 255).astype(np.uint8)); print('skin share of texture', (m > 0.5).mean())
