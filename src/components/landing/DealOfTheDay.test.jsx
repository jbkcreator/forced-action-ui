import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DealOfTheDay from './DealOfTheDay';
import * as landingApi from '../../api/landing';

describe('DealOfTheDay (T-B12-07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing while status is empty', async () => {
    vi.spyOn(landingApi, 'fetchDealOfTheDay').mockResolvedValue({ status: 'empty', deal: null });
    const { container } = render(<DealOfTheDay onUnlock={vi.fn()} />);
    await waitFor(() => expect(container.textContent).not.toMatch(/Loading/i));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once the window has expired', async () => {
    vi.spyOn(landingApi, 'fetchDealOfTheDay').mockResolvedValue({ status: 'expired', deal: null });
    const { container } = render(<DealOfTheDay onUnlock={vi.fn()} />);
    await waitFor(() => expect(container.textContent).not.toMatch(/Loading/i));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the live deal with scarcity framing, not a discount', async () => {
    const windowEnd = new Date(Date.now() + 3600 * 1000).toISOString();
    vi.spyOn(landingApi, 'fetchDealOfTheDay').mockResolvedValue({
      status: 'live',
      window_start: new Date().toISOString(),
      window_end: windowEnd,
      deal: {
        property_id: 1,
        address_masked: '••• •••••• St',
        city: 'Tampa',
        state: 'FL',
        zip: '33601',
        score: 96,
        lead_tier: 'Ultra Platinum',
        distress_types: ['foreclosure'],
        pricing: 'standard',
      },
    });

    render(<DealOfTheDay onUnlock={vi.fn()} />);

    expect(await screen.findByText(/Deal of the Day/i)).toBeInTheDocument();
    expect(screen.getByText(/standard price/i)).toBeInTheDocument();
    expect(screen.queryByText(/% off/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
  });

  it('invokes onUnlock when the unlock button is clicked', async () => {
    const onUnlock = vi.fn();
    vi.spyOn(landingApi, 'fetchDealOfTheDay').mockResolvedValue({
      status: 'live',
      window_start: new Date().toISOString(),
      window_end: new Date(Date.now() + 3600 * 1000).toISOString(),
      deal: {
        property_id: 1,
        address_masked: '••• •••••• St',
        city: 'Tampa',
        state: 'FL',
        zip: '33601',
        score: 96,
        lead_tier: 'Ultra Platinum',
        distress_types: [],
        pricing: 'standard',
      },
    });

    render(<DealOfTheDay onUnlock={onUnlock} />);
    const cta = await screen.findByText(/Unlock now/i);
    cta.click();
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});
