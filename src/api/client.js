const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw { status: res.status, ...error };
  }

  return res.json();
}

export const api = {
  get(path, params) {
    const qs = params ? '?' + new URLSearchParams(params) : '';
    return apiRequest(`${path}${qs}`);
  },
  post(path, body) {
    return apiRequest(path, { method: 'POST', body });
  },
};
