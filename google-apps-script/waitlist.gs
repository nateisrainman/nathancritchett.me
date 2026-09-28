/**
 * Waitlist backend for nathancritchett.me
 *
 * For every website signup this script:
 *   1. appends a row to the "Signups" tab of THIS Google Sheet,
 *   2. emails the subscriber their welcome kit (links to the Intro + worksheets),
 *   3. emails NOTIFY_EMAIL so you know someone joined.
 * It also serves the list to the site's /admin.html page behind ADMIN_TOKEN.
 *
 * Full setup instructions: see WAITLIST-SETUP.md in the website repo.
 * IMPORTANT: deploy as Web app with "Execute as: Me" and "Who has access: Anyone".
 * "Anyone within <your company>" silently blocks every public visitor.
 */

// ---- Settings you edit ----------------------------------------------------

// A long random string. It gates READING the list (the /admin.html dashboard).
// The list stays locked until you change this. Never commit the real value.
var ADMIN_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_STRING";

// Where "new signup" notifications go. Set to "" to turn them off.
var NOTIFY_EMAIL = "nathan.critch@outlook.com";

// Replies to the welcome email go here.
var REPLY_TO = "nathan.critch@outlook.com";

// ---------------------------------------------------------------------------

var VERSION = 3;
var SITE = "https://nathancritchett.me";
var SHEET_NAME = "Signups";
var HEADERS = ["timestamp", "name", "email", "source", "score_total", "score_weakest", "page", "referrer", "welcome_email"];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < HEADERS.length) {
    // Older sheets were created before the welcome_email column existed.
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sh;
}

// JSON, or JSONP when the site passes ?callback=fn. JSONP loads through a
// <script> tag, which is not subject to CORS, and lets the site confirm a
// signup was really stored instead of guessing.
function respond_(obj, callback) {
  var body = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + body + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max || 500);
}

function handleSignup_(data) {
  var email = clean_(data.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "invalid email" };
  }
  var name = clean_(data.name, 120);
  var source = clean_(data.source, 40) || "book";

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();

    // Dedupe on email. Already-listed people are a success, not an error.
    var lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      var emails = sh.getRange(2, 3, lastRow - 1, 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === email) {
          return { status: "duplicate" };
        }
      }
    }

    sh.appendRow([
      clean_(data.ts, 40) || new Date().toISOString(),
      name,
      email,
      source,
      clean_(data.score_total, 10),
      clean_(data.score_weakest, 80),
      clean_(data.page, 200),
      clean_(data.referrer, 300),
      "pending",
    ]);
    var row = sh.getLastRow();
    var count = row - 1;
  } finally {
    lock.releaseLock();
  }

  // Emails go out after the row is safely written, so a mail failure never
  // loses a signup. The welcome_email column records what happened.
  var mailStatus = "sent";
  try {
    sendWelcome_(name, email, source);
  } catch (err) {
    mailStatus = "failed: " + String(err).slice(0, 200);
  }
  sh.getRange(row, HEADERS.indexOf("welcome_email") + 1).setValue(mailStatus);

  try {
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New waitlist signup: " + (name || email) + " (" + count + " total)",
        body: [
          "Name: " + (name || "(none)"),
          "Email: " + email,
          "Source: " + source,
          "Welcome email: " + mailStatus,
          "",
          "Full list: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        ].join("\n"),
      });
    }
  } catch (err) { /* notification is best-effort */ }

  return { status: "ok" };
}

function sendWelcome_(name, email, source) {
  var first = name ? name.split(/\s+/)[0] : "";
  var hi = first ? "Hi " + first + "," : "Hi,";
  var links = [
    ["The Intro + The Architect's Mandate (PDF)", SITE + "/assets/intro-and-mandate.pdf"],
    ["Cognitive Supply Chain Self-Audit, Org Edition", SITE + "/worksheets/supply-chain-org.html"],
    ["Cognitive Supply Chain Self-Audit, Classroom Edition", SITE + "/worksheets/supply-chain-classroom.html"],
    ["The Cognitive Audit", SITE + "/audit.html"],
  ];
  var intro = "You're on the Architects List for Cognitive Architecture. " +
    "You'll get 30% off and first-edition access the day the book goes live.";

  var text = [hi, "", intro, "", "Your kit, ready now:"]
    .concat(links.map(function (l) { return "- " + l[0] + ": " + l[1]; }))
    .concat(["", "Just reply to this email if you have questions.", "", "Nathan"])
    .join("\n");

  var html = "<p>" + hi + "</p><p>" + intro + "</p><p><strong>Your kit, ready now:</strong></p><ul>" +
    links.map(function (l) { return '<li><a href="' + l[1] + '">' + l[0] + "</a></li>"; }).join("") +
    "</ul><p>Just reply to this email if you have questions.</p><p>Nathan</p>";

  MailApp.sendEmail({
    to: email,
    subject: "You're on the Architects List",
    body: text,
    htmlBody: html,
    name: "Nathan Critchett",
    replyTo: REPLY_TO,
  });
}

// Form POST (legacy path, kept so older cached copies of the site still work).
function doPost(e) {
  try {
    var data = (e && e.parameter && e.parameter.email) ? e.parameter
      : JSON.parse((e && e.postData && e.postData.contents) || "{}");
    return respond_(handleSignup_(data));
  } catch (err) {
    return respond_({ status: "error", message: String(err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = p.callback;
  try {
    if (p.action === "signup") return respond_(handleSignup_(p), cb);

    if (p.action === "list") {
      if (ADMIN_TOKEN === "CHANGE_ME_TO_A_LONG_RANDOM_STRING") {
        return respond_({ status: "error", message: "token_not_set" }, cb);
      }
      if (p.token !== ADMIN_TOKEN) return respond_({ status: "error", message: "unauthorized" }, cb);
      var sh = sheet_();
      var last = sh.getLastRow();
      var values = last < 2 ? [] : sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
      var rows = values.map(function (r) {
        var o = {};
        HEADERS.forEach(function (h, i) { o[h] = r[i]; });
        return o;
      });
      return respond_({ status: "ok", count: rows.length, rows: rows, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() }, cb);
    }

    return respond_({ status: "ok", service: "waitlist", version: VERSION }, cb);
  } catch (err) {
    return respond_({ status: "error", message: String(err) }, cb);
  }
}

// Run this once from the Apps Script editor (select it, click Run). It grants
// the Sheet + email permissions and sends you a test welcome email, so you
// know mail works before real visitors arrive.
function testSetup() {
  sheet_();
  sendWelcome_("Test", NOTIFY_EMAIL || Session.getActiveUser().getEmail(), "test");
  Logger.log("OK. Check " + (NOTIFY_EMAIL || "your inbox") + " for the test welcome email.");
}
