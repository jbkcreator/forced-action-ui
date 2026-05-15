import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BundleOfferModal from './BundleOfferModal';
import { bundleCheckout } from '../../api/bundles';

vi.mock('../../api/bundles', () => ({
  bundleCheckout: vi.fn(),
}));

vi.mock('../../api/phase2b', () => ({
  logBusinessEvent: vi.fn(),
}));

vi.mock('../common/PaymentSheetModal', () => ({
  default: ({ isOpen, description, amountLabel }) => (
    isOpen ? <div>{`Payment sheet: ${description} ${amountLabel}`}</div> : null
  ),
}));

describe('BundleOfferModal', () => {
  it('requires choosing a locked ZIP before opening checkout for ZIP-scoped bundles', async () => {
    bundleCheckout.mockResolvedValue({
      client_secret: 'cs_test',
      publishable_key: 'pk_test',
    });

    render(
      <BundleOfferModal
        isOpen
        feedUuid="feed-123"
        bundleType="zip_booster"
        lockedZips={['33602', '33647']}
        vertical="roofing"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const action = screen.getByRole('button', { name: /buy for \$29/i });
    expect(action).toBeDisabled();

    await userEvent.selectOptions(screen.getByLabelText(/target zip/i), '33647');
    expect(action).toBeEnabled();

    await userEvent.click(action);
    expect(bundleCheckout).toHaveBeenCalledWith({
      feedUuid: 'feed-123',
      bundleType: 'zip_booster',
      zipCode: '33647',
      vertical: 'roofing',
      abVariant: 'a',
    });
  });

  it('shows recurring copy for Monthly Reload', () => {
    render(
      <BundleOfferModal
        isOpen
        feedUuid="feed-789"
        bundleType="monthly_reload"
        lockedZips={['33647']}
        vertical="roofing"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Recurring monthly billing, charged to your saved card.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start for \$89\/mo/i })).toBeEnabled();
    expect(screen.queryByLabelText(/target zip/i)).not.toBeInTheDocument();
  });
});
