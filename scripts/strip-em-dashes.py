#!/usr/bin/env python3
"""
Replace em dashes (— and &mdash;) and en dashes (–) across user-facing
files with cleaner punctuation.

Rules, in order:
  1. Attribution patterns: line-start or tag-start em dash + space
     ("— Nathan") becomes plain text with the dash removed.
  2. Mid-sentence em dash with spaces ("word — word") becomes comma.
  3. Em dash with no spaces ("word—word") becomes comma + space.
  4. Tight HTML-entity dashes ("word&mdash;word") become comma + space.
  5. En dashes between words ("8–10") become hyphens. En dash with
     spaces (a stylistic em-dash substitute) becomes comma.
  6. Stray bare em dashes become commas.

We skip:
  - <script> and <style> contents (could break syntax / selectors)
  - HTML comments (<!-- ... -->) — invisible to users, low signal
  - <code> and <pre> spans (intentional typography)

The script writes in place. Re-runnable: idempotent on output.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EM = "—"  # —
EN = "–"  # –
MDASH_ENTITY = "&mdash;"
NDASH_ENTITY = "&ndash;"

# Match a <script>, <style>, <code>, or <pre> block (incl. its content)
# so we can carve them out, transform the surrounding text, and stitch back.
PROTECT_RE = re.compile(
    r"(<script\b[^>]*>.*?</script>"
    r"|<style\b[^>]*>.*?</style>"
    r"|<code\b[^>]*>.*?</code>"
    r"|<pre\b[^>]*>.*?</pre>"
    r"|<!--.*?-->)",
    re.S | re.I,
)


def transform_text(t):
    # --- Attribution / line-start dash (delete the dash) ---
    # "— Nathan" at start of line or after a tag closing → "Nathan"
    t = re.sub(rf"(^|>)\s*{EM}\s+", r"\1", t, flags=re.M)
    t = re.sub(rf"(^|>)\s*{EN}\s+", r"\1", t, flags=re.M)
    t = re.sub(r"(^|>)\s*&mdash;\s+", r"\1", t, flags=re.M)
    t = re.sub(r"(^|>)\s*&ndash;\s+", r"\1", t, flags=re.M)

    # --- Spaced em dash → comma ---
    t = t.replace(f" {EM} ", ", ")
    t = t.replace(f" {MDASH_ENTITY} ", ", ")
    t = t.replace(f"{MDASH_ENTITY} ", ", ")
    t = t.replace(f" {MDASH_ENTITY}", ",")

    # Mixed leading-space variants
    t = t.replace(f" {EM}", ",")  # word —word
    t = t.replace(f"{EM} ", ", ")  # word— word

    # --- Tight em dash with no spaces ("word—word") → comma + space ---
    t = re.sub(rf"(\w){EM}(\w)", r"\1, \2", t)
    t = re.sub(r"(\w)&mdash;(\w)", r"\1, \2", t)

    # --- Any remaining bare em dashes → comma ---
    t = t.replace(EM, ",")
    t = t.replace(MDASH_ENTITY, ",")

    # --- En dash handling ---
    # "5–10" (numeric range) → "5-10" hyphen
    t = re.sub(rf"(\w){EN}(\w)", r"\1-\2", t)
    t = re.sub(r"(\w)&ndash;(\w)", r"\1-\2", t)
    # Spaced en dash as a stylistic substitute → comma
    t = t.replace(f" {EN} ", ", ")
    t = t.replace(f" {NDASH_ENTITY} ", ", ")
    # Strays
    t = t.replace(EN, "-")
    t = t.replace(NDASH_ENTITY, "-")

    # --- Cleanup: double commas / orphan punctuation introduced by edits ---
    t = re.sub(r",\s*,(?=\s)", ",", t)  # ", , " → ", "
    t = re.sub(r"\.\s*,", ".", t)        # ". ," → ". "
    t = re.sub(r",\s*\.", ".", t)        # ", ." → "."
    # Comma followed by punctuation/HTML close → just keep punctuation
    t = re.sub(r",\s*</", "</", t)

    return t


def transform_file(path):
    with open(path, encoding="utf-8") as f:
        original = f.read()

    parts = PROTECT_RE.split(original)
    # PROTECT_RE.split returns alternating: outside, protected, outside, ...
    out = []
    for i, chunk in enumerate(parts):
        if i % 2 == 0:
            out.append(transform_text(chunk))
        else:
            out.append(chunk)  # leave script/style/code/pre untouched

    new = "".join(out)
    if new == original:
        return "unchanged"

    with open(path, "w", encoding="utf-8") as f:
        f.write(new)

    # Diagnostic counts
    before = original.count(EM) + original.count(EN) + original.count(MDASH_ENTITY) + original.count(NDASH_ENTITY)
    after = new.count(EM) + new.count(EN) + new.count(MDASH_ENTITY) + new.count(NDASH_ENTITY)
    return f"changed: {before} dashes → {after}"


TARGET_EXTS = {".html"}


def main():
    files = []
    for dp, _, fs in os.walk(ROOT):
        if "/.git" in dp or "/node_modules" in dp:
            continue
        for f in fs:
            if os.path.splitext(f)[1].lower() in TARGET_EXTS:
                files.append(os.path.join(dp, f))
    files.sort()
    print(f"Sweeping {len(files)} HTML files...\n")
    for p in files:
        rel = os.path.relpath(p, ROOT)
        print(f"  {rel:60s} {transform_file(p)}")
    print("\nDone.")


if __name__ == "__main__":
    main()
