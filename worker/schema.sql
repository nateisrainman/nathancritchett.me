-- Architects List waitlist table (Cloudflare D1).
--
-- One-time setup:
--   cd worker
--   wrangler d1 create architects-list
--   # paste the returned database_id into wrangler.toml
--   wrangler d1 execute architects-list --remote --file=./schema.sql
--
-- Re-running is safe (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS waitlist (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  source        TEXT DEFAULT 'book',
  score_total   INTEGER,
  score_weakest TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist (source);
