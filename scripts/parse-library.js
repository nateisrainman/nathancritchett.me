/**
 * Parses the exported library markdown (Arq + CritchPitch) into structured
 * articles: title, key takeaways, body HTML, FAQ, and sources.
 *
 * Handles both authoring conventions:
 *   - Arq: [n] citations, "## Key takeaways / ## Frequently asked questions /
 *     ## Sources", italic *dek*.
 *   - CritchPitch: [^n] citations, "### Key Takeaways / ### Article Body /
 *     ### Frequently Asked Questions / ### Sources", > **KEY|WARNING|NOTE**
 *     callouts, "**stat** -- text" stat callouts, markdown tables.
 *
 * All em/en dashes are normalized to commas/hyphens so output is dash-clean.
 */

const EM = "\u2014", EN = "\u2013";
function normalizeDashes(t) {
  t = t.replace(new RegExp(" " + EM + " ", "g"), ", ").replace(new RegExp(" " + EN + " ", "g"), ", ");
  t = t.replace(new RegExp("(\\w)" + EM + "(\\w)", "g"), "$1, $2");
  t = t.replace(new RegExp("(\\d)" + EN + "(\\d)", "g"), "$1-$2").replace(new RegExp("(\\w)" + EN + "(\\w)", "g"), "$1-$2");
  t = t.replace(new RegExp(EM, "g"), ", ").replace(new RegExp(EN, "g"), "-");
  t = t.replace(/\.\s*,\s*/g, ". ").replace(/,\s*,\s*/g, ", ");
  return t;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inline markdown -> HTML (bold, italics, citations), dash-normalized + escaped.
function inline(s) {
  s = normalizeDashes(s);
  s = escapeHtml(s);
  s = s.replace(/\[\^(\d+)\]/g, (m, n) => `<sup><a href="#src-${n}">${n}</a></sup>`);
  s = s.replace(/\[(\d+)\]/g, (m, n) => `<sup><a href="#src-${n}">${n}</a></sup>`);
  s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^\w*])\*([^*\n]+?)\*(?![\w*])/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^\w_])_([^_\n]+?)_(?![\w_])/g, "$1<em>$2</em>");
  return s;
}

// Plain text (for schema / meta): strip markdown + dashes.
function plain(s) {
  s = normalizeDashes(s);
  s = s.replace(/\[\^?\d+\]/g, "");
  s = s.replace(/\*\*([^*]+?)\*\*/g, "$1").replace(/[*_`]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

const CALLOUT_LABELS = { KEY: "Key idea", WARNING: "Watch for", NOTE: "Note" };

// Convert a list of content lines (one body section) into HTML blocks.
function convertBlocks(lines) {
  // group into blocks separated by blank lines
  const blocks = [];
  let cur = [];
  for (const ln of lines) {
    if (ln.trim() === "") { if (cur.length) { blocks.push(cur); cur = []; } }
    else cur.push(ln);
  }
  if (cur.length) blocks.push(cur);

  const out = [];
  for (const b of blocks) {
    const first = b[0];

    // blockquote callout
    if (b.every((l) => l.trim().startsWith(">"))) {
      const inner = b.map((l) => l.replace(/^\s*>\s?/, ""));
      const labelMatch = inner[0].match(/^\*\*([A-Z]+)\*\*$/);
      let label = "Note", bodyLines = inner;
      if (labelMatch) { label = CALLOUT_LABELS[labelMatch[1]] || "Note"; bodyLines = inner.slice(1); }
      const text = inline(bodyLines.join(" ").trim());
      out.push(`        <div class="callout"><span class="callout-label">${label}</span><p>${text}</p></div>`);
      continue;
    }

    // markdown table
    if (b.length >= 2 && b[0].trim().startsWith("|") && /^\s*\|[\s:|-]+\|\s*$/.test(b[1])) {
      const row = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = row(b[0]);
      const body = b.slice(2).map(row);
      const thead = "<tr>" + head.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr>";
      const tbody = body.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("\n");
      out.push(`        <table>\n${thead}\n${tbody}\n</table>`);
      continue;
    }

    // stat callout: single line, **figure** -- text
    if (b.length === 1) {
      const stat = first.match(/^\*\*([^*]+?)\*\*\s*[\u2014\u2013]\s*(.+)$/);
      if (stat) {
        out.push(`        <div class="stat-callout"><div class="stat-figure">${inline(stat[1])}</div><div class="stat-label">${inline(stat[2])}</div></div>`);
        continue;
      }
    }

    // bullet list
    if (b.every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = b.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("\n");
      out.push(`        <ul>\n${items}\n</ul>`);
      continue;
    }

    // numbered list
    if (b.every((l) => /^\s*\d+\.\s+/.test(l))) {
      const items = b.map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`).join("\n");
      out.push(`        <ol>\n${items}\n</ol>`);
      continue;
    }

    // paragraph
    out.push(`        <p>${inline(b.join(" "))}</p>`);
  }
  return out.join("\n");
}

function classify(text) {
  const t = text.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (t === "key takeaways") return "takeaways";
  if (t === "article body") return "bodylabel";
  if (t === "frequently asked questions") return "faq";
  if (t === "sources") return "sources";
  if (t.startsWith("named entities")) return "skip";
  return "content";
}

function parseArticle(titleLine, lines) {
  const title = titleLine.replace(/^\d+\.\s*/, "").trim();
  let mode = "pre";
  const takeaways = [];
  const bodySegs = []; // {heading:{level,text}|null, lines:[]}
  const faqLines = [];
  const sourceLines = [];

  for (const raw of lines) {
    const h = raw.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (h) {
      const level = h[1].length;
      const role = classify(h[2]);
      if (role === "takeaways") { mode = "takeaways"; continue; }
      if (role === "bodylabel") { mode = "body"; continue; }
      if (role === "faq") { mode = "faq"; continue; }
      if (role === "sources") { mode = "sources"; continue; }
      if (role === "skip") { mode = "skip"; continue; }
      // content heading
      if (mode === "pre" || mode === "takeaways") mode = "body";
      if (mode === "body") bodySegs.push({ heading: { level, text: h[2] }, lines: [] });
      continue;
    }
    if (mode === "takeaways") {
      const m = raw.match(/^\s*[-*]\s+(.+)$/);
      if (m) takeaways.push(m[1].trim());
    } else if (mode === "body") {
      if (!bodySegs.length) bodySegs.push({ heading: null, lines: [] });
      bodySegs[bodySegs.length - 1].lines.push(raw);
    } else if (mode === "faq") {
      faqLines.push(raw);
    } else if (mode === "sources") {
      sourceLines.push(raw);
    }
  }

  // body html
  const bodyHtml = bodySegs.map((seg) => {
    let h = "";
    if (seg.heading) {
      const tag = seg.heading.level === 2 ? "h2" : "h3";
      h = `        <${tag}>${inline(seg.heading.text)}</${tag}>\n`;
    }
    return h + convertBlocks(seg.lines);
  }).join("\n");

  // faq
  const faq = [];
  let q = null, a = [];
  const flush = () => { if (q) faq.push({ q: plain(q), a: a.join(" ").trim() }); };
  for (const raw of faqLines) {
    const qm = raw.match(/^\*\*(?:Q:\s*)?(.+?)\*\*\s*$/);
    if (qm) { flush(); q = qm[1].trim(); a = []; }
    else if (q && raw.trim()) a.push(raw.trim());
  }
  flush();

  // sources
  const sources = [];
  for (const raw of sourceLines) {
    const sm = raw.match(/^\s*(\d+)\.\s+(.+)$/);
    if (!sm) continue;
    const n = sm[1];
    let text = sm[2];
    const urlMatch = text.match(/(https?:\/\/\S+)\s*$/);
    let url = "";
    if (urlMatch) { url = urlMatch[1].replace(/[.,]+$/, ""); text = text.slice(0, urlMatch.index).trim(); }
    sources.push({ n, text: text.replace(/[.\u2014\u2013\s]+$/, "").trim(), url });
  }

  return { title, takeaways, bodyHtml, faq, sources };
}

function parseFile(md) {
  const lines = md.split("\n");
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^# (.+?)\s*$/);
    if (m) { if (cur) blocks.push(cur); cur = { titleLine: m[1], lines: [] }; }
    else if (cur) cur.lines.push(line);
  }
  if (cur) blocks.push(cur);
  // drop the first block (file title + contents)
  return blocks.slice(1).map((b) => parseArticle(b.titleLine, b.lines));
}

module.exports = { parseFile, inline, plain, normalizeDashes };
