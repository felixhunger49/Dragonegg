# Builds the Dragoneggs figures in Blender: blender/<name>.blend + src/models/<name>.glb
# Run:  blender --background --python blender/build_figures.py -- goki wulma      (no names = all)
#   or with the bpy Python module:  python blender/build_figures.py goki wulma
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: F401 (makes mathutils available when run with the bpy module)
from mathutils import Vector
from figlib import Fig, rot, roty, aim

HERE = os.path.dirname(os.path.abspath(__file__))

def vneck(c, depth=1.33, width=1.05):
    return c.y < -.04 and c.z > depth and abs(c.x) < (c.z - depth) * width
def gi_paint(under='under', sleeve=.33, wrist=True, belt=(.93, 1.07)):
    """martial-arts gi: V-neck, sash, short sleeves, wrist bands"""
    def paint(kind, t, c):
        if kind == 'neck':
            return 'skin'
        if kind == 'torso':
            if belt and belt[0] < c.z < belt[1]:
                return 'belt'
            if under and vneck(c):
                return under
            return 'gi'
        if kind == 'up':
            return 'gi' if t < sleeve else 'skin'
        if kind == 'fore':
            return 'wrist' if wrist and t > .74 else 'skin'
        return 'pants'
    return paint
def sash(F, knot=True):
    if knot:
        F.sphere('Knot', .05, (.14, -.08, .99), (1, .8, 1), 10, 8, 'belt', 'hips')
        F.box('SashEnd1', (.05, .02, .22), (.14, -.085, .86), 'belt', 'hips', .008, rot(.12, 'Y'))
        F.box('SashEnd2', (.045, .02, .18), (.17, -.07, .88), 'belt', 'hips', .008, rot(-.15, 'Y'))
def lapels(F, m='gi'):
    for s in (1, -1):
        F.box('Lapel', (.05, .03, .27), (s * .07, -.128, 1.43), m, 'torso', .01, rot(-.1, 'X') @ rot(s * .42, 'Y'))
def symbol(F):
    F.cone('Symbol', .055, .055, .015, (.115, -.128, 1.39), (.15, -1, .1), 16, 'symbol', 'torso')
    F.box('SymbolInk', (.03, .008, .04), (.117, -.143, 1.392), 'symbolink', 'torso', 0)
def surf(F, x, y, z, r=.3):
    v = Vector((x, y, z)).normalized() * r
    return F.G(v.x, v.y + .25, v.z)

# ---------------------------------------------------------------- heroes
def goki():
    F = Fig('goki', {'skin': '#f8c088', 'gi': '#f07818', 'pants': '#f07818', 'belt': '#2848c0', 'boots': '#2848c0', 'wrist': '#2848c0',
                     'under': '#2848c0', 'hair': '#1c1a28', 'tail': '#8a5a30', 'staff': '#c81818', 'symbol': '#f8f0e0', 'symbolink': '#202020'})
    F.skeleton(tail=True)
    F.body(paint=gi_paint())
    sash(F); lapels(F); symbol(F); F.sleeve_cuffs('gi'); F.fists(); F.boots()
    F.head(); F.face()
    F.hair_cap('hair', -.4, 1.08)
    F.spikes([[0, 1, .15, .13, .42], [.5, .85, 0, .12, .4], [-.5, .85, 0, .12, .4], [.85, .45, -.15, .11, .36], [-.85, .45, -.15, .11, .36],
              [0, .6, -.8, .13, .44], [.55, .3, -.8, .12, .4], [-.55, .3, -.8, .12, .4], [.3, -.15, -.95, .11, .34], [-.3, -.15, -.95, .11, .34],
              [.7, .75, -.5, .11, .36], [-.7, .75, -.5, .11, .36]], .12, .4)
    F.spikes([[.3, 1, -.3, .09, .3], [-.3, 1, -.3, .09, .3], [.95, .15, .1, .08, .26], [-.95, .15, .1, .08, .26], [.15, .35, -1, .09, .32],
              [-.15, .35, -1, .09, .32], [0, -.4, -1, .09, .26]], .09, .3)
    for b in ([-.12, .48, .2], [.02, .5, .23], [.15, .47, .2]):  # bangs
        F.cone('Bang', .07 * F.HS, 0, .2 * F.HS, F.G(*b), Vector((b[0] * .5, -1, -.7)), 6, 'hair', 'head')
    for s in (1, -1):  # sideburns
        F.cone('Side', .05 * F.HS, 0, .16 * F.HS, F.G(s * .24, .3, .12), Vector((s * .3, -.3, -1)), 6, 'hair', 'head')
    F.tube('Tail', [(0, .1, .9), (0, .2, .86), (0, .28, .8), (.02, .34, .72), (.05, .36, .64)], [.045, .04, .035, .03, .026], 'tail', 'tail')
    F.cone('Staff', .03, .03, 1.2, (-.36, .2, .95), (.65, 0, .76), 10, 'staff', 'torso')
    d = Vector((.65, 0, .76)).normalized()
    for z in (.0, 1.17):
        F.cone('StaffCap', .034, .034, .04, Vector((-.36, .2, .95)) + d * z, d, 10, 'rim', 'torso')
    return F

def kurikin():
    F = Fig('kurikin', {'skin': '#f8c088', 'gi': '#f07818', 'pants': '#f07818', 'belt': '#2848c0', 'boots': '#2848c0', 'wrist': '#2848c0',
                        'under': '#2848c0', 'symbol': '#f8f0e0', 'symbolink': '#202020', 'detail_dots': '#8a4020', 'detail_shine': '#fff4dc'},
            hs=.76, sw=.27)
    F.skeleton()
    F.body(torso=((.165, .125), (.155, .115), (.205, .14), (.225, .135)), arm=.92, paint=gi_paint())
    sash(F); lapels(F); symbol(F); F.sleeve_cuffs('gi', R=.08); F.fists(.95); F.boots()
    F.head(jaw=.85)
    F.face(nose=None, eyescale=1.08)
    # bald head: six marks on the forehead and a shiny spot
    for p in ([-.07, .86, .5], [0, .88, .48], [.07, .86, .5], [-.07, .8, .6], [0, .82, .58], [.07, .8, .6]):
        F.sphere('Dot', .016 * F.HS, surf(F, *p, r=.288), (1, 1, 1), 6, 4, 'detail_dots', 'head')
    F.sphere('Shine', .04 * F.HS, surf(F, .3, .9, .25, r=.286), (1, .5, 1), 8, 6, 'detail_shine', 'head')
    return F

def joshi():
    F = Fig('joshi', {'skin': '#f0b880', 'gi': '#e8583a', 'pants': '#e8d8a0', 'belt': '#3a8a3a', 'boots': '#a87038', 'sole': '#6a4420',
                      'beard': '#f4f4f4', 'whitehair': '#e8e8e8', 'brow': '#e0e0e0', 'glasses': '#101014', 'shell': '#3a9a3a', 'shellrim': '#e0c070',
                      'detail_shine': '#fff4dc', 'detail_flower': '#ffe040'}, sw=.28, piv=1.6)
    F.skeleton()
    def paint(kind, t, c):  # loose shirt with long sleeves, rolled up a bit
        if kind == 'neck':
            return 'skin'
        if kind == 'torso':
            if .95 < c.z < 1.04:
                return 'belt'
            return 'skin' if vneck(c, 1.42, .7) else 'gi'
        if kind == 'up':
            return 'gi'
        if kind == 'fore':
            return 'gi' if t < .4 else 'skin'
        return 'pants'
    F.body(torso=((.18, .14), (.175, .135), (.21, .145), (.225, .135)), arm=.9, paint=paint)
    F.sleeve_cuffs('gi', at=.92, R=.075)
    for sd in ('_L', '_R'):
        E, W = F.J['E' + sd], F.J['W' + sd]
        F.torus('RollUp' + sd, .074, .02, E.lerp(W, .4), 'gi', 'forearm' + sd, rot=aim(W - E))
    F.fists(.95)
    F.boots(shoe=True, straps=False)
    F.head(jaw=.95)
    F.face(eyes=False, brow='brow', glasses=True)
    G, HS = F.G, F.HS
    # sunglasses
    F.box('Glasses', (.28 * HS, .06 * HS, .075 * HS), G(0, .27, .29), 'glasses', 'head', .01)
    for s in (1, -1):
        F.box('GlassArm', (.03 * HS, .2 * HS, .03 * HS), G(s * .15, .27, .19), 'glasses', 'head', 0)
    # bald with white tufts, mustache and a long beard
    F.sphere('Shine', .04 * HS, surf(F, .25, .9, .3, r=.286), (1, .5, 1), 8, 6, 'detail_shine', 'head')
    for s in (1, -1):
        F.sphere('Tuft', .1 * HS, G(s * .25, .24, -.12), (1, 1.1, 1.3), 10, 8, 'whitehair', 'head')
        F.cone('Mustache', .035 * HS, .012 * HS, .14 * HS, F.fp(s * .02, -.11, .0), Vector((s * 1, -.2, -.6)), 8, 'beard', 'head', bend=.2)
    F.cone('Beard', .17 * HS, .02 * HS, .5 * HS, G(0, .02, .17), Vector((0, -.35, -1)), 14, 'beard', 'head', bend=.1)
    # turtle shell on the back
    F.sphere('Shell', .34, (0, .27, 1.22), (1.05, .5, 1.2), 20, 14, 'shell', 'torso')
    F.torus('ShellRim', .34, .035, (0, .23, 1.22), 'shellrim', 'torso', scale=(1.05, 1.2, 1), rot=rot(math.pi / 2, 'X'))
    for s in (1, -1):
        F.box('Strap', (.05, .03, .5), (s * .13, -.14, 1.25), 'shellrim', 'torso', .01, rot(s * .1, 'Y'))
    return F

