/**
 * Architects List waitlist -> Supabase.
 *
 * Fill in the two values below from your Supabase dashboard:
 *   Project Settings -> API -> "Project URL" and "Project API keys: anon public"
 *
 * The anon public key is SAFE to ship in the browser. Row Level Security on the
 * `waitlist` table only allows inserting new signups, never reading or editing
 * existing ones. (See SUPABASE-SETUP.md for the one-time table setup.)
 */
window.WAITLIST_CONFIG = {
  url: "PASTE_SUPABASE_PROJECT_URL",       // e.g. https://abcdwxyz.supabase.co
  anonKey: "PASTE_SUPABASE_ANON_PUBLIC_KEY",
};

window.submitWaitlist = async function submitWaitlist({ name, email, source, score }) {
  var cfg = window.WAITLIST_CONFIG || {};
  if (!cfg.url || cfg.url.indexOf("PASTE") === 0 ||
      !cfg.anonKey || cfg.anonKey.indexOf("PASTE") === 0) {
    throw new Error("Waitlist is not configured yet (set WAITLIST_CONFIG in assets/waitlist.js).");
  }

  var row = {
    name: name ? String(name).trim() : null,
    email: String(email || "").trim().toLowerCase(),
    source: source || "book",
    score_total: score && score.total != null ? score.total : null,
    score_weakest: score && score.weakest ? score.weakest : null,
  };

  var endpoint = cfg.url.replace(/\/$/, "") + "/rest/v1/waitlist?on_conflict=email";
  var res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "apikey": cfg.anonKey,
      "Authorization": "Bearer " + cfg.anonKey,
      "Content-Type": "application/json",
      // Ignore duplicate emails (already on the list) instead of erroring.
      "Prefer": "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });

  // 2xx = added. 409 = already on the list. Both are success for the visitor.
  if (!res.ok && res.status !== 409) {
    var detail = await res.text().catch(function () { return ""; });
    throw new Error("Waitlist insert failed (" + res.status + "): " + detail);
  }
  return true;
};
