import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  api: { get: vi.fn() },
}));

import { api } from './client';
import { fetchDeliveries } from './deliveries';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('deliveries api client', () => {
  it('GETs /api/admin/deliveries with a Bearer token and returns the envelope', async () => {
    const envelope = { total: 0, limit: 50, offset: 0, items: [] };
    api.get.mockResolvedValue(envelope);

    const res = await fetchDeliveries('tok-123', { limit: 50, offset: 0 });

    expect(api.get).toHaveBeenCalledTimes(1);
    const [path, params, options] = api.get.mock.calls[0];
    expect(path).toBe('/api/admin/deliveries');
    expect(params).toEqual({ limit: 50, offset: 0 });
    expect(options.headers.Authorization).toBe('Bearer tok-123');
    expect(res).toBe(envelope);
  });

  it('drops empty / null / undefined params before sending', async () => {
    api.get.mockResolvedValue({ items: [] });

    await fetchDeliveries('tok', {
      status: 'rejected', grade: '', account_id: null,
      property_id: undefined, from: '2099-06-01', limit: 50, offset: 0,
    });

    const params = api.get.mock.calls[0][1];
    expect(params).toEqual({ status: 'rejected', from: '2099-06-01', limit: 50, offset: 0 });
    expect('grade' in params).toBe(false);
    expect('account_id' in params).toBe(false);
    expect('property_id' in params).toBe(false);
  });

  it('forwards an abort signal through options', async () => {
    api.get.mockResolvedValue({ items: [] });
    const ctrl = new AbortController();
    await fetchDeliveries('tok', { limit: 50 }, { signal: ctrl.signal });
    expect(api.get.mock.calls[0][2].signal).toBe(ctrl.signal);
  });
});
