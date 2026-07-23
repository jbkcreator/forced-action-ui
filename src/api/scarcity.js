import { api } from './client';

/**
 * GET /api/scarcity/county?zip=...&vertical=...
 * Returns county-level ZIP inventory pressure derived from territory status:
 * { zip_code, zip_status, county_id, county_name, vertical,
 *   open_count, locked_count, grace_count, total_count }
 */
export function fetchCountyScarcity(zip, { vertical, signal } = {}) {
  const params = { zip };
  if (vertical) params.vertical = vertical;
  return api.get('/api/scarcity/county', params, { signal });
}
