# -*- coding: utf-8 -*-
"""Emit content/catalogue/storyderm-manifest.json from a hand-curated table.

    python3 scripts/catalogue/curate-storyderm.py     (or: pnpm catalogue:curate)

The curation lives in the PRODUCTS table below — the grouping of source files
into products, the variant ladders, the taxonomy placement and the marked demo
commercial values. This script only checks it and serialises it, and it exits
non-zero rather than writing a manifest that does not reconcile:

  * every referenced source file exists on disk;
  * no file is claimed by two products;
  * every product has exactly one primary image;
  * no slug is used twice;
  * every file on disk is mapped, or listed unresolved with a reason
    (Thumbs.db and .DS_Store excluded) — docs/14's P0 gate, made executable.

Why a generator rather than a hand-written JSON file: ninety paths containing
spaces, parentheses and Korean characters, typed by hand, would produce a
manifest whose errors are invisible until seeding fails. The judgement is
human; the transcription is not. See C-16 in docs/26-content-and-catalogue-decisions.md.
"""
import json, os, sys, collections

ROOT = os.path.join(os.environ["HOME"], "mnt", "FazaileliSkincare.ir")
SRC  = "public/images/brands/storyderm"

FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
def fa_num(n):
    s = ("%g" % n)
    return "".join(FA_DIGITS[int(c)] if c.isdigit() else ("٫" if c == "." else c) for c in s)

UNIT_FA = {"ml": "میلی‌لیتر", "g": "گرم", "unit": "عدد", "sheet": "عدد", "kit": "ست"}
UNIT_EN = {"ml": "ml", "g": "g", "unit": "pcs", "sheet": "sheet", "kit": "kit"}

FORMS = {
  "cleanser": ("پاک‌کننده", "Cleanser"),
  "toner":    ("تونر", "Toner"),
  "essence":  ("اسنس", "Essence"),
  "serum":    ("سرم", "Serum"),
  "ampoule":  ("آمپول", "Ampoule"),
  "cream":    ("کرم", "Cream"),
  "eye-care": ("کرم دور چشم", "Eye cream"),
  "mask":     ("ماسک", "Mask"),
  "sheet":    ("ماسک ورقه‌ای", "Sheet mask"),
  "peel":     ("پیلینگ", "Peel"),
  "patch":    ("پچ", "Patch"),
  "balm":     ("بالم", "Balm"),
  "gel":      ("ژل", "Gel"),
  "powder":   ("پودر", "Powder"),
}

def P(slug, line, category, name, form, concerns, skin, phases, variants, media,
      audience="home", price_visibility="public", disposition="seed",
      form_key=None, notes=None, assignment_source="range_name", identity=None):
    return dict(slug=slug, line=line, category=category, name=name,
                form=form_key or form, concerns=concerns, skin=skin, phases=phases,
                variants=variants, media=media, audience=audience,
                price_visibility=price_visibility, disposition=disposition,
                notes=notes, assignment_source=assignment_source, identity=identity)


# C-5: a Persian product name is composed from facts, never invented. The form
# word translates because it is a fact about the object; the product name stays
# in Latin script because transliterating it would invent a Persian spelling the
# supplier has not chosen and nobody searches for.
#
#   کرم Clinic-A          Clinic-A Cream
#   آمپول Princess Shine  Princess Shine Ampoule
#
# The Latin half is the printed name with its trailing English form word removed
# when it has one, so the Persian side does not read «کرم Clinic-A Cream». Where
# that rule misfires — a name whose form word is not at the end, or is the only
# thing that distinguishes it — the curation table sets `identity` explicitly
# rather than the rule being made cleverer.
STRIPPABLE = ["Cream", "Toner", "Essence", "Serum", "Ampoule", "Cleanser",
              "Sheet mask", "Mask", "Peel", "Patch", "Balm", "Gel", "Powder",
              "Eye cream"]