def tjamtschu():
    F = Fig('tjamtschu', {'skin': '#e0a870', 'gi': '#48a058', 'pants': '#3a6a9a', 'belt': '#e8c848', 'boots': '#784828', 'wrist': '#e8c848',
                          'hair': '#1c1a28', 'detail_scar': '#b03030', 'sole': '#4a2c18', 'rim': '#9a6038'})
    F.skeleton()
    F.body(torso=((.175, .13), (.165, .12), (.23, .15), (.25, .14)), paint=gi_paint(under='skin', sleeve=.28))
    sash(F); lapels(F); F.sleeve_cuffs('gi', at=.28); F.fists(); F.boots()
    F.head(jaw=1.05)
    F.face()
    G, HS = F.G, F.HS
    F.box('Scar', (.015 * HS, .01 * HS, .09 * HS), F.fp(-.17, .03, .004), 'detail_scar', 'head', 0, rot(.3, 'Y'))
    F.box('Scar2', (.015 * HS, .01 * HS, .07 * HS), F.fp(-.14, .03, .004), 'detail_scar', 'head', 0, rot(-.6, 'Y'))
    # long wild mane
    F.hair_shell('hair', front=.16, back=-.3, sc=1.08)
    for x in (-.2, -.1, 0, .1, .2):
        top = G(x * 1.1, .4, -.18)
        F.tube('Mane', [top, top + Vector((x * .12, .1, -.12)), top + Vector((x * .2, .15, -.35)), top + Vector((x * .22, .12, -.55))],
               [.07, .065, .05, .02], 'hair', 'head')
    F.spikes([[0, -.5, -1, .1, .3], [.4, -.4, -.9, .09, .28], [-.4, -.4, -.9, .09, .28], [.6, .6, -.4, .1, .3], [-.6, .6, -.4, .1, .3]], .1, .3)
    for b in ([-.1, .47, .2], [.08, .48, .22], [.2, .44, .18]):
        F.cone('Bang', .07 * HS, 0, .2 * HS, G(*b), Vector((b[0] * .3, -1, -.7)), 6, 'hair', 'head', bend=.15)
    return F

def wulma():
    F = Fig('wulma', {'skin': '#f8c8a0', 'gi': '#f070a8', 'pants': '#f8c8a0', 'belt': '#f8f0f8', 'boots': '#d02828', 'hair': '#30c0c8',
                      'ribbon': '#e83838', 'sole': '#801818', 'rim': '#f04848', 'mouth': '#c04050', 'pupil': '#2a6ab0', 'lipstick': '#e05070'},
            sw=.255, hs=.74)
    F.skeleton()
    def paint(kind, t, c):
        if kind == 'neck':
            return 'skin'
        if kind == 'torso':
            if .99 < c.z < 1.05:
                return 'belt'
            return 'skin' if c.z > 1.47 and c.y < 0 and abs(c.x) < .1 else 'gi'
        if kind == 'up':
            return 'gi' if t < .25 else 'skin'
        if kind == 'fore':
            return 'skin'
        return 'pants'
    F.body(torso=((.165, .12), (.135, .105), (.19, .135), (.2, .125)), neck=(.065, .058), arm=.78, leg=.72, paint=paint)
    # puffy sleeves and the skirt
    for s, sd in ((1, '_L'), (-1, '_R')):
        S = F.J['S' + sd]
        F.sphere('Puff' + sd, .1, S + F.armdir(s) * .03, (1.05, 1, .95), 14, 10, 'gi', 'upperarm' + sd)
    F.cone('Skirt', .165, .32, .44, (0, 0, 1.02), (0, 0, -1), 24, 'gi', 'hips')
    F.torus('SkirtHem', .32, .02, (0, 0, .58), 'belt', 'hips')
    F.fists(.85)
    F.boots(h=.24, straps=False)
    F.head(jaw=.8)
    F.face(lashes=True, eyescale=1.1, nose='skin')
    G, HS = F.G, F.HS
    F.hair_shell('hair', front=.13, back=-.28, sc=1.08)
    for s in (1, -1):  # locks framing the face, down to the chin
        F.tube('SideLock', [G(s * .27, .4, .12), G(s * .29, .2, .13), G(s * .26, -.02, .13), G(s * .22, -.14, .12)],
               [.075 * HS, .07 * HS, .055 * HS, .02 * HS], 'hair', 'head', flat=.55)
    F.tube('Ponytail', [G(0, .42, -.3), G(0, .3, -.42), G(0, .05, -.46), G(.02, -.2, -.42)], [.1 * HS, .1 * HS, .08 * HS, .025 * HS], 'hair', 'head')
    for x, d in ((-.16, .3), (-.04, .1), (.08, -.1), (.18, -.3)):  # fringe
        F.tube('Bang', [G(x, .5, .2), G(x + d * .1, .44, .27), G(x + d * .2, .33, .28)], [.06 * HS, .05 * HS, .012 * HS], 'hair', 'head', flat=.45)
    F.box('Ribbon', (.2 * HS, .07 * HS, .1 * HS), G(0, .42, -.36), 'ribbon', 'head', .01, rot(.3, 'X'))
    return F

