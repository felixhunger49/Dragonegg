# Builds Son Goki in Blender and exports src/models/goki.glb (+ blender/goki.blend to keep editing by hand).
# Run:  blender --background --python blender/build_goki.py      (or with the bpy Python module)
# Units are the game's rig units: hips at 0.875, top of the head ~2.0. Character faces -Y (Blender front view).
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_GLB = os.environ.get('OUT_GLB') or os.path.join(HERE, '..', 'src', 'models', 'goki.glb')
OUT_BLEND = os.environ.get('OUT_BLEND') or os.path.join(HERE, 'goki.blend')

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- materials (names pick the colour from LOOKS in the game) ----------
def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def mat(name, hexcol):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    h = hexcol.lstrip('#')
    rgb = [srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = 0.8
    return m
M = {k: mat(k, v) for k, v in {
    'skin': '#f8c088', 'gi': '#f07818', 'belt': '#2848c0', 'boots': '#2848c0', 'wrist': '#2848c0', 'under': '#2848c0',
    'hair': '#1c1a28', 'tail': '#8a5a30', 'staff': '#c81818', 'rim': '#3a5ad8', 'sole': '#18307a',
    'eye': '#ffffff', 'pupil': '#2a1c30', 'pupilcore': '#08060c', 'shine': '#ffffff', 'brow': '#16141e',
    'mouth': '#6a2424', 'symbol': '#f8f0e0', 'symbolink': '#202020'}.items()}

def link(ob):
    scene.collection.objects.link(ob)
    return ob
def finish(ob, matname, bone):
    """material for all faces, smooth shading, rigid weight to one bone"""
    me = ob.data
    if matname:
        me.materials.clear()
        me.materials.append(M[matname])
    for p in me.polygons:
        p.use_smooth = True
    if bone:
        vg = ob.vertex_groups.new(name=bone)
        vg.add(range(len(me.vertices)), 1.0, 'REPLACE')
    return ob
def apply_mods(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear()
    ob.data = me
    return ob
def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))