def latin_identity(name, override):
    if override is not None:
        return override
    for word in STRIPPABLE:
        suffix = " " + word
        if name.lower().endswith(suffix.lower()):
            stripped = name[: -len(suffix)].strip()
            if stripped:
                return stripped
    return name

# (size, unit, price_rials, stock)
def V(size, unit, price, stock): return (size, unit, price, stock)

PRODUCTS = [
# ── 1. Ultra Lift ────────────────────────────────────────────────────────────
 P("ultra-a-z-cream","ultra-lift","cream","Ultra A-Z Cream","cream",
   ["aging"],["dry","normal"],["hydrate"],
   [V(50,"ml",41800000,7), V(220,"ml",128000000,3)],
   [("primary","1.Ultra Lift/Ultra A-Z Cream 50ml.png"),
    ("gallery","1.Ultra Lift/Ultra A-Z Cream 220ml.png")]),
 P("ultra-essence-aqua","ultra-lift","toner","Ultra Essence Aqua","toner",
   ["aging","hydration"],["normal","dry"],["hydrate"],
   [V(150,"ml",29500000,9), V(500,"ml",78000000,2)],
   [("primary","1.Ultra Lift/Ultra Essence Aqua 150ml.png"),
    ("gallery","1.Ultra Lift/Ultra Essence Aqua 500ml.png")]),
 P("ultra-essence-clean","ultra-lift","cleanser","Ultra Essence Clean","cleanser",
   ["aging"],["normal","dry"],["cleanse"],
   [V(150,"ml",26400000,11)],
   [("primary","1.Ultra Lift/Ultra Essence Clean 150ml.png")]),
 P("ultra-lift-powder","ultra-lift","powder","Ultra Lift Powder","powder",
   ["aging"],["normal","combination"],["treat"],
   [V(4,"unit",34900000,5)],
   [("primary","1.Ultra Lift/Ultra lift powder 1.5g 4ea.png"),
    ("gallery","1.Ultra Lift/Ultra lift powder 1.5g 4ea_2.png"),
    ("gallery","1.Ultra Lift/Ultra Lift Powder 1.5g 4ea (4).png"),
    ("gallery","1.Ultra Lift/Ultra Lift Powder 1.5g 4ea (5).png")],
   notes="Four frames of one subject, grouped as a single product per rule 2. The 4 × 1.5 g pack is read from the filename; the sachet weight is not modelled as a size unit."),

# ── 2. Princess Shine ────────────────────────────────────────────────────────
 P("princess-shine-ampoule","princess-shine","ampoule","Princess Shine Ampoule","ampoule",
   ["lak"],["normal","combination"],["treat"],
   [V(30,"ml",56000000,6)],
   [("primary","2.Princess Shine/Princess Shine Ampoule 30ml.png")]),
 P("princess-shine-aqua","princess-shine","toner","Princess Shine Aqua","toner",
   ["lak","hydration"],["normal","combination"],["hydrate"],
   [V(150,"ml",28900000,8), V(500,"ml",74500000,2)],
   [("primary","2.Princess Shine/Princess Shine Aqua 150ml.png"),
    ("gallery","2.Princess Shine/Princess Shine Aqua 500ml.png")]),
 P("princess-shine-clean","princess-shine","cleanser","Princess Shine Clean","cleanser",
   ["lak"],["normal","combination"],["cleanse"],
   [V(100,"ml",24200000,12), V(500,"ml",68000000,3)],
   [("primary","2.Princess Shine/Princess shine clean 100ml.png"),
    ("gallery","2.Princess Shine/Princess shine clean 500ml.png")]),
 P("princess-peel","princess-shine","peel","Princess Peel","peel",
   ["lak"],["normal","combination"],["treat"],
   [V(4,"unit",39500000,4)],
   [("primary","2.Princess Shine/Princess peel 2ml 4ea.png")] +
   [("gallery","2.Princess Shine/Princess Peel_IMG (%d).jpg" % i) for i in range(1,11)],
   notes="The ten Princess Peel_IMG frames are one gallery of a single subject, not ten products — rule 2. Packshot is primary.",
   identity="Princess Peel"),

# ── 3. O2 White ──────────────────────────────────────────────────────────────
 P("o2-white-aqua","o2-white","toner","O2 White Aqua","toner",
   ["lak","hydration"],["oily","combination"],["hydrate"],
   [V(150,"ml",28500000,10), V(500,"ml",73000000,2)],
   [("primary","3.O2 White/O2 White Aqua 150ml.png"),
    ("gallery","3.O2 White/O2 White Aqua 500ml.png")]),
 P("o2-white-clean","o2-white","cleanser","O2 White Clean","cleanser",
   ["lak"],["oily","combination"],["cleanse"],
   [V(100,"ml",23800000,14), V(500,"ml",66500000,3)],
   [("primary","3.O2 White/O2 white clean 100ml.png"),
    ("gallery","3.O2 White/O2 white clean 500ml.png")]),
 P("o2-white-essence","o2-white","essence","O2 White Essence","essence",
   ["lak"],["oily","combination","normal"],["treat"],
   [V(30,"ml",47200000,7), V(220,"ml",119000000,2)],
   [("primary","3.O2 White/O2 white essence 30ml.png"),
    ("gallery","3.O2 White/O2 white essence 220ml.png")]),
 P("o2-jewelry-peel","o2-white","peel","O2 Jewelry Peel","peel",
   ["lak"],["oily","combination"],["treat"],
   [V(4,"unit",38000000,5)],
   [("primary","3.O2 White/O2 Jewelry Peel 2ml 4ea.png")]),

# ── 4. TimeMachine Calming ───────────────────────────────────────────────────
 P("timemachine-calming-aqua","timemachine-calming","toner","TimeMachine Calming Aqua","toner",
   ["barrier","hydration"],["sensitive","dry"],["hydrate"],
   [V(150,"ml",30200000,9), V(500,"ml",79500000,2)],
   [("primary","4.TimeMachine Calming/Timemachine Calming Aqua 150ml.png"),
    ("gallery","4.TimeMachine Calming/Timemachine Calming Aqua 500ml.png")]),
 P("timemachine-water-clean","timemachine-calming","cleanser","TimeMachine Water Clean","cleanser",
   ["barrier"],["sensitive","dry"],["cleanse"],
   [V(150,"ml",25600000,13), V(500,"ml",69000000,3)],
   [("primary","4.TimeMachine Calming/Timemachine Water Clean 150ml.png"),
    ("gallery","4.TimeMachine Calming/Timemachine Water Clean 500ml.png")]),
 P("timemachine-hyal-1000","timemachine-calming","essence","TimeMachine Hyal 1000","essence",
   ["hydration","barrier"],["dry","sensitive"],["treat"],
   [V(30,"ml",49800000,0), V(220,"ml",124000000,0)],
   [("primary","4.TimeMachine Calming/TimeMachine Hyal 1000 30ml.png"),
    ("gallery","4.TimeMachine Calming/TimeMachine Hyal 1000 220ml.png")],
   notes="Seeded out of stock in both sizes, deliberately — the listing must have a published, priced, unavailable product to render (C-6)."),
 P("timemachine-peel","timemachine-calming","peel","TimeMachine Peel","peel",
   ["barrier"],["sensitive","dry"],["treat"],
   [V(4,"unit",37500000,6)],
   [("primary","4.TimeMachine Calming/Timemachine peel.png"),
    ("gallery","4.TimeMachine Calming/Timemachine Peel2.png")],
   notes="Two frames of one subject. The pack count is not stated on either file; 4 × 2 ml follows the sibling peels in this brand and is marked demo.",
   identity="TimeMachine Peel"),

# ── 5. Clinic-A ──────────────────────────────────────────────────────────────
 P("clinic-a-aqua","clinic-a","toner","Clinic-A Aqua","toner",
   ["acne"],["oily","combination"],["hydrate"],
   [V(150,"ml",27800000,10), V(500,"ml",71500000,2)],
   [("primary","5.Clinic-A/Clinic-A Aqua 150ml.png"),
    ("gallery","5.Clinic-A/Clinic-A Aqua 500ml.png")]),
 P("clinic-a-clean","clinic-a","cleanser","Clinic-A Clean","cleanser",
   ["acne"],["oily","combination"],["cleanse"],
   [V(150,"ml",24900000,15), V(500,"ml",67000000,4)],
   [("primary","5.Clinic-A/Clinic-A Clean 150ml.png"),
    ("gallery","5.Clinic-A/Clinic-A Clean 500ml.png")]),
 P("clinic-a-cream","clinic-a","cream","Clinic-A Cream","cream",
   ["acne"],["oily","combination"],["hydrate"],
   [V(50,"ml",38400000,8), V(220,"ml",112000000,2)],
   [("primary","5.Clinic-A/Clinic-A Cream 50ml.png"),
    ("gallery","5.Clinic-A/Clinic-A Cream 220ml.png")]),
 P("clinic-a-spot","clinic-a","serum","Clinic-A Spot","serum",
   ["acne"],["oily","combination"],["treat"],
   [V(15,"ml",None,4)],
   [("primary","5.Clinic-A/Clinic-A Spot 15ml.png")],
   price_visibility="on_request",
   notes="Seeded price_visibility=on_request so the listing has a real «استعلام قیمت» row that cannot enter a cart (C-6). It carries no price row at all — an on-request product with a hidden zero price is a number waiting to be displayed by mistake."),

# ── 6. Anti Wrinkle Care ─────────────────────────────────────────────────────
 P("anti-wrinkle-eye-contour","anti-wrinkle-care","eye-care","Anti-Wrinkle Eye Contour","eye-care",
   ["aging"],["normal","dry"],["treat"],
   [V(15,"ml",43600000,7)],
   [("primary","6.Anti Wrinkle Care/Anti-wrinkle eye contour 15ml.png")],
   identity="Anti-Wrinkle"),
 P("anti-wrinkle-face-contour","anti-wrinkle-care","cream","Anti-Wrinkle Face Contour","cream",
   ["aging"],["normal","dry"],["hydrate"],
   [V(50,"ml",52400000,5)],
   [("primary","6.Anti Wrinkle Care/Anti-wrinkle face contour 50ml.png")]),
 P("time-patch","anti-wrinkle-care","patch","Time Patch","patch",
   ["aging"],["normal","combination"],["treat"],
   [V(5,"unit",29800000,9)],
   [("primary","6.Anti Wrinkle Care/Time patch 2ea 5pouch.png"),
    ("gallery","6.Anti Wrinkle Care/Time Patch2.png"),
    ("gallery","6.Anti Wrinkle Care/Time patch needle.png")],
   notes="Three frames of one subject: retail pack, styled shot, and a macro of the microneedle surface.",
   identity="Time Patch"),

# ── 7. Personal Care ─────────────────────────────────────────────────────────
 P("smooth-multi-balm-24h","personal-care","balm","24h Smooth Multi Balm","balm",
   ["barrier"],["dry","sensitive"],["protect"],
   [V(50,"ml",21500000,16), V(200,"ml",58000000,4)],
   [("primary","7.Personal Care/24h Smooth Multi Balm 50ml.png"),
    ("gallery","7.Personal Care/24h Smooth Multi Balm 200ml.png")],
   assignment_source="inference"),
 P("black-cavi-heating-gel","personal-care","gel","Black Cavi Heating Gel","gel",
   ["aging"],["normal","combination"],["treat"],
   [V(80,"ml",33200000,6)],
   [("primary","7.Personal Care/Black Cavi Heating Gel 80ml.png")],
   assignment_source="inference"),
 P("ex-cloud-peel","personal-care","peel","EX Cloud Peel","peel",
   ["lak"],["normal","combination"],["treat"],
   [V(80,"ml",35800000,7)],
   [("primary","7.Personal Care/EX Cloud Peel 80ml.png")],
   assignment_source="inference"),
 P("laser-repair-serum","personal-care","serum","Laser Repair Serum","serum",
   ["barrier"],["sensitive","dry"],["treat"],
   [V(50,"ml",54900000,6), V(220,"ml",139000000,2)],
   [("primary","7.Personal Care/Laser Repair Serum 50ml.png"),
    ("gallery","7.Personal Care/Laser Repair Serum 220ml.png")],
   assignment_source="inference"),
 P("omso-enzyme-wash","personal-care","cleanser","Omso Enzyme Wash","cleanser",
   ["lak"],["oily","combination"],["cleanse"],
   [],
   [("primary","7.Personal Care/Omso Enzyme Wash 50g.png")],
   disposition="hold",
   notes="HELD (C-17). The filename spells 'Omso'; two sibling files in the same folder spell 'Osmo'. One of the two is a typo and the manifest cannot tell which, so the product is seeded unpublished with no variant until the spelling is confirmed."),
 P("osmo-snail-cream","personal-care","cream","Osmo Snail Cream","cream",
   ["barrier","hydration"],["dry","sensitive"],["hydrate"],
   [V(50,"ml",36700000,0)],
   [("primary","7.Personal Care/Osmo Snail Cream 50ml.png")],
   assignment_source="inference",
   notes="Seeded out of stock deliberately — the second of the two unavailable rows C-6 requires."),
 P("osmo-vita7-ampoule","personal-care","ampoule","Osmo Vita7 Ampoule","ampoule",
   ["lak"],["normal","combination"],["treat"],
   [V(30,"ml",51300000,8)],
   [("primary","7.Personal Care/Osmo Vita7 Ampoule 30ml.png")],
   assignment_source="inference"),
 P("peptide-gold-lifting-pack","personal-care","mask","Peptide Gold Lifting Pack","mask",
   ["aging"],["normal","dry"],["treat"],
   [V(15,"ml",26900000,11)],
   [("primary","7.Personal Care/Peptide Gold Lifting Pack 15ml.png")],
   assignment_source="inference",
   identity="Peptide Gold Lifting"),
 P("pure-origin-cell","personal-care","ampoule","Pure Origin Cell","ampoule",
   ["aging","barrier"],["dry","sensitive"],["treat"],
   [V(30,"ml",96000000,3), V(5,"unit",72000000,4)],
   [("primary","7.Personal Care/Pure Origin Cell Ampoule 30ml.png"),
    ("gallery","7.Personal Care/Pure Origin Cell 7ml x 5ea.png"),
    ("package","7.Personal Care/Pure Origin Cell box package.png")],
   disposition="hold",
   notes="HELD (C-17). A 30 ml ampoule and a 5 × 7 ml vial set share the name. They are either two presentations of one product or two products, and the packshots do not settle it. Modelled as one product with two variants and held unpublished until a product sheet does."),
 P("shape-memory-repair","personal-care","cream","Shape Memory Repair","cream",
   ["aging","barrier"],["normal","dry"],["protect"],
   [V(50,"ml",47500000,6), V(220,"ml",121000000,2)],
   [("primary","7.Personal Care/Shape Memory Repair 50ml.png"),
    ("gallery","7.Personal Care/Shape Memory Repair 220ml.png")],
   assignment_source="inference"),

# ── 9. Mask · 72 Capsule ─────────────────────────────────────────────────────
] + [
 P("72-capsule-mask-%s" % c, "mask", "mask", "72 Capsule Mask %s" % t, "mask",
   concerns, skin, ["treat"],
   [V(1,"unit",price,stock)],
   [("primary","9.Mask/1.72 Capsule Mask/%s" % retail),
    ("package","9.Mask/1.72 Capsule Mask/%s" % pouch)],
   assignment_source="inference", identity="72 Capsule %s" % t,
   notes="Colour names the formula, so blue, wine and yellow are three products rather than one with three variants — rule 4. The 1 kg salon size is a separate professional-only product.")
 for c,t,retail,pouch,concerns,skin,price,stock in [
   ("blue","Blue","72 Capsule Mask blue.png","72 Capsule Mask blue paush.png",["hydration"],["dry","normal"],18900000,14),
   ("wine","Wine","72 Capsule Mask wine.png","72 Capsule Mask wine paush.png",["aging"],["normal","combination"],18900000,12),
   ("yellow","Yellow","72 Capsule Mask Yellow.png","72 Capsule Mask yellow paush.png",["lak"],["oily","combination"],18900000,10),
 ]] + [
 P("72-capsule-mask-%s-professional" % c, "mask", "mask",
   "72 Capsule Mask %s 1kg" % t, "mask",
   concerns, skin, ["treat"],
   [V(1,"kit",None,3)],
   [("primary","9.Mask/1.72 Capsule Mask/%s" % bulk)],
   audience="professional", price_visibility="on_request",
   assignment_source="inference", identity="72 Capsule %s 1kg" % t,
   notes="The salon bulk size. Professional-only and price-on-request: isProfessionalOnly is a property of the product, not the variant, so the bulk pack is its own product rather than a variant of the retail one.")
 for c,t,bulk,concerns,skin in [
   ("blue","Blue","72 capsule mask_blue 1kg.png",["hydration"],["dry","normal"]),
   ("wine","Wine","72 capsule mask_wine 1kg.png",["aging"],["normal","combination"]),
   ("yellow","Yellow","72 capsule mask_yellow 1kg.png",["lak"],["oily","combination"]),
 ]] + [

# ── 9. Mask · Gelato ─────────────────────────────────────────────────────────
 P("gelato-mask-cool","mask","mask","Cool Gelato Mask","mask",
   ["barrier"],["sensitive","oily"],["treat"],
   [V(1,"unit",16400000,18)],
   [("primary","9.Mask/2.Gelato Mask/cool gelato mask.png")],
   assignment_source="inference"),
 P("gelato-mask-oily","mask","mask","Oily Gelato Mask","mask",
   ["acne"],["oily","combination"],["treat"],
   [V(1,"unit",16400000,15)],
   [("primary","9.Mask/2.Gelato Mask/oily gelato mask.png")],
   assignment_source="inference"),
 P("gelato-mask-vitamin-c","mask","mask","Vitamin C Gelato Mask","mask",
   ["lak"],["normal","combination"],["treat"],
   [V(1,"unit",16400000,13)],
   [("primary","9.Mask/2.Gelato Mask/vitamic c gelato mask.png")],
   assignment_source="inference",
   notes="The filename reads 'vitamic c'. Recorded as a filename typo rather than carried into the product name."),

# ── 9. Mask · Sheet ──────────────────────────────────────────────────────────
 P("egf-advanced-cell-sheet-mask","mask","mask","EGF Advanced Cell Mask","sheet",
   ["aging","barrier"],["dry","sensitive"],["treat"],
   [V(1,"sheet",7900000,40)],
   [("primary","9.Mask/3.Sheet Mask/EGF Advanced Cell Mask.png")],
   assignment_source="inference"),
 P("o2-white-sheet-mask","mask","mask","O2 White Mask","sheet",
   ["lak"],["oily","combination"],["treat"],
   [V(1,"sheet",7900000,45)],
   [("primary","9.Mask/3.Sheet Mask/O2 White Mask.png")]),
 P("princess-shine-sheet-mask","mask","mask","Princess Shine Mask","sheet",
   ["lak"],["normal","combination"],["treat"],
   [V(1,"sheet",7900000,38)],
   [("primary","9.Mask/3.Sheet Mask/Princess Shine Mask.png")]),
 P("timemachine-calming-sheet-mask","mask","mask","TimeMachine Calming Mask","sheet",
   ["barrier"],["sensitive","dry"],["treat"],
   [V(1,"sheet",7900000,42)],
   [("primary","9.Mask/3.Sheet Mask/Timemachine Calming Mask.png")]),
 P("ultra-peptide-sheet-mask","mask","mask","Ultra Peptide Mask","sheet",
   ["aging"],["normal","dry"],["treat"],
   [V(1,"sheet",7900000,36)],
   [("primary","9.Mask/3.Sheet Mask/Ultra Peptide Mask.png")]),
 P("vitamin-c-brightening-sheet-mask","mask","mask","Vitamin C Brightening Mask","sheet",
   ["lak"],["normal","oily"],["treat"],
   [V(1,"sheet",7900000,44)],
   [("primary","9.Mask/3.Sheet Mask/Vitamin C Brightening Mask.png")]),

# ── 10. Anti-Red ─────────────────────────────────────────────────────────────
 P("resens-red-aqua","anti-red","toner","Resens Red Aqua","toner",
   ["barrier","hydration"],["sensitive","dry"],["hydrate"],
   [V(100,"ml",31600000,8)],
   [("primary","10.Anti-Red/Resens Red Aqua 100ml.png")]),
 P("resens-red-cream","anti-red","cream","Resens Red Cream","cream",
   ["barrier"],["sensitive","dry"],["hydrate"],
   [V(50,"ml",44300000,6)],
   [("primary","10.Anti-Red/Resens Red Cream 50ml.png")]),
]