# ---------------------------------------------------------------- enemies
def clothes(sleeve=.33, longsleeve=False, under=None, belt=(.95, 1.05), wrist=False, open_front=None, top='gi'):
    """generic outfit painter: sleeve length, long sleeves (to the wrist), V-neck colour, open vest showing the chest"""
    def paint(kind, t, c):
        if kind == 'neck':
            return 'skin'
        if kind == 'torso':
            if belt and belt[0] < c.z < belt[1]:
                return 'belt'
            if open_front and c.y < -.05 and c.z > 1.05 and abs(c.x) < .07 + (c.z - 1.05) * .12:
                return open_front
            if under and vneck(c):
                return under
            return top
        if kind == 'up':
            return top if longsleeve or t < sleeve else 'skin'
        if kind == 'fore':
            if wrist and t > .74:
                return 'wrist'
            return top if longsleeve else 'skin'
        return 'pants'
    return paint
def angry_brows(F, m='brow'):
    HS = F.HS
    for s in (1, -1):
        F.box('Brow', (.11 * HS, .035 * HS, .03 * HS), F.fp(s * .1, .1, .006), m, 'head', .002, roty(-s * .35) @ rot(s * .35, 'Y'))

def bandit():
    F = Fig('bandit', {'skin': '#d8a068', 'gi': '#8a5a30', 'pants': '#5a3a20', 'belt': '#c03030', 'boots': '#3a2818', 'hair': '#3a2818',
                       'band': '#c03030', 'sole': '#24180e', 'rim': '#5a4030', 'detail_stubble': '#8a6040'})
    F.skeleton()
    F.body(torso=((.18, .13), (.17, .125), (.23, .15), (.25, .14)), arm=1.05, paint=clothes(sleeve=0, open_front='skin'))
    F.fists(1.05); F.boots(straps=False)
    F.head(jaw=1.1)
    F.face(brow=None)
    angry_brows(F)
    G, HS = F.G, F.HS
    F.hair_shell('hair', front=.18, back=-.25, sc=1.06)
    F.torus('Headband', .3 * HS * 1.0, .04 * HS, G(0, .36, .0), 'band', 'head', scale=(1, 1.05, 1))
    F.tube('BandTail', [G(-.05, .32, -.3), G(-.1, .2, -.42), G(-.08, .05, -.45)], [.03 * HS, .03 * HS, .02 * HS], 'band', 'head', flat=.4)
    F.sphere('Stubble', .17 * HS, F.fp(0, -.17, -.06), (1.1, .5, .55), 12, 8, 'detail_stubble', 'head')
    return F

def soldier():
    F = Fig('soldier', {'skin': '#e8b078', 'gi': '#5a7040', 'pants': '#5a7040', 'belt': '#2a2a2a', 'boots': '#2a2a2a', 'hair': '#3e5430',
                        'visor': '#2e3e22', 'sole': '#151515', 'rim': '#3a3a3a', 'pocket': '#4a5e34', 'buckle': '#c8b048'})
    F.skeleton()
    F.body(torso=((.175, .13), (.165, .12), (.225, .15), (.245, .14)), paint=clothes(longsleeve=True))
    for s in (1, -1):
        F.box('Pocket', (.08, .02, .07), (s * .1, -.142, 1.32), 'pocket', 'torso', .01)
    F.box('Buckle', (.06, .02, .045), (0, -.17, 1.0), 'buckle', 'hips', .008)
    F.fists(); F.boots(h=.24, straps=False)
    F.head()
    F.face(brow=None)
    angry_brows(F)
    G, HS = F.G, F.HS
    F.dome('Helmet', .34 * HS, G(0, .26, 0), 'hair', 'head', cut=.5, scale=(1.02, 1.05, 1))
    F.box('Visor', (.32 * HS, .14 * HS, .03 * HS), G(0, .33, .3), 'visor', 'head', .01, rot(-.2, 'X'))
    F.torus('HelmetRim', .34 * HS, .02 * HS, G(0, .26, 0), 'visor', 'head')
    return F

