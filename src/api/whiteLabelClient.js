/**
 * White-label tier API module (Stage 12 / fa056).
 * All requests go through the shared api client (src/api/client.js).
 * Authentication: Bearer JWT in Authorization header (stored in localStorage.wl_access_token).
 * Data endpoints also accept X-API-Key header for programmatic access.
 */

import { apiRequest } from './client.js';

const BASE = '/api/wl';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function wlHeaders(extra = {}) {
  const token = localStorage.getItem('wl_access_token');
  return token
    ? { Authorization: `Bearer ${token}`, ...extra }
    : extra;
}

async function withRefresh(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.status === 401) {
      const refreshed = await wlRefreshToken();
      if (refreshed) return await fn();
      // Refresh failed — redirect to login
      window.location.href = '/wl/login';
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth endpoints (public)
// ---------------------------------------------------------------------------

export async function wlSignup(companyName, adminName, adminEmail, password, planTier = 'standard', branding = {}) {
  return apiRequest(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: companyName,
      admin_name: adminName,
      admin_email: adminEmail,
      password,
      plan_tier: planTier,
      primary_color: branding.primaryColor || null,
      secondary_color: branding.secondaryColor || null,
    }),
  });
}

export async function wlLogin(email, password) {
  const data = await apiRequest(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    localStorage.setItem('wl_access_token', data.access_token);
    localStorage.setItem('wl_refresh_token', data.refresh_token);
  }
  return data;
}

export async function wlRefreshToken() {
  const refresh = localStorage.getItem('wl_refresh_token');
  if (!refresh) return null;
  try {
    const data = await apiRequest(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (data.access_token) {
      localStorage.setItem('wl_access_token', data.access_token);
      return data.access_token;
    }
  } catch {
    wlLogout();
  }
  return null;
}

export function wlLogout() {
  localStorage.removeItem('wl_access_token');
  localStorage.removeItem('wl_refresh_token');
}

export async function wlForgotPassword(email) {
  return apiRequest(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function wlResetPassword(token, newPassword) {
  return apiRequest(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export async function wlGetAccount() {
  return withRefresh(() => apiRequest(`${BASE}/account`, { headers: wlHeaders() }));
}

export async function wlUpdateAccount(fields) {
  return withRefresh(() => apiRequest(`${BASE}/account`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...wlHeaders() },
    body: JSON.stringify(fields),
  }));
}

export async function wlUploadLogo(file) {
  const form = new FormData();
  form.append('file', file);
  return withRefresh(() => apiRequest(`${BASE}/account/logo`, {
    method: 'POST',
    headers: wlHeaders(),
    body: form,
  }));
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function wlGetTeam() {
  return withRefresh(() => apiRequest(`${BASE}/team`, { headers: wlHeaders() }));
}

export async function wlInviteMember(email, name, role = 'member') {
  return withRefresh(() => apiRequest(`${BASE}/team/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...wlHeaders() },
    body: JSON.stringify({ email, name, role }),
  }));
}

export async function wlUpdateMember(userId, role) {
  return withRefresh(() => apiRequest(`${BASE}/team/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...wlHeaders() },
    body: JSON.stringify({ role }),
  }));
}

export async function wlRemoveMember(userId) {
  return withRefresh(() => apiRequest(`${BASE}/team/${userId}`, {
    method: 'DELETE',
    headers: wlHeaders(),
  }));
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export async function wlCreateCheckout(planTier = 'standard', includeTrial = true) {
  return withRefresh(() => apiRequest(`${BASE}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...wlHeaders() },
    body: JSON.stringify({ plan_tier: planTier, include_trial: includeTrial }),
  }));
}

export async function wlGetBillingStatus() {
  return withRefresh(() => apiRequest(`${BASE}/billing/status`, { headers: wlHeaders() }));
}

export async function wlGetBillingPortal() {
  return withRefresh(() => apiRequest(`${BASE}/billing/portal`, {
    method: 'POST',
    headers: wlHeaders(),
  }));
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export async function wlGetApiKeys() {
  return withRefresh(() => apiRequest(`${BASE}/api-keys`, { headers: wlHeaders() }));
}

export async function wlCreateApiKey(label = 'Default') {
  return withRefresh(() => apiRequest(`${BASE}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...wlHeaders() },
    body: JSON.stringify({ label }),
  }));
}

export async function wlRevokeApiKey(keyId) {
  return withRefresh(() => apiRequest(`${BASE}/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: wlHeaders(),
  }));
}

export async function wlGetKeyUsage() {
  return withRefresh(() => apiRequest(`${BASE}/api-keys/usage`, { headers: wlHeaders() }));
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export async function wlGetLeads(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return withRefresh(() => apiRequest(`${BASE}/data/leads${qs ? `?${qs}` : ''}`, { headers: wlHeaders() }));
}

export async function wlGetLeadDetail(propertyId) {
  return withRefresh(() => apiRequest(`${BASE}/data/leads/${propertyId}`, { headers: wlHeaders() }));
}

export async function wlGetStats() {
  return withRefresh(() => apiRequest(`${BASE}/data/stats`, { headers: wlHeaders() }));
}

export async function wlGetContractors(countyId, vertical, forceRefresh = false) {
  const qs = new URLSearchParams({ county_id: countyId, vertical, force_refresh: forceRefresh }).toString();
  return withRefresh(() => apiRequest(`${BASE}/data/contractors?${qs}`, { headers: wlHeaders() }));
}

export async function wlSubmitDeal(dealData) {
  return withRefresh(() => apiRequest(`${BASE}/data/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...wlHeaders() },
    body: JSON.stringify(dealData),
  }));
}

// ---------------------------------------------------------------------------
// Reports (trigger browser download)
// ---------------------------------------------------------------------------

export async function wlDownloadLeadsCsv(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/reports/leads.csv${qs ? `?${qs}` : ''}`;
  const token = localStorage.getItem('wl_access_token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to download CSV');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leads.csv';
  a.click();
}

export async function wlDownloadBenchmarkPdf() {
  const token = localStorage.getItem('wl_access_token');
  const res = await fetch(`${BASE}/reports/benchmark.pdf`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to download benchmark PDF');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'benchmark.pdf';
  a.click();
}

export async function wlDownloadDashboardPdf() {
  const token = localStorage.getItem('wl_access_token');
  const res = await fetch(`${BASE}/reports/dashboard.pdf`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to download dashboard PDF');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dashboard.pdf';
  a.click();
}
