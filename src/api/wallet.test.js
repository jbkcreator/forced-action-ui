import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { api } from './client';
import {
  acceptAcceleratedWalletOffer,
  declineAcceleratedWalletOffer,
} from './wallet';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('wallet api client', () => {
  it('acceptAcceleratedWalletOffer POSTs the correct path + body', async () => {
    api.post.mockResolvedValue({ status: 'accepted', subscription_id: 'sub_1' });
    const res = await acceptAcceleratedWalletOffer('feed-1', 42);
    expect(api.post).toHaveBeenCalledWith(
      '/api/wallet/accept-accelerated-offer/feed-1',
      { offer_id: 42 },
    );
    expect(res.subscription_id).toBe('sub_1');
  });

  it('declineAcceleratedWalletOffer POSTs the correct path + body', async () => {
    api.post.mockResolvedValue({ status: 'declined', wallet_opt_out: true });
    const res = await declineAcceleratedWalletOffer('feed-1', 42);
    expect(api.post).toHaveBeenCalledWith(
      '/api/wallet/decline-accelerated-offer/feed-1',
      { offer_id: 42 },
    );
    expect(res.wallet_opt_out).toBe(true);
  });
});
