/**
 * Email Campaigns API client.
 * All paths are under /api/admin per the backend contract.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function adminFetch(token, path, options = {}) {
  const { signal, ...rest } = options;
  const headers = { Authorization: `Bearer ${token}`, ...(rest.headers || {}) };
  if (rest.body !== undefined && !(rest.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    rest.body = typeof rest.body === 'string' ? rest.body : JSON.stringify(rest.body);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, signal });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    err.detail = detail;
    err.body = data;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function fetchCampaignSummary(token, options = {}) {
  return adminFetch(token, '/api/admin/email-campaigns/summary', options);
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export function fetchCampaigns(token, { status = '' } = {}, options = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const qs = params.toString();
  return adminFetch(token, `/api/admin/email-campaigns${qs ? `?${qs}` : ''}`, options);
}

export function fetchCampaignDetail(token, campaignId, options = {}) {
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}`, options);
}

export function createCampaign(token, payload, options = {}) {
  return adminFetch(token, '/api/admin/email-campaigns', { method: 'POST', body: payload, ...options });
}

export function pauseCampaign(token, campaignId, options = {}) {
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}/pause`, { method: 'POST', ...options });
}

export function resumeCampaign(token, campaignId, options = {}) {
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}/resume`, { method: 'POST', ...options });
}

export function addMoreContacts(token, campaignId, options = {}) {
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}/add-contacts`, { method: 'POST', ...options });
}

export function updateCampaign(token, campaignId, payload, options = {}) {
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}`, { method: 'PUT', body: payload, ...options });
}

export function deleteCampaign(token, campaignId, options = {}) {
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}`, { method: 'DELETE', ...options });
}

// ─── Eligible count ───────────────────────────────────────────────────────────

export function fetchEligibleCount(token, filters = {}, options = {}) {
  const params = new URLSearchParams();
  if (filters.county_id)   params.set('county_id',   filters.county_id);
  if (filters.vertical)    params.set('vertical',    filters.vertical);
  if (filters.campaign_id) params.set('campaign_id', filters.campaign_id);
  if (Array.isArray(filters.zips)) {
    filters.zips.forEach(z => params.append('zips', z));
  } else if (typeof filters.zips === 'string' && filters.zips.trim()) {
    filters.zips.split(',').map(z => z.trim()).filter(Boolean).forEach(z => params.append('zips', z));
  }
  return adminFetch(token, `/api/admin/email-campaigns/eligible-count?${params}`, options);
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function fetchContacts(token, campaignId, { search = '', engagement_status = '', page = 1, page_size = 50 } = {}, options = {}) {
  const params = new URLSearchParams();
  if (search)            params.set('search',            search);
  if (engagement_status) params.set('engagement_status', engagement_status);
  params.set('page',      page);
  params.set('page_size', page_size);
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}/contacts?${params}`, options);
}

export function exportContacts(token, campaignId, { engagement_status = '' } = {}, options = {}) {
  const params = new URLSearchParams();
  if (engagement_status) params.set('engagement_status', engagement_status);
  return adminFetch(token, `/api/admin/email-campaigns/${campaignId}/contacts/export?${params}`, options);
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function fetchEmailTemplates(token, options = {}) {
  return adminFetch(token, '/api/admin/email-templates', options);
}

export function fetchTemplateVariables(token, options = {}) {
  return adminFetch(token, '/api/admin/email-templates/variables', options);
}

export function createTemplate(token, payload, options = {}) {
  return adminFetch(token, '/api/admin/email-templates', { method: 'POST', body: payload, ...options });
}

export function updateTemplate(token, templateId, payload, options = {}) {
  return adminFetch(token, `/api/admin/email-templates/${templateId}`, { method: 'PUT', body: payload, ...options });
}

export function deleteTemplate(token, templateId, options = {}) {
  return adminFetch(token, `/api/admin/email-templates/${templateId}`, { method: 'DELETE', ...options });
}

// ─── Inbox / Warmup ───────────────────────────────────────────────────────────

export function fetchWarmupStatus(token, options = {}) {
  return adminFetch(token, '/api/admin/email-inboxes', options);
}
