"""Write a copy of model.glb with a new base-colour texture (JPEG) and a matte, non-metal roughness/metal map.
usage: export.py basecolor.png out.glb [rmfix]"""
import sys, pygltflib, cv2, numpy as np
tex, out = sys.argv[1], sys.argv[2]; rmfix = 'rmfix' in sys.argv
g = pygltflib.GLTF2().load('model.glb'); blob = bytearray(g.binary_blob())
pbr = g.materials[0].pbrMetallicRoughness
repl = {}
im = cv2.imread(tex); repl[g.images[g.textures[pbr.baseColorTexture.index].source].bufferView] = cv2.imencode('.jpg', im, [cv2.IMWRITE_JPEG_QUALITY, 92])[1].tobytes()
if rmfix:
    rm = cv2.imread('tex_safari_explorer_3d_model_rm.jpg')  # BGR: B=metal(glTF blue), G=roughness
    rm[..., 0] = 0                                  # nothing on him is bare metal at this scale: skin was coming out copper
    rm[..., 1] = np.maximum(rm[..., 1], 150)        # matte: no glossy skin or cloth
    repl[g.images[g.textures[pbr.metallicRoughnessTexture.index].source].bufferView] = cv2.imencode('.jpg', rm, [cv2.IMWRITE_JPEG_QUALITY, 90])[1].tobytes()
import os
if rmfix and os.path.exists('tex_normal_fixed.png'):
    nmi = cv2.imread('tex_normal_fixed.png')
    repl[g.images[g.textures[g.materials[0].normalTexture.index].source].bufferView] = cv2.imencode('.png', nmi, [cv2.IMWRITE_PNG_COMPRESSION, 9])[1].tobytes()
newblob = bytearray()
for i, bv in enumerate(g.bufferViews):
    data = repl.get(i, bytes(blob[bv.byteOffset or 0:(bv.byteOffset or 0) + bv.byteLength]))
    while len(newblob) % 4: newblob.append(0)
    bv.byteOffset = len(newblob); bv.byteLength = len(data); newblob += data
while len(newblob) % 4: newblob.append(0)
g.buffers[0].byteLength = len(newblob); g.set_binary_blob(bytes(newblob)); g.save_binary(out)
print(out, len(newblob))