def ninja():
    F = Fig('ninja', {'skin': '#e8b078', 'gi': '#4a2a6a', 'pants': '#4a2a6a', 'belt': '#c8a020', 'boots': '#2a1a3a', 'hair': '#3a1a5a',
                      'scarf': '#c02040', 'sole': '#1a1028', 'rim': '#3a2a50', 'wrap': '#2a1a3a'})
    F.skeleton()
    F.body(torso=((.165, .12), (.15, .11), (.21, .14), (.23, .13)), arm=.95, leg=.9, paint=clothes(longsleeve=True, belt=(.96, 1.06)))
    for sd in ('_L', '_R'):
        E, W = F.J['E' + sd], F.J['W' + sd]
        F.torus('Wrap' + sd, .062, .014, E.lerp(W, .8), 'wrap', 'forearm' + sd, rot=aim(W - E))
    F.fists(.95, m='wrap')
    F.boots(rim=None, straps=False, h=.22)
    F.tube('BeltTail', [(.1, -.12, 1.0), (.16, -.06, .9), (.18, .0, .8)], [.025, .022, .015], 'belt', 'hips', flat=.4)
    F.head()
    G, HS = F.G, F.HS
    # hood covers the whole head, a skin-coloured slit shows the eyes
    F.hair_shell('hair', front=-.5, back=-.6, sc=1.07)
    F.box('Slit', (.36 * HS, .1 * HS, .06 * HS), G(0, .27, .26), 'skin', 'head', .02)
    for s in (1, -1):
        F.sphere('Eye', .045 * HS, G(s * .09, .27, .3), (1, .4, .7), 10, 8, 'lid', 'head')
        F.box('Brow', (.1 * HS, .03 * HS, .03 * HS), G(s * .09, .33, .3), 'brow', 'head', 0, rot(s * .4, 'Y'))
    F.tube('Scarf', [G(0, .05, -.25), G(.06, -.12, -.42), G(.12, -.4, -.5), G(.2, -.7, -.48)], [.06 * HS, .07 * HS, .065 * HS, .04 * HS],
           'scarf', 'torso', flat=.3)
    F.torus('ScarfRing', .2 * HS, .05 * HS, G(0, .02, 0), 'scarf', 'head', scale=(1.05, 1, 1))
    return F

def robot():
    F = Fig('robot', {'skin': '#a8b0c0', 'gi': '#707888', 'pants': '#58606e', 'belt': '#e8c020', 'boots': '#40464f', 'visor': '#ff3030',
                      'joint': '#40464f', 'sole': '#2a2e36', 'rim': '#8a929e'}, arm_angle=30)
    F.skeleton()
    J = F.J
    F.box('Chest', (.5, .34, .5), (0, 0, 1.3), 'gi', 'torso', .04)
    F.box('ChestPlate', (.32, .04, .14), (0, -.17, 1.38), 'belt', 'torso', .015)
    F.box('Belly', (.36, .3, .26), (0, 0, 1.02), 'gi', 'torso', .04)
    F.box('Hip', (.4, .3, .16), (0, 0, .87), 'pants', 'hips', .03)
    F.cone('Neck', .07, .07, .14, (0, 0, 1.54), (0, 0, 1), 10, 'joint', 'torso')
    for s, sd in ((1, '_L'), (-1, '_R')):
        S, E, W = J['S' + sd], J['E' + sd], J['W' + sd]
        F.sphere('Shoulder', .11, S, (1, 1, 1), 14, 10, 'gi', 'upperarm' + sd)
        F.cone('Upper', .07, .065, (E - S).length, S, E - S, 10, 'skin', 'upperarm' + sd)
        F.sphere('Elbow', .07, E, (1, 1, 1), 12, 8, 'joint', 'forearm' + sd)
        F.cone('Lower', .075, .065, (W - E).length, E, W - E, 10, 'gi', 'forearm' + sd)
        F.sphere('Hand', .08, W + F.armdir(s) * .07, (1, .9, 1.1), 12, 8, 'skin', 'hand' + sd)
        Pp, K, An = J['P' + sd], J['K' + sd], J['A' + sd]
        F.cone('Thigh', .09, .08, (K - Pp).length, Pp, K - Pp, 10, 'pants', 'thigh' + sd)
        F.sphere('Knee', .085, K, (1, 1, 1), 12, 8, 'joint', 'shin' + sd)
        F.cone('Shin', .085, .075, (An - K).length, K, An - K, 10, 'skin', 'shin' + sd)
    F.boots(rim=None, straps=False, h=.16)
    F.box('HeadBox', (.42, .38, .36), (0, -.01, 1.83), 'skin', 'head', .05)
    F.box('Visor', (.34, .04, .08), (0, -.2, 1.86), 'visor', 'head', .015)
    F.box('Mouth', (.2, .03, .05), (0, -.2, 1.74), 'joint', 'head', .01)
    for s in (1, -1):
        F.cone('Ear', .06, .06, .05, (s * .21, 0, 1.84), (s, 0, 0), 12, 'joint', 'head')
    F.cone('Antenna', .012, .012, .22, (.12, 0, 2.0), (0, 0, 1), 6, 'joint', 'head')
    F.sphere('AntennaTip', .035, (.12, 0, 2.23), (1, 1, 1), 8, 6, 'visor', 'head')
    F.bodyob = None
    return F

