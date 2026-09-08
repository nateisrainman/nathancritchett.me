# Waitlist setup (Google Sheet, ~5 minutes, no server)

The site is static, so signups are stored in a **Google Sheet you own**, via a
free **Google Apps Script Web App**. You can see every signup two ways:

1. **In the Google Sheet** itself, and
2. **On the site** at `https://nathancritchett.me/admin.html` (a private dashboard).

## One-time setup

1. **Create the Sheet.** Go to [sheets.new](https://sheets.new) and name it
   e.g. "Cognitive Architecture Waitlist". Leave it empty (the script adds a
   `Signups` tab with headers automatically).

2. **Add the script.** In that Sheet: **Extensions → Apps Script**. Delete the
   starter code, then paste the entire contents of
   [`google-apps-script/waitlist.gs`](google-apps-script/waitlist.gs).

3. **Set your admin token.** Near the top of the script, change:
   ```js
   var ADMIN_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_STRING";
   ```
   to a long random string (e.g. from a password manager). This gates the
   `/admin.html` dashboard. Keep it private, do **not** commit it anywhere.
   Save (disk icon).

4. **Deploy it.** Click **Deploy → New deployment**. Gear icon → **Web app**.
   Set **Execute as: Me**, **Who has access: Anyone**. Click **Deploy**,
   authorize when prompted, and copy the **Web app URL** (ends in `/exec`).

5. **Wire the site.** In [`assets/waitlist.js`](assets/waitlist.js), set:
   ```js
   window.WAITLIST_CONFIG = {
     endpoint: "https://script.google.com/macros/s/AKfyc.../exec",  // your Web app URL
     sheetUrl: "https://docs.google.com/spreadsheets/d/.../edit",   // your Sheet link (optional)
   };
   ```
   Commit and push. Signups now flow into the Sheet.

6. **Use the dashboard.** Open `https://nathancritchett.me/admin.html`, paste
   your `ADMIN_TOKEN`, and click **Load**. It shows the full list, counts by
   source (book vs audit), a **Download CSV** button, and an **Open Google
   Sheet** link. The token is stored only in your browser.

## Notes

- **The Web app URL is safe to ship** in the browser, it only accepts new
  signups. Reading the list back requires the private token, which never
  appears in the site's code.
- **Updating the script later:** re-deploy with **Deploy → Manage deployments
  → Edit → Version: New version**. The `/exec` URL stays the same.
- **Before setup is finished:** signups won't error out, they're still
  captured in PostHog (see `assets/analytics.js`), and the form shows success.
  Only the Sheet is empty until step 5 is done.
- **Duplicates** (same email) are ignored automatically, counted as success.
- **Spam:** the form includes a hidden honeypot field; bot submissions are
  silently dropped and never hit the Sheet.
