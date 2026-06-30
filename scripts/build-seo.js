#!/usr/bin/env node
/**
 * SEO / entity build step for nathancritchett.me (static site, no framework).
 *
 * Reads identity from scripts/site-data.js and the cluster map from
 * scripts/articles.js, then injects into each /writing article:
 *   - a visible byline + freshness meta row (read time, sources, last updated)
 *   - Article + Breadcrumb + (optional) FAQPage JSON-LD, author = Nathan (@id)
 *   - a visible "Common questions" FAQ block where authored
 *   - a "Keep reading" cluster cross-link block
 * and (re)generates:
 *   - /writing/index.html   (library index grouped by cluster)
 *   - /sitemap.xml
 *   - /robots.txt
 * and fills the <!--SEO:HEAD--> placeholder on /index.html and /about.html.
 *
 * Idempotent: every injection lives between HTML comment markers and is
 * replaced in place on each run. Safe to run any number of times.
 */

const fs = require("fs");
const path = require("path");
const D = require("./site-data");
const { REVIEW_DATE, clusters, articles } = require("./articles");
const { collections } = require("./collections");
const { navHtml: siteNav, librarySwitch } = require("./nav");

const ROOT = path.dirname(__dirname);
const SITE = D.SITE;

/* ------------------------- helpers ------------------------- */

const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];
function humanDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const FANCY_DASH = new RegExp("[\\u2013\\u2014]"); // en dash, em dash
function assertNoFancyDashes(s, where) {
  if (FANCY_DASH.test(s)) {
    throw new Error(`Generated em/en dash in ${where} (forbidden).`);
  }
}

function read(file) { return fs.readFileSync(file, "utf8"); }
function write(file, content) { fs.writeFileSync(file, content); }

