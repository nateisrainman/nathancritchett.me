#!/usr/bin/env python3
"""
Generate page-specific Open Graph share cards for nathancritchett.me.

Outputs 1200x630 PNGs to assets/og-*.png using the brand palette:
  Abyss      #060A14
  Dune Gold  #C4874D
  Coral      #D4735E
  Pandora    #00D4B8
  Cloud      #F0ECF8

Run: python3 scripts/generate-og-cards.py
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets")
COVER_PATH = os.path.join(OUT_DIR, "book-cover.jpg")
W, H = 1200, 630

# Brand colors
ABYSS = (6, 10, 20)
DEEP = (16, 24, 40)
GOLD = (196, 135, 77)
CORAL = (212, 115, 94)
PANDORA = (0, 212, 184)
CLOUD = (240, 236, 248)
MUTE = (128, 136, 168)
SOFT = (90, 96, 128)

# Fonts
SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
SERIF_REG = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SANS = "/System/Library/Fonts/Helvetica.ttc"


def f(path, size):
    return ImageFont.truetype(path, size)


def gradient_bg(draw, img):
    """Vertical diagonal gradient from ABYSS to DEEP."""
    base = Image.new("RGB", (W, H), ABYSS)
    overlay = Image.new("RGB", (W, H), DEEP)
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for y in range(H):
        # diagonal-ish fade
        v = int(255 * (y / H) * 0.55)
        md.line([(0, y), (W, y)], fill=v)
    base = Image.composite(overlay, base, mask)
    img.paste(base, (0, 0))


def radial_glow(img, cx, cy, radius, color, max_alpha=60):
    """Stamp a soft radial glow onto img."""
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    steps = 18
    for i in range(steps, 0, -1):
        r = int(radius * (i / steps))
        a = int(max_alpha * (1 - i / steps) ** 1.4)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (a,))
    img.alpha_composite(glow)


def particles(img, points):
    """Tiny colored dots for atmosphere."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x, y, r, color, a in points:
        d.ellipse([x - r, y - r, x + r, y + r], fill=color + (a,))
    img.alpha_composite(layer)


def hairline(draw, x, y, w, color=GOLD, h=2):
    draw.rectangle([x, y, x + w, y + h], fill=color)


def text_centered(draw, text, font, y, fill=CLOUD, kern=0):
    """Draw text centered horizontally at given y, with optional letter-spacing (kern)."""
    if kern == 0:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) / 2, y), text, font=font, fill=fill)
    else:
        # measure each char to apply kerning
        char_widths = []
        for c in text:
            bbox = draw.textbbox((0, 0), c, font=font)
            char_widths.append(bbox[2] - bbox[0])
        total = sum(char_widths) + kern * (len(text) - 1)
        x = (W - total) / 2
        for c, cw in zip(text, char_widths):
            draw.text((x, y), c, font=font, fill=fill)
            x += cw + kern


def text_left(draw, text, font, x, y, fill=CLOUD, kern=0):
    if kern == 0:
        draw.text((x, y), text, font=font, fill=fill)
    else:
        cx = x
        for c in text:
            draw.text((cx, y), c, font=font, fill=fill)
            bbox = draw.textbbox((0, 0), c, font=font)
            cx += (bbox[2] - bbox[0]) + kern


def base_card():
    img = Image.new("RGBA", (W, H), ABYSS + (255,))
    bg = Image.new("RGB", (W, H), ABYSS)
    d = ImageDraw.Draw(bg)
    # subtle vertical fade
    for y in range(H):
        t = y / H
        r = int(ABYSS[0] + (DEEP[0] - ABYSS[0]) * t * 0.7)
        g = int(ABYSS[1] + (DEEP[1] - ABYSS[1]) * t * 0.7)
        b = int(ABYSS[2] + (DEEP[2] - ABYSS[2]) * t * 0.7)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    img.paste(bg, (0, 0))

    # ambient glows
    radial_glow(img, 180, 540, 500, (107, 63, 160), max_alpha=70)   # violet bottom-left
    radial_glow(img, 1040, 120, 460, GOLD, max_alpha=55)            # gold top-right
    radial_glow(img, 600, 320, 360, PANDORA, max_alpha=22)          # subtle cyan center

    # particles
    pts = [
        (180, 90, 3, PANDORA, 160),
        (1000, 70, 2, GOLD, 150),
        (350, 540, 2, PANDORA, 130),
        (1050, 510, 3, GOLD, 130),
        (850, 110, 2, PANDORA, 180),
        (280, 320, 2, GOLD, 130),
        (950, 380, 2, PANDORA, 150),
        (140, 460, 2, GOLD, 130),
        (600, 60, 2, PANDORA, 130),
        (600, 560, 2, GOLD, 130),
        (440, 200, 1, CLOUD, 90),
        (760, 440, 1, CLOUD, 90),
    ]
    particles(img, pts)
    return img