# ---------------------------------------------------------------- bosses
def hauzahn():
    F = Fig('hauzahn', {'skin': '#9a8a7a', 'gi': '#6a4a30', 'pants': '#4a3020', 'belt': '#c03030', 'boots': '#3a2818', 'hair': '#6a6070',
                        'pupil': '#e0b020', 'nose': '#141014', 'fang': '#f4f0e0', 'claw': '#f0f0f0', 'sole': '#24180e', 'rim': '#5a4030',
                        'detail_fur': '#7a6e64'}, sw=.31)
    F.skeleton()
    F.body(torso=((.19, .14), (.18, .13), (.25, .16), (.27, .15)), neck=(.1, .09), arm=1.15, paint=clothes(sleeve=0, open_front='skin'))
    F.fists(1.1, claws='claw')
    F.boots(straps=False)
    F.head(jaw=1.15)
    F.face(nose=None, mouth=False, ears=None, brow=None)
    angry_brows(F, 'hair')
    G, HS = F.G, F.HS
    F.hair_shell('hair', front=.2, back=-.35, sc=1.08)
    F.spikes([[0, .2, -1, .12, .3], [.5, .1, -.9, .1, .28], [-.5, .1, -.9, .1, .28], [0, -.4, -1, .12, .3], [.7, -.2, -.6, .1, .26],
              [-.7, -.2, -.6, .1, .26]], .1, .3, bend=.05)
    for s in (1, -1):  # wolf ears
        F.cone('WolfEar', .08 * HS, 0, .24 * HS, G(s * .16, .5, -.02), Vector((s * .25, .05, 1)), 6, 'hair', 'head', scale=(1, .5, 1))
        F.tube('Mane', [G(s * .25, .15, -.05), G(s * .3, -.05, -.05), G(s * .26, -.2, 0)], [.08 * HS, .07 * HS, .02 * HS], 'hair', 'head', flat=.5)
    # muzzle with nose and fangs
    F.box('Snout', (.2 * HS, .26 * HS, .15 * HS), G(0, .15, .33), 'skin', 'head', .03)
    F.sphere('WolfNose', .05 * HS, G(0, .21, .47), (1.2, 1, .8), 10, 8, 'nose', 'head')
    F.box('Mouth', (.15 * HS, .02 * HS, .02 * HS), G(0, .09, .46), 'mouth', 'head', 0)
    for s in (1, -1):
        F.cone('Fang', .018 * HS, 0, .06 * HS, G(s * .05, .1, .45), (0, 0, -1), 6, 'fang', 'head')
    F.sphere('ChestFur', .12, (0, -.12, 1.35), (1.1, .4, 1), 12, 8, 'detail_fur', 'torso')
    return F

def zarak():
    F = Fig('zarak', {'skin': '#c8925a', 'gi': '#7040a0', 'pants': '#e8e0d0', 'belt': '#e8c020', 'boots': '#5a3070', 'turban': '#e8e0d0',
                      'gem': '#e83030', 'mustache': '#3a2010', 'stinger': '#a03838', 'tip': '#f0e040', 'sole': '#2a1838', 'rim': '#e8c020'})
    F.skeleton()
    F.body(torso=((.18, .13), (.165, .125), (.23, .15), (.25, .14)), leg=1.12, paint=clothes(sleeve=.5, belt=(.93, 1.07), under='skin'))
    sash(F); F.fists(); F.boots(straps=False)
    F.head()
    F.face(brow=None)
    angry_brows(F)
    G, HS = F.G, F.HS
    F.torus('Turban', .27 * HS, .1 * HS, G(0, .42, 0), 'turban', 'head', scale=(1.05, 1.1, 1))
    F.sphere('TurbanTop', .25 * HS, G(0, .52, -.02), (1, 1, .9), 16, 10, 'turban', 'head')
    F.sphere('Gem', .055 * HS, G(0, .45, .31), (1, .6, 1.2), 10, 8, 'gem', 'head')
    for s in (1, -1):
        F.cone('Mustache', .03 * HS, .008 * HS, .16 * HS, F.fp(s * .02, -.11, .0), Vector((s * 1, -.2, -.2)), 8, 'mustache', 'head', bend=-.3)
    # scorpion tail curling over the back
    pts = [(0, .16, 1.0), (0, .3, 1.15), (0, .42, 1.4), (0, .4, 1.68), (0, .26, 1.9), (0, .08, 1.98)]
    F.tube('Stinger', pts, [.1, .095, .085, .075, .06, .045], 'stinger', 'torso')
    for i, p in enumerate(pts[1:-1]):
        F.torus('Segment', .095 - i * .012, .015, p, 'stinger', 'torso', rot=aim(Vector(pts[i + 2]) - Vector(pts[i])))
    F.cone('Tip', .06, 0, .2, pts[-1], (0, -.6, -.5), 8, 'tip', 'torso')
    return F

