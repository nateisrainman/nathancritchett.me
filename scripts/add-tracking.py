#!/usr/bin/env python3
"""
Inject the PostHog analytics snippet into every HTML page's <head>.

Idempotent. Skips files that already have `posthog.init`.

Strategy: one shared external file `assets/analytics.js` so config
lives in one place. Each page just adds a single deferred <script> tag,
which gets dropped right before </head>.
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Use absolute path so it works from any subdirectory (e.g. /writing/foo.html)
SNIPPET = '  <script defer src="/assets/analytics.js"></script>\n'


def already_instrumented(html):
    return "posthog" in html.lower() or "analytics.js" in html


def inject(html):
    # Inject right before </head>
    return re.sub(r"(\s*)</head>", SNIPPET + r"\1</head>", html, count=1)


def process(path):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    if already_instrumented(html):
        return "skipped (already instrumented)"
    if "</head>" not in html:
        return "skipped (no </head>)"
    new = inject(html)
    if new == html:
        return "skipped (no change)"
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)
    return "instrumented"


def main():
    files = []
    for dp, _, fs in os.walk(ROOT):
        if "/.git" in dp or "/node_modules" in dp:
            continue
        for f in fs:
            if f.endswith(".html"):
                files.append(os.path.join(dp, f))
    files.sort()
    print(f"Adding tracking to {len(files)} HTML files...\n")
    counts = {"instrumented": 0, "skipped": 0}
    for p in files:
        rel = os.path.relpath(p, ROOT)
        result = process(p)
        key = "instrumented" if result == "instrumented" else "skipped"
        counts[key] += 1
        print(f"  {rel:60s} {result}")
    print(f"\nInstrumented {counts['instrumented']}, skipped {counts['skipped']}.")


if __name__ == "__main__":
    main()
