#!/usr/bin/env python3
"""
Add Open Graph + Twitter card meta tags to every writing/*.html page.

- Parses the existing <title> and <meta name="description"> per page.
- Inserts OG/Twitter tags right after the description.
- Skips files that already have og:image (idempotent).
- Uses /assets/og-writing.png as the universal share card for essays.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITING_DIR = os.path.join(ROOT, "writing")
SITE_URL = "https://nathancritchett.me"
OG_IMAGE = f"{SITE_URL}/assets/og-writing.png?v=1"
TWITTER_HANDLE = "@nathancritch"


def clean_title(title):
    """Strip the trailing site name from the page title for OG."""
    title = title.strip()
    for tail in [" | Nathan Critchett", " — Nathan Critchett", " - Nathan Critchett"]:
        if title.endswith(tail):
            title = title[: -len(tail)]
    return title


def og_block(filename, title, description):
    canonical = f"{SITE_URL}/writing/{filename}"
    og_title = clean_title(title)
    return f"""  <link rel="canonical" href="{canonical}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Nathan Critchett">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{OG_IMAGE}">
  <meta property="og:image:secure_url" content="{OG_IMAGE}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Nathan Critchett — Research, essays, field notes.">
  <meta property="article:author" content="Nathan Critchett">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="{TWITTER_HANDLE}">
  <meta name="twitter:creator" content="{TWITTER_HANDLE}">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{OG_IMAGE}">
  <meta name="twitter:image:alt" content="Nathan Critchett — Research, essays, field notes.">

  <meta name="apple-mobile-web-app-title" content="Nathan Critchett">
  <meta name="theme-color" content="#060A14">"""


def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    if "og:image" in html:
        return "skipped (already has OG tags)"

    title_match = re.search(r"<title>(.*?)</title>", html, re.S)
    desc_match = re.search(
        r'<meta\s+name="description"\s+content="([^"]*)"\s*/?>', html
    )
    if not title_match or not desc_match:
        return "skipped (missing title or description)"

    title = title_match.group(1)
    description = desc_match.group(1).strip()

    filename = os.path.basename(path)
    block = og_block(filename, title, description)

    # Insert right after the description meta tag
    new_html = re.sub(
        r'(<meta\s+name="description"\s+content="[^"]*"\s*/?>)',
        r"\1\n" + block,
        html,
        count=1,
    )

    if new_html == html:
        return "skipped (failed to insert)"

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)
    return "updated"


def main():
    files = sorted(
        os.path.join(WRITING_DIR, f)
        for f in os.listdir(WRITING_DIR)
        if f.endswith(".html")
    )
    print(f"Found {len(files)} writing pages.")
    counts = {"updated": 0, "skipped": 0}
    for path in files:
        result = process_file(path)
        tag = "updated" if result == "updated" else "skipped"
        counts[tag] += 1
        print(f"  {result:50s}  {os.path.basename(path)}")
    print()
    print(f"Done. Updated {counts['updated']}, skipped {counts['skipped']}.")


if __name__ == "__main__":
    main()
