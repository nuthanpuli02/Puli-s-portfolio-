import asyncio, base64, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page()
        pg.on('console', lambda m: print('console:', m.text))
        await pg.goto('http://localhost:8770/anim/combine.html'); await pg.wait_for_function('window.ready')
        log = await pg.evaluate('run()')
        for l in log: print(l)
        data = await pg.evaluate('window.out')
        open('puli_anim.glb', 'wb').write(base64.b64decode(data))
        await b.close()
asyncio.run(main())