// Replace a <!--SEO:NAME--> ... <!--/SEO:NAME--> region with payload.
// If the markers are absent, insert (markers + payload) immediately before
// `anchor` (the first occurrence). Returns the new string.
function injectRegion(content, name, payload, anchor) {
  const block = `<!--SEO:${name}-->\n${payload}\n<!--/SEO:${name}-->`;
  const re = new RegExp(`<!--SEO:${name}-->[\\s\\S]*?<!--/SEO:${name}-->`);
  if (re.test(content)) return content.replace(re, block);
  const idx = content.indexOf(anchor);
  if (idx === -1) throw new Error(`Anchor not found for ${name}: ${anchor}`);
  return content.slice(0, idx) + block + "\n" + content.slice(idx);
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

// Approximate read time + source count from the article body.
function bodyStats(html) {
  const start = html.indexOf('class="article-body"');
  let region = start === -1 ? html : html.slice(start);
  const refIdx = region.search(/<h2[^>]*>\s*(References|Sources)\b/i);
  const readingRegion = refIdx === -1 ? region : region.slice(0, refIdx);
  const words = stripTags(readingRegion).split(" ").filter(Boolean).length;
  const readMins = Math.max(2, Math.round(words / 200));
  let sources = 0;
  if (refIdx !== -1) {
    const refRegion = region.slice(refIdx);
    // Numbered <li> sources (newer style) or <p> entries (older articles).
    const lis = (refRegion.match(/<li[\s>]/g) || []).length;
    sources = lis || (refRegion.match(/<p[\s>]/g) || []).length;
  }
  return { readMins, sources };
}

function htmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------- per-article ------------------------- */

const titleBySlug = {};   // for cross-link cards
const descBySlug = {};

// First pass: gather titles/descriptions for "Keep reading" cards.
for (const a of articles) {
  const file = path.join(ROOT, "writing", `${a.slug}.html`);
  const html = read(file);
  titleBySlug[a.slug] = extract(html, /<h1 class="article-title">([\s\S]*?)<\/h1>/);
  descBySlug[a.slug] = extract(html, /<p class="article-subtitle">([\s\S]*?)<\/p>/);
}

function bylineHtml({ readMins, sources, type }) {
  const bits = [`${readMins} min read`];
  if (sources > 0) bits.push(`${sources} cited sources`);
  bits.push(`Last updated ${humanDate(REVIEW_DATE)}`);
  const meta = bits.join('<span class="byline-dot">&middot;</span>');
  return `      <div class="article-byline">
        <div class="byline-meta">${meta}</div>
        <div class="byline-author">
          <span class="byline-avatar">NC</span>
          <span>By <a href="/about.html" rel="author">Nathan Critchett</a>, ${htmlEscape(D.person.jobTitle)}</span>
        </div>
      </div>`;
}

function faqHtml(faq) {
  if (!faq || !faq.length) return "";
  const items = faq.map((f) => `        <details class="faq-item">
          <summary>${htmlEscape(f.q)}</summary>
          <div class="faq-answer">${htmlEscape(f.a)}</div>
        </details>`).join("\n");
  return `      <section class="faq">
        <h2>Common questions</h2>
${items}
      </section>`;
}

function authorBoxHtml() {
  return `      <aside class="author-box">
        <img class="author-avatar" src="/assets/headshot.jpg" alt="Nathan Critchett" onerror="this.style.display='none'">
        <div>
          <div class="author-name">Nathan Critchett</div>
          <p>Cognitive strategist and builder focused on closing the gap between what AI can produce and what people can evaluate. Founder of <a href="https://critchpitch.com" rel="noopener">CritchPitch</a> and <a href="https://arq.training" rel="noopener">Arq.Training</a>, and a former Division I pitcher. <a href="/about.html">More about Nathan</a>.</p>
        </div>
      </aside>`;
}

function keepReadingHtml(slug, cluster) {
  const siblings = articles
    .filter((a) => a.cluster === cluster && a.slug !== slug)
    .slice(0, 3);
  if (!siblings.length) return "";
  const cards = siblings.map((s) => `      <a class="kr-card" href="${s.slug}.html">
        <span class="kr-tag">${htmlEscape(clusters[s.cluster].label)}</span>
        <h3>${titleBySlug[s.slug]}</h3>
        <p>${descBySlug[s.slug]}</p>
      </a>`).join("\n");
  return `  <section class="keep-reading">
    <h2>Keep reading</h2>
    <div class="kr-grid">
${cards}
    </div>
  </section>`;
}

function articleGraph(a, html, stats) {
  const url = `${SITE}/writing/${a.slug}.html`;
  const headline = stripTags(titleBySlug[a.slug]);
  const description = stripTags(descBySlug[a.slug]);
  const section = clusters[a.cluster].label;
  const graph = [
    D.personNode({ full: false }),
    D.siteOrgNode(),
    D.articleNode({
      url,
      headline,
      description,
      datePublished: REVIEW_DATE,
      dateModified: REVIEW_DATE,
      section,
      image: `${SITE}/assets/og-writing.png`,
    }),
    D.breadcrumbNode([
      { name: "Home", url: `${SITE}/` },
      { name: "Writing", url: `${SITE}/writing/` },
      { name: headline, url },
    ]),
    D.faqNode(a.faq),
  ];
  return `  <script type="application/ld+json">\n${D.jsonLdScript(graph)}\n  </script>`;
}

let count = 0;
for (const a of articles) {
  const file = path.join(ROOT, "writing", `${a.slug}.html`);
  let html = read(file);
  const type = extract(html, /<span class="article-type">([\s\S]*?)<\/span>/) || "Article";
  const stats = bodyStats(html);

  const byline = bylineHtml({ ...stats, type });
  const head = articleGraph(a, html, stats);
  const faqBlock = faqHtml(a.faq);
  const authorBlock = authorBoxHtml();
  const faqAndAuthor = [faqBlock, authorBlock].filter(Boolean).join("\n");
  const keepReading = keepReadingHtml(a.slug, a.cluster);

  [byline, head, faqAndAuthor, keepReading].forEach((p) =>
    assertNoFancyDashes(p, `${a.slug}`)
  );

  html = injectRegion(html, "HEAD", head, "</head>");
  html = injectRegion(html, "BYLINE", byline, '<div class="article-body">');
  html = injectRegion(html, "FAQAUTHOR", faqAndAuthor, "  </article>");
  const krAnchor = html.includes('<div class="article-cta">')
    ? '<div class="article-cta">'
    : "<footer";
  html = injectRegion(html, "KEEPREADING", keepReading, krAnchor);
  // Unify the (previously stale) AI article nav with the rest of the site.
  html = html.replace(/<nav class="nav" id="nav">[\s\S]*?<\/nav>/, () => siteNav());

  write(file, html);
  count++;
}

/* ------------------------- writing index ------------------------- */

function navHtml(prefix) {
  return `  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="${prefix}" class="nav-name">NATHAN CRITCHETT</a>
      <div class="nav-right">
        <a href="${prefix}book.html#preorder" class="nav-mobile-cta">Book Pre-sale</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-links" id="nav-links">
        <a href="${prefix}#stakes">The Problem</a>
        <a href="${prefix}book.html">The Book</a>
        <a href="${prefix}writing/">Writing</a>
        <a href="${prefix}about.html">About</a>
        <a href="${prefix}#contact" class="nav-cta">Get in Touch</a>
      </div>
    </div>
  </nav>`;
}

const navScript = `  <script>
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle) navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    if (navLinks) navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  </script>`;

function buildWritingIndex() {
  const url = `${SITE}/writing/`;
  const sections = Object.entries(clusters).map(([id, c]) => {
    const items = articles.filter((a) => a.cluster === id);
    const list = items.map((a) => `        <a href="${a.slug}.html" class="writing-item">
          <span class="writing-title">${titleBySlug[a.slug]}</span>
          <span class="writing-desc">${descBySlug[a.slug]}</span>
          <span class="writing-arrow">&#8594;</span>
        </a>`).join("\n");
    return `      <div class="cluster">
        <h2 class="cluster-title">${htmlEscape(c.label)}</h2>
        <p class="cluster-blurb">${htmlEscape(c.blurb)}</p>
        <div class="writing-list">
${list}
        </div>
      </div>`;
  }).join("\n");

  const itemList = {
    "@type": "CollectionPage",
    "@id": url + "#page",
    name: "Writing by Nathan Critchett",
    url,
    isPartOf: { "@id": D.SITEORG_ID },
    about: { "@id": D.PERSON_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/writing/${a.slug}.html`,
        name: stripTags(titleBySlug[a.slug]),
      })),
    },
  };
  const graph = [
    D.personNode({ full: false }),
    D.siteOrgNode(),
    D.prune(itemList),
    D.breadcrumbNode([
      { name: "Home", url: `${SITE}/` },
      { name: "Writing", url },
    ]),
  ];
  const jsonld = `  <script type="application/ld+json">\n${D.jsonLdScript(graph)}\n  </script>`;

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Writing by Nathan Critchett | Cognitive Strategy for the AI Era</title>
  <meta name="description" content="The full library: ${articles.length} essays and whitepapers on the Complexity Gap, vertical development, cognitive offloading, human-AI learning, and district strategy in the AI era.">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Nathan Critchett">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="Writing by Nathan Critchett">
  <meta property="og:description" content="${articles.length} essays and whitepapers on cognitive strategy for the AI era.">
  <meta property="og:image" content="${SITE}/assets/og-writing.png?v=3">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@nathancritch">
  <meta name="theme-color" content="#060A14">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="article.css">
  <link rel="stylesheet" href="library.css">
  <script defer src="/assets/analytics.js"></script>
${jsonld}
</head>
<body>
${siteNav()}
  <header class="library-hero">
    <p class="section-label">My Writing</p>
    <h1>Writing on cognitive strategy for the AI era</h1>
    <p class="library-sub">${articles.length} essays and whitepapers, grouped into the ideas they build. Every piece is written and bylined by Nathan Critchett.</p>
  </header>
  <main class="library">
${librarySwitch("writing")}
${sections}
  </main>
  <footer class="footer">
    <div class="footer-inner">
      <span class="footer-name">Nathan Critchett</span>
      <span class="footer-copy">2026. All rights reserved.</span>
    </div>
  </footer>
${navScript}
</body>
</html>
`;
  assertNoFancyDashes(page, "writing/index.html");
  write(path.join(ROOT, "writing", "index.html"), page);
}

buildWritingIndex();

/* ------------------------- sitemap + robots ------------------------- */

function buildSitemap() {
  const staticPages = ["/", "/about.html", "/hire.html", "/writing/", "/book.html"];
  const collectionUrls = [];
  for (const c of Object.values(collections)) {
    collectionUrls.push({ loc: SITE + c.basePath, lastmod: c.reviewed });
    for (const a of c.articles) {
      collectionUrls.push({ loc: SITE + c.basePath + a.slug + ".html", lastmod: c.reviewed });
    }
  }
  const urls = [
    ...staticPages.map((p) => ({ loc: SITE + p, lastmod: REVIEW_DATE })),
    ...articles.map((a) => ({
      loc: `${SITE}/writing/${a.slug}.html`,
      lastmod: REVIEW_DATE,
    })),
    ...collectionUrls,
  ];
  const body = urls.map((u) =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  write(path.join(ROOT, "sitemap.xml"), xml);
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
  write(path.join(ROOT, "robots.txt"), txt);
}

buildSitemap();
buildRobots();

/* ------------------------- homepage + about schema ------------------------- */

function injectHeadSchema(file, graph) {
  if (!fs.existsSync(file)) return false;
  let html = read(file);
  const payload = `  <script type="application/ld+json">\n${D.jsonLdScript(graph)}\n  </script>`;
  assertNoFancyDashes(payload, file);
  html = injectRegion(html, "HEAD", payload, "</head>");
  write(file, html);
  return true;
}

// Homepage: full Person + WebSite + site Organization + founded orgs.
const homeGraph = [
  D.personNode({ full: true }),
  D.siteOrgNode(),
  ...D.foundedOrgNodes(),
  D.prune({
    "@type": "WebSite",
    "@id": SITE + "/#website",
    url: SITE + "/",
    name: "Nathan Critchett",
    publisher: { "@id": D.SITEORG_ID },
    about: { "@id": D.PERSON_ID },
  }),
];
const didHome = injectHeadSchema(path.join(ROOT, "index.html"), homeGraph);

// About hub: full Person + founded orgs + ProfilePage.
const aboutUrl = SITE + "/about.html";
const aboutGraph = [
  D.prune({
    "@type": "ProfilePage",
    "@id": aboutUrl + "#page",
    url: aboutUrl,
    mainEntity: { "@id": D.PERSON_ID },
  }),
  D.personNode({ full: true }),
  D.siteOrgNode(),
  ...D.foundedOrgNodes(),
  D.breadcrumbNode([
    { name: "Home", url: SITE + "/" },
    { name: "About", url: aboutUrl },
  ]),
];
const didAbout = injectHeadSchema(path.join(ROOT, "about.html"), aboutGraph);

// Hire page: WebPage + Service offering + full Person + FAQPage.
const hireUrl = SITE + "/hire.html";
const HIRE_FAQ = [
  { q: "What is a fractional Chief AI Officer?", a: "Senior AI leadership on a part-time or contract basis. The role sets AI priorities, oversees the build, and owns adoption, without the cost or commitment of a full-time executive hire." },
  { q: "How long is a typical engagement?", a: "An AI Adoption Sprint runs over a few focused weeks around a single pilot. Fractional leadership runs as an ongoing monthly engagement. Keynotes and workshops are scoped to the event." },
  { q: "Is the work remote or on-site?", a: "Both. Engagements run remotely, with on-site sessions when a workshop or leadership offsite calls for it." },
  { q: "What does it cost?", a: "Pricing is scoped per engagement against the outcome it targets. Fractional AI leadership commonly runs as a monthly retainer. Book a call for a quote." },
  { q: "Which industries and organizations?", a: "Field work spans education and the public sector, across 100+ organizations. The adoption method is domain-general and transfers to any organization rolling out AI." },
  { q: "Available for advisory or select full-time roles?", a: "Open to advisory, fractional, and select roles. Reach out to start a conversation." },
];
const hireGraph = [
  D.prune({
    "@type": "WebPage",
    "@id": hireUrl + "#page",
    url: hireUrl,
    name: "Hire Nathan Critchett",
    about: { "@id": D.PERSON_ID },
    isPartOf: { "@id": D.SITEORG_ID },
  }),
  D.personNode({ full: true }),
  D.siteOrgNode(),
  D.prune({
    "@type": "Service",
    "@id": hireUrl + "#service",
    name: "Fractional Chief AI Officer and AI adoption advisory",
    serviceType: "AI strategy and adoption",
    provider: { "@id": D.PERSON_ID },
    areaServed: "Worldwide",
    description: "Fractional AI leadership, AI adoption sprints, keynotes, and workshops that turn enterprise AI spend into measurable ROI.",
  }),
  D.breadcrumbNode([
    { name: "Home", url: SITE + "/" },
    { name: "Hire", url: hireUrl },
  ]),
  D.faqNode(HIRE_FAQ),
];
const didHire = injectHeadSchema(path.join(ROOT, "hire.html"), hireGraph);

console.log(`Injected schema + byline into ${count} articles.`);
console.log(`Hire schema: ${didHire ? "ok" : "hire.html not found"}.`);
console.log(`Wrote writing/index.html, sitemap.xml, robots.txt.`);
console.log(`Homepage schema: ${didHome ? "ok" : "skipped (no index.html marker)"}.`);
console.log(`About schema: ${didAbout ? "ok" : "about.html not found yet"}.`);
