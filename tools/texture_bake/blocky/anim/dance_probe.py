import asyncio, json
from playwright.async_api import async_playwright
JS = '''(t)=>{action.time=t;mixer.update(0);cur.updateMatrixWorld(true);
 const h=cur.getObjectByName('mixamorigHips');const p=new THREE_V();h.getWorldPosition(p);
 const q=h.getWorldQuaternion(new THREE_Q());const f=new THREE_V(0,0,1).applyQuaternion(q);
 const lf=cur.getObjectByName('mixamorigLeftFoot').getWorldPosition(new THREE_V()),rf=cur.getObjectByName('mixamorigRightFoot').getWorldPosition(new THREE_V());
 return [p.x,p.y,p.z,Math.atan2(f.x,f.z)*180/Math.PI,lf.x,lf.z,rf.x,rf.z]}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':240,'height':320})
        await pg.goto('http://localhost:8770/anim/inspect.html?w=240&h=320'); await pg.wait_for_function('window.ready')
        await pg.add_script_tag(type='module', content="import * as T from '../r/node_modules/three/build/three.module.js'; window.THREE_V=T.Vector3; window.THREE_Q=T.Quaternion; window.tready=1;")
        await pg.wait_for_function('window.tready')
        res = {}
        for n in ['Hip_Hop_Dancing', 'Moonwalk']:
            await pg.evaluate(f'load("{n}")')
            dur = 17.2 if n.startswith('Hip') else 1.0
            step = 0.2 if n.startswith('Hip') else 0.1
            rows = []
            t = 0.0
            while t <= dur:
                rows.append([round(t, 2)] + [round(v, 3) for v in await pg.evaluate(f'({JS})({t})')]); t += step
            res[n] = rows
        await b.close()
    json.dump(res, open('dance_probe.json', 'w'))
    for n, rows in res.items():
        print(n)
        for r in rows: print('  t %5.2f hips x %6.3f y %5.3f z %6.3f yaw %7.1f | Lfoot %6.3f %6.3f Rfoot %6.3f %6.3f' % tuple(r))
asyncio.run(main())
