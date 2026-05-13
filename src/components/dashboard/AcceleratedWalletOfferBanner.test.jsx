import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AcceleratedWalletOfferBanner, {
  readAwDismissed,
  writeAwDismissed,
} from './AcceleratedWalletOfferBanner';

const defaultProps = {
  feedUuid: 'feed-1',
  offerId: 42,
  creditsOffered: 20,
  priceCents: 4900,
  missedLeads: 3,
  savedCardLast4: '4242',
};

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('AcceleratedWalletOfferBanner', () => {
  it('renders with missing-leads framing when missedLeads > 0', () => {
    render(<AcceleratedWalletOfferBanner {...defaultProps} />);
    expect(screen.getByTestId('accelerated-wallet-offer-banner')).toBeInTheDocument();
    expect(screen.getByText(/card ending 4242/i)).toBeInTheDocument();
    expect(screen.getByText(/3 leads in your ZIP/i)).toBeInTheDocument();
    expect(screen.getByText(/\$49/)).toBeInTheDocument();
  });

  it('falls back to credits-ready framing when missedLeads = 0', () => {
    render(<AcceleratedWalletOfferBanner {...defaultProps} missedLeads={0} />);
    expect(screen.getByText(/20 credits pre-loaded/i)).toBeInTheDocument();
  });

  it('falls back to "your saved card" when last4 is missing', () => {
    render(<AcceleratedWalletOfferBanner {...defaultProps} savedCardLast4={undefined} />);
    expect(screen.getByText(/Wallet ready on your saved card/i)).toBeInTheDocument();
  });

  it('clicking Activate calls onActivate with offerId', async () => {
    const onActivate = vi.fn();
    render(<AcceleratedWalletOfferBanner {...defaultProps} onActivate={onActivate} />);
    await userEvent.click(screen.getByRole('button', { name: /Activate Wallet/i }));
    expect(onActivate).toHaveBeenCalledWith(42);
  });

  it('clicking Not now hides the banner, persists dismiss, and calls onDecline', async () => {
    const onDecline = vi.fn();
    render(<AcceleratedWalletOfferBanner {...defaultProps} onDecline={onDecline} />);
    await userEvent.click(screen.getByRole('button', { name: /Not now/i }));
    expect(screen.queryByTestId('accelerated-wallet-offer-banner')).not.toBeInTheDocument();
    expect(onDecline).toHaveBeenCalledWith(42);
    expect(readAwDismissed('feed-1')).toBe(true);
  });

  it('readAwDismissed/writeAwDismissed round-trip', () => {
    expect(readAwDismissed('feed-x')).toBe(false);
    writeAwDismissed('feed-x');
    expect(readAwDismissed('feed-x')).toBe(true);
  });

  it('readAwDismissed expires after 7 days', () => {
    writeAwDismissed('feed-x');
    expect(readAwDismissed('feed-x')).toBe(true);
    // Simulate 8 days passing
    const original = localStorage.getItem('fa.dashboard.aw_push_dismissed.feed-x');
    const eightDaysAgo = Number(original) - 8 * 24 * 3600 * 1000;
    localStorage.setItem('fa.dashboard.aw_push_dismissed.feed-x', String(eightDaysAgo));
    expect(readAwDismissed('feed-x')).toBe(false);
  });
});
