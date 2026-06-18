#!/usr/bin/env node
/**
 * Generates the cross-venture library sections (/arq/ and /pitching/) on the
 * personal site from scripts/collections.js.
 *
 * For each collection it writes:
 *   - <basePath>index.html      a category-grouped library index
 *   - <basePath><slug>.html     a bylined article page per piece
 *
 * Bodies are not yet imported, so each article page presents the real metadata
 * (title, dek, description, read time, source count, category) and links to the
 * full sourced article. When full text is available, the same pages fill in.
 *
 * Brand: reuses /styles.css, /writing/article.css, /writing/library.css.
 */

const fs = require("fs");
const path = require("path");
const D = require("./site-data");
const { collections } = require("./collections");

const ROOT = path.dirname(__dirname);
const SITE = D.SITE;

const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];
function humanDate(iso) { const [y,m,d]=iso.split("-").map(Number); return `${MONTHS[m-1]} ${d}, ${y}`; }
const FANCY = new RegExp("[\\u2013\\u2014]");
function assertClean(s, where){ if (FANCY.test(s)) throw new Error("em/en dash in "+where); }
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function jsonLd(graph){ return `  <script type="application/ld+json">\n${D.jsonLdScript(graph)}\n  </script>`; }

function nav() {
  return `  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="/" class="nav-name">NATHAN CRITCHETT</a>
      <div class="nav-right">
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
      <div class="nav-links" id="nav-links">
        <a href="/writing/">Writing</a>
        <a href="/arq/">Arq</a>
        <a href="/pitching/">Pitching</a>
        <a href="/about.html">About</a>
        <a href="/#contact" class="nav-cta">Get in Touch</a>
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
const footer = `  <footer class="footer">
    <div class="footer-inner">
      <span class="footer-name">Nathan Critchett</span>
      <span class="footer-copy">2026. All rights reserved.</span>
    </div>
  </footer>`;

const head = (title, desc, canonical) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Nathan Critchett">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${SITE}/assets/og-home.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@nathancritch">
  <meta name="theme-color" content="#060A14">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/writing/article.css">
  <link rel="stylesheet" href="/writing/library.css">
  <script defer src="/assets/analytics.js"></script>`;

function founderTitle(c){ return c.key === "pitching" ? "Founder of CritchPitch" : "Founder of Arq.Training"; }

/* ---------------- index page ---------------- */
function buildIndex(c) {
  const url = SITE + c.basePath;
  const sections = c.categories.map((cat) => {
    const items = c.articles.filter((a) => a.category === cat.key);
    if (!items.length) return "";
    const list = items.map((a) => `        <a href="${a.slug}.html" class="writing-item">
          <span class="writing-title">${esc(a.title)}</span>
          <span class="writing-desc">${esc(a.dek)}</span>
          <span class="writing-meta">${a.read} min read &middot; ${a.sources} sources</span>
          <span class="writing-arrow">&#8594;</span>
        </a>`).join("\n");
    return `      <div class="cluster">
        <h2 class="cluster-title">${esc(cat.label)}</h2>
        <p class="cluster-blurb">${esc(cat.blurb)}</p>
        <div class="writing-list">
${list}
        </div>
      </div>`;
  }).filter(Boolean).join("\n");

  const itemList = D.prune({
    "@type": "CollectionPage",
    "@id": url + "#page",
    name: `${c.label} Library by Nathan Critchett`,
    url,
    about: { "@id": D.PERSON_ID },
    isPartOf: { "@id": D.SITEORG_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: c.articles.map((a, i) => ({
        "@type": "ListItem", position: i + 1,
        url: url + a.slug + ".html", name: a.title,
      })),
    },
  });
  const graph = [
    D.personNode({ full: false }), D.siteOrgNode(), itemList,
    D.breadcrumbNode([{ name: "Home", url: SITE + "/" }, { name: c.label + " Library", url }]),
  ];

  const noteHtml = c.note ? `    <p class="library-note">${esc(c.note)}</p>\n` : "";
  const page = `${head(`${c.label} Library by Nathan Critchett`, c.heroSub, url)}
${jsonLd(graph)}
</head>
<body>
${nav()}
  <header class="library-hero">
    <p class="section-label">${esc(c.heroEyebrow)}</p>
    <h1>${esc(c.heroTitle)}</h1>
    <p class="library-sub">${esc(c.heroSub)}</p>
  </header>
  <main class="library">
${noteHtml}${sections}
    <p class="library-more">More from Nathan: <a href="/writing/">AI &amp; Cognition</a> &middot; <a href="/arq/">Arq</a> &middot; <a href="/pitching/">Pitching</a></p>
  </main>
${footer}
${navScript}
</body>
</html>
`;
  assertClean(page, c.basePath + "index.html");
  fs.mkdirSync(path.join(ROOT, c.basePath), { recursive: true });
  fs.writeFileSync(path.join(ROOT, c.basePath, "index.html"), page);
  return c.articles.length;
}

/* ---------------- article page ---------------- */
function buildArticle(c, a) {
  const url = SITE + c.basePath + a.slug + ".html";
  const catLabel = c.categories.find((x) => x.key === a.category).label;
  const desc = a.desc || a.dek;
  const siblings = c.articles.filter((x) => x.category === a.category && x.slug !== a.slug).slice(0, 3);

  const articleNode = D.prune({
    "@type": "Article",
    "@id": url + "#article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: a.title,
    description: desc,
    image: SITE + "/assets/og-home.png",
    datePublished: c.reviewed,
    dateModified: c.reviewed,
    articleSection: catLabel,
    author: { "@id": D.PERSON_ID },
    publisher: { "@id": D.SITEORG_ID },
    sameAs: [c.sourceBase + "/library/" + a.slug],
    url,
  });
  const graph = [
    D.personNode({ full: false }), D.siteOrgNode(), articleNode,
    D.breadcrumbNode([
      { name: "Home", url: SITE + "/" },
      { name: c.label + " Library", url: SITE + c.basePath },
      { name: a.title, url },
    ]),
  ];

  const keepReading = siblings.length ? `  <section class="keep-reading">
    <h2>Keep reading</h2>
    <div class="kr-grid">
${siblings.map((s) => `      <a class="kr-card" href="${s.slug}.html">
        <span class="kr-tag">${esc(catLabel)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.dek)}</p>
      </a>`).join("\n")}
    </div>
  </section>` : "";

  const disclaimer = c.key === "pitching"
    ? `      <p class="article-disclaimer"><em>Education, not a medical diagnosis or treatment plan. If your pitcher has pain, consult a qualified sports-medicine professional.</em></p>\n`
    : "";

  const sourceUrl = c.sourceBase + "/library/" + a.slug;
  const page = `${head(`${a.title} | Nathan Critchett`, desc, url)}
${jsonLd(graph)}
</head>
<body>
${nav()}
  <article class="article">
    <div class="article-inner">
      <div class="article-meta">
        <a href="./" class="back-link">&larr; ${esc(c.label)} Library</a>
        <span class="article-type">${esc(catLabel)}</span>
      </div>
      <h1 class="article-title">${esc(a.title)}</h1>
      <p class="article-subtitle">${esc(a.dek)}</p>
      <div class="article-byline">
        <div class="byline-meta">${a.read} min read<span class="byline-dot">&middot;</span>${a.sources} cited sources<span class="byline-dot">&middot;</span>Last reviewed ${humanDate(c.reviewed)}</div>
        <div class="byline-author">
          <span class="byline-avatar">NC</span>
          <span>By <a href="/about.html" rel="author">Nathan Critchett</a>, ${esc(founderTitle(c))}</span>
        </div>
      </div>
      <div class="article-body">
        <p>${esc(desc)}</p>
        <div class="source-callout">
          <span class="callout-label">Full article</span>
          <p>This is the library entry on Nathan's hub. Read the full, fully-sourced piece on ${esc(c.sourceName)}.</p>
          <a class="btn btn-primary btn-sm" href="${sourceUrl}" rel="noopener">Read on ${esc(c.sourceName)} &#8594;</a>
        </div>
${disclaimer}      </div>
      <aside class="author-box">
        <img class="author-avatar" src="/assets/headshot.jpg" alt="Nathan Critchett" onerror="this.style.display='none'">
        <div>
          <div class="author-name">Nathan Critchett</div>
          <p>Cognitive strategist and builder. ${esc(founderTitle(c))} and a former Division I pitcher. <a href="/about.html">More about Nathan</a>.</p>
        </div>
      </aside>
    </div>
  </article>
${keepReading}
${footer}
${navScript}
</body>
</html>
`;
  assertClean(page, c.basePath + a.slug);
  fs.writeFileSync(path.join(ROOT, c.basePath, a.slug + ".html"), page);
}

let total = 0;
for (const c of Object.values(collections)) {
  buildIndex(c);
  c.articles.forEach((a) => buildArticle(c, a));
  total += c.articles.length;
  console.log(`Built ${c.label}: index + ${c.articles.length} article pages.`);
}
console.log(`Collections total: ${total} article pages.`);