def sphere(name, r, loc, scale=(1, 1, 1), seg=16, rings=12, matname=None, bone=None, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    if rot:
        bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return finish(mesh_from_bm(name, bm), matname, bone)
def cone(name, r1, r2, h, base, direction, seg=10, matname=None, bone=None, bend=0.0):
    """cone/cylinder from `base` along `direction`; bend curls the tip sideways a bit"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.translate(bm, vec=Vector((0, 0, h / 2)), verts=bm.verts)
    # extra loops so it can bend smoothly
    if bend:
        for v in bm.verts:
            t = v.co.z / h
            v.co.x += bend * t * t * h
    d = Vector(direction).normalized()
    q = Vector((0, 0, 1)).rotation_difference(d)
    bmesh.ops.rotate(bm, matrix=q.to_matrix(), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(base), verts=bm.verts)
    return finish(mesh_from_bm(name, bm), matname, bone)
def box(name, size, loc, matname, bone, bevel=0.02, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=2, affect='EDGES')
    if rot:
        bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return finish(mesh_from_bm(name, bm), matname, bone)
def torus(name, R, r, loc, matname, bone, scale=(1, 1, 1), rot=None):
    bm = bmesh.new()
    segs, ring = 24, 8
    verts = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            p = Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
            row.append(bm.verts.new(p))
        verts.append(row)
    for i in range(segs):
        for j in range(ring):
            bm.faces.new((verts[i][j], verts[(i + 1) % segs][j], verts[(i + 1) % segs][(j + 1) % ring], verts[i][(j + 1) % ring]))
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    if rot:
        bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return finish(mesh_from_bm(name, bm), matname, bone)

# ---------- skeleton ----------
A = math.radians(float(os.environ.get('ARM_ANGLE', 42)))  # A-pose: arms 42 degrees out from hanging straight down
def armdir(s):
    return Vector((s * math.sin(A), 0, -math.cos(A)))
J = {}
for s, sd in ((1, '_L'), (-1, '_R')):
    S = Vector((s * .29, 0, 1.47))
    E = S + armdir(s) * .3
    W = E + armdir(s) * .27
    J['S' + sd], J['E' + sd], J['W' + sd], J['H' + sd] = S, E, W, W + armdir(s) * .13
    J['P' + sd] = Vector((s * .105, 0, .85))
    J['K' + sd] = Vector((s * .115, -.01, .475))
    J['A' + sd] = Vector((s * .11, 0, .1))
    J['T' + sd] = Vector((s * .11, -.17, .03))

arm_data = bpy.data.armatures.new('GokiRig')
rig = link(bpy.data.objects.new('GokiRig', arm_data))
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones
def bone(name, head, tail, parent=None):
    b = eb.new(name)
    b.head, b.tail = Vector(head), Vector(tail)
    if parent:
        b.parent = eb[parent]
    return b
bone('hips', (0, 0, .875), (0, 0, .98))
bone('torso', (0, 0, .98), (0, 0, 1.56), 'hips')
bone('head', (0, 0, 1.635), (0, 0, 1.95), 'torso')
for sd in ('_L', '_R'):
    bone('upperarm' + sd, J['S' + sd], J['E' + sd], 'torso')
    bone('forearm' + sd, J['E' + sd], J['W' + sd], 'upperarm' + sd).use_connect = True
    bone('hand' + sd, J['W' + sd], J['H' + sd], 'forearm' + sd).use_connect = True
    bone('thigh' + sd, J['P' + sd], J['K' + sd], 'hips')
    bone('shin' + sd, J['K' + sd], J['A' + sd], 'thigh' + sd).use_connect = True
    bone('foot' + sd, J['A' + sd], J['T' + sd], 'shin' + sd).use_connect = True
bone('tail', (0, .12, .9), (0, .3, .78), 'hips')
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- body: one smooth mesh grown around a stick figure (Skin modifier) ----------
pts, edges, radii = [], [], []
def P(co, r):
    pts.append(Vector(co))
    radii.append(r if isinstance(r, tuple) else (r, r))
    return len(pts) - 1
def chain(*ids):
    for a, b in zip(ids, ids[1:]):
        edges.append((a, b))
pelvis = P((0, 0, .86), (.175, .13))
waist = P((0, 0, 1.0), (.165, .12))
chest = P((0, 0, 1.24), (.225, .15))
upper = P((0, -.005, 1.40), (.245, .14))
neck0 = P((0, 0, 1.53), (.08, .078))
neck1 = P((0, 0, 1.66), (.072, .07))
chain(pelvis, waist, chest, upper, neck0, neck1)
for sd in ('_L', '_R'):
    S, E, W = J['S' + sd], J['E' + sd], J['W' + sd]
    sh = P(S + Vector((0, 0, -.01)), (.112, .105))
    bi = P(S.lerp(E, .45), (.095, .085))  # biceps
    el = P(E, .066)
    fo = P(E.lerp(W, .35), (.076, .068))  # forearm muscle
    wr = P(W, (.052, .046))
    chain(upper, sh, bi, el, fo, wr)
    Pp, K, An = J['P' + sd], J['K' + sd], J['A' + sd]
    hp = P(Pp + Vector((0, 0, -.02)), (.15, .14))
    th = P(Pp.lerp(K, .5), (.15, .145))  # baggy gi pants
    kn = P(K, .13)
    sn = P(K.lerp(An, .45), (.125, .12))
    an = P(An + Vector((0, 0, .1)), .07)
    chain(pelvis, hp, th, kn, sn, an)
me = bpy.data.meshes.new('Body')
me.from_pydata([tuple(p) for p in pts], edges, [])
body = link(bpy.data.objects.new('Body', me))
sk = body.modifiers.new('Skin', 'SKIN')
sk.use_smooth_shade = True
sk.branch_smoothing = 0.6
for i, r in enumerate(radii):
    body.data.skin_vertices[0].data[i].radius = r
body.data.skin_vertices[0].data[pelvis].use_root = True
sub = body.modifiers.new('Sub', 'SUBSURF')
sub.levels = sub.render_levels = 2
apply_mods(body)

# colour regions of the body mesh by position
def seg_t(p, a, b):
    ab = b - a
    t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
    return t, (a + ab * t - p).length
body.data.materials.clear()
order = ['gi', 'skin', 'belt', 'under', 'wrist']
for k in order:
    body.data.materials.append(M[k])
for poly in body.data.polygons:
    c = poly.center
    m = 'gi'
    if c.z > 1.535:
        m = 'skin'
    else:
        best = ('torso', 0, seg_t(c, Vector((0, 0, .86)), Vector((0, 0, 1.53)))[1] - .15)
        for sd in ('_L', '_R'):
            t, d = seg_t(c, J['S' + sd], J['E' + sd])
            if d - .08 < best[2]:
                best = ('up', t, d - .08)
            t, d = seg_t(c, J['E' + sd], J['W' + sd])
            if d - .06 < best[2]:
                best = ('fore', t, d - .06)
        kind, t = best[0], best[1]
        if kind == 'torso':
            if .93 < c.z < 1.07:
                m = 'belt'
            elif c.y < -.04 and c.z > 1.33 and abs(c.x) < (c.z - 1.33) * 1.05:
                m = 'under'
        elif kind == 'up':
            m = 'gi' if t < .33 else 'skin'
        elif kind == 'fore':
            m = 'wrist' if t > .74 else 'skin'
    poly.material_index = order.index(m)

parts = []
# ---------- sash: wide wrap with a knot and two hanging ends ----------
parts.append(sphere('Knot', .05, (.14, -.08, .99), (1, .8, 1), 10, 8, 'belt', 'hips'))
parts.append(box('SashEnd1', (.05, .02, .22), (.14, -.085, .86), 'belt', 'hips', .008, Matrix.Rotation(.12, 3, 'Y')))
parts.append(box('SashEnd2', (.045, .02, .18), (.17, -.07, .88), 'belt', 'hips', .008, Matrix.Rotation(-.15, 3, 'Y')))
# gi collar lapels (crossed V over the blue undershirt) and chest symbol
for s in (1, -1):
    parts.append(box('Lapel', (.05, .03, .27), (s * .07, -.128, 1.43), 'gi', 'torso', .01,
                     Matrix.Rotation(-.1, 3, 'X') @ Matrix.Rotation(s * .42, 3, 'Y')))
parts.append(cone('Symbol', .055, .055, .015, (.115, -.128, 1.39), (.15, -1, .1), 16, 'symbol', 'torso'))
parts.append(box('SymbolInk', (.03, .008, .04), (.117, -.143, 1.392), 'symbolink', 'torso', 0))
# sleeve cuffs
for sd in ('_L', '_R'):
    S, E = J['S' + sd], J['E' + sd]
    c = S.lerp(E, .33)
    q = Vector((0, 0, 1)).rotation_difference(E - S).to_matrix()
    parts.append(torus('Cuff' + sd, .086, .016, c, 'gi', 'upperarm' + sd, rot=q))
# ---------- hands: fists ----------
for s, sd in ((1, '_L'), (-1, '_R')):
    W = J['W' + sd]
    d = armdir(s)
    q = Vector((0, 0, -1)).rotation_difference(d).to_matrix()
    parts.append(sphere('Fist' + sd, .068, W + d * .07, (.9, .78, 1.15), 14, 10, 'skin', 'hand' + sd, q))
    parts.append(sphere('Thumb' + sd, .026, W + d * .05 + Vector((0, -.055, 0)), (1, 1, 1.6), 8, 6, 'skin', 'hand' + sd, q))
# ---------- boots ----------
for s, sd in ((1, '_L'), (-1, '_R')):
    An = J['A' + sd]
    parts.append(cone('BootShaft' + sd, .085, .09, .2, (An.x, 0, .06), (0, 0, 1), 14, 'boots', 'shin' + sd))
    parts.append(torus('BootRim' + sd, .09, .016, (An.x, 0, .265), 'rim', 'shin' + sd))
    parts.append(box('BootFoot' + sd, (.145, .29, .1), (An.x, -.06, .05), 'boots', 'foot' + sd, .035))
    parts.append(box('Sole' + sd, (.15, .295, .03), (An.x, -.06, .012), 'sole', 'foot' + sd, .01))
    for k, yy in enumerate((-.12, -.17)):
        parts.append(box('Strap' + sd, (.152, .03, .02), (An.x, yy, .1 - k * .012), 'sole', 'foot' + sd, .005, Matrix.Rotation(.5, 3, 'X')))

# ---------- head (same anime shape as the built-in figure) ----------
HR, HS, PIV = .285, .7, Vector((0, 0, 1.62))
def G(x, y, z):
    """game head coords (x, y up, z front) -> Blender"""
    return PIV + Vector((x * HS, -z * HS, y * HS))
def head_deform(x, y, z):
    t = min(1, -y / HR) if y < 0 else 0
    e = t * t * (3 - 2 * t)
    x *= .9 * (1 - .46 * e)
    if z > 0:
        z *= .95
    z *= 1 - .1 * e
    z += .055 * e * max(0, z / HR)
    y *= 1 + .24 * e
    return x, y, z
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=24, radius=HR)
for v in bm.verts:
    x, y, z = head_deform(v.co.x, v.co.z, -v.co.y)  # blender (x, -front, up) -> game (x, up, front)
    v.co = G(x, y + .26, z)
head = finish(mesh_from_bm('Head', bm), 'skin', 'head')
parts.append(head)
def face_pt(x, y, out=0):
    z = math.sqrt(max(0, HR * HR - x * x - y * y))
    x2, y2, z2 = head_deform(x, y, z)
    return G(x2, y2 + .26, z2 + out)
def roty(a):
    return Matrix.Rotation(a, 3, 'Z')  # game y-rotation = blender z-rotation
for s in (1, -1):
    parts.append(sphere('Eye', .075 * HS, face_pt(s * .1, -.005, -.012), (.8, .42, 1.02), 14, 10, 'eye', 'head', roty(-s * .35)))
    parts.append(sphere('Iris', .05 * HS, face_pt(s * .095, -.012, .004), (.62, .32, .98), 12, 8, 'pupil', 'head', roty(-s * .35)))
    parts.append(sphere('Pupil', .026 * HS, face_pt(s * .093, -.012, .012), (.62, .3, 1.1), 8, 6, 'pupilcore', 'head', roty(-s * .35)))
    parts.append(sphere('Shine', .014 * HS, face_pt(s * .093 + .018, .014, .018), (1, 1, 1), 6, 4, 'shine', 'head'))
    parts.append(box('Lid', (.11 * HS, .03 * HS, .016 * HS), face_pt(s * .1, .06, .004), 'brow', 'head', 0,
                     roty(-s * .35) @ Matrix.Rotation(s * .12, 3, 'Y')))
    parts.append(box('Brow', (.1 * HS, .03 * HS, .024 * HS), face_pt(s * .105, .115, .004), 'brow', 'head', .002,
                     roty(-s * .35) @ Matrix.Rotation(-s * .3, 3, 'Y')))
    parts.append(sphere('Ear', .055 * HS, G(s * .245, .25, -.02), (.45, .8, 1), 10, 8, 'skin', 'head'))
parts.append(cone('Nose', .022 * HS, 0, .06 * HS, face_pt(0, -.085, -.01), (0, -1, -.35), 6, 'skin', 'head'))
parts.append(box('Mouth', (.075 * HS, .02 * HS, .014 * HS), face_pt(.006, -.155, .004), 'mouth', 'head', 0, Matrix.Rotation(.08, 3, 'Y')))

# ---------- hair: Goki's spikes ----------
def hair_cap():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=.3 * 1.08)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < .3 * 1.08 * math.cos(math.pi * .45)], context='VERTS')
    for v in bm.verts:
        x, y, z = v.co.x, v.co.z, -v.co.y  # game coords around the cap centre
        c, sn = math.cos(-.4), math.sin(-.4)
        y, z = y * c - z * sn, y * sn + z * c
        v.co = G(x, y + .26, z - .02)
    return finish(mesh_from_bm('HairCap', bm), 'hair', 'head')
parts.append(hair_cap())
def spikes(lst, r, h):
    for d in lst:
        v = Vector((d[0], d[1], d[2])).normalized()
        rr, hh = (d[3] if len(d) > 3 else r), (d[4] if len(d) > 4 else h)
        base = (v.x * .24, .25 + v.y * .24, v.z * .24)
        bdir = Vector((v.x, -v.z, v.y))
        parts.append(cone('Spike', rr * HS * 1.05, 0, hh * HS * 1.1, G(*base), bdir, 8, 'hair', 'head', bend=.12))
spikes([[0, 1, .15, .13, .42], [.5, .85, 0, .12, .4], [-.5, .85, 0, .12, .4], [.85, .45, -.15, .11, .36], [-.85, .45, -.15, .11, .36],
        [0, .6, -.8, .13, .44], [.55, .3, -.8, .12, .4], [-.55, .3, -.8, .12, .4], [.3, -.15, -.95, .11, .34], [-.3, -.15, -.95, .11, .34],
        [.7, .75, -.5, .11, .36], [-.7, .75, -.5, .11, .36]], .12, .4)
spikes([[.3, 1, -.3, .09, .3], [-.3, 1, -.3, .09, .3], [.95, .15, .1, .08, .26], [-.95, .15, .1, .08, .26], [.15, .35, -1, .09, .32],
        [-.15, .35, -1, .09, .32], [0, -.4, -1, .09, .26]], .09, .3)
for b in ([-.12, .48, .2], [.02, .5, .23], [.15, .47, .2]):  # bangs over the forehead
    parts.append(cone('Bang', .07 * HS, 0, .2 * HS, G(*b), Vector((b[0] * .5, -1, -.7)), 6, 'hair', 'head'))
for s in (1, -1):  # sideburns
    parts.append(cone('Side', .05 * HS, 0, .16 * HS, G(s * .24, .3, .12), Vector((s * .3, -.3, -1)), 6, 'hair', 'head'))

# ---------- tail and staff ----------
tail_pts = [Vector((0, .1, .9)), Vector((0, .2, .86)), Vector((0, .28, .8)), Vector((.02, .34, .72)), Vector((.05, .36, .64))]
for i, (a, b) in enumerate(zip(tail_pts, tail_pts[1:])):
    parts.append(cone('Tail', .045 - i * .005, .04 - i * .005, (b - a).length + .02, a, b - a, 10, 'tail', 'tail'))
parts.append(sphere('TailTip', .03, tail_pts[-1], (1, 1, 1), 8, 6, 'tail', 'tail'))
parts.append(cone('Staff', .03, .03, 1.2, (-.36, .2, .95), (.65, 0, .76), 10, 'staff', 'torso'))
for z in (.0, 1.17):
    d = Vector((.65, 0, .76)).normalized()
    parts.append(cone('StaffCap', .034, .034, .04, Vector((-.36, .2, .95)) + d * z, d, 10, 'rim', 'torso'))

# ---------- skinning: automatic weights for the body, rigid parts keep their single bone ----------
for o in bpy.context.view_layer.objects:
    o.select_set(False)
body.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
body.select_set(False)
rig.select_set(False)
for p in parts:
    p.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body.name = 'Goki'
print('vertices', len(body.data.vertices), 'faces', len(body.data.polygons))

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', export_yup=True, export_skins=True,
                          export_animations=False, export_apply=False, export_materials='EXPORT', use_selection=False)
print('exported', OUT_GLB)