def rostbart():
    F = Fig('rostbart', {'skin': '#f0b880', 'gi': '#b02828', 'pants': '#2a2a3a', 'belt': '#e8c020', 'boots': '#1a1a1a', 'hair': '#c84818',
                         'hat': '#1a1a24', 'skull': '#f0f0f0', 'patch': '#101010', 'gold': '#e8c020', 'sole': '#0e0e0e', 'rim': '#3a3a3a'})
    F.skeleton()
    F.body(torso=((.19, .15), (.185, .145), (.23, .155), (.245, .14)), paint=clothes(longsleeve=True, belt=(.94, 1.04), under='skin'))
    for z in (1.12, 1.24, 1.36):  # coat buttons
        F.sphere('Button', .02, (.06, -.16, z), (1, .6, 1), 8, 6, 'gold', 'torso')
    F.box('CoatTail', (.36, .04, .4), (0, .13, .82), 'gi', 'hips', .02, rot(-.15, 'X'))
    for sd in ('_L', '_R'):
        E, W = F.J['E' + sd], F.J['W' + sd]
        F.torus('Cuff' + sd, .072, .022, E.lerp(W, .85), 'gold', 'forearm' + sd, rot=aim(W - E))
    F.fists(); F.boots(h=.3, straps=False, rim='gold')
    F.head(jaw=1.05)
    F.face(brow=None)
    angry_brows(F, 'hair')
    G, HS = F.G, F.HS
    F.cone('HatBrim', .38 * HS, .38 * HS, .06 * HS, G(0, .45, 0), (0, 0, 1), 24, 'hat', 'head')
    F.cone('HatCrown', .3 * HS, .25 * HS, .22 * HS, G(0, .5, 0), (0, 0, 1), 20, 'hat', 'head')
    F.torus('HatBand', .29 * HS, .02 * HS, G(0, .54, 0), 'gold', 'head')
    F.sphere('Skull', .06 * HS, G(0, .6, .27), (1, .5, 1), 10, 8, 'skull', 'head')
    F.sphere('Beard', .2 * HS, G(0, .03, .16), (1.05, .85, 1.05), 16, 12, 'hair', 'head')
    F.cone('BeardTip', .14 * HS, .02 * HS, .2 * HS, G(0, -.08, .22), Vector((0, -.3, -1)), 10, 'hair', 'head')
    F.cone('Patch', .07 * HS, .07 * HS, .02 * HS, F.fp(.1, -.005, .01), (.35, -1, 0), 12, 'patch', 'head')
    F.box('PatchBand', (.5 * HS, .02 * HS, .02 * HS), G(0, .33, .2), 'patch', 'head', 0, rot(-.35, 'Y'))
    return F

