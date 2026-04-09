# Architects List Worker

Cloudflare Worker that handles Architects List signups and sends the welcome kit via Resend.

## Deploy

```bash
# 1. Install wrangler if you do not have it
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Set your Resend API key as a secret
cd worker
wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted

# 4. Deploy
wrangler deploy
```

After deploying, wrangler will print a URL like `https://architects-list.YOUR-SUBDOMAIN.workers.dev`. Update the `fetch` URLs in both `book.html` and `audit.js` to point to that URL if it differs from `architects-list.nathancritch.workers.dev`.

## Resend Setup

1. Sign up at https://resend.com
2. Verify `nathancritchett.me` as a sending domain (add the DNS records Resend provides to GoDaddy)
3. Generate an API key from the dashboard
4. Paste it into the `wrangler secret put` command above

## What it does

- Accepts POST requests from the book page and audit page
- Validates the email
- Sends a welcome email to the signup with all five kit links
- Sends a notification email to nathan.critch@outlook.com with the signup details
- Returns JSON success/error

## CORS

The worker only accepts requests from `https://nathancritchett.me`. Update `CORS_HEADERS` in `index.js` if you need to allow other origins (like a local dev server).
