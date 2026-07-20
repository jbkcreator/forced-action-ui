import { api } from './client';

export function fetchPricing() {
  return api.get('/api/pricing');
}

export function fetchLandingData(countyId) {
  return api.get('/api/landing-data', { county_id: countyId });
}

export function fetchFoundingSummary(vertical, countyId) {
  return api.get('/api/founding-summary', { vertical, county_id: countyId });
}

export function fetchFoundingSpots(tier, vertical, countyId) {
  return api.get('/api/founding-spots', { tier, vertical, county_id: countyId });
}

export function checkZip(zipCode, vertical, countyId) {
  return api.get('/api/zip-check', { zip_code: zipCode, vertical, county_id: countyId });
}

export function fetchZipAvailability(vertical, countyId) {
  return api.get('/api/zip-availability', { vertical, county_id: countyId });
}

export function fetchSampleLeads(zipCode, vertical, countyId) {
  return api.get('/api/sample-leads', { zip_code: zipCode, vertical, county_id: countyId });
}

export function getCountyLanding(countyId) {
  return api.get(`/api/counties/${countyId}/landing`);
}

export function submitWaitlist({ zipCode, vertical, countyId, name, email, phone, sms_opt_in, waitlist_type, consent_acceptance }) {
  return api.post('/api/waitlist', {
    zip_code: zipCode,
    vertical,
    county_id: countyId,
    name,
    email,
    phone,
    sms_opt_in,
    waitlist_type,
    consent_acceptance,
  });
}

export function createCheckout({
  tier, vertical, countyId, zipCodes, email, consentAcceptance = null, attribution = null,
  alreadyHasDashboardAccess = false, successReturnPath = null,
}) {
  return api.post('/api/checkout', {
    tier,
    vertical,
    county_id: countyId,
    zip_codes: zipCodes,
    email,
    consent_acceptance: consentAcceptance,
    attribution,
    already_has_dashboard_access: alreadyHasDashboardAccess,
    success_return_path: successReturnPath,
  });
}