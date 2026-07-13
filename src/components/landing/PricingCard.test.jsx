import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PricingCard from './PricingCard';
import { fetchFoundingSpots } from '../../api/landing';

vi.mock('./LandingContext', () => ({
  useLanding: () => ({
    selectedVertical: 'roofing',
    countyId: 'hillsborough',
    pricing: {
      starter: { founding_amount: 199, regular_amount: 299, label: 'Starter', features: ['Feature A'] },
    },
  }),
}));
vi.mock('../../api/landing', () => ({
  fetchFoundingSpots: vi.fn(),
}));

describe('PricingCard', () => {
  it('shows founding state when backend founding_available is true', async () => {
    fetchFoundingSpots.mockResolvedValue({
      founding_available: true, founding_remaining: 5, founding_cap: 20, deadline_passed: false,
    });
    render(<PricingCard tier="starter" onCheckout={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('$199')).toBeInTheDocument());
  });

  it('shows regular pricing (not "sold out") when deadline passed but spots remain', async () => {
    fetchFoundingSpots.mockResolvedValue({
      founding_available: false, founding_remaining: 5, founding_cap: 20, deadline_passed: true,
    });
    render(<PricingCard tier="starter" onCheckout={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('$299')).toBeInTheDocument());
    expect(screen.queryByText(/sold out/i)).not.toBeInTheDocument();
  });

  it('shows "sold out" copy when spots are actually exhausted (deadline not passed)', async () => {
    fetchFoundingSpots.mockResolvedValue({
      founding_available: false, founding_remaining: 0, founding_cap: 20, deadline_passed: false,
    });
    render(<PricingCard tier="starter" onCheckout={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/sold out/i)).toBeInTheDocument());
  });
});
