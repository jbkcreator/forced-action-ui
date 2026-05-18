/**
 * Focused tests for the Auto Mode tile in SettingsPage.
 *
 * Covers tier-aware rendering and click handlers:
 *   - Starter without entitlement → "Get Auto Mode" checkout CTA
 *   - Growth wallet → toggle button
 *   - Power wallet → toggle button
 *   - Entitled Starter (auto_mode_enabled=true on starter_wallet) → toggle
 *   - Checkout button calls createAutoModeCheckout + redirects
 *   - Toggle button calls setAutoMode + triggers refetch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../api/dashboard', () => ({
  fetchFeed: vi.fn(),
  fetchReferralStatus: vi.fn(() => Promise.resolve(null)),
  createAutoModeCheckout: vi.fn(),
  setAutoMode: vi.fn(),
}));
vi.mock('../api/account', () => ({
  acceptAnnual: vi.fn(),
  upgradeTier: vi.fn(),
  openBillingPortal: vi.fn(),
}));
// Stripe.js loader is async + reaches the network — mock to a stub Stripe with
// initEmbeddedCheckout that resolves to a mount/destroy mock object.
const stripeMockSession = {
  mount: vi.fn(),
  destroy: vi.fn(),
};
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    initEmbeddedCheckout: vi.fn(() => Promise.resolve(stripeMockSession)),
  })),
}));

import SettingsPage from './SettingsPage';
import { fetchFeed, createAutoModeCheckout, setAutoMode } from '../api/dashboard';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/feed-test/settings']}>
      <Routes>
        <Route path="/dashboard/:feedUuid/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fakeFeed({
  tier = 'starter_regular',
  wallet_tier = null,
  auto_mode_enabled = false,
  auto_mode_entitled = null,  // null = infer from inputs
} = {}) {
  // Default entitlement to match what the real backend would compute.
  const entitled = auto_mode_entitled != null
    ? auto_mode_entitled
    : ['growth', 'power'].includes(wallet_tier);
  return Promise.resolve({
    subscriber: {
      id: 1,
      tier,
      wallet_tier,
      auto_mode_enabled,
      auto_mode_entitled: entitled,
      county_id: 'hillsborough',
      vertical: 'roofing',
      status: 'active',
      email: 't@example.com',
      event_feed_uuid: 'feed-test',
    },
    pagination: { total: 0 },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom doesn't implement window.location.href setter — stub it.
  delete window.location;
  window.location = { href: '' };
});

describe('SettingsPage Auto Mode tile', () => {
  it('Starter without entitlement shows "Get Auto Mode" checkout CTA', async () => {
    fetchFeed.mockReturnValueOnce(fakeFeed({ wallet_tier: 'starter_wallet', auto_mode_enabled: false }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Auto Mode')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Get Auto Mode/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enable Auto Mode|Disable Auto Mode/i })).not.toBeInTheDocument();
    expect(screen.getByText(/included on Wallet Growth and Wallet Power/i)).toBeInTheDocument();
  });

  it('Growth wallet shows toggle button (Enabled state hidden)', async () => {
    fetchFeed.mockReturnValueOnce(fakeFeed({ wallet_tier: 'growth', auto_mode_enabled: false }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Auto Mode')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Enable Auto Mode/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Get Auto Mode/i })).not.toBeInTheDocument();
  });

  it('Power wallet shows toggle (Disable when already enabled)', async () => {
    fetchFeed.mockReturnValueOnce(fakeFeed({ wallet_tier: 'power', auto_mode_enabled: true }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Auto Mode')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Disable Auto Mode/i })).toBeInTheDocument();
  });

  it('Entitled Starter (auto_mode_entitled=true) shows toggle, not CTA', async () => {
    // Even if auto_mode_enabled is False, an entitled Starter must see the
    // toggle (not the checkout CTA) — this is the re-enable-after-disable case.
    fetchFeed.mockReturnValueOnce(fakeFeed({
      wallet_tier: 'starter_wallet',
      auto_mode_enabled: false,
      auto_mode_entitled: true,
    }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Auto Mode')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Enable Auto Mode/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Get Auto Mode/i })).not.toBeInTheDocument();
  });

  it('clicking "Get Auto Mode" opens embedded checkout modal', async () => {
    fetchFeed.mockReturnValueOnce(fakeFeed({ wallet_tier: 'starter_wallet' }));
    createAutoModeCheckout.mockResolvedValue({
      client_secret: 'cs_test_secret_xxx',
      publishable_key: 'pk_test_xxx',
      session_id: 'cs_x',
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Auto Mode')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Get Auto Mode/i }));
    await waitFor(() => {
      expect(createAutoModeCheckout).toHaveBeenCalledWith({ feedUuid: 'feed-test' });
    });
    // Modal mounts the embedded Stripe element via initEmbeddedCheckout +
    // its returned .mount() — confirm we hit that path.
    await waitFor(() => {
      expect(stripeMockSession.mount).toHaveBeenCalled();
    });
  });

  it('clicking "Enable Auto Mode" calls setAutoMode and refetches', async () => {
    // First fetch returns disabled; second (refetch) returns enabled
    fetchFeed
      .mockReturnValueOnce(fakeFeed({ wallet_tier: 'growth', auto_mode_enabled: false }))
      .mockReturnValueOnce(fakeFeed({ wallet_tier: 'growth', auto_mode_enabled: true }));
    setAutoMode.mockResolvedValue({ auto_mode_enabled: true });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /Enable Auto Mode/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Enable Auto Mode/i }));
    await waitFor(() => {
      expect(setAutoMode).toHaveBeenCalledWith({ feedUuid: 'feed-test', enabled: true });
    });
    // After refetch, the button text switches to Disable
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Disable Auto Mode/i })).toBeInTheDocument();
    });
  });

  it('checkout API error renders an inline error message', async () => {
    fetchFeed.mockReturnValueOnce(fakeFeed({ wallet_tier: 'starter_wallet' }));
    createAutoModeCheckout.mockRejectedValue({ detail: { message: 'Stripe is offline' } });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /Get Auto Mode/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Get Auto Mode/i }));
    await waitFor(() => {
      expect(screen.getByText(/Stripe is offline/)).toBeInTheDocument();
    });
  });
});