UNRESOLVED = [
 ("8.Protection/BB Ecocell Balm 50ml 신형.png",
  "Korean packaging suffix 신형 ('new model') on the filename. Which generation of the product this is, and whether the previous one is still distributed, is not readable from the file."),
 ("8.Protection/Super Ultra Nutrition 50ml 신형.png",
  "Same suffix, same question. Also the only two files in the Protection range, so neither can be cross-checked against a sibling."),
 ("9.Mask/1.72 Capsule Mask/72 capsule mask_small.png",
  "A small pack of the 72 Capsule Mask whose colour — and therefore whose formula — is not visible in the filename and not legible in the shot."),
]

LINES = [
 ("ultra-lift","1.Ultra Lift","اولترا لیفت","Ultra Lift",10),
 ("princess-shine","2.Princess Shine","پرنسس شاین","Princess Shine",20),
 ("o2-white","3.O2 White","او۲ وایت","O2 White",30),
 ("timemachine-calming","4.TimeMachine Calming","تایم‌ماشین کامینگ","TimeMachine Calming",40),
 ("clinic-a","5.Clinic-A","کلینیک آ","Clinic-A",50),
 ("anti-wrinkle-care","6.Anti Wrinkle Care","آنتی رینکل","Anti Wrinkle Care",60),
 ("personal-care","7.Personal Care","پرسنال کر","Personal Care",70),
 ("protection","8.Protection","پروتکشن","Protection",80),
 ("mask","9.Mask","ماسک","Mask",90),
 ("anti-red","10.Anti-Red","آنتی رد","Anti-Red",100),
]

# ── build ────────────────────────────────────────────────────────────────────
errors, seen_paths, seen_slugs = [], {}, set()
out_products = []
ordinals = None

for rank, p in enumerate(PRODUCTS, start=1):
    if p["slug"] in seen_slugs: errors.append("duplicate slug %s" % p["slug"])
    seen_slugs.add(p["slug"])
    form_fa, form_en = FORMS[p["form"]]

    counts = collections.Counter()
    media = []
    for role, rel in p["media"]:
        full = os.path.join(ROOT, SRC, rel)
        if not os.path.exists(full): errors.append("missing file: %s" % rel)
        if rel in seen_paths: errors.append("%s claimed by %s and %s" % (rel, seen_paths[rel], p["slug"]))
        seen_paths[rel] = p["slug"]
        counts[role] += 1
        media.append({"path": rel, "role": role, "ordinal": counts[role]})
    if counts["primary"] != 1: errors.append("%s has %d primary" % (p["slug"], counts["primary"]))

    variants = []
    for i,(size,unit,price,stock) in enumerate(p["variants"], start=1):
        variants.append({
          "sku": "DEMO-%s-%02d" % (p["slug"].upper(), i),
          "sizeValue": size, "sizeUnit": unit,
          "sizeSource": "filename",
          "labels": {"fa": "%s %s" % (fa_num(size), UNIT_FA[unit]),
                     "en": "%s %s" % (("%g"%size), UNIT_EN[unit])},
          "demoPriceRials": (None if p["price_visibility"] == "on_request" else price),
          "demoStock": stock,
        })

    out_products.append({
      "draftKey": "storyderm-%s" % p["slug"],
      "slug": p["slug"],
      "line": p["line"],
      "category": p["category"],
      "disposition": p["disposition"],
      "audience": p["audience"],
      "priceVisibility": p["price_visibility"],
      "merchandisingRank": rank * 10,
      "names": {
        "form": {"fa": form_fa, "en": form_en, "source": "packshot"},
        "product": {"value": p["name"], "source": "packshot"},
        "display": {"fa": "%s %s" % (form_fa, latin_identity(p["name"], p["identity"])),
                    "en": p["name"]},
      },
      "taxonomy": {
        "concerns": p["concerns"],
        "skinStates": p["skin"],
        "phases": p["phases"],
        "source": p["assignment_source"],
      },
      "variants": variants,
      "media": media,
      "note": p["notes"],
    })

