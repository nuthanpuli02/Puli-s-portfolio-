import sys, asyncio, json, os
from playwright.async_api import async_playwright
# usage: shot.py model out W H lit "yaw,cx,cy,half;yaw,..." 
async def main():
    m,out,W,H,lit,views=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4]),sys.argv[5],sys.argv[6]
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':W,'height':H})
        await pg.goto(f'http://localhost:8770/view.html?m={m}&w={W}&h={H}&lit={lit}&nomip='+os.environ.get('NOMIP','0'))
        await pg.wait_for_function('window.ready',timeout=120000)
        for i,v in enumerate(views.split(';')):
            y,cx,cy,h=map(float,v.split(','))
            await pg.evaluate(f'render({y},{cx},{cy},{h})')
            await pg.locator('canvas').screenshot(path=f'{out}_{i}.png')
        await b.close()
asyncio.run(main())
