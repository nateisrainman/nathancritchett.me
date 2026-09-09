#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
FONTS = os.path.join(ROOT, "scripts", "fonts")
SERIF = os.path.join(FONTS, "DMSerifDisplay-Regular.ttf")
SANS = os.path.join(FONTS, "PlusJakartaSans.ttf")
W, H = 1200, 630

ABYSS = (6, 10, 20)
DEEP = (20, 30, 52)
GOLD = (196, 135, 77)
CORAL = (212, 115, 94)
CLOUD = (240, 236, 248)
MUTE = (176, 180, 204)
DIM = (128, 136, 168)


def font(path, size):
    return ImageFont.truetype(path, size)


def gradient_bg():
    base = Image.new("RGB", (W, H), ABYSS)
    top = Image.new("RGB", (W, H), DEEP)
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for y in range(H):
        md.line([(0, y), (W, y)], fill=int(70 * (1 - y / H)))
    base = Image.composite(top, base, mask)
    return base


def glow(img, cx, cy, radius, color, max_alpha=70):
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    steps = 60
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(max_alpha * (1 - i / steps))
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (a,))
    img.paste(Image.alpha_composite(img.convert("RGBA"), g).convert("RGB"), (0, 0))
    return img


def tracked(draw, xy, text, fnt, fill, spacing):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        w = draw.textbbox((0, 0), ch, font=fnt)[2]
        x += w + spacing
    return x


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textbbox((0, 0), t, font=fnt)[2] <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def cover_fill(src, tw, th):
    """object-fit: cover crop of src to tw x th."""
    sw, sh = src.size
    scale = max(tw / sw, th / sh)
    ns = (int(sw * scale + 0.5), int(sh * scale + 0.5))
    r = src.resize(ns, Image.LANCZOS)
    left = (ns[0] - tw) // 2
    top = int((ns[1] - th) * 0.42)  # bias slightly up to keep face/ball
    top = max(0, min(top, ns[1] - th))
    return r.crop((left, top, left + tw, top + th))


# ---------------- HOME CARD ----------------
def home_card():
    img = gradient_bg().convert("RGB")
    img = glow(img, 980, 120, 460, GOLD, 55)

    # photo panel on the right, blended at its left edge
    pw = 470
    photo = cover_fill(Image.open(os.path.join(A, "nathan-hero.jpg")).convert("RGB"), pw, H)
    mask = Image.new("L", (pw, H), 255)
    mdraw = ImageDraw.Draw(mask)
    fade = 170
    for x in range(fade):
        for_col = int(255 * (x / fade))
        mdraw.line([(x, 0), (x, H)], fill=for_col)
    img.paste(photo, (W - pw, 0), mask)

    d = ImageDraw.Draw(img)
    padx = 76
    # eyebrow
    tracked(d, (padx, 92), "AI STRATEGIST  ·  BUILDER  ·  AUTHOR",
            font(SANS, 24), GOLD, 2)
    # name
    name_f = font(SERIF, 92)
    d.text((padx - 3, 150), "Nathan", font=name_f, fill=CLOUD)
    d.text((padx - 3, 250), "Critchett", font=name_f, fill=CLOUD)
    # mission
    mis_f = font(SANS, 30)
    lines = wrap(d, "On a mission to empower every person to become the best version of themselves.",
                 mis_f, 620)
    y = 385
    for ln in lines:
        d.text((padx, y), ln, font=mis_f, fill=MUTE)
        y += 42
    # url
    tracked(d, (padx, 560), "NATHANCRITCHETT.ME", font(SANS, 20), DIM, 2)
    img.save(os.path.join(A, "og-home.png"))
    print("wrote og-home.png")


# ---------------- BOOK CARD ----------------
def book_card():
    img = gradient_bg().convert("RGB")
    img = glow(img, 250, 315, 440, GOLD, 55)
    d = ImageDraw.Draw(img)

    # book cover on the left with shadow
    cover = Image.open(os.path.join(A, "book-cover.jpg")).convert("RGB")
    ch = 468
    cw = int(cover.size[0] * ch / cover.size[1])
    cover = cover.resize((cw, ch), Image.LANCZOS)
    cx, cy = 96, (H - ch) // 2
    # shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rectangle([cx + 10, cy + 18, cx + cw + 10, cy + ch + 18], fill=(0, 0, 0, 120))
    img.paste(Image.alpha_composite(img.convert("RGBA"), shadow).convert("RGB"), (0, 0))
    img.paste(cover, (cx, cy))

    tx = cx + cw + 70
    maxw = W - tx - 70
    # eyebrow
    tracked(d, (tx, 132), "COMING SOON", font(SANS, 22), GOLD, 3)
    # title
    tf = font(SERIF, 68)
    ty = 172
    for ln in wrap(d, "Cognitive Architecture", tf, maxw):
        d.text((tx, ty), ln, font=tf, fill=CLOUD)
        ty += 74
    # subtitle
    sf = font(SANS, 26)
    ty += 6
    for ln in wrap(d, "How to Think When Machines Think For You", sf, maxw):
        d.text((tx, ty), ln, font=sf, fill=GOLD)
        ty += 36
    # tagline
    gf = font(SANS, 24)
    ty += 18
    for ln in wrap(d, "The foundational text for the era after information.", gf, maxw):
        d.text((tx, ty), ln, font=gf, fill=MUTE)
        ty += 34
    tracked(d, (tx, 560), "NATHANCRITCHETT.ME/BOOK", font(SANS, 20), DIM, 2)
    img.save(os.path.join(A, "og-book.png"))
    print("wrote og-book.png")


home_card()
book_card()
