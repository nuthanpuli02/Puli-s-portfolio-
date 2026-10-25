import asyncio, json, sys
from playwright.async_api import async_playwright
NAMES = ['Breathing_Idle','Walking','Moonwalk','Hip_Hop_Dancing','Jumping','Idle_To_Braced_Hang','Hanging_Idle','Falling_Flat_Impact','Getting_Up','Running','Running_Jump','Running_Slide']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':240,'height':320})
        await pg.goto('http://localhost:8770/anim/inspect.html?w=240&h=320')
        await pg.wait_for_function('window.ready')
        out = {}; hips = {}
        for n in NAMES:
            info = await pg.evaluate(f'load("{n}")'); out[n] = info
            dur = info['clips'][0][1]
            K = 8
            for k in range(K):
                t = dur * k / (K - 1) * 0.999
                hp = await pg.evaluate(f'frame({t},35,-1,0.75)'); hips.setdefault(n,[]).append([round(t,2)]+[round(v,3) for v in hp])
                await pg.locator('canvas').screenshot(path=f'fr_{n}_{k}.png')
            print(n, round(dur,2), 's hips', hips[n][0], hips[n][-1], flush=True)
        json.dump({'info':out,'hips':hips}, open('info.json','w'), indent=1)
        await b.close()
asyncio.run(main())
