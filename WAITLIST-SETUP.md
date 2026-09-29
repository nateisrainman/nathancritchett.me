# Waitlist

> **Live setup (Sept 2026):** the Apps Script is attached to Nathan's Google
> Sheet in the nathan.lumspirits@gmail.com account and deployed as a public web
> app (URL in `assets/waitlist.js`). Every signup lands in that Sheet's
> **Signups** tab. To update the script: paste the new code, then
> Deploy → Manage deployments → pencil → New version → Deploy.

## How it works now (no Google setup required)

Signups go through **FormSubmit** (formsubmit.co, free, no account):

- **You get an email** at `nathan.critch@outlook.com` for every signup (name,
  email, source). Your inbox *is* the list: search "New waitlist signup".
- **The subscriber gets a welcome email** automatically with the kit links.
- The site only says "You're in" once FormSubmit confirms. If it can't, it tries
  the Google Apps Script below, and if that fails too, the visitor gets a
  one-click "email Nathan" link. Every attempt is also logged in PostHog
  (`waitlist_signup_attempt`, with the email).

**One-time activation:** the first signup after this went live sends an
**"Activate Form"** email from FormSubmit to `nathan.critch@outlook.com`
(check Junk). Click the button once. Every signup after that is delivered.

To change the address: edit `notifyEmail` in `assets/waitlist.js` (the new
address will need activating once, too).

---

# Optional backup: Google Sheet via Apps Script


Signups from the book page and the audit page go to a **Google Apps Script Web
App** ([`google-apps-script/waitlist.gs`](google-apps-script/waitlist.gs)) that:

1. saves each signup as a row in a **Google Sheet you own**,
2. **emails the subscriber** their kit (Intro PDF + both worksheets + audit link),
3. **emails you** (`NOTIFY_EMAIL`) every time someone joins.

You can see the list in the Sheet, or at `https://nathancritchett.me/admin.html`.
That page also shows a **status box** telling you whether signups are actually
working right now.

## Why it broke before (Sept 2026 audit)

- The deployment URL was `script.google.com/a/macros/edapt.com/...`. The
  `/a/macros/edapt.com/` part means the deployment is tied to the edapt.com
  Workspace account, and public visitors get bounced to a Google sign-in page.
- The site showed "You're in" no matter what happened, so failures were invisible.
- The script never sent any email.

The site now only says "You're in" after Google confirms the row was saved. If
that fails, visitors see a one-click "email Nathan" link instead, and every
attempt is logged in PostHog (`waitlist_signup_attempt`, with the email) as a
backup record.

## One-time setup

1. **Use a personal Google account (e.g. Gmail), not edapt.com.** Workspace
   admins often block "Anyone" access, which is exactly what broke this.

2. **Create the Sheet.** Go to [sheets.new](https://sheets.new), name it
   "Cognitive Architecture Waitlist".

3. **Add the script.** In the Sheet: **Extensions → Apps Script**. Delete the
   starter code and paste the whole of `google-apps-script/waitlist.gs`.

4. **Edit the settings at the top:**
   - `ADMIN_TOKEN`: a long random string (from a password manager). The list
     stays locked until you change it. Don't commit the real value.
   - `NOTIFY_EMAIL` / `REPLY_TO`: where notifications and replies go.
   Save (disk icon).

5. **Authorize + test email.** In the function dropdown pick **`testSetup`**,
   click **Run**, and approve the permissions (Sheets + send email). You should
   get a test welcome email at `NOTIFY_EMAIL`.

6. **Deploy.** **Deploy → New deployment** → gear → **Web app**.
   - **Execute as: Me**
   - **Who has access: Anyone** ← *not* "Anyone within ..."
   Click **Deploy**, copy the **Web app URL**. It must look like
   `https://script.google.com/macros/s/AKfyc.../exec` with **no `/a/macros/<domain>/`**.

7. **Wire the site.** Put that URL in `endpoint` in
   [`assets/waitlist.js`](assets/waitlist.js) (optionally the Sheet link in
   `sheetUrl`), commit, push. Or send the URL to Claude and it will do this.

8. **Check it.** Open `https://nathancritchett.me/admin.html` **in a private /
   incognito window** (that's what the public sees). The status box should say
   **"Signup endpoint is live"**. Paste your `ADMIN_TOKEN`, click **Load**.

## Recovering signups from before the fix

Anyone who signed up while it was broken saw "You're in" and got nothing. The
page fired `signup_completed` in PostHog and identified the person by email, so
their emails are in PostHog: **PostHog → People** (or **Activity**, filtered by
event `signup_completed`, property `site = nathancritchett.me`). Visitors with
ad blockers won't be there. Add the rest from the emails and DMs you've received.

## Notes

- **The Web app URL is safe to ship** in the browser. Reading the list needs the
  private token.
- **Updating the script later:** **Deploy → Manage deployments → Edit (pencil) →
  Version: New version → Deploy**. The URL stays the same.
- **Email limits:** a free Gmail account can send about 100 emails a day through
  Apps Script (Workspace: 1,500). The `welcome_email` column shows `sent` or the
  error for each row.
- **Duplicates** (same email) are ignored and count as success, with no second email.
- **Spam:** a hidden honeypot field drops bot submissions before they reach the Sheet.
