// Meta Pixel — client-side retargeting/audience tracking.
//
// Complements the existing server-side Meta Conversions API integration
// (src/services/meta_capi_service.py on the backend) rather than replacing
// it: this builds the browser-side visitor audience (PageView/ViewContent/
// InitiateCheckout have no server-side equivalent), while Purchase carries
// the same event_id the backend already uses so Meta dedupes the two
// Purchase reports into one.
//
// No-ops entirely when VITE_META_PIXEL_ID isn't set (e.g. local dev),
// mirroring how META_CAPI_ENABLED gates the backend integration.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialized = false;

function loadPixelScript() {
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
}

export function initMetaPixel() {
  if (initialized || !PIXEL_ID) return;
  initialized = true;
  loadPixelScript();
  window.fbq('init', PIXEL_ID);
}

export function trackPageView() {
  if (!PIXEL_ID || !window.fbq) return;
  window.fbq('track', 'PageView');
}

export function trackViewContent(payload) {
  if (!PIXEL_ID || !window.fbq) return;
  window.fbq('track', 'ViewContent', payload);
}

export function trackInitiateCheckout(payload) {
  if (!PIXEL_ID || !window.fbq) return;
  window.fbq('track', 'InitiateCheckout', payload);
}

export function trackPurchase({ value, currency, eventId } = {}) {
  if (!PIXEL_ID || !window.fbq) return;
  const customData = {};
  if (value != null) customData.value = value;
  if (currency) customData.currency = currency;
  if (eventId) {
    window.fbq('track', 'Purchase', customData, { eventID: eventId });
  } else {
    window.fbq('track', 'Purchase', customData);
  }
}