mapped = len(seen_paths)
unres  = len(UNRESOLVED)
for rel,_ in UNRESOLVED:
    if not os.path.exists(os.path.join(ROOT, SRC, rel)): errors.append("missing unresolved file: %s" % rel)
    if rel in seen_paths: errors.append("unresolved file also mapped: %s" % rel)

on_disk = []
for dirpath, _dirs, files in os.walk(os.path.join(ROOT, SRC)):
    for f in files:
        if f in ("Thumbs.db", ".DS_Store"): continue
        on_disk.append(os.path.relpath(os.path.join(dirpath, f), os.path.join(ROOT, SRC)))
missing = sorted(set(on_disk) - set(seen_paths) - {u[0] for u in UNRESOLVED})
if missing: errors.append("files on disk in neither products nor unresolved: %s" % missing)

manifest = {
  "$comment": "Hand-curated. The only input to the catalogue seed — C-16. Regenerate with scripts/catalogue/curate-storyderm.py after editing that script, never by hand.",
  "brand": {"slug":"storyderm","countryCode":"KR","isOfficialRepresentative":False,
            "names":{"fa":"استوری‌درم","en":"Storyderm"}},
  "sourceRoot": SRC,
  "reviewedBy": None,
  "reconciliation": {"filesOnDisk": len(on_disk), "mapped": mapped, "unresolved": unres},
  "lines": [{"slug":s,"sourceFolder":f,"names":{"fa":fa,"en":en},"sortOrder":o} for s,f,fa,en,o in LINES],
  "products": out_products,
  "unresolved": [{"path":p,"reason":r} for p,r in UNRESOLVED],
}

if errors:
    print("MANIFEST ERRORS:"); [print(" -", e) for e in errors]; sys.exit(1)

dest = os.path.join(ROOT, "content", "catalogue", "storyderm-manifest.json")
os.makedirs(os.path.dirname(dest), exist_ok=True)
with open(dest, "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
print("products=%d  mapped=%d  unresolved=%d  onDisk=%d" % (len(out_products), mapped, unres, len(on_disk)))
