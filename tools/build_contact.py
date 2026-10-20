import sys,json
src=open('contact.src.html').read()
yaw=sys.argv[2] if len(sys.argv)>2 else '0'
if sys.argv[1]=='local':
    im={"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}};out='contact.test.html'
else:
    im={"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}};out='contact.html'
open(out,'w').write(src.replace('__IMPORTMAP__',json.dumps(im)).replace('__FISH_YAW__',yaw).replace('__BIRD_YAW__',sys.argv[3] if len(sys.argv)>3 else '0'))
print(out)
