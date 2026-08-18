#!/usr/bin/env python3
"""Generate responsive image variants and wire them into the pages.

PageSpeed's "Improve image delivery" flags images whose file is far larger than
the box they render into - a 2000px photo dropped into a 352px slot, or a
1000px portrait into an 86px avatar. Compression alone can't fix that; the
browser needs smaller files to choose from.

This does two things:

  * Hard-caps images that are oversized even on a large desktop screen at twice
    their maximum CSS width, which is retina-sharp with nothing left over.
  * Emits a srcset ladder plus a sizes hint for everything else, so a phone
    downloads a phone-sized file while desktop still gets the full-resolution
    one.

DISPLAY_WIDTH below is measured from the stylesheet - the largest max-width the
image's container reaches at any breakpoint. Numbers are deliberately generous:
guessing high costs a few KB, guessing low would render blurry.

    python tools/responsive.py --dry-run
    python tools/responsive.py
"""

import argparse
import os
import re
import shutil
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LADDER = [400, 640, 960, 1280, 1600]
MIN_SAVING = 0.15
RETINA = 2

# img class -> widest CSS px the element ever renders at. None = full-bleed.
DISPLAY_WIDTH = {
    "testimonial-card-avatar-image": 86,
    "how-works-media-image": 352,
    "success-story-video-thumb-image": 352,
    "program-learning-laptop": 448,
    "what-we-do-image-left": 480,
    "what-we-do-image-right": 480,
    "insights-video-thumbnail": 728,
    "events-main-card-image": 980,
    "events-featured-image": 980,
    "about-hero-image": 1152,
    "program-overview-image": 1152,
    "program-covers-bg-image": 1152,
    "program-hero-image": 1152,
    "program-who-image": 1152,
    "founder-main-image": None,
    "hero-background-image": None,
    "success-video-card-image": None,
    "album-tile-img": None,
    "site-footer-logo": 200,
    "logo-image": 260,
}

MOBILE_BREAKPOINT = 767


def img_tags(src):
    return re.findall(r"<img\b[^>]*>", src)


def first_class(tag):
    m = re.search(r'class="([^"]+)"', tag)
    return m.group(1).split()[0] if m else None


def collect():
    """Map each image path to the smallest display width that covers every use."""
    uses = {}
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        src = open(os.path.join(ROOT, name), encoding="utf-8").read()
        for tag in img_tags(src):
            m = re.search(r'src="([^"]+)"', tag)
            if not m:
                continue
            ref = m.group(1)
            if ref.endswith(".svg") or not os.path.isfile(os.path.join(ROOT, ref)):
                continue
            cls = first_class(tag)
            width = DISPLAY_WIDTH.get(cls, None) if cls in DISPLAY_WIDTH else None
            prev = uses.get(ref, ("__unset__", set()))
            merged = None if (prev[0] is None or width is None) else max(
                width, prev[0]) if prev[0] != "__unset__" else width
            uses[ref] = (merged, prev[1] | {cls})
    return uses


def variants_for(path, cap):
    with Image.open(os.path.join(ROOT, path)) as im:
        w = im.size[0]
    limit = min(w, cap) if cap else w
    return [x for x in LADDER if x < limit] + ([limit] if limit else [])


def resize_to(src_path, width, out_path):
    with Image.open(src_path) as im:
        has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
        im = im.convert("RGBA" if has_alpha else "RGB")
        if im.size[0] != width:
            h = round(im.size[1] * width / im.size[0])
            im = im.resize((width, h), Image.LANCZOS)
        im.save(out_path, "WEBP", quality=90, method=6)
    return os.path.getsize(out_path)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    uses = collect()
    plan = []
    for ref, (display, classes) in sorted(uses.items()):
        full = os.path.join(ROOT, ref)
        with Image.open(full) as im:
            w, h = im.size
        if w < 500:
            continue
        cap = min(w, display * RETINA) if display else w
        widths = sorted(set(x for x in LADDER + [cap] if x <= cap))
        if not widths or (len(widths) == 1 and widths[0] == w):
            continue
        plan.append((ref, w, h, display, cap, widths))

    stem_of = lambda ref: os.path.splitext(ref)[0]
    generated = {}
    total_before = total_after = 0

    print("%-40s %6s %7s %7s  %s" % ("image", "stored", "display", "cap", "variants"))
    for ref, w, h, display, cap, widths in plan:
        full = os.path.join(ROOT, ref)
        before = os.path.getsize(full)
        total_before += before
        made = []
        for x in widths:
            out = "%s-%dw.webp" % (stem_of(ref), x)
            outp = os.path.join(ROOT, out)
            n = resize_to(full, x, outp) if not args.dry_run else 0
            if args.dry_run:
                n = resize_to(full, x, outp + ".tmp")
                os.remove(outp + ".tmp")
            made.append((x, out, n))
        # Drop any rung that is no smaller than a wider one - re-encoding a
        # near-lossless source can make 960w heavier than 1000w, and a browser
        # picking the narrower file would download more bytes for less detail.
        pruned, best = [], None
        for x, out, n in reversed(made):
            if best is None or n < best:
                pruned.append((x, out, n))
                best = n
            elif not args.dry_run:
                os.remove(os.path.join(ROOT, out))
        made = list(reversed(pruned))

        generated[ref] = (made, display, cap)
        largest = made[-1][2]
        total_after += largest
        print("%-40s %5.0fK %6s %7d  %s"
              % (ref, before / 1024, display if display else "full", cap,
                 " ".join("%dw:%.0fK" % (x, n / 1024) for x, _, n in made)))

    print("\n  largest-variant total: %.2f MB -> %.2f MB" % (total_before / 1048576, total_after / 1048576))
    if args.dry_run:
        print("  dry run - nothing written")
        return 0

    # ---- wire srcset/sizes into the pages -------------------------------
    changed = 0
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        p = os.path.join(ROOT, name)
        src = open(p, encoding="utf-8").read()
        original = src

        def rewrite(tag):
            m = re.search(r'src="([^"]+)"', tag)
            if not m or "srcset=" in tag:
                return tag
            ref = m.group(1)
            if ref not in generated:
                return tag
            made, display, cap = generated[ref]
            cls = first_class(tag)
            disp = DISPLAY_WIDTH.get(cls, display)
            srcset = ", ".join("%s %dw" % (out, x) for x, out, _ in made)
            if disp:
                sizes = "(max-width: %dpx) 100vw, %dpx" % (MOBILE_BREAKPOINT, disp)
            else:
                sizes = "100vw"
            biggest = made[-1]
            # Point src at the capped file and restate its true dimensions.
            with Image.open(os.path.join(ROOT, biggest[1])) as im:
                bw, bh = im.size
            tag = re.sub(r'src="[^"]+"', 'src="%s"' % biggest[1], tag)
            tag = re.sub(r'\bwidth="\d+"', 'width="%d"' % bw, tag)
            tag = re.sub(r'\bheight="\d+"', 'height="%d"' % bh, tag)
            close = " />" if tag.rstrip().endswith("/>") else ">"
            body = tag.rstrip()[:-2].rstrip() if close == " />" else tag.rstrip()[:-1].rstrip()
            return '%s srcset="%s" sizes="%s"%s' % (body, srcset, sizes, close)

        src = re.sub(r"<img\b[^>]*>", lambda m: rewrite(m.group(0)), src)
        if src != original:
            open(p, "w", encoding="utf-8").write(src)
            changed += 1
    print("  pages rewritten: %d" % changed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
