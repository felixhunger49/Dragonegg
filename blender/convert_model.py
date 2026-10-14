# Turns a finished, textured or vertex-coloured model (e.g. from an AI 3D generator: one mesh, no bones, often on a stand)
# into a game figure: removes the stand, reduces the vertex count, adds the game's bones with automatic
# weights, gives the hair its own "hair" material (so the game can colour it, e.g. gold for Super) and adds
# extra parts (tail, staff). Joint positions are measured per model and listed in MODELS below.
#   python blender/convert_model.py goki "/path/to/son goki.glb"
import bpy, bmesh, math, os, sys
import numpy as np
from mathutils import Matrix, Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from figlib import Fig

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# joint positions in the source model's own units (Blender axes: Z up, figure faces -Y); _L = +X, mirrored for _R
MODELS = {
    'goki': dict(
        cut=.012, faces=14000, tex=1024,
        hips=.37, torso=(.42, .70), head=(.715, .90), neck=.71, tilt=(-18, -.013),
        S=(.115, 0, .655), E=(.136, 0, .54), W=(.137, -.025, .48), H=(.125, -.04, .425),
        P=(.06, -.005, .35), K=(.073, 0, .21), A=(.10, .008, .075), T=(.11, -.075, .02),
        colors={'hair': '#e8c860', 'tail': '#8a5a30', 'staff': '#c81818', 'rim': '#3a5ad8'},
        extras='goki'),
    # ComfyUI model with vertex colours, standing on rocks: cut below the trouser hems, shoes are rebuilt
    'kurikin': dict(
        cut=-.355, floor=-.49, faces=14000, hair=False,
        hips=-.08, torso=(0, .24), head=(.27, .50), neck=.26, tilt=(-15, -.02),
        S=(.16, .03, .20), E=(.20, .05, .065), W=(.265, -.05, .075), H=(.30, -.11, .07),
        P=(.08, .02, -.10), K=(.16, 0, -.24), A=(.215, .03, -.40), T=(.25, -.10, -.47),
        colors={'shoe': '#1e2238', 'sock': '#d0d0d8'},
        extras='shoes'),
}

def load(src, cfg):
    bpy.ops.import_scene.gltf(filepath=src)
    ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
    ob.data.transform(ob.matrix_world)
    ob.parent = None
    ob.matrix_world.identity()
    for o in list(bpy.context.scene.objects):
        if o != ob:
            bpy.data.objects.remove(o)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)  # generators split vertices along UV seams
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cfg['cut']], context='VERTS')  # the stand
    # close the openings left by the cut (e.g. trouser hems)
    rim = [e for e in bm.edges if e.is_boundary and min(v.co.z for v in e.verts) < cfg['cut'] + .01]
    bmesh.ops.holes_fill(bm, edges=rim, sides=0)
    # keep only big connected pieces (crumbs left over from the stand)
    lab, parts = {}, []
    for v in bm.verts:
        if v in lab:
            continue
        st, comp = [v], []
        lab[v] = 1
        while st:
            x = st.pop()
            comp.append(x)
            for e in x.link_edges:
                o = e.other_vert(x)
                if o not in lab:
                    lab[o] = 1
                    st.append(o)
        parts.append(comp)
    bmesh.ops.delete(bm, geom=[v for p in parts if len(p) < 2000 for v in p], context='VERTS')
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])  # filled openings
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.validate()
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    m = ob.modifiers.new('Decimate', 'DECIMATE')
    m.ratio = cfg['faces'] / len(ob.data.polygons)
    bpy.ops.object.modifier_apply(modifier='Decimate')
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

