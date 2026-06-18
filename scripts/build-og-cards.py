#!/usr/bin/env python3
"""
Generate brand section Open Graph cards (1200x630) for the libraries.

Outputs:
  assets/og-pitching.png   CritchPitch library
  assets/og-arq.png        Arq library
  assets/og-writing.png    AI & Cognition writing

Brand palette + real site fonts (DM Serif Display, Plus Jakarta Sans).
Run: python3 scripts/build-og-cards.py
"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")
FONTS = os.path.join(ROOT, "scripts", "fonts")
W, H = 1200, 630

ABYSS = (6, 10, 20)
DEEP = (22, 32, 56)
GOLD = (196, 135, 77)
CORAL = (212, 115, 94)
PANDORA = (0, 212, 184)
CLOUD = (240, 236, 248)
MUTE = (176, 180, 204)
DIM = (128, 136, 168)

SERIF = os.path.join(FONTS, "DMSerifDisplay-Regular.ttf")
SANS = os.path.join(FONTS, "PlusJakartaSans.ttf")


def font(path, size):
    return ImageFont.truetype(path, size)


def gradient_bg(img):
    base = Image.new("RGB", (W, H), ABYSS)
    overlay = Image.new("RGB", (W, H), DEEP)
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for y in range(H):
        md.line([(0, y), (W, y)], fill=int(190 * (y / H)))
    base = Image.composite(overlay, base, mask)
    img.paste(base, (0, 0))


def glow(img, cx, cy, radius, color, max_alpha=70):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(layer)
    steps = 22
    for i in range(steps, 0, -1):
        r = int(radius * (i / steps))
        a = int(max_alpha * (1 - i / steps) ** 1.5)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (a,))
    img.alpha_composite(layer)


def tracked(draw, pos, text, fnt, fill, tracking):
    x, y = pos
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking


def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def card(out, eyebrow, accent, headline, sub, footer):
    img = Image.new("RGBA", (W, H), ABYSS + (255,))
    gradient_bg(img)
    glow(img, 1000, 120, 520, accent, 60)
    glow(img, 120, 560, 460, accent, 32)
    d = ImageDraw.Draw(img)

    PAD = 80
    # top kicker
    tracked(d, (PAD, 70), "NATHANCRITCHETT.ME", font(SANS, 22), DIM, 3)
    # accent rule + eyebrow
    d.rectangle([PAD, 150, PAD + 54, 156], fill=accent)
    tracked(d, (PAD + 72, 138), eyebrow, font(SANS, 26), accent, 4)

    # headline (serif): shrink until it fits in 2 lines
    for size in (80, 70, 62, 56):
        hf = font(SERIF, size)
        lines = wrap(d, headline, hf, W - 2 * PAD)
        if len(lines) <= 2:
            break
    line_h = int(size * 1.16)
    y = 206
    for ln in lines:
        d.text((PAD, y), ln, font=hf, fill=CLOUD)
        y += line_h

    # sub (capped so it never reaches the footer rule)
    sf = font(SANS, 30)
    y += 12
    for ln in wrap(d, sub, sf, W - 2 * PAD - 40)[:2]:
        d.text((PAD, y), ln, font=sf, fill=MUTE)
        y += 42

    # footer
    d.line([(PAD, H - 96), (W - PAD, H - 96)], fill=(255, 255, 255, 40), width=1)
    d.ellipse([PAD, H - 72, PAD + 40, H - 32], fill=accent)
    initials = font(SERIF, 22)
    d.text((PAD + 11, H - 68), "NC", font=initials, fill=ABYSS)
    d.text((PAD + 56, H - 70), footer, font=font(SANS, 26), fill=CLOUD)

    img.convert("RGB").save(os.path.join(OUT, out), "PNG")
    print("wrote", out)


card("og-pitching.png", "CRITCHPITCH LIBRARY", CORAL,
     "Youth Pitching Arm-Care, Mechanics, and Velocity",
     "25 evidence-based guides for baseball parents and coaches.",
     "Nathan Critchett, Founder of CritchPitch")

card("og-arq.png", "ARQ LIBRARY", PANDORA,
     "Cognitive Complexity and How Thinking Grows",
     "14 articles on cognitive development, classroom to workforce.",
     "Nathan Critchett, Founder of Arq.Training")

card("og-writing.png", "WRITING", GOLD,
     "Cognitive Strategy for the AI Era",
     "24 essays and whitepapers on closing the gap between AI and human thinking.",
     "Nathan Critchett, Cognitive Strategist")
