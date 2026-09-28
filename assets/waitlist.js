/**
 * Architects List waitlist -> Google Sheet (via a Google Apps Script Web App).
 *
 * WHY THIS SETUP: the site is static (GitHub Pages), so there is no server to
 * receive form posts. A Google Apps Script Web App (google-apps-script/waitlist.gs)
 * stores each signup in a Google Sheet, emails the subscriber their kit, and
 * emails Nathan. See WAITLIST-SETUP.md.
 *
 * The endpoint MUST be a public deployment ("Who has access: Anyone"), so its
 * URL looks like https://script.google.com/macros/s/.../exec. A URL containing
 * /a/macros/<company-domain>/ is restricted to that company and rejects visitors.
 */
window.WAITLIST_CONFIG = {
  endpoint: "https://script.google.com/a/macros/edapt.com/s/AKfycbzhWtuy8AOiYpud6CCt5pO_y0Xx6S6hla9xPpjH_m2IRDsr4S6G1fDJjrOnoQvrnt7BWw/exec",
  sheetUrl: "",                              // optional: your Google Sheet link, shown on /admin.html
  contactEmail: "nathan.critch@outlook.com", // fallback shown to visitors if the signup can't be confirmed
};

// Load a JSONP response from the Apps Script endpoint. A <script> tag is not
// subject to CORS, and unlike the old hidden-iframe POST we get the actual
// answer back, so we only report success when the row was really stored.
window.waitlistJsonp = function waitlistJsonp(params, timeoutMs) {
  var cfg = window.WAITLIST_CONFIG || {};
  return new Promise(function (resolve, reject) {
    var cb = "__wl_cb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    var script = document.createElement("script");
    var timer;

    function cleanup() {
      clearTimeout(timer);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cb] = function (data) { cleanup(); resolve(data || {}); };
    script.onerror = function () { cleanup(); reject(new Error("unreachable")); };
    // The script loaded but never called back: Google served something else
    // (a sign-in page, an error page, or an old deployment of the script).
    script.onload = function () {
      setTimeout(function () {
        if (window[cb]) { cleanup(); reject(new Error("bad response")); }
      }, 50);
    };
    timer = setTimeout(function () { cleanup(); reject(new Error("timeout")); }, timeoutMs || 15000);

    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k] == null ? "" : String(params[k]));
    });
    qs.push("callback=" + cb);
    script.src = cfg.endpoint + (cfg.endpoint.indexOf("?") === -1 ? "?" : "&") + qs.join("&");
    document.head.appendChild(script);
  });
};

function wlTrack(event, props) {
  try { if (window.posthog) window.posthog.capture(event, props); } catch (e) {}
}

// Old delivery path: fire-and-forget form POST into a hidden iframe. Used only
// as a best-effort extra when the confirmed path fails, so that an older
// deployment of the Apps Script still gets the row if it can.
function wlLegacyPost(endpoint, row) {
  try {
    var iframe = document.createElement("iframe");
    iframe.name = "wl_" + Date.now();
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    var form = document.createElement("form");
    form.method = "POST";
    form.action = endpoint;
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
    form.submit();
    setTimeout(function () { try { form.remove(); iframe.remove(); } catch (e) {} }, 10000);
  } catch (e) {}
}

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

  // Record the lead in PostHog BEFORE contacting the Sheet, so there is a
  // second copy of every signup attempt (with the email) no matter what.
  try {
    if (window.posthog) window.posthog.identify(email, { name: row.name, email: email });
  } catch (e) {}
  wlTrack("waitlist_signup_attempt", { email: email, name: row.name, source: row.source });

  var cfg = window.WAITLIST_CONFIG || {};
  var result;
  try {
    if (!cfg.endpoint) throw new Error("endpoint not set");
    result = await window.waitlistJsonp(Object.assign({ action: "signup" }, row));
  } catch (err) {
    result = { status: "error", message: err && err.message };
  }

  if (result.status === "ok" || result.status === "duplicate") {
    return { stored: true, duplicate: result.status === "duplicate" };
  }

  if (cfg.endpoint) wlLegacyPost(cfg.endpoint, row);
  wlTrack("waitlist_signup_failed", { email: email, name: row.name, source: row.source, reason: String(result.message || "unknown") });
  if (window.console) console.error("[waitlist] signup not confirmed:", result);

  var err = new Error("We couldn't confirm your signup. Please email " + (cfg.contactEmail || "us") + " and we'll add you by hand.");
  err.waitlistFailed = true;
  err.mailto = "mailto:" + (cfg.contactEmail || "") +
    "?subject=" + encodeURIComponent("Add me to the Architects List") +
    "&body=" + encodeURIComponent("Please add me to the waitlist.\n\nName: " + row.name + "\nEmail: " + email);
  throw err;
};