def textures(ob, cfg):
    """smaller textures; drop metal/roughness (the game draws toon shading)"""
    mat = ob.data.materials[0]
    mat.name = 'texture'
    nt = mat.node_tree
    base = None
    for n in list(nt.nodes):
        if n.type != 'TEX_IMAGE':
            continue
        to = [l.to_node.type for l in n.outputs['Color'].links]
        if 'SEPARATE_COLOR' in to:
            nt.nodes.remove(n)
            continue
        n.image.scale(cfg['tex'], cfg['tex'])
        if 'BSDF_PRINCIPLED' in to:
            base = n.image
    for n in list(nt.nodes):
        if n.type == 'SEPARATE_COLOR':
            nt.nodes.remove(n)
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Roughness'].default_value = .8
    return base

def split_hair(ob, img, cfg, k):
    """faces above the neck with blond/white texture colour -> material 'hair'"""
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    me = ob.data
    uv = me.uv_layers.active.data
    hair = bpy.data.materials.get('hair')
    me.materials.append(hair)
    hi = len(me.materials) - 1
    neck = cfg['neck'] * k
    bm = bmesh.new()
    bm.from_mesh(me)
    ul = bm.loops.layers.uv.active
    isH = {}
    for f in bm.faces:
        if f.calc_center_median().z < neck:
            continue
        u = sum(l[ul].uv.x for l in f.loops) / len(f.loops)
        v = sum(l[ul].uv.y for l in f.loops) / len(f.loops)
        r, g, b, _ = px[min(h - 1, int(v * h)), min(w - 1, int(u * w))]
        # everything on the head that is neither skin (red clearly above green, green near blue) nor clothes (blue);
        # greyish white (spike tips) counts as hair
        skin = r > .25 and r - g > .07 and g - b < (r - g) * 1.3
        isH[f] = not skin and (b <= r or max(r, g, b) - min(r, g, b) < .15)
    # smooth: a face follows the majority of its neighbours (twice)
    for _ in range(2):
        nxt = {}
        for f, v in isH.items():
            nb = [isH.get(o, False) for e in f.edges for o in e.link_faces if o is not f]
            nxt[f] = sum(nb) * 2 > len(nb) if nb else v
        isH = nxt
    # only big connected areas are hair (small ones are eyes, teeth ...)
    seen, n = set(), 0
    for f0, v in isH.items():
        if not v or f0 in seen:
            continue
        st, comp = [f0], []
        seen.add(f0)
        while st:
            f = st.pop()
            comp.append(f)
            for e in f.edges:
                for o in e.link_faces:
                    if o not in seen and isH.get(o):
                        seen.add(o)
                        st.append(o)
        if len(comp) >= 60:
            for f in comp:
                f.material_index = hi
            n += len(comp)
    bm.to_mesh(me)
    bm.free()
    print('hair faces', n)

def raise_head(ob, cfg, k, fl=0):
    """statues often look down; turn the head up (degrees, around the neck) so the face shows in the side view"""
    a, y = cfg['tilt']
    z0, z1 = (cfg['neck'] - .01 - fl) * k, (cfg['neck'] + .03 - fl) * k
    for v in ob.data.vertices:
        w = min(1, max(0, (v.co.z - z0) / (z1 - z0)))
        if not w:
            continue
        r = math.radians(a) * (w * w * (3 - 2 * w))
        dy, dz = v.co.y - y * k, v.co.z - z0
        v.co.y = y * k + dy * math.cos(r) - dz * math.sin(r)
        v.co.z = z0 + dy * math.sin(r) + dz * math.cos(r)

def joints(cfg, k, fl):
    return {n: (Vector(cfg[n]) - Vector((0, 0, fl))) * k for n in 'SEWHPKAT'}