def eisenfaust():
    F = Fig('eisenfaust', {'skin': '#b8c0cc', 'gi': '#7a1c1c', 'pants': '#3a3a44', 'belt': '#e8c020', 'boots': '#2a2a30', 'hair': '#e02020',
                           'metal': '#8a929e', 'plate': '#606870', 'visor': '#ff2020', 'sole': '#18181c', 'rim': '#4a4a54'}, sw=.31)
    F.skeleton()
    big = '_R'  # the right arm is a huge metal arm
    def paint(kind, t, c):
        return clothes(sleeve=.3)(kind, t, c)
    F.body(torso=((.19, .14), (.18, .135), (.25, .16), (.27, .15)), neck=(.09, .085), arm=1.12, paint=paint)
    S, E, W = F.J['S' + big], F.J['E' + big], F.J['W' + big]
    F.sphere('BigShoulder', .17, S, (1, 1, 1), 16, 12, 'plate', 'upperarm' + big)
    F.cone('BigUpper', .12, .11, (E - S).length, S, E - S, 14, 'metal', 'upperarm' + big)
    F.cone('BigLower', .15, .13, (W - E).length, E, W - E, 14, 'metal', 'forearm' + big)
    for k in (.3, .6):
        F.torus('Band', .145, .02, E.lerp(W, k), 'plate', 'forearm' + big, rot=aim(W - E))
    F.sphere('BigFist', .17, W + F.armdir(-1) * .1, (1, .9, 1.1), 16, 12, 'metal', 'hand' + big)
    Wl = F.J['W_L']
    q = Vector((0, 0, -1)).rotation_difference(F.armdir(1)).to_matrix()
    F.sphere('Fist_L', .075, Wl + F.armdir(1) * .075, (.9, .78, 1.15), 14, 10, 'skin', 'hand_L', q)
    F.boots(straps=False, h=.24)
    F.head(jaw=1.15)
    F.face(brow=None)
    angry_brows(F)
    G, HS = F.G, F.HS
    F.box('HeadPlate', (.24 * HS, .3 * HS, .32 * HS), G(-.14, .27, .1), 'plate', 'head', .03)
    F.sphere('CyberEye', .055 * HS, G(-.12, .28, .3), (1, .5, 1), 10, 8, 'visor', 'head')
    for i in range(5):  # red mohawk
        F.box('Mohawk', (.07 * HS, .22 * HS, .14 * HS), G(0, .56 - i * .03, .18 - i * .13), 'hair', 'head', .02, rot(-.3 + i * .25, 'X'))
    F.box('ChestPlate', (.2, .04, .14), (.08, -.15, 1.36), 'plate', 'torso', .02)
    return F

def morgrak():
    F = Fig('morgrak', {'skin': '#8a60c0', 'gi': '#2a1c40', 'pants': '#2a1c40', 'belt': '#c02848', 'boots': '#1a1028', 'cape': '#a01830',
                        'capein': '#5a0c1c', 'horn': '#e8e0c8', 'pupil': '#ff3030', 'gold': '#d8a830', 'sole': '#0e0818', 'rim': '#c02848'},
            sw=.3)
    F.skeleton()
    F.body(torso=((.18, .13), (.17, .125), (.24, .15), (.26, .14)), arm=1.05, paint=clothes(longsleeve=True, belt=(.94, 1.06)))
    for s in (1, -1):  # shoulder armour
        F.dome('Pauldron' + str(s), .14, F.J['S_L' if s > 0 else 'S_R'] + Vector((0, 0, .02)), 'gold', 'upperarm_L' if s > 0 else 'upperarm_R', cut=.5,
               scale=(1.1, 1, .8))
    F.fists(1.05, claws='horn')
    F.boots(straps=False, rim='gold', h=.26)
    # cape from the shoulders down the back
    F.box('Cape', (.72, .04, 1.2), (0, .2, 1.0), 'cape', 'torso', .02, rot(.12, 'X'))
    F.box('CapeIn', (.68, .02, 1.16), (0, .17, 1.0), 'capein', 'torso', 0, rot(.12, 'X'))
    F.box('Collar', (.6, .08, .22), (0, .1, 1.58), 'cape', 'torso', .03, rot(-.3, 'X'))
    F.head(jaw=1.1)
    F.face(brow=None, ears=None)
    angry_brows(F)
    G, HS = F.G, F.HS
    for s in (1, -1):
        F.tube('Horn', [G(s * .18, .46, 0), G(s * .32, .62, -.02), G(s * .4, .86, -.06), G(s * .36, 1.08, -.1)], [.09 * HS, .075 * HS, .05 * HS, .008 * HS],
               'horn', 'head')
        F.cone('PointyEar', .05 * HS, 0, .22 * HS, G(s * .26, .3, -.03), Vector((s, .2, .35)), 6, 'skin', 'head', scale=(1, .4, 1))
    F.hair_shell('gi', front=.4, back=-.1, sc=1.04)
    F.cone('Crown', .2 * HS, .22 * HS, .08 * HS, G(0, .5, 0), (0, 0, 1), 16, 'gold', 'head')
    return F

FIGS = {'goki': goki, 'kurikin': kurikin, 'joshi': joshi, 'tjamtschu': tjamtschu, 'wulma': wulma,
        'bandit': bandit, 'soldier': soldier, 'ninja': ninja, 'robot': robot,
        'hauzahn': hauzahn, 'zarak': zarak, 'rostbart': rostbart, 'eisenfaust': eisenfaust, 'morgrak': morgrak}

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    for name in (args or list(FIGS)):
        F = FIGS[name]()
        F.export(os.path.join(HERE, '..', 'src', 'models', name + '.glb'), os.path.join(HERE, name + '.blend'))
