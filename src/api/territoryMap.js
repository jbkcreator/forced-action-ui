import { apiRequest, isAbortError } from './client';

export async function fetchTerritoryMap(countyId, vertical, { signal } = {}) {
  return apiRequest(
    `/api/territory-map?county_id=${encodeURIComponent(countyId)}&vertical=${encodeURIComponent(vertical)}`,
    { signal },
  );
}

export { isAbortError };
