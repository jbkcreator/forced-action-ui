import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PartnerSummaryCard from './PartnerSummaryCard';

describe('PartnerSummaryCard — confirm flow', () => {
  it('shows "Continue to Stripe" by default', () => {
    render(
      <PartnerSummaryCard
        selected={['33601']}
        priceMonthly={2000}
        onCheckout={vi.fn()}
        submitting={false}
        confirming={false}
      />
    );
    expect(screen.getByRole('button', { name: /continue to stripe/i })).toBeInTheDocument();
    expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
  });

  it('shows confirm label and Cancel when confirming=true', () => {
    render(
      <PartnerSummaryCard
        selected={['33601']}
        priceMonthly={2000}
        onCheckout={vi.fn()}
        submitting={false}
        confirming={true}
        onCancelConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /confirm \$2,000\/mo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancelConfirm when Cancel clicked', async () => {
    const onCancelConfirm = vi.fn();
    render(
      <PartnerSummaryCard
        selected={['33601']}
        priceMonthly={2000}
        onCheckout={vi.fn()}
        submitting={false}
        confirming={true}
        onCancelConfirm={onCancelConfirm}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancelConfirm).toHaveBeenCalledOnce();
  });

  it('disables checkout button when no ZIPs selected', () => {
    render(
      <PartnerSummaryCard
        selected={[]}
        priceMonthly={2000}
        onCheckout={vi.fn()}
        submitting={false}
        confirming={false}
      />
    );
    expect(screen.getByRole('button', { name: /continue to stripe/i })).toBeDisabled();
  });
});
