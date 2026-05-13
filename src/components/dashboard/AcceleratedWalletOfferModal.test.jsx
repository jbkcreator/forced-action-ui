import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AcceleratedWalletOfferModal from './AcceleratedWalletOfferModal';

vi.mock('../../api/wallet', () => ({
  acceptAcceleratedWalletOffer: vi.fn(),
}));

import { acceptAcceleratedWalletOffer } from '../../api/wallet';
// Stub the Icon component so the test doesn't hit asset paths
vi.mock('../ui/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

const defaultProps = {
  isOpen: true,
  feedUuid: 'feed-1',
  offerId: 42,
  creditsOffered: 20,
  priceCents: 4900,
  savedCardLast4: '4242',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('AcceleratedWalletOfferModal', () => {
  it('renders saved card last4 + price + credits', () => {
    render(<AcceleratedWalletOfferModal {...defaultProps} />);
    expect(screen.getByText(/Activate Starter Wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
    // Credits row label
    expect(screen.getByText(/Credits \/ month/i)).toBeInTheDocument();
    // "20" appears in the modal body
    expect(screen.getAllByText(/20/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$49 \/ mo/)).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    render(<AcceleratedWalletOfferModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('accelerated-wallet-offer-modal')).not.toBeInTheDocument();
  });

  it('clicking Activate posts to the API and shows success', async () => {
    acceptAcceleratedWalletOffer.mockResolvedValue({
      subscription_id: 'sub_123',
      stripe_status: 'incomplete',
    });
    const onSuccess = vi.fn();
    render(<AcceleratedWalletOfferModal {...defaultProps} onSuccess={onSuccess} />);
    await userEvent.click(screen.getByTestId('accelerated-wallet-offer-confirm'));
    await waitFor(() =>
      expect(screen.getByText(/Wallet activating/i)).toBeInTheDocument(),
    );
    expect(acceptAcceleratedWalletOffer).toHaveBeenCalledWith('feed-1', 42);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows secure-checkout fallback when requires_action=true', async () => {
    acceptAcceleratedWalletOffer.mockResolvedValue({
      subscription_id: 'sub_123',
      requires_action: true,
    });
    render(<AcceleratedWalletOfferModal {...defaultProps} />);
    await userEvent.click(screen.getByTestId('accelerated-wallet-offer-confirm'));
    await waitFor(() =>
      expect(screen.getByText(/Open secure checkout/i)).toBeInTheDocument(),
    );
  });

  it('shows error on API failure', async () => {
    acceptAcceleratedWalletOffer.mockRejectedValue({ message: 'Card declined' });
    render(<AcceleratedWalletOfferModal {...defaultProps} />);
    await userEvent.click(screen.getByTestId('accelerated-wallet-offer-confirm'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Card declined'),
    );
  });

  it('clicking Not now calls onClose', async () => {
    const onClose = vi.fn();
    render(<AcceleratedWalletOfferModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /Not now/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
