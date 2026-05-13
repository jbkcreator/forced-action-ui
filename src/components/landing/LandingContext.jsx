import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_VERTICAL, DEFAULT_COUNTY_ID } from '../../config/constants';
import { api } from '../../api/client';

const LandingContext = createContext();

const ATTRIBUTION_STORAGE_KEY = 'fa.attribution';

// Allowed signup_source values — must stay in sync with backend
// `signup_engine.ALLOWED_SIGNUP_SOURCES`.
const ALLOWED_SIGNUP_SOURCES = new Set([
  'direct', 'landing_page', 'dbpr_email', 'cora_sms',
  'missed_call', 'referral', 'admin', 'unknown',
]);

function readStoredAttribution() {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistAttribution(attr) {
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attr));
  } catch {
    /* noop — private mode etc. */
  }
}

function resolveSignupSource(rawSource, hasReferral) {
  const cleaned = (rawSource || '').toString().trim().toLowerCase();
  if (cleaned && ALLOWED_SIGNUP_SOURCES.has(cleaned)) return cleaned;
  if (hasReferral) return 'referral';
  return 'landing_page';
}

/**
 * Capture commercial-ladder attribution from the URL on first landing:
 *   signup_source, utm_source, utm_medium, utm_campaign, campaign_id,
 *   ref / referral_code, token.
 *
 * If `token` is present, POST it to /api/landing/resolve-token. On success
 * the user is redirected straight to /dashboard/{feed_uuid} — recognised
 * missed-call / DBPR / Cora links skip the signup form.
 *
 * Stored in React state + sessionStorage so the FirstSessionWall modal
 * + Stripe Checkout success page can read it later.
 */
export function LandingProvider({ children }) {
  const [selectedVertical, setSelectedVertical] = useState(DEFAULT_VERTICAL);
  const countyId = DEFAULT_COUNTY_ID;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [attribution, setAttribution] = useState(() => readStoredAttribution() || null);
  const [tokenResolving, setTokenResolving] = useState(false);

  useEffect(() => {
    // First-touch wins: if we already persisted attribution for this session,
    // keep it. Only refresh on explicit token + new params arrival.
    const hasUrlParams =
      searchParams.has('signup_source') ||
      searchParams.has('utm_source') ||
      searchParams.has('utm_campaign') ||
      searchParams.has('utm_medium') ||
      searchParams.has('campaign_id') ||
      searchParams.has('ref') ||
      searchParams.has('referral_code') ||
      searchParams.has('token');

    if (!hasUrlParams && attribution) return;

    const referralCode =
      searchParams.get('referral_code') || searchParams.get('ref') || null;
    const captured = {
      signupSource: resolveSignupSource(searchParams.get('signup_source'), !!referralCode),
      utmSource: searchParams.get('utm_source') || null,
      utmMedium: searchParams.get('utm_medium') || null,
      utmCampaign: searchParams.get('utm_campaign') || null,
      campaignId: searchParams.get('campaign_id') || null,
      referralCode,
      attributionToken: searchParams.get('token') || null,
    };

    setAttribution(captured);
    persistAttribution(captured);

    // Fire-and-forget landing-page-viewed audit event.
    api
      .post('/api/business-event', {
        event_type: 'LANDING_PAGE_VIEWED',
        payload: captured,
      })
      .catch(() => {});

    // Signed-token resolve → skip signup, go straight to dashboard.
    if (captured.attributionToken && !tokenResolving) {
      setTokenResolving(true);
      api
        .post('/api/landing/resolve-token', { token: captured.attributionToken })
        .then((res) => {
          if (res?.feed_uuid) {
            navigate(`/dashboard/${res.feed_uuid}`, { replace: true });
          }
        })
        .catch(() => {
          /* invalid / expired → silently fall back to normal signup flow */
        })
        .finally(() => setTokenResolving(false));
    }
    // intentionally omit `attribution` + `tokenResolving` from deps —
    // we only re-run when searchParams change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const value = useMemo(
    () => ({
      selectedVertical,
      setSelectedVertical,
      countyId,
      attribution: attribution || {
        signupSource: 'landing_page',
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        campaignId: null,
        referralCode: null,
        attributionToken: null,
      },
      tokenResolving,
    }),
    [selectedVertical, countyId, attribution, tokenResolving],
  );

  return <LandingContext.Provider value={value}>{children}</LandingContext.Provider>;
}

export function useLanding() {
  return useContext(LandingContext);
}
