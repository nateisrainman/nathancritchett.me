/**
 * Architects List waitlist.
 *
 * PRIMARY: FormSubmit (formsubmit.co). No server, no account. Every signup
 * emails Nathan (notifyEmail) with the person's details, and FormSubmit sends
 * the subscriber an automatic welcome email (_autoresponse) with the kit links.
 * The very first submission triggers a one-time "Activate form" email to
 * notifyEmail; click it once and every signup after that is delivered.
 *
 * FALLBACK: the Google Apps Script endpoint (google-apps-script/waitlist.gs),
 * used only if FormSubmit does not confirm, so nobody gets two welcome emails.
 *
 * Every attempt is also logged in PostHog (waitlist_signup_attempt, with email).
 */
window.WAITLIST_CONFIG = {
  notifyEmail: "nathan.critch@outlook.com",  // where signup notifications go (FormSubmit)
  endpoint: "https://script.google.com/macros/s/AKfycbxncLfsB7ioAWLW5Jtaf-vtNT2p34ooJaiKMUKBCJJMIBVCayaiwH4pl6z7WVNFH4Ay9Q/exec",
  sheetUrl: "",                              // optional: your Google Sheet link, shown on /admin.html
  contactEmail: "nathan.critch@outlook.com", // fallback shown to visitors if the signup can't be confirmed
};

var WL_SITE = "https://nathancritchett.me";

function wlWelcomeText(name) {
  var first = name ? name.split(/\s+/)[0] : "";
  return [
    (first ? "Hi " + first + "," : "Hi there,"),
    "",
    "Thank you for signing up for a book that isn't out yet! I have some resources to share ASAP, and a message to help shed light on my \"why\" with this book.",
    "",
    "You're on the Architects List, which means 30% off and a first-edition copy the day the book launches. Here's what you can dig into today:",
    "",
    "1. The Intro + The Architect's Mandate",
    "This is the opening of the book and my main driver behind the pages. You can get a feel for my voice and the stakes, as well as decide if this is a book you want to share with your team, or not read at all! Imagine that...",
    WL_SITE + "/assets/intro-and-mandate.pdf",
    "",
    "2. The Cognitive Audit",
    "A short self-assessment that shows where AI is sharpening your thinking and where it's quietly doing the thinking for you. This is the first-step assessment for organizations I work with, and I would feel very fulfilled if I could get more people started on this sooner.",
    WL_SITE + "/audit.html",
    "",
    "3. Cognitive Supply Chain Self-Audit (Org Edition)",
    "If you lead a team, sit down with this in one session. It maps whether your people's judgment is growing as fast as the tools you're giving them.",
    WL_SITE + "/worksheets/supply-chain-org.html",
    "",
    "4. Cognitive Supply Chain Self-Audit (Classroom Edition)",
    "For teachers and school leaders. The same map, built for a classroom, so you can see where AI is helping students think and where it's thinking for them.",
    WL_SITE + "/worksheets/supply-chain-classroom.html",
    "",
    "These are just things that I wanted to share because I care deeply about empowering humans over machines. I see a narrow path where we can grow ourselves, but only with a strong sense of self and metacognition. Unfortunately, we grossly lack these skills in the world today, so I hope we can embark on this journey to change the lives of ourselves and our loved ones together.",
    "",
    "If anything in here sparks a thought or a question, write me at nathan.critch@outlook.com. I read every one.",
    "",
    "Grateful you're here,",
    "Nathan",
  ].join("\n");
}

// FormSubmit's AJAX endpoint answers with JSON and allows cross-origin calls,
// so we know for certain whether the signup went through.
async function wlFormSubmit(row) {
  var cfg = window.WAITLIST_CONFIG || {};
  var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
  try {
    var res = await fetch("https://formsubmit.co/ajax/" + cfg.notifyEmail, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: row.name,
        email: row.email,
        source: row.source,
        audit_score: row.score_total,
        audit_weakest: row.score_weakest,
        page: row.page,
        _subject: "New waitlist signup: " + (row.name || row.email) + " (" + row.source + ")",
        _template: "table",
        _captcha: "false",
        _replyto: row.email,
        _autoresponse: wlWelcomeText(row.name),
      }),
      signal: ctrl ? ctrl.signal : undefined,
    });
    var data = await res.json().catch(function () { return {}; });
    return { ok: res.ok && (data.success === true || data.success === "true"), message: data.message || ("HTTP " + res.status) };
  } catch (err) {
    return { ok: false, message: (err && err.message) || "network error" };
  } finally {
    clearTimeout(timer);
  }
}

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

  // 1) FormSubmit: emails Nathan + auto-replies to the subscriber.
  var fs = cfg.notifyEmail ? await wlFormSubmit(row) : { ok: false, message: "notifyEmail not set" };
  if (fs.ok) {
    wlTrack("waitlist_signup_stored", { email: email, source: row.source, via: "formsubmit" });
    return { stored: true, via: "formsubmit" };
  }

  // 2) Fallback: Google Apps Script (saves to the Sheet and sends its own emails).
  var result;
  try {
    if (!cfg.endpoint) throw new Error("endpoint not set");
    result = await window.waitlistJsonp(Object.assign({ action: "signup" }, row));
  } catch (err) {
    result = { status: "error", message: err && err.message };
  }
  if (result.status === "ok" || result.status === "duplicate") {
    wlTrack("waitlist_signup_stored", { email: email, source: row.source, via: "apps_script" });
    return { stored: true, via: "apps_script", duplicate: result.status === "duplicate" };
  }
  result.message = "formsubmit: " + fs.message + " | apps script: " + result.message;

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
