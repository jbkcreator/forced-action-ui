import { api } from './client';

export function fetchDealRoom(token) {
  return api.get('/api/deal-room/' + token);
}

export function createHoldCheckout(token) {
  return api.post('/api/hold-checkout', { deal_room_token: token });
}

// Demo — generate a deal room for a prospect, gated by the demo passcode.
// body: { prospect_name, prospect_email, zip_code, tier, job_value, close_rate }
// 201 → { deal_room_url, prefilled_checkout_url }
// 401 → wrong/missing passcode · 409 → ZIP already held / locked
export function createDemoDealRoom(passcode, body) {
  return api.post('/api/demo/deal-room', body, {
    headers: { 'X-Demo-Passcode': passcode },
  });
}
