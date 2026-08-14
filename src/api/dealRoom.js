import { api } from './client';

export function fetchDealRoom(token) {
  return api.get('/api/deal-room/' + token);
}

export function createHoldCheckout(token) {
  return api.post('/api/hold-checkout', { deal_room_token: token });
}

// Demo — exchange email + password for a demo-scoped bearer token.
// 200 → { access_token } · 401 → invalid credentials
export function demoLogin(email, password) {
  return api.post('/api/demo/login', { email, password });
}

// Demo — generate a deal room for a prospect, authorized by the demo token.
// body: { prospect_name, prospect_email, zip_code, vertical, county_id, tier, job_value, close_rate }
// 201 → { deal_room_url, prefilled_checkout_url }
// 401 → missing/expired token · 409 → ZIP already held / locked
export function createDemoDealRoom(token, body) {
  return api.post('/api/demo/deal-room', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
