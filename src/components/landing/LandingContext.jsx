import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DEFAULT_VERTICAL, DEFAULT_COUNTY_ID } from '../../config/constants';
import { api } from '../../api/client';
import { fetchPricing, fetchLandingData } from '../../api/landing';

const LandingContext = createContext();

const ATTRIBUTION_STORAGE_KEY = 'fa.attribution';
const COUNTY_STORAGE_KEY = 'fa.county_id';

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

function persistCountyId(countyId) {
  try {
    sessionStorage.setItem(COUNTY_STORAGE_KEY, countyId);
  } catch {
    /* noop */
  }
}

function readStoredCountyId() {
  try {
    return sessionStorage.getItem(COUNTY_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function resolveSignupSource(rawSource, hasReferral) {
  const cleaned = (rawSource || '').toString().trim().toLowerCase();
  if (cleaned && ALLOWED_SIGNUP_SOURCES.has(cleaned)) return cleaned;
  if (hasReferral) return 'referral';
  return 'landing_page';
}

/**
 * Provides county-aware landing page state.
 *
 * county_id resolution order:
 *   1. Route param  /landing/:countyId
 *   2. Query param  ?county_id=hillsborough
 *   3. sessionStorage (persisted from prior visit on same session)
 *   4. DEFAULT_COUNTY_ID fallback (backward-compat for root `/` route)
 *
 * Fetches GET /api/landing-data?county_id=<countyId> on mount and exposes
 * landingData + landingDataLoading through context so child components can
 * drive copy, CTA mode, and county name from the API response.
 */
export function LandingProvider({ children }) {
  const [selectedVertical, setSelectedVertical] = useState(DEFAULT_VERTICAL);

  // ── County ID resolution ──────────────────────────────────────────────────
  const { countyId: routeCountyId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resolvedCountyId = (
    routeCountyId ||
    searchParams.get('county_id') ||
    readStoredCountyId() ||
    DEFAULT_COUNTY_ID
  );
  const [countyId, setCountyId] = useState(resolvedCountyId);

  // Keep countyId in sync if the URL changes (e.g. browser back/forward)
  useEffect(() => {
    const next = routeCountyId || searchParams.get('county_id');
    if (next && next !== countyId) {
      setCountyId(next);
    }
  }, [routeCountyId, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist county to sessionStorage so it survives Stripe redirect back to /success
  useEffect(() => {
    persistCountyId(countyId);
  }, [countyId]);

  // ── Attribution ───────────────────────────────────────────────────────────
  const [attribution, setAttribution] = useState(() => readStoredAttribution() || null);
  const [tokenResolving, setTokenResolving] = useState(false);

  // ── Landing data (county-specific metrics + cta_mode) ────────────────────
  const [landingData, setLandingData] = useState(null);
  const [landingDataLoading, setLandingDataLoading] = useState(true);

  useEffect(() => {
    if (!countyId) return;
    let cancelled = false;
    setLandingDataLoading(true);
    fetchLandingData(countyId)
      .then((res) => {
        if (!cancelled) setLandingData(res);
      })
      .catch(() => {
        if (!cancelled) setLandingData(null);
      })
      .finally(() => {
        if (!cancelled) setLandingDataLoading(false);
      });
    return () => { cancelled = true; };
  }, [countyId]);

  // ── Pricing config ────────────────────────────────────────────────────────
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPricingLoading(true);
    fetchPricing()
      .then((res) => {
        if (!cancelled) setPricing(res?.pricing || null);
      })
      .catch(() => {
        if (!cancelled) setPricing(null);
      })
      .finally(() => {
        if (!cancelled) setPricingLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Attribution capture ───────────────────────────────────────────────────
  useEffect(() => {
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

    api
      .post('/api/business-event', {
        event_type: 'LANDING_PAGE_VIEWED',
        payload: { ...captured, county_id: countyId },
      })
      .catch(() => {});

    if (captured.attributionToken && !tokenResolving) {
      setTokenResolving(true);
      api
        .post('/api/landing/resolve-token', { token: captured.attributionToken })
        .then((res) => {
          if (res?.feed_uuid) {
            navigate(`/dashboard/${res.feed_uuid}`, { replace: true });
          }
        })
        .catch(() => {})
        .finally(() => setTokenResolving(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const value = useMemo(
    () => ({
      selectedVertical,
      setSelectedVertical,
      countyId,
      setCountyId,
      landingData,
      landingDataLoading,
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
      pricing,
      pricingLoading,
    }),
    [selectedVertical, countyId, landingData, landingDataLoading, attribution, tokenResolving, pricing, pricingLoading],
  );

  return <LandingContext.Provider value={value}>{children}</LandingContext.Provider>;
}

export function useLanding() {
  return useContext(LandingContext);
}
