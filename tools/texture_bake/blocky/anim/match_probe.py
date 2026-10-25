import asyncio, json, numpy as np
from playwright.async_api import async_playwright
POSE_JS = '''(t)=>{action.time=t;mixer.update(0);const out=[];cur.traverse(o=>{if(o.isBone&&o.name!=='mixamorigHips'){out.push(...o.quaternion.toArray())}});
 const h=cur.getObjectByName('mixamorigHips');out.push(...h.quaternion.toArray());return out}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':64,'height':64})
        await pg.goto('http://localhost:8770/anim/inspect.html?w=64&h=64'); await pg.wait_for_function('window.ready')
        P = {}
        await pg.evaluate('load("Moonwalk")')
        P['m'] = [(t, await pg.evaluate(f'({POSE_JS})({t})')) for t in np.arange(0, 1.0, 1/30)]
        await pg.evaluate('load("Hip_Hop_Dancing")')
        P['d'] = [(t, await pg.evaluate(f'({POSE_JS})({t})')) for t in np.arange(6.4, 9.0, 1/30)]
        await b.close()
    best = []
    for tm, qm in P['m']:
        qm = np.array(qm).reshape(-1, 4)
        for td, qd in P['d']:
            qd = np.array(qd).reshape(-1, 4)
            d = 1 - np.abs((qm * qd).sum(1))      # 0 = same rotation
            best.append((d.sum(), tm, td))
    best.sort()
    for s, tm, td in best[:8]: print('score %.3f  moonwalk t %.2f  dance t %.2f' % (s, tm, td))
asyncio.run(main())
