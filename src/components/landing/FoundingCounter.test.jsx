import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FoundingCounter from './FoundingCounter';
import { fetchFoundingSummary } from '../../api/landing';

vi.mock('./LandingContext', () => ({
  useLanding: () => ({ selectedVertical: 'roofing', countyId: 'hillsborough' }),
}));
vi.mock('../../api/landing', () => ({
  fetchFoundingSummary: vi.fn(),
}));

describe('FoundingCounter countdown', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a live countdown from founding_price_deadline_at / server_now', async () => {
    const serverNow = new Date('2026-07-28T00:00:00Z');
    const deadline = new Date('2026-07-30T01:02:03Z'); // 2d 1h 2m 3s out
    vi.spyOn(Date, 'now').mockReturnValue(serverNow.getTime());
    fetchFoundingSummary.mockResolvedValue({
      total_remaining: 5,
      total_cap: 30,
      founding_available: true,
      founding_price_deadline_at: deadline.toISOString(),
      server_now: serverNow.toISOString(),
      deadline_passed: false,
    });

    render(<FoundingCounter />);

    await waitFor(() => expect(screen.getByText(/2d/)).toBeInTheDocument());
    expect(screen.getByText(/left at founding rate/i)).toBeInTheDocument();
  });

  it('shows "window closed" when deadline_passed is true, even if local clock lags', async () => {
    const serverNow = new Date('2026-07-28T00:00:00Z');
    const deadline = new Date('2026-07-27T00:00:00Z'); // already past
    vi.spyOn(Date, 'now').mockReturnValue(serverNow.getTime());
    fetchFoundingSummary.mockResolvedValue({
      total_remaining: 5,
      total_cap: 30,
      founding_available: true,
      founding_price_deadline_at: deadline.toISOString(),
      server_now: serverNow.toISOString(),
      deadline_passed: true,
    });

    render(<FoundingCounter />);

    await waitFor(() => expect(screen.getByText(/founding window closed/i)).toBeInTheDocument());
  });

  it('corrects for browser clock skew using server_now, not raw Date.now()', async () => {
    // Browser clock is 1 hour ahead of the server. Without the offset
    // correction, this would show ~1 hour less time remaining than it
    // should — the whole reason the countdown reads server_now at all.
    const serverNow = new Date('2026-07-28T00:00:00Z');
    const browserNow = new Date('2026-07-28T01:00:00Z');
    const deadline = new Date('2026-07-28T02:00:00Z'); // 2h out per server clock
    vi.spyOn(Date, 'now').mockReturnValue(browserNow.getTime());
    fetchFoundingSummary.mockResolvedValue({
      total_remaining: 5,
      total_cap: 30,
      founding_available: true,
      founding_price_deadline_at: deadline.toISOString(),
      server_now: serverNow.toISOString(),
      deadline_passed: false,
    });

    render(<FoundingCounter />);

    await waitFor(() => expect(screen.getByText(/02h/)).toBeInTheDocument());
  });

  it('renders nothing extra when the backend has no deadline configured', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.now());
    fetchFoundingSummary.mockResolvedValue({
      total_remaining: 5,
      total_cap: 30,
      founding_available: true,
      founding_price_deadline_at: null,
      server_now: new Date().toISOString(),
      deadline_passed: false,
    });

    render(<FoundingCounter />);

    await waitFor(() => expect(screen.getByText(/of 30 remaining/)).toBeInTheDocument());
    expect(screen.queryByText(/left at founding rate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/founding window closed/i)).not.toBeInTheDocument();
  });
});
