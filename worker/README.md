# Architects List Worker

Cloudflare Worker behind the book waitlist (the "Architects List"). It stores
every signup in a D1 table and sends a welcome kit + admin notification via
Resend.

## How it works (important)

A signup is treated as **successful the moment it is stored in the database**.
Emails are best-effort: if Resend is misconfigured (e.g. the sending domain
is not verified yet), the visitor still gets a success response and the lead is
safely in the `waitlist` table. The worker only returns an error if it could
not record the signup at all.

`book.html` and `audit.html` POST `{ name, email, source, score }` to the
worker root. The dashboard (`/dashboard.html`) GETs `/signups` with a bearer key.

## One-time setup

```bash
cd worker

# 1. Install wrangler + log in
npm install -g wrangler
wrangler login

# 2. Create the D1 database, then paste the printed database_id into wrangler.toml
wrangler d1 create architects-list

# 3. Create the waitlist table
wrangler d1 execute architects-list --remote --file=./schema.sql

# 4. Set secrets
wrangler secret put RESEND_API_KEY     # from https://resend.com
wrangler secret put DASHBOARD_KEY      # any strong string; used by dashboard.html

# 5. Deploy
wrangler deploy
```

After deploying, wrangler prints a URL like
`https://architects-list.<subdomain>.workers.dev`. The site currently posts to
`https://architects-list.nathancritch.workers.dev` (in `book.html` and
`audit.js`); update those if your URL differs.

## Resend setup (for the emails)

The signup is captured without this, but to actually send the welcome kit:

1. Sign up at https://resend.com
2. Verify `nathancritchett.me` as a sending domain (add the DNS records Resend
   gives you). Until this is done, sends from `nathan@nathancritchett.me` fail,
   which is the most common cause of "the welcome email never arrived."
3. Generate an API key and set it with `wrangler secret put RESEND_API_KEY`.

## Viewing / exporting signups

```bash
# Recent rows straight from the database
wrangler d1 execute architects-list --remote \
  --command "SELECT created_at, email, name, source, score_total FROM waitlist ORDER BY created_at DESC LIMIT 50"

# Full export
wrangler d1 execute architects-list --remote --command "SELECT * FROM waitlist" --json > signups.json
```

The `/dashboard.html` page also lists signups (enter your `DASHBOARD_KEY`).

## CORS

The worker only accepts browser requests from `https://nathancritchett.me`
(`CORS_HEADERS` in `index.js`). Add other origins there if needed.