def paste_cover(img, target_h=300, right_margin=90, y_center=None):
    """
    Paste the book cover on the right side with a soft drop shadow.
    Cover preserves its native aspect ratio.
    Returns the rect occupied as (x0, y0, x1, y1) so callers can avoid it.
    """
    cover = Image.open(COVER_PATH).convert("RGBA")
    cw0, ch0 = cover.size
    target_w = int(target_h * cw0 / ch0)
    cover = cover.resize((target_w, target_h), Image.LANCZOS)

    if y_center is None:
        y_center = H // 2
    x0 = W - right_margin - target_w
    y0 = y_center - target_h // 2

    # Drop shadow: blurred dark rectangle slightly larger than cover
    shadow_pad = 24
    shadow = Image.new(
        "RGBA",
        (target_w + shadow_pad * 2, target_h + shadow_pad * 2),
        (0, 0, 0, 0),
    )
    sd = ImageDraw.Draw(shadow)
    sd.rectangle(
        [shadow_pad, shadow_pad, shadow_pad + target_w, shadow_pad + target_h],
        fill=(0, 0, 0, 180),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=18))
    img.alpha_composite(shadow, dest=(x0 - shadow_pad, y0 - shadow_pad + 8))

    # Thin gold hairline frame for definition
    frame = Image.new("RGBA", (target_w + 2, target_h + 2), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rectangle([0, 0, target_w + 1, target_h + 1], outline=GOLD + (90,), width=1)
    img.alpha_composite(frame, dest=(x0 - 1, y0 - 1))

    img.alpha_composite(cover, dest=(x0, y0))
    return (x0, y0, x0 + target_w, y0 + target_h)


def draw_arrow(draw, x, y, color=GOLD, length=22, thickness=2):
    """Draw a right-pointing arrow at (x, y)."""
    # shaft
    draw.rectangle([x, y - thickness // 2, x + length, y + thickness // 2 + (thickness % 2)], fill=color)
    # head
    head = 8
    draw.polygon(
        [(x + length, y - head), (x + length + head, y), (x + length, y + head)],
        fill=color,
    )


def add_footer(draw, label_left="NATHANCRITCHETT.ME", label_right=None):
    """Bottom row: site URL on left, optional CTA on right with drawn arrow."""
    sans = f(SANS, 18)
    text_left(draw, label_left, sans, 64, H - 60, fill=MUTE, kern=2)
    if label_right:
        bbox = draw.textbbox((0, 0), label_right, font=sans)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        arrow_gap = 14
        arrow_len = 26
        arrow_head = 8
        total = tw + arrow_gap + arrow_len + arrow_head
        x = W - 64 - total
        draw.text((x, H - 60), label_right, font=sans, fill=GOLD)
        # vertical-center the arrow against the text
        ax = x + tw + arrow_gap
        ay = H - 60 + th // 2 + 1
        draw_arrow(draw, ax, ay, color=GOLD, length=arrow_len)


# -----------------------------------------------------------------
# CARD 1: HOME
# -----------------------------------------------------------------
def card_home():
    img = base_card()
    paste_cover(img, target_h=300, right_margin=90, y_center=H // 2 - 20)
    d = ImageDraw.Draw(img)

    sans = f(SANS, 20)
    sans_sm = f(SANS, 16)
    serif = f(SERIF_BOLD, 60)
    serif_sm = f(SERIF_REG, 24)

    # Eyebrow
    text_left(d, "NATHAN CRITCHETT", sans, 64, 64, fill=GOLD, kern=3)
    hairline(d, 64, 100, 90)

    # Headline
    d.text((64, 150), "Close the gap between AI", font=serif, fill=CLOUD)
    d.text((64, 218), "and the humans using it.", font=serif, fill=CLOUD)

    # Subhead
    d.text((64, 310), "Cognitive strategy, speaking, and a", font=serif_sm, fill=MUTE)
    d.text((64, 344), "new book for leaders in the AI era.", font=serif_sm, fill=MUTE)

    # Tiny cover caption
    text_left(d, "NEW BOOK · PRE-SALE OPEN", sans_sm, 830, 460, fill=GOLD, kern=2)

    add_footer(d, "NATHANCRITCHETT.ME", "Read more")
    return img


# -----------------------------------------------------------------
# CARD 2: BOOK  (the hero piece — must be the strongest)
# -----------------------------------------------------------------
def card_book():
    img = base_card()
    # Slightly larger cover on the book card itself
    paste_cover(img, target_h=400, right_margin=90, y_center=H // 2 - 10)
    d = ImageDraw.Draw(img)

    sans = f(SANS, 20)
    sans_sm = f(SANS, 18)
    title_serif = f(SERIF_BOLD, 78)
    sub_serif = f(SERIF_REG, 28)

    # Eyebrow
    text_left(d, "A NEW BOOK  ·  PRE-SALE OPEN", sans, 64, 64, fill=GOLD, kern=3)
    hairline(d, 64, 100, 90)

    # Main title — two lines
    d.text((64, 150), "Cognitive", font=title_serif, fill=CLOUD)
    d.text((64, 232), "Architecture", font=title_serif, fill=CLOUD)

    # Coral underline accent
    d.rectangle([64, 332, 360, 336], fill=CORAL)

    # Subtitle
    d.text((64, 360), "How to Think When", font=sub_serif, fill=GOLD)
    d.text((64, 396), "Machines Think For You", font=sub_serif, fill=GOLD)

    # Byline
    text_left(d, "BY NATHAN CRITCHETT", sans_sm, 64, 460, fill=MUTE, kern=3)

    add_footer(d, "NATHANCRITCHETT.ME/BOOK", "Reserve your copy")
    return img


# -----------------------------------------------------------------
# CARD 3: AUDIT
# -----------------------------------------------------------------
def card_audit():
    img = base_card()
    paste_cover(img, target_h=300, right_margin=90, y_center=H // 2 - 20)
    d = ImageDraw.Draw(img)

    sans = f(SANS, 20)
    sans_sm = f(SANS, 16)
    serif = f(SERIF_BOLD, 62)
    serif_sm = f(SERIF_REG, 24)

    text_left(d, "THE COGNITIVE AUDIT", sans, 64, 64, fill=GOLD, kern=3)
    hairline(d, 64, 100, 90)

    d.text((64, 150), "Where is the gap", font=serif, fill=CLOUD)
    d.text((64, 222), "widest in your", font=serif, fill=CLOUD)
    d.text((64, 294), "organization?", font=serif, fill=CLOUD)

    d.text((64, 396), "5 minutes. 15 questions. An honest score.", font=serif_sm, fill=MUTE)

    # Tiny cover caption
    text_left(d, "PAIRS WITH THE BOOK", sans_sm, 850, 460, fill=GOLD, kern=2)

    add_footer(d, "NATHANCRITCHETT.ME/AUDIT", "Take the audit")
    return img


# -----------------------------------------------------------------
# CARD 4: WRITING  (research / essays fallback)
# -----------------------------------------------------------------
def card_writing():
    img = base_card()
    paste_cover(img, target_h=300, right_margin=90, y_center=H // 2 - 20)
    d = ImageDraw.Draw(img)

    sans = f(SANS, 20)
    sans_sm = f(SANS, 16)
    serif = f(SERIF_BOLD, 56)
    serif_sm = f(SERIF_REG, 24)

    text_left(d, "RESEARCH  ·  ESSAYS  ·  FIELD NOTES", sans, 64, 64, fill=GOLD, kern=3)
    hairline(d, 64, 100, 90)

    d.text((64, 150), "Cognitive strategy", font=serif, fill=CLOUD)
    d.text((64, 214), "for the AI era.", font=serif, fill=CLOUD)

    d.text((64, 304), "Writing by Nathan Critchett on AI,", font=serif_sm, fill=MUTE)
    d.text((64, 338), "education, and the future of human judgment.", font=serif_sm, fill=MUTE)

    # Tiny cover caption
    text_left(d, "NEW BOOK · PRE-SALE OPEN", sans_sm, 830, 460, fill=GOLD, kern=2)

    add_footer(d, "NATHANCRITCHETT.ME", "Read the archive")
    return img


def save(img, name):
    path = os.path.join(OUT_DIR, name)
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  wrote {name}")


def main():
    print("Generating OG share cards (1200x630)...")
    save(card_home(), "og-home.png")
    save(card_book(), "og-book.png")
    save(card_audit(), "og-audit.png")
    save(card_writing(), "og-writing.png")
    print("Done.")


if __name__ == "__main__":
    main()
