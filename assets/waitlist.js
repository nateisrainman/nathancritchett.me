/**
 * Architects List waitlist -> Google Sheet (via a Google Apps Script Web App).
 *
 * WHY THIS SETUP: the site is static (GitHub Pages), so there is no server to
 * receive form posts. A Google Apps Script Web App is a free, no-server endpoint
 * that appends each signup as a row in a Google Sheet you own. You then see every
 * signup in that Sheet, or in the on-site dashboard at /admin.html.
 *
 * ONE-TIME SETUP (about 5 minutes): follow WAITLIST-SETUP.md, then paste the
 * Web App URL below. The URL is safe to ship in the browser, it only accepts
 * new signups; reading the list back requires a private token it never exposes.
 */
window.WAITLIST_CONFIG = {
  endpoint: "https://script.google.com/a/macros/edapt.com/s/AKfycbzhWtuy8AOiYpud6CCt5pO_y0Xx6S6hla9xPpjH_m2IRDsr4S6G1fDJjrOnoQvrnt7BWw/exec",
  sheetUrl: "",                              // optional: your Google Sheet link, shown on /admin.html
};

window.submitWaitlist = async function submitWaitlist(data) {
  data = data || {};

  // Honeypot: real people leave this empty. Bots fill every field.
  // Pretend success so the bot moves on, but store nothing.
  if (data.hp) return { stored: false, bot: true };

  var email = String(data.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  var row = {
    name: data.name ? String(data.name).trim() : "",
    email: email,
    source: data.source || "book",
    score_total: data.score && data.score.total != null ? data.score.total : "",
    score_weakest: data.score && data.score.weakest ? data.score.weakest : "",
    page: location.pathname,
    referrer: document.referrer || "",
    ts: new Date().toISOString(),
  };

  var cfg = window.WAITLIST_CONFIG || {};
  var configured = cfg.endpoint && cfg.endpoint.indexOf("PASTE") !== 0;

  // Not wired to the Sheet yet: don't hard-fail the visitor. PostHog (fired by
  // the form) still captures the lead, and this logs a reminder for the admin.
  if (!configured) {
    if (window.console) console.warn("[waitlist] endpoint not set in assets/waitlist.js, signup captured in PostHog only. See WAITLIST-SETUP.md.");
    return { stored: false, unconfigured: true };
  }

  // text/plain keeps this a "simple" CORS request (no preflight), which Apps
  // Script handles cleanly. The Apps Script reads the raw JSON body.
  var res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    var detail = await res.text().catch(function () { return ""; });
    throw new Error("Waitlist save failed (" + res.status + "): " + detail);
  }

  var out = await res.json().catch(function () { return { status: "ok" }; });
  if (out && out.status === "error") {
    throw new Error(out.message || "Waitlist save failed.");
  }
  // status "ok" (added) or "duplicate" (already on the list) are both success.
  return { stored: true, duplicate: out && out.status === "duplicate" };
};
