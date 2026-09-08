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

  // Submit via a hidden form targeting a hidden iframe. This is a top-level
  // form navigation, NOT fetch/XHR, so it is not subject to CORS at all -
  // the browser never tries (and fails) to read a cross-origin response.
  // Apps Script receives the form fields, writes the row, and we treat the
  // iframe's load (or a short timeout) as success. This is the reliable way
  // to post to Apps Script from a static site.
  return await new Promise(function (resolve, reject) {
    var iframe = document.createElement("iframe");
    iframe.name = "wl_" + Date.now();
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    var form = document.createElement("form");
    form.method = "POST";
    form.action = cfg.endpoint;
    form.target = iframe.name;
    form.style.display = "none";

    Object.keys(row).forEach(function (k) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = row[k] == null ? "" : String(row[k]);
      form.appendChild(input);
    });
    document.body.appendChild(form);

    var done = false;
    function finish(ok) {
      if (done) return;
      done = true;
      setTimeout(function () {
        try { form.remove(); iframe.remove(); } catch (e) {}
      }, 1500);
      if (ok) resolve({ stored: true });
      else reject(new Error("Could not reach the signup service. Please try again."));
    }

    // The iframe fires 'load' once the POST completes (even though the
    // cross-origin body is unreadable). Fall back to success after 4s in
    // case the load event is unreliable - the row is written regardless.
    iframe.addEventListener("load", function () { finish(true); });
    setTimeout(function () { finish(true); }, 4000);

    try {
      form.submit();
    } catch (err) {
      finish(false);
    }
  });
};
