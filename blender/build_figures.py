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

FIGS = {'goki': goki, 'kurikin': kurikin, 'joshi': joshi, 'tjamtschu': tjamtschu, 'wulma': wulma}

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    for name in (args or list(FIGS)):
        F = FIGS[name]()
        F.export(os.path.join(HERE, '..', 'src', 'models', name + '.glb'), os.path.join(HERE, name + '.blend'))
