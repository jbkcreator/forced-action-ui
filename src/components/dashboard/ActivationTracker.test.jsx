import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivationTracker from './ActivationTracker';

function subscriber(overrides = {}) {
  return {
    tier: 'free',
    created_at: new Date().toISOString(),
    activation: {
      signup_time: new Date().toISOString(),
      first_leads_shown_time: null,
      first_unlock_time: null,
    },
    ...overrides,
  };
}

describe('ActivationTracker (T-B12-05)', () => {
  it('renders nothing for a paid tier subscriber', () => {
    const { container } = render(
      <ActivationTracker subscriber={subscriber({ tier: 'pro' })} leadCount={5} onUnlockFirstLead={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once activation (first_unlock_time) has happened', () => {
    const { container } = render(
      <ActivationTracker
        subscriber={subscriber({
          activation: {
            signup_time: new Date().toISOString(),
            first_leads_shown_time: new Date().toISOString(),
            first_unlock_time: new Date().toISOString(),
          },
        })}
        leadCount={5}
        onUnlockFirstLead={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the "pulling leads" message before first_leads_shown_time is set', () => {
    render(<ActivationTracker subscriber={subscriber()} leadCount={0} onUnlockFirstLead={vi.fn()} />);
    expect(screen.getByText(/Pulling real scored leads/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unlock first contact/i)).not.toBeInTheDocument();
  });

  it('shows the unlock-first-contact CTA once leads have been shown', () => {
    const onUnlockFirstLead = vi.fn();
    render(
      <ActivationTracker
        subscriber={subscriber({
          activation: {
            signup_time: new Date().toISOString(),
            first_leads_shown_time: new Date().toISOString(),
            first_unlock_time: null,
          },
        })}
        leadCount={5}
        onUnlockFirstLead={onUnlockFirstLead}
      />,
    );
    const cta = screen.getByText(/Unlock first contact/i);
    cta.click();
    expect(onUnlockFirstLead).toHaveBeenCalledTimes(1);
  });

  it('renders nothing once past the 5-minute activation window', () => {
    const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const { container } = render(
      <ActivationTracker
        subscriber={subscriber({
          activation: { signup_time: sixMinAgo, first_leads_shown_time: sixMinAgo, first_unlock_time: null },
        })}
        leadCount={5}
        onUnlockFirstLead={vi.fn()}
      />,
    );
    // H-12: a stale "Get your first lead in 5 minutes" card with no clock
    // left would otherwise contradict the Monetization Wall's own live
    // countdown shown elsewhere on the same dashboard.
    expect(container).toBeEmptyDOMElement();
  });
});
