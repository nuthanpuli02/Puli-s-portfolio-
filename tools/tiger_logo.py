"""Draws Puli's tiger logo: a stalking tiger whose long lines are written with his name (text on SVG paths),
with the face, ears and paws as fine strokes. Writes site/src/assets/tiger-logo.svg (colour: currentColor).
Run from the repo root: python3 tools/tiger_logo.py
"""
import pathlib
# (path, text size) — the long lines are written with the name; the face and paws are fine strokes
LINES={
 'spine': ("M178 286 C200 262 214 246 236 232 C262 214 290 176 322 152 C338 140 352 146 356 162", 11),
 'tail':  ("M330 148 C318 110 282 72 232 58 C192 46 162 48 150 32 C145 22 154 13 165 19", 10),
 'belly': ("M190 350 C230 322 268 284 300 250", 10.5),
 'shoulder':("M216 250 C202 290 192 326 178 362", 9.5),
 'hindB': ("M356 162 C368 190 360 214 344 228 C350 240 354 252 352 264", 10),
 'hindF': ("M300 250 C312 256 322 262 330 268", 9),
 'foreA': ("M122 352 C110 382 92 420 68 462", 10.5),
 'foreB': ("M162 366 C150 400 122 438 98 466", 10.5),
 'fore2a':("M200 352 C212 368 222 380 228 394", 9),
 'fore2b':("M226 330 C238 350 246 370 252 392", 9),
 'cheek': ("M118 300 C110 322 116 346 140 357 C164 362 186 346 190 322", 9.5),
 'brow':  ("M124 296 C138 284 164 280 184 293", 8.5),
}
STRIPES=[  # tapered brush stripes over the back and flanks
 "M240 232 C246 248 244 266 236 286","M256 220 C266 238 266 260 258 282","M274 204 C286 222 288 246 280 270",
 "M292 186 C304 204 308 228 302 252","M310 166 C322 182 328 204 324 230","M330 150 C342 164 348 182 346 204",
 "M200 270 C206 286 204 304 196 322","M222 262 C230 280 230 300 222 320",
 "M150 38 C162 46 172 48 184 46","M190 50 C200 58 212 62 224 62","M240 64 C250 74 262 82 274 86","M286 86 C294 98 304 108 312 118",
]
DETAIL=[
 "M122 298 C118 284 126 276 137 284","M171 281 C181 274 189 282 185 296",
 "M131 315 Q140 307 149 313","M159 311 Q168 304 177 309",
 "M140 313 v0.1","M168 309 v0.1",
 "M151 330 L156.5 336 L162 329 Z","M156.5 336 V342","M146 345 Q156.5 351 167 343",
 "M151 290 Q153 298 151 306","M141 294 Q145 300 143 307","M162 290 Q160 298 162 305",
 "M120 318 Q128 320 132 326","M188 318 Q180 320 176 326","M122 334 Q130 334 134 340","M186 334 Q178 334 174 340",
 "M58 466 Q66 474 78 471 Q86 476 96 470 Q104 474 108 466","M326 268 Q336 274 346 270 Q354 274 360 266","M218 396 Q228 402 238 398 Q246 401 254 394",
 "M163 19 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0",
]
def svg(text_mode, w=420, ink="#111", name="NUTHAN PULI · ", vb="40 0 340 480"):
    x0,y0,vw,vh=map(float,vb.split()); h=w*vh/vw
    o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h:.0f}" fill="none" stroke="{ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><defs>']
    for k,(d,_) in LINES.items(): o.append(f'<path id="{k}" d="{d}"/>')
    o.append('</defs>')
    for k,(d,fs) in LINES.items():
        if text_mode: o.append(f'<text font-family="Inter,Arial,sans-serif" font-weight="800" font-size="{fs}" letter-spacing="0.4" fill="{ink}" stroke="none" dy="{fs*0.36:.2f}"><textPath href="#{k}">{name*14}</textPath></text>')
        else: o.append(f'<use href="#{k}"/>')
    for d in STRIPES: o.append(f'<path d="{d}" stroke-width="{3.2 if text_mode else 2.2}"/>')
    for d in DETAIL: o.append(f'<path d="{d}"/>')
    o.append('</svg>'); return '\n'.join(o)

if __name__=='__main__':
    root=pathlib.Path(__file__).resolve().parent.parent
    s=svg(True, w=340, ink="currentColor")
    s=s.replace(' width="340" height="480"','')
    (root/'site'/'src'/'assets'/'tiger-logo.svg').write_text(s, encoding='utf-8')
    print('wrote site/src/assets/tiger-logo.svg')