def skeleton(F, cfg, k, tail, fl=0):
    J = joints(cfg, k, fl)
    arm = bpy.data.armatures.new(F.name + 'Rig')
    F.rig = rig = F.link(bpy.data.objects.new(F.name + 'Rig', arm))
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    def bone(name, head, tl, parent=None, connect=False):
        b = eb.new(name)
        b.head, b.tail = Vector(head), Vector(tl)
        if parent:
            b.parent = eb[parent]
            b.use_connect = connect
    z = lambda a: (0, 0, (a - fl) * k)
    bone('hips', z(cfg['hips']), z(cfg['torso'][0]))
    bone('torso', z(cfg['torso'][0]), z(cfg['torso'][1]), 'hips')
    bone('head', z(cfg['head'][0]), z(cfg['head'][1]), 'torso')
    for s, sd in ((1, '_L'), (-1, '_R')):
        m = lambda v: Vector((v.x * s, v.y, v.z))
        bone('upperarm' + sd, m(J['S']), m(J['E']), 'torso')
        bone('forearm' + sd, m(J['E']), m(J['W']), 'upperarm' + sd, True)
        bone('hand' + sd, m(J['W']), m(J['H']), 'forearm' + sd, True)
        bone('thigh' + sd, m(J['P']), m(J['K']), 'hips')
        bone('shin' + sd, m(J['K']), m(J['A']), 'thigh' + sd, True)
        bone('foot' + sd, m(J['A']), m(J['T']), 'shin' + sd, True)
    if tail:
        bone('tail', tail[0], tail[1], 'hips')
    bpy.ops.object.mode_set(mode='OBJECT')

def goki_extras(F):
    F.tube('Tail', [(0, .1, .9), (0, .2, .86), (0, .28, .8), (.02, .34, .72), (.05, .36, .64)], [.045, .04, .035, .03, .026], 'tail', 'tail')
    a, d = Vector((-.38, .22, .98)), Vector((.6, 0, .8)).normalized()
    F.cone('Staff', .03, .03, 1.2, a, d, 10, 'staff', 'torso')
    for t in (0, 1.17):
        F.cone('StaffCap', .034, .034, .04, a + d * t, d, 10, 'rim', 'torso')

def shoes(F, cfg, k, fl):
    """simple shoes and socks for models whose feet were lost with the stand"""
    J = joints(cfg, k, fl)
    hem = (cfg['cut'] - fl) * k
    for s, sd in ((1, '_L'), (-1, '_R')):
        m = lambda v: Vector((v.x * s, v.y, v.z))
        A, T, K = m(J['A']), m(J['T']), m(J['K'])
        up = (K - A).normalized()
        # dark leg wrap from the shoe up into the trousers, a light band at the ankle, a round kung-fu shoe
        F.cone('Wrap', .058, .064, hem + .04 - A.z + .06, A - up * .06, up, 12, 'shoe', 'shin' + sd)
        F.cone('Band', .066, .066, .03, A + up * .02, up, 12, 'sock', 'shin' + sd)
        d = Vector((T.x - A.x, T.y - A.y, 0)).normalized()
        rot = Vector((0, 1, 0)).rotation_difference(d).to_matrix()
        F.sphere('Shoe', 1, Vector((A.x, A.y, .075)) + d * .07, (.085, .18, .08), 16, 10, 'shoe', 'foot' + sd, rot)

def convert(name, src):
    cfg = MODELS[name]
    F = Fig(name, cfg['colors'])
    ob = load(src, cfg)
    fl = cfg.get('floor', 0)
    k = .875 / (cfg['hips'] - fl)  # game units: feet at 0, hips at 0.875
    ob.data.transform(Matrix.Translation((0, 0, -fl * k)) @ Matrix.Scale(k, 4))
    img = textures(ob, cfg)
    if cfg.get('hair', True):
        split_hair(ob, img, cfg, k)
    if cfg.get('tilt'):
        raise_head(ob, cfg, k, fl)
    tail = ((0, .12, .9), (0, .3, .78)) if cfg.get('extras') == 'goki' else None
    skeleton(F, cfg, k, tail, fl)
    if cfg.get('extras') == 'goki':
        goki_extras(F)
    if cfg.get('extras') == 'shoes':
        shoes(F, cfg, k, fl)
    for im in bpy.data.images:
        im.pack()
    F.bodyob = ob
    F.export(os.path.join(ROOT, 'src', 'models', name + '.glb'), os.path.join(HERE, name + '.blend'), texcoords=True)

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    convert(args[0], args[1])
