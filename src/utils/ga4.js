// GA4 event tracking — thin wrapper around window.gtag.
// No-ops silently when gtag is not loaded (local dev without GA4 script).
// Measurement ID: G-LJJ4W7082K (loaded directly in index.html + seo/base.html).

function _gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

/** Fire a custom GA4 event. Drops undefined/null params automatically. */
export function trackEvent(name, params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  );
  _gtag('event', name, clean);
}

/** Set GA4 user properties (called once on login). */
export function setUserProperties(props = {}) {
  const clean = Object.fromEntries(
    Object.entries(props).filter(([, v]) => v !== undefined && v !== null)
  );
  _gtag('set', 'user_properties', clean);
}
