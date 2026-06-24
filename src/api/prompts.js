const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function adminFetch(token, path, options = {}) {
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function fetchPromptGraphs(token) {
  return adminFetch(token, '/api/admin/prompts');
}

export async function fetchPromptFile(token, graph, filename) {
  return adminFetch(token, `/api/admin/prompts/${encodeURIComponent(graph)}/${encodeURIComponent(filename)}`);
}

export async function updatePromptFile(token, graph, filename, content) {
  return adminFetch(token, `/api/admin/prompts/${encodeURIComponent(graph)}/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    body: { content },
  });
}
