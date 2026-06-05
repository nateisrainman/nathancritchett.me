/* ============================================
   PostHog analytics for nathancritchett.me

   - Loads PostHog with the project's public API key
   - Tags every event with site: 'nathancritchett.me' so this data
     can be filtered cleanly inside the shared PostHog project
   - Lightweight wrapper exposes window.track(name, props) for any
     inline scripts that want to fire custom events
   ============================================ */

(function () {
  // Standard PostHog snippet (sets up window.posthog stub + loads array.js)
  !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "), n = 0; n < o.length; n++) g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);

  posthog.init('phc_p9c4HjC6KLcAqdbHu5Zf4sXgDr2FbD6XbHgmYWPUAwJs', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    capture_performance: true,
  });

  // Persistent property: every event from this site carries it.
  // Lets you filter cleanly inside the shared PostHog project.
  posthog.register({ site: 'nathancritchett.me' });

  // Auto-track clicks on every "Reserve / Pre-sale" CTA across the site.
  // Caught via class names already on the buttons.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    var text = (el.textContent || '').trim().toLowerCase();
    var href = (el.getAttribute('href') || '').toLowerCase();

    // Book pre-sale CTA clicks
    if (
      text.indexOf('reserve the book') !== -1 ||
      text.indexOf('book pre-sale') !== -1 ||
      text.indexOf('reserve now') !== -1 ||
      text.indexOf('reserve your copy') !== -1 ||
      href.indexOf('#preorder') !== -1
    ) {
      posthog.capture('cta_reserve_book_click', {
        label: el.textContent.trim().slice(0, 80),
        location: window.location.pathname,
      });
    }

    // Audit CTAs
    if (
      text.indexOf('take the audit') !== -1 ||
      text.indexOf('start the audit') !== -1 ||
      href.indexOf('/audit') !== -1
    ) {
      posthog.capture('cta_audit_click', {
        label: el.textContent.trim().slice(0, 80),
        location: window.location.pathname,
      });
    }
  }, true);

  // Expose a small helper so inline scripts (book form, audit form,
  // ocean-safety video, etc.) can fire custom events without
  // repeating the safety check.
  window.track = function (name, props) {
    try {
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture(name, props || {});
      }
    } catch (_) { /* no-op */ }
  };
})();
