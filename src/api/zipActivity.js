import { api } from './client';

export function fetchZipActivity(zipCode, vertical, options = {}) {
  const params = { zip_code: zipCode };
  if (vertical) params.vertical = vertical;
  return api.get('/api/zip-activity', params, options);
}
