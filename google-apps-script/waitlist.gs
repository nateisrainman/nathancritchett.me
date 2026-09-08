/**
 * Waitlist backend for nathancritchett.me
 *
 * Appends each website signup as a row in THIS Google Sheet, and serves the
 * list back to the site's /admin.html page behind a private token.
 *
 * Full setup instructions: see WAITLIST-SETUP.md in the website repo.
 * Paste this whole file into the Sheet's Apps Script editor (Extensions ->
 * Apps Script), set ADMIN_TOKEN below, then Deploy -> New deployment ->
 * Web app -> Execute as: Me, Who has access: Anyone.
 */

// A long random string. It gates READING the list (the /admin.html dashboard).
// Keep it private: set it here, and paste the same value into /admin.html when
// prompted. Never commit it to the public website repo.
var ADMIN_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_STRING";

var SHEET_NAME = "Signups";
var HEADERS = ["timestamp", "name", "email", "source", "score_total", "score_weakest", "page", "referrer"];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// New signups arrive here (POST from the website form).
function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var email = String(data.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ status: "error", message: "invalid email" });
    }

    var sh = sheet_();

    // Dedupe on email. Already-listed people are a success, not an error.
    var lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      var emails = sh.getRange(2, 3, lastRow - 1, 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === email) {
          return json_({ status: "duplicate" });
        }
      }
    }

    sh.appendRow([
      data.ts || new Date().toISOString(),
      data.name || "",
      email,
      data.source || "book",
      data.score_total != null ? data.score_total : "",
      data.score_weakest || "",
      data.page || "",
      data.referrer || "",
    ]);
    return json_({ status: "ok" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}

// The /admin.html dashboard reads the list here (GET with the token).
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "list") {
    if (p.token !== ADMIN_TOKEN) {
      return json_({ status: "error", message: "unauthorized" });
    }
    var sh = sheet_();
    var last = sh.getLastRow();
    if (last < 2) return json_({ status: "ok", count: 0, rows: [] });
    var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
    var rows = values.map(function (r) {
      var o = {};
      HEADERS.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
    return json_({ status: "ok", count: rows.length, rows: rows });
  }
  return ContentService.createTextOutput("Waitlist endpoint OK");
}
