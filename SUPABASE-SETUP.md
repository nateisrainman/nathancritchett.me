# Waitlist setup (Supabase) - 5 minutes, no command line

The book/audit signup forms now save straight into a Supabase table called
`waitlist`. Three small steps and you are live. Everything is done in the
Supabase website, no terminal or "wrangler" needed.

## Step 1: Create the table

1. Go to your Supabase project at https://supabase.com/dashboard
2. Left sidebar -> **SQL Editor** -> **New query**
3. Paste this in and click **Run**:

```sql
create table if not exists public.waitlist (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  name          text,
  source        text default 'book',
  score_total   int,
  score_weakest text,
  created_at    timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Let the public website ADD signups, but never read or change existing rows.
drop policy if exists "Public can join waitlist" on public.waitlist;
create policy "Public can join waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
```

## Step 2: Copy your two keys

1. Left sidebar -> **Project Settings** (gear) -> **API**
2. Copy **Project URL** (looks like `https://abcdwxyz.supabase.co`)
3. Copy the **anon public** key (under "Project API keys"). This one is safe to
   put on the website; the rule above means it can only add signups.

> Do NOT use the `service_role` key on the website. Only the `anon public` key.

## Step 3: Paste them into the site

Open `assets/waitlist.js` and replace the two placeholders:

```js
window.WAITLIST_CONFIG = {
  url: "https://abcdwxyz.supabase.co",      // your Project URL
  anonKey: "eyJhbGciOi...your anon key...", // your anon public key
};
```

Save, commit, and push. Railway redeploys automatically. Done.

(Or just send me those two values and I will paste them in for you.)

## Check it works

- Go to your live `/book.html`, enter a name + email, submit. You should see the
  success message.
- In Supabase: left sidebar -> **Table Editor** -> `waitlist` -> your test row
  is there. That is also where you read/export all your signups any time.

## What about the welcome email?

This setup reliably **captures** every signup (the part that was broken). It does
not yet send the automatic welcome kit email. That is a clean follow-up we can do
a couple of ways (a Supabase "Database Webhook" to Resend, or a simple automation
like Zapier on each new row). Say the word and I will set it up.

> The old `worker/` folder (Cloudflare) is no longer used and can be ignored.
