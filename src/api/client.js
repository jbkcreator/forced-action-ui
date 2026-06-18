const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const { signal, ...rest } = options;
  const config = {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...rest.headers },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  if (signal) config.signal = signal;

  const res = await fetch(url, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw { status: res.status, ...error };
  }

  return res.json();
}

export const api = {
  get(path, params, options = {}) {
    const qs = params ? '?' + new URLSearchParams(params) : '';
    return apiRequest(`${path}${qs}`, options);
  },
  post(path, body, options = {}) {
    return apiRequest(path, { method: 'POST', body, ...options });
  },
  patch(path, body, options = {}) {
    return apiRequest(path, { method: 'PATCH', body, ...options });
  },
};

export function isAbortError(err) {
  return err && (err.name === 'AbortError' || err.code === 20);
}
