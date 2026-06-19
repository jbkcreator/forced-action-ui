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

export function fetchQuoraQueue(token, page = 1, opts = {}) {
  return adminFetch(token, `/api/admin/quora/queue?page=${page}&page_size=50`, opts);
}

export function updateQuoraDraft(token, id, answerMarkdown) {
  return adminFetch(token, `/api/admin/quora/${id}/draft`, {
    method: 'PATCH',
    body: { answer_markdown: answerMarkdown },
  });
}

export function postQuoraAnswer(token, id) {
  return adminFetch(token, `/api/admin/quora/${id}/post`, { method: 'POST' });
}

export function fetchQuoraPosted(token, page = 1, opts = {}) {
  return adminFetch(token, `/api/admin/quora/posted?page=${page}&page_size=50`, opts);
}

export function fetchQuoraTopics(token, opts = {}) {
  return adminFetch(token, '/api/admin/quora/topics', opts);
}

export function createQuoraTopic(token, keyword) {
  return adminFetch(token, '/api/admin/quora/topics', { method: 'POST', body: { keyword } });
}

export function deleteQuoraTopic(token, id) {
  return adminFetch(token, `/api/admin/quora/topics/${id}`, { method: 'DELETE' });
}

export function updateQuoraSettings(token, cooldown_days) {
  return adminFetch(token, '/api/admin/quora/settings', { method: 'PUT', body: { cooldown_days } });
}
