# Building blocks for the Dragoneggs figures (used by build_figures.py).
# Units are the game's rig units: hips at 0.875, top of the head ~2.0. Figures face -Y (Blender front view).
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def roty(a):
    """turn around the vertical axis (the game's y rotation)"""
    return Matrix.Rotation(a, 3, 'Z')
def rot(a, axis):
    return Matrix.Rotation(a, 3, axis)
def aim(d):
    return Vector((0, 0, 1)).rotation_difference(Vector(d)).to_matrix()

class Fig:
    """One figure: skeleton + body + parts, all joined into one skinned mesh on export."""
    HR = .285  # head radius of the built-in figures (before head scale)

    def __init__(self, name, colors, arm_angle=42, sw=.29, hs=.7, piv=1.62):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.scene = bpy.context.scene
        self.name = name
        self.parts = []
        self.M = {}
        base = {'eye': '#ffffff', 'pupil': '#2a1c30', 'pupilcore': '#08060c', 'shine': '#ffffff', 'brow': '#16141e',
                'mouth': '#6a2424', 'lid': '#140c16', 'sole': '#18307a', 'rim': '#3a5ad8'}
        base.update(colors)
        for k, v in base.items():
            self.mat(k, v)
        self.A = math.radians(arm_angle)
        self.HS, self.PIV = hs, Vector((0, 0, piv))
        J = self.J = {}
        for s, sd in ((1, '_L'), (-1, '_R')):
            S = Vector((s * sw, 0, 1.47))
            E = S + self.armdir(s) * .3
            W = E + self.armdir(s) * .27
            J['S' + sd], J['E' + sd], J['W' + sd], J['H' + sd] = S, E, W, W + self.armdir(s) * .13
            J['P' + sd] = Vector((s * .105, 0, .85))
            J['K' + sd] = Vector((s * .115, -.01, .475))
            J['A' + sd] = Vector((s * .11, 0, .1))
            J['T' + sd] = Vector((s * .11, -.17, .03))

    # ---------- materials: names pick the colour from LOOKS in the game ----------
    def mat(self, name, hexcol):
        m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        h = hexcol.lstrip('#')
        rgb = [srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
        m.diffuse_color = (*rgb, 1)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (*rgb, 1)
        bsdf.inputs['Roughness'].default_value = 0.8
        self.M[name] = m
        return m

    # ---------- primitives (each becomes a rigid part on one bone) ----------
    def link(self, ob):
        self.scene.collection.objects.link(ob)
        return ob
    def finish(self, ob, matname, bone, keep=True):
        me = ob.data
        if matname:
            me.materials.clear()
            me.materials.append(self.M[matname])
        for p in me.polygons:
            p.use_smooth = True
        if bone:
            vg = ob.vertex_groups.new(name=bone)
            vg.add(range(len(me.vertices)), 1.0, 'REPLACE')
        if keep:
            self.parts.append(ob)
        return ob
    def from_bm(self, name, bm):
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        return self.link(bpy.data.objects.new(name, me))
    def sphere(self, name, r, loc, scale=(1, 1, 1), seg=16, rings=12, m=None, bone=None, rot=None):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
        bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        if rot:
            bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
        return self.finish(self.from_bm(name, bm), m, bone)
    def cone(self, name, r1, r2, h, base, direction, seg=10, m=None, bone=None, bend=0.0, scale=None):
        """cone/cylinder from `base` along `direction`; bend curls the tip a little"""
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
        bmesh.ops.translate(bm, vec=Vector((0, 0, h / 2)), verts=bm.verts)
        if scale:
            bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        if bend:
            for v in bm.verts:
                t = v.co.z / h
                v.co.x += bend * t * t * h
        bmesh.ops.rotate(bm, matrix=aim(direction), verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector(base), verts=bm.verts)
        return self.finish(self.from_bm(name, bm), m, bone)
    def tube(self, name, pts, radii, m, bone, seg=12, flat=1.0, steps=4):
        """one smooth tube through points (tails, beards, ponytails); flat < 1 squashes it into a strand"""
        pts = [Vector(p) for p in pts]
        # Catmull-Rom subdivision for a smooth path
        P, R = [], []
        for i in range(len(pts) - 1):
            p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
            for k in range(steps):
                t = k / steps
                t2, t3 = t * t, t * t * t
                P.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
                R.append(radii[i] + (radii[i + 1] - radii[i]) * t)
        P.append(pts[-1])
        R.append(radii[-1])
        bm = bmesh.new()
        rings = []
        up = Vector((0, 0, 1))
        for i, p in enumerate(P):
            tg = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized()
            side = tg.cross(up if abs(tg.dot(up)) < .9 else Vector((1, 0, 0))).normalized()
            nrm = side.cross(tg).normalized()
            rings.append([bm.verts.new(p + (side * math.cos(a) + nrm * math.sin(a) * flat) * R[i])
                          for a in (2 * math.pi * j / seg for j in range(seg))])
        for a, b in zip(rings, rings[1:]):
            for j in range(seg):
                bm.faces.new((a[j], a[(j + 1) % seg], b[(j + 1) % seg], b[j]))
        bm.faces.new(list(reversed(rings[0])))
        tip = bm.verts.new(P[-1] + (P[-1] - P[-2]).normalized() * R[-1] * .6)
        for j in range(seg):
            bm.faces.new((rings[-1][j], rings[-1][(j + 1) % seg], tip))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return self.finish(self.from_bm(name, bm), m, bone)
    def box(self, name, size, loc, m, bone, bevel=0.02, rot=None):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1)
        bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
        if bevel:
            bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=2, affect='EDGES')
        if rot:
            bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
        return self.finish(self.from_bm(name, bm), m, bone)
    def torus(self, name, R, r, loc, m, bone, scale=(1, 1, 1), rot=None, segs=24):
        bm = bmesh.new()
        ring = 8
        vs = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            vs.append([bm.verts.new(Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
                       for b in (2 * math.pi * j / ring for j in range(ring))])
        for i in range(segs):
            for j in range(ring):
                bm.faces.new((vs[i][j], vs[(i + 1) % segs][j], vs[(i + 1) % segs][(j + 1) % ring], vs[i][(j + 1) % ring]))
        bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        if rot:
            bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
        return self.finish(self.from_bm(name, bm), m, bone)
    def dome(self, name, r, loc, m, bone, cut=.45, scale=(1, 1, 1), rot=None, seg=24):
        """top part of a sphere (caps, helmets, hair)"""
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=16, radius=r)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < r * math.cos(math.pi * cut) - 1e-6], context='VERTS')
        bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        if rot:
            bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
        return self.finish(self.from_bm(name, bm), m, bone)

    # ---------- skeleton ----------
    def armdir(self, s):
        return Vector((s * math.sin(self.A), 0, -math.cos(self.A)))
    def skeleton(self, tail=False):
        J = self.J
        arm = bpy.data.armatures.new(self.name + 'Rig')
        self.rig = rig = self.link(bpy.data.objects.new(self.name + 'Rig', arm))
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')
        eb = arm.edit_bones
        def bone(name, head, tail, parent=None, connect=False):
            b = eb.new(name)
            b.head, b.tail = Vector(head), Vector(tail)
            if parent:
                b.parent = eb[parent]
                b.use_connect = connect
        bone('hips', (0, 0, .875), (0, 0, .98))
        bone('torso', (0, 0, .98), (0, 0, 1.56), 'hips')
        bone('head', (0, 0, 1.635), (0, 0, 1.95), 'torso')
        for sd in ('_L', '_R'):
            bone('upperarm' + sd, J['S' + sd], J['E' + sd], 'torso')
            bone('forearm' + sd, J['E' + sd], J['W' + sd], 'upperarm' + sd, True)
            bone('hand' + sd, J['W' + sd], J['H' + sd], 'forearm' + sd, True)
            bone('thigh' + sd, J['P' + sd], J['K' + sd], 'hips')
            bone('shin' + sd, J['K' + sd], J['A' + sd], 'thigh' + sd, True)
            bone('foot' + sd, J['A' + sd], J['T' + sd], 'shin' + sd, True)
        if tail:
            bone('tail', (0, .12, .9), (0, .3, .78), 'hips')
        bpy.ops.object.mode_set(mode='OBJECT')

    # ---------- body: one smooth mesh grown around a stick figure (Skin modifier) ----------
    def body(self, torso=((.175, .13), (.165, .12), (.225, .15), (.245, .14)), neck=(.08, .072), arm=1.0, leg=1.0,
             paint=None, legs=True):
        """torso radii (x, y) at pelvis, waist, chest, upper chest; arm/leg scale the limb thickness.
        paint(kind, t, centre) -> material name; kind is torso/neck/up/fore/leg"""
        J = self.J
        pts, edges, radii = [], [], []
        def P(co, r):
            pts.append(Vector(co))
            radii.append(r if isinstance(r, tuple) else (r, r))
            return len(pts) - 1
        def chain(*ids):
            edges.extend(zip(ids, ids[1:]))
        pelvis = P((0, 0, .86), torso[0])
        waist = P((0, 0, 1.0), torso[1])
        chest = P((0, 0, 1.24), torso[2])
        upper = P((0, -.005, 1.40), torso[3])
        n0 = P((0, 0, 1.53), (neck[0], neck[0] * .97))
        n1 = P((0, 0, 1.66), (neck[1], neck[1] * .97))
        chain(pelvis, waist, chest, upper, n0, n1)
        a, l = arm, leg
        for sd in ('_L', '_R'):
            S, E, W = J['S' + sd], J['E' + sd], J['W' + sd]
            chain(upper, P(S + Vector((0, 0, -.01)), (.112 * a, .105 * a)), P(S.lerp(E, .45), (.095 * a, .085 * a)), P(E, .066 * a),
                  P(E.lerp(W, .35), (.076 * a, .068 * a)), P(W, (.052 * a, .046 * a)))
            if legs:
                Pp, K, An = J['P' + sd], J['K' + sd], J['A' + sd]
                chain(pelvis, P(Pp + Vector((0, 0, -.02)), (.15 * l, .14 * l)), P(Pp.lerp(K, .5), (.15 * l, .145 * l)), P(K, .13 * l),
                      P(K.lerp(An, .45), (.125 * l, .12 * l)), P(An + Vector((0, 0, .1)), .07 * l))
        me = bpy.data.meshes.new('Body')
        me.from_pydata([tuple(p) for p in pts], edges, [])
        body = self.link(bpy.data.objects.new('Body', me))
        sk = body.modifiers.new('Skin', 'SKIN')
        sk.use_smooth_shade = True
        sk.branch_smoothing = 0.6
        for i, r in enumerate(radii):
            body.data.skin_vertices[0].data[i].radius = r
        body.data.skin_vertices[0].data[pelvis].use_root = True
        sub = body.modifiers.new('Sub', 'SUBSURF')
        sub.levels = sub.render_levels = 2
        dg = bpy.context.evaluated_depsgraph_get()
        me2 = bpy.data.meshes.new_from_object(body.evaluated_get(dg))
        body.modifiers.clear()
        body.data = me2
        self.bodyob = body
        # colour regions
        def seg_t(p, a, b):
            ab = b - a
            t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
            return t, (a + ab * t - p).length
        names = []
        idx = {}
        for poly in body.data.polygons:
            c = poly.center
            if c.z > 1.535 and abs(c.x) < .15:
                kind, t = 'neck', 0
            else:
                best = ('torso', (c.z - .86) / .67, seg_t(c, Vector((0, 0, .86)), Vector((0, 0, 1.53)))[1] - .15)
                for sd in ('_L', '_R'):
                    t, d = seg_t(c, J['S' + sd], J['E' + sd])
                    if d - .08 < best[2]:
                        best = ('up', t, d - .08)
                    t, d = seg_t(c, J['E' + sd], J['W' + sd])
                    if d - .06 < best[2]:
                        best = ('fore', t, d - .06)
                    t, d = seg_t(c, J['P' + sd], J['A' + sd])
                    if c.z < .86 and d - .1 < best[2]:
                        best = ('leg', t, d - .1)
                kind, t = best[0], best[1]
            m = paint(kind, t, c) if paint else ('skin' if kind in ('neck', 'up', 'fore') else 'gi')
            if m not in idx:
                idx[m] = len(names)
                names.append(m)
                body.data.materials.append(self.M[m])
            poly.material_index = idx[m]
        return body

    # ---------- standard pieces ----------
    def fists(self, scale=1.0, m='skin', claws=None):
        for s, sd in ((1, '_L'), (-1, '_R')):
            W, d = self.J['W' + sd], self.armdir(s)
            q = Vector((0, 0, -1)).rotation_difference(d).to_matrix()
            self.sphere('Fist' + sd, .068 * scale, W + d * .07 * scale, (.9, .78, 1.15), 14, 10, m, 'hand' + sd, q)
            self.sphere('Thumb' + sd, .026 * scale, W + d * .05 + Vector((0, -.055 * scale, 0)), (1, 1, 1.6), 8, 6, m, 'hand' + sd, q)
            if claws:
                for k in (-1, 0, 1):
                    base = W + d * .1 * scale + Vector((k * .03, -.05, 0))
                    self.cone('Claw', .016, 0, .07, base, d + Vector((0, -.6, 0)), 6, claws, 'hand' + sd)
    def boots(self, m='boots', rim='rim', sole='sole', h=.2, straps=True, shoe=False):
        for s, sd in ((1, '_L'), (-1, '_R')):
            x = self.J['A' + sd].x
            if not shoe:
                self.cone('BootShaft' + sd, .085, .09, h, (x, 0, .06), (0, 0, 1), 14, m, 'shin' + sd)
                if rim:
                    self.torus('BootRim' + sd, .09, .016, (x, 0, .06 + h + .005), rim, 'shin' + sd)
            self.box('BootFoot' + sd, (.145, .29, .1), (x, -.06, .05), m, 'foot' + sd, .035)
            self.box('Sole' + sd, (.15, .295, .03), (x, -.06, .012), sole, 'foot' + sd, .01)
            if straps:
                for k, yy in enumerate((-.12, -.17)):
                    self.box('Strap' + sd, (.152, .03, .02), (x, yy, .1 - k * .012), sole, 'foot' + sd, .005, rot(.5, 'X'))
    def sleeve_cuffs(self, m, at=.33, R=.086):
        for sd in ('_L', '_R'):
            S, E = self.J['S' + sd], self.J['E' + sd]
            self.torus('Cuff' + sd, R, .016, S.lerp(E, at), m, 'upperarm' + sd, rot=aim(E - S))

    # ---------- head (same anime shape as the built-in figures) ----------
    def G(self, x, y, z):
        """game head coords (x, y up, z front; head pivot at the neck) -> Blender"""
        return self.PIV + Vector((x * self.HS, -z * self.HS, y * self.HS))
    def head_deform(self, x, y, z, jaw=1.0):
        HR = self.HR
        t = min(1, -y / HR) if y < 0 else 0
        e = t * t * (3 - 2 * t)
        x *= .9 * (1 - .46 * e * jaw)
        if z > 0:
            z *= .95
        z *= 1 - .1 * e
        z += .055 * e * max(0, z / HR)
        y *= 1 + .24 * e
        return x, y, z
    def head(self, m='skin', jaw=1.0):
        self.jaw = jaw
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=24, radius=self.HR)
        for v in bm.verts:
            x, y, z = self.head_deform(v.co.x, v.co.z, -v.co.y, jaw)
            v.co = self.G(x, y + .26, z)
        return self.finish(self.from_bm('Head', bm), m, 'head')
    def fp(self, x, y, out=0):
        """point on the face surface (game head coords around the head centre)"""
        HR = self.HR
        z = math.sqrt(max(0, HR * HR - x * x - y * y))
        x2, y2, z2 = self.head_deform(x, y, z, getattr(self, 'jaw', 1.0))
        return self.G(x2, y2 + .26, z2 + out)
    def face(self, eyes=True, lashes=False, brow='brow', nose='skin', mouth=True, ears='skin', glasses=False, eyescale=1.0):
        HS = self.HS
        for s in (1, -1):
            if eyes and not glasses:
                es = eyescale
                self.sphere('Eye', .075 * HS * es, self.fp(s * .1, -.005, -.012), (.8, .42, 1.3 if lashes else 1.02), 14, 10, 'eye', 'head', roty(-s * .35))
                self.sphere('Iris', .05 * HS * es, self.fp(s * .095, -.012, .004), (.62, .32, .98), 12, 8, 'pupil', 'head', roty(-s * .35))
                self.sphere('Pupil', .026 * HS * es, self.fp(s * .093, -.012, .012), (.62, .3, 1.1), 8, 6, 'pupilcore', 'head', roty(-s * .35))
                self.sphere('Shine', .014 * HS * es, self.fp(s * .093 + .018, .014, .018), (1, 1, 1), 6, 4, 'shine', 'head')
                self.box('Lid', (.11 * HS, .03 * HS, .016 * HS), self.fp(s * .1, .06, .004), 'lid', 'head', 0, roty(-s * .35) @ rot(s * .12, 'Y'))
                if lashes:
                    self.box('Lash', (.035 * HS, .02 * HS, .016 * HS), self.fp(s * .15, .055, .004), 'lid', 'head', 0, rot(s * .7, 'Y'))
            if brow:
                self.box('Brow', (.1 * HS, .03 * HS, .024 * HS), self.fp(s * .105, .115, .004), brow, 'head', .002,
                         roty(-s * .35) @ rot(-s * .3, 'Y'))
            if ears:
                self.sphere('Ear', .055 * HS, self.G(s * .245, .25, -.02), (.45, .8, 1), 10, 8, ears, 'head')
        if nose:
            self.cone('Nose', .022 * HS, 0, .06 * HS, self.fp(0, -.085, -.01), (0, -1, -.35), 6, nose, 'head')
        if mouth:
            self.box('Mouth', (.075 * HS, .02 * HS, .014 * HS), self.fp(.006, -.155, .004), 'mouth', 'head', 0, rot(.08, 'Y'))
    def hair_cap(self, m='hair', tilt=-.4, sc=1.08, cut=.45):
        HR = self.HR
        bm = bmesh.new()
        r = .3 * sc
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=r)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < r * math.cos(math.pi * cut) - 1e-6], context='VERTS')
        c, sn = math.cos(tilt), math.sin(tilt)
        for v in bm.verts:
            x, y, z = v.co.x, v.co.z, -v.co.y
            y, z = y * c - z * sn, y * sn + z * c
            v.co = self.G(x, y + .26, z - .02)
        return self.finish(self.from_bm('HairCap', bm), m, 'head')
    def hair_shell(self, m='hair', front=.12, back=-.3, sc=1.07, seg=32):
        """hair that hugs the head: hairline at `front` height over the forehead, down to `back` at the neck"""
        HR = self.HR
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=24, radius=HR)
        kill = []
        for v in bm.verts:
            x, y, z = v.co.x, v.co.z, -v.co.y
            k = (1 - z / HR) / 2  # 0 at the front, 1 at the back
            if y < front + (back - front) * k:
                kill.append(v)
        bmesh.ops.delete(bm, geom=kill, context='VERTS')
        for v in bm.verts:
            x, y, z = self.head_deform(v.co.x * sc, v.co.z * sc, -v.co.y * sc, getattr(self, 'jaw', 1.0))
            v.co = self.G(x, y + .26, z)
        return self.finish(self.from_bm('HairShell', bm), m, 'head')
    def spikes(self, lst, r, h, m='hair', bend=.12):
        HS = self.HS
        for d in lst:
            v = Vector((d[0], d[1], d[2])).normalized()
            rr, hh = (d[3] if len(d) > 3 else r), (d[4] if len(d) > 4 else h)
            self.cone('Spike', rr * HS * 1.05, 0, hh * HS * 1.1, self.G(v.x * .24, .25 + v.y * .24, v.z * .24), Vector((v.x, -v.z, v.y)), 8, m, 'head', bend=bend)
    def gdir(self, x, y, z):
        """direction in game head coords -> Blender"""
        return Vector((x, -z, y))

    # ---------- skinning + export ----------
    def export(self, out_glb, out_blend, texcoords=False):
        for o in bpy.context.view_layer.objects:
            o.select_set(False)
        body = getattr(self, 'bodyob', None)
        if body:
            body.select_set(True)
            self.rig.select_set(True)
            bpy.context.view_layer.objects.active = self.rig
            bpy.ops.object.parent_set(type='ARMATURE_AUTO')
            body.select_set(False)
            self.rig.select_set(False)
        else:  # only rigid parts (robots): their vertex groups already say which bone moves them
            body = self.parts.pop(0)
            md = body.modifiers.new('Armature', 'ARMATURE')
            md.object = self.rig
            body.parent = self.rig
        for p in self.parts:
            p.select_set(True)
        body.select_set(True)
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.join()
        body.name = self.name
        print(self.name, 'vertices', len(body.data.vertices))
        os.makedirs(os.path.dirname(out_glb), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=out_blend)
        bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_yup=True, export_skins=True,
                                  export_animations=False, export_apply=False, export_materials='EXPORT', use_selection=False,
                                  export_texcoords=texcoords, export_image_format='JPEG', export_jpeg_quality=85)
