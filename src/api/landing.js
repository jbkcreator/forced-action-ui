import { api } from './client';

export function fetchFoundingSummary(vertical, countyId) {
  return api.get('/api/founding-summary', { vertical, county_id: countyId });
}

export function fetchFoundingSpots(tier, vertical, countyId) {
  return api.get('/api/founding-spots', { tier, vertical, county_id: countyId });
}

export function checkZip(zipCode, vertical, countyId) {
  return api.get('/api/zip-check', { zip_code: zipCode, vertical, county_id: countyId });
}

export function fetchSampleLeads(zipCode, vertical, countyId) {
  return api.get('/api/sample-leads', { zip_code: zipCode, vertical, county_id: countyId });
}

export function submitWaitlist({ zipCode, vertical, countyId, name, email }) {
  return api.post('/api/waitlist', {
    zip_code: zipCode,
    vertical,
    county_id: countyId,
    name,
    email,
  });
}

export function createCheckout({ tier, vertical, countyId, zipCodes }) {
  return api.post('/api/checkout', {
    tier,
    vertical,
    county_id: countyId,
    zip_codes: zipCodes,
  });
}
