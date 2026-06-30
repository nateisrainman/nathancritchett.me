/**
 * Canonical site nav, shared across every generated and hand-built page.
 * Uses absolute paths so it works from any directory. The "Writing" item is
 * a dropdown that breaks into the three libraries.
 *
 * To rename a library label, edit it here and rebuild.
 */

function writingDropdown() {
  return `<div class="nav-dropdown">
          <a href="/writing/" class="nav-dropbtn">Writing</a>
          <div class="nav-submenu">
            <a href="/writing/">AI &amp; Cognition</a>
            <a href="/arq/">Cognitive Development</a>
            <a href="/pitching/">Pitching</a>
          </div>
        </div>`;
}

// Standard nav for interior pages (articles, libraries, about).
function navHtml() {
  return `  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="/" class="nav-name">NATHAN CRITCHETT</a>
      <div class="nav-right">
        <a href="/book.html#preorder" class="nav-mobile-cta">Book Pre-sale</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-links" id="nav-links">
        <a href="/book.html">The Book</a>
        ${writingDropdown()}
        <a href="/hire.html">Hire</a>
        <a href="/about.html">About</a>
        <a href="/#contact" class="nav-cta">Get in Touch</a>
      </div>
    </div>
  </nav>`;
}

// A horizontal switcher shown at the top of every library index so all three
// libraries are reachable from any one of them. `active` = writing|arq|pitching.
function librarySwitch(active) {
  const libs = [
    { key: "writing", href: "/writing/", label: "AI &amp; Cognition", n: 25 },
    { key: "arq", href: "/arq/", label: "Cognitive Development", n: 14 },
    { key: "pitching", href: "/pitching/", label: "Pitching", n: 25 },
  ];
  return `    <nav class="lib-switch" aria-label="Libraries">
${libs.map((l) => `      <a href="${l.href}" class="lib-tab${l.key === active ? " is-active" : ""}">
        <span class="lib-tab-label">${l.label}</span>
        <span class="lib-tab-meta">${l.n} articles</span>
      </a>`).join("\n")}
    </nav>`;
}

module.exports = { navHtml, writingDropdown, librarySwitch };
