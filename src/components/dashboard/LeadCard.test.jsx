import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeadCard from './LeadCard';

vi.mock('../../hooks/useLeadHold', () => ({ default: () => null }));

function baseLead(overrides = {}) {
  return {
    property_id: 1,
    address: '1 Test St',
    city: 'Tampa',
    state: 'FL',
    zip: '33602',
    lead_tier: 'Silver',
    cds_score: 45,
    unlocked: false,
    is_hot: false,
    ...overrides,
  };
}

describe('LeadCard unlock CTA (Task 6 — D1/D2/D3)', () => {
  it('shows the $4 CTA for a sub-Gold lead with no active window', () => {
    render(
      <LeadCard
        lead={baseLead()}
        index={0}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
        feedUuid="feed-1"
      />,
    );
    expect(screen.getByText('Unlock $4')).toBeInTheDocument();
  });

  it('shows the $150 hot-lead CTA for an is_hot lead with no active window', () => {
    render(
      <LeadCard
        lead={baseLead({ is_hot: true, lead_tier: 'Gold' })}
        index={0}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
        feedUuid="feed-1"
      />,
    );
    expect(screen.getByText('Unlock $150')).toBeInTheDocument();
    expect(screen.queryByText('Unlock $4')).not.toBeInTheDocument();
  });

  it('shows the $99 reduced CTA when an active flash-scarcity window covers the lead\'s ZIP, even for a sub-Gold lead', () => {
    render(
      <LeadCard
        lead={baseLead()}
        index={0}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
        activeWindow={{ zip_code: '33602', vertical: 'roofing', expires_in_seconds: 900 }}
        feedUuid="feed-1"
      />,
    );
    expect(screen.getByText('Unlock $99')).toBeInTheDocument();
    expect(screen.getByText(/Reduced rate active for ~15m/)).toBeInTheDocument();
  });

  it('calls onUnlockHotLead (not onUnlockLead) when the hot-lead CTA is clicked', async () => {
    const onUnlockLead = vi.fn();
    const onUnlockHotLead = vi.fn();
    render(
      <LeadCard
        lead={baseLead({ is_hot: true })}
        index={0}
        onUnlockLead={onUnlockLead}
        onUnlockHotLead={onUnlockHotLead}
        feedUuid="feed-1"
      />,
    );
    screen.getByText('Unlock $150').click();
    expect(onUnlockHotLead).toHaveBeenCalledTimes(1);
    expect(onUnlockLead).not.toHaveBeenCalled();
  });

  it('renders only one CTA per card even when both handlers are present', () => {
    render(
      <LeadCard
        lead={baseLead({ is_hot: true })}
        index={0}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
        feedUuid="feed-1"
      />,
    );
    expect(screen.getAllByRole('button', { name: /Unlock/ })).toHaveLength(1);
  });

  it('renders no unlock CTA once the lead is unlocked', () => {
    render(
      <LeadCard
        lead={baseLead({ unlocked: true, is_hot: true })}
        index={0}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
        feedUuid="feed-1"
      />,
    );
    expect(screen.queryByText(/Unlock \$/)).not.toBeInTheDocument();
  });
});
