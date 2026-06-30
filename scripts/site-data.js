/**
 * Single source of truth for Nathan Critchett's identity and the
 * structured data emitted across nathancritchett.me.
 *
 * Edit the data at the top of this file (profile URLs, school, etc.).
 * Empty fields are pruned automatically, so a blank URL is simply
 * omitted from the JSON-LD instead of shipping a broken/placeholder link.
 *
 * Then run:  node scripts/build-seo.js
 * to regenerate every byline, every JSON-LD block, the /writing index,
 * the sitemap, and robots.txt from this one file.
 */

const SITE = "https://nathancritchett.me";

const PERSON_ID = SITE + "/#nathan";
const SITEORG_ID = SITE + "/#org";

/* --------------------------------------------------------------- *
 * 1. IDENTITY DATA  (the only section you normally edit)
 * --------------------------------------------------------------- */

const profiles = {
  linkedin: "https://www.linkedin.com/in/nathan-critchett/",
  // Conflict on the live site: nav links twitter.com/nathancritchett but
  // meta tags use @nathancritch. Left blank until confirmed so we never
  // ship a wrong sameAs. Set to the correct full profile URL, e.g.
  // "https://x.com/nathancritchett".
  x: "",
  github: "",
  instagram: "",
  youtube: "",
  scholar: "",
  substack: "",
  medium: "",
  crunchbase: "",
  wikidata: "",
};

// Schools attended. Leave name blank to omit alumniOf entirely.
const alumni = [
  { name: "Loyola Marymount University", url: "https://www.lmu.edu" },
];

const person = {
  name: "Nathan Critchett",
  givenName: "Nathan",
  familyName: "Critchett",
  jobTitle: "AI Strategist & Builder",
  // Used as a brand tagline in copy, not in schema jobTitle.
  tagline: "AI Strategist & Builder",
  description:
    "Nathan Critchett is an AI strategist and hands-on builder who helps " +
    "enterprises close the gap between what AI can produce and what their people " +
    "can evaluate. He translates cognitive-science research into shipped products, " +
    "LLM-assisted tools, and adoption programs across 100+ organizations, and is " +
    "the author of Cognitive Architecture. Founder of Arq.Training and CritchPitch. " +
    "Open to advisory, fractional, and enterprise AI engagements.",
  url: SITE,
  image: SITE + "/assets/headshot.jpg",
  email: "nathan.critch@outlook.com",
  knowsAbout: [
    "AI strategy",
    "Enterprise AI adoption",
    "Generative AI",
    "Large language models (LLMs)",
    "Prompt engineering",
    "AI adoption and change management",
    "Human-in-the-loop design",
    "AI ROI and measurement",
    "Product strategy",
    "Learning experience design",
    "Cognitive offloading",
    "Human-AI collaboration",
    "Future of work",
    "AI in education",
  ],
};

// Organizations Nathan founded. Referenced as founder + worksFor, and
// surfaced in the person's sameAs for cross-site entity reinforcement.
const organizations = [
  {
    id: SITE + "/#critchpitch",
    name: "CritchPitch",
    url: "https://critchpitch.com",
    description:
      "Youth pitching screening and arm-health tool, built to put a pitching " +
      "lab in every parent's pocket.",
    role: "Founder",
    // critchpitch.com/about sameAs-links back here; this is the reciprocal half.
    sameAs: [SITE],
  },
  {
    id: SITE + "/#arqtraining",
    name: "Arq.Training",
    url: "https://arq.training",
    description:
      "A cognitive diagnostic platform for education that makes visible how " +
      "students actually think, turning curriculum and test scores into a " +
      "picture of the reasoning in between.",
    role: "Founder",
    sameAs: [],
  },
];

/* --------------------------------------------------------------- *
 * 2. HELPERS
 * --------------------------------------------------------------- */

// Recursively drop empty strings, empty arrays, empty objects, null/undefined,
// and objects whose only "real" fields were pruned away.
function prune(value) {
  if (Array.isArray(value)) {
    const arr = value.map(prune).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const pv = prune(v);
      if (pv !== undefined) out[k] = pv;
    }
    // keep objects that carry @type/@id even if otherwise small
    const keys = Object.keys(out);
    if (keys.length === 0) return undefined;
    if (keys.length === 1 && (keys[0] === "@type" || keys[0] === "@id"))
      return undefined;
    return out;
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t.length ? value : undefined;
  }
  return value === null ? undefined : value;
}

// Build the person's sameAs from profiles + founded org URLs (filtered).
function personSameAs() {
  const fromProfiles = Object.values(profiles);
  const fromOrgs = organizations.map((o) => o.url);
  return [...fromProfiles, ...fromOrgs].filter((u) => u && u.trim());
}

function alumniNodes() {
  return alumni
    .filter((a) => a.name && a.name.trim())
    .map((a) => prune({ "@type": "CollegeOrUniversity", name: a.name, url: a.url }));
}

function orgRefs() {
  return organizations.map((o) => ({ "@id": o.id }));
}

// Full Person node (used on /about and homepage). Compact omits the heavy
// knowsAbout/alumniOf arrays for per-article pages.
function personNode({ full = false } = {}) {
  const node = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: person.name,
    givenName: person.givenName,
    familyName: person.familyName,
    jobTitle: person.jobTitle,
    description: person.description,
    url: person.url,
    image: person.image,
    sameAs: personSameAs(),
    worksFor: orgRefs(),
    founder: orgRefs(),
  };
  if (full) {
    node.email = "mailto:" + person.email;
    node.knowsAbout = person.knowsAbout;
    const al = alumniNodes();
    if (al.length) node.alumniOf = al;
  }
  return prune(node);
}

function siteOrgNode() {
  return prune({
    "@type": "Organization",
    "@id": SITEORG_ID,
    name: "Nathan Critchett",
    url: SITE,
    logo: SITE + "/assets/headshot.jpg",
    founder: { "@id": PERSON_ID },
  });
}

function foundedOrgNodes() {
  return organizations.map((o) =>
    prune({
      "@type": "Organization",
      "@id": o.id,
      name: o.name,
      url: o.url,
      description: o.description,
      founder: { "@id": PERSON_ID },
      sameAs: o.sameAs,
    })
  );
}

function articleNode({ url, headline, description, datePublished, dateModified, section, image }) {
  return prune({
    "@type": "Article",
    "@id": url + "#article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline,
    description,
    image: image || person.image,
    datePublished,
    dateModified,
    articleSection: section,
    author: { "@id": PERSON_ID },
    publisher: { "@id": SITEORG_ID },
    url,
  });
}

function breadcrumbNode(crumbs) {
  return prune({
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  });
}

function faqNode(faqs) {
  if (!faqs || !faqs.length) return undefined;
  return prune({
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
}

// Serialize a @graph to an escaped JSON-LD <script> body. Escapes "<" (and ">")
// per static-site guidance so nothing can break out of the <script> element.
function jsonLdScript(graph) {
  const clean = graph.filter((n) => n !== undefined);
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": clean }, null, 2);
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

module.exports = {
  SITE,
  PERSON_ID,
  SITEORG_ID,
  person,
  organizations,
  profiles,
  personNode,
  siteOrgNode,
  foundedOrgNodes,
  articleNode,
  breadcrumbNode,
  faqNode,
  jsonLdScript,
  prune,
};
