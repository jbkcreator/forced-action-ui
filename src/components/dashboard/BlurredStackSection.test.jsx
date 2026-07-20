import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlurredStackSection from './BlurredStackSection';

function blurredLead(overrides = {}) {
  return {
    property_id: 1,
    address_masked: '••• ••••••',
    city: 'Tampa',
    state: 'FL',
    zip: '33601',
    lead_tier: 'Silver',
    score: 45,
    is_hot: false,
    ...overrides,
  };
}

describe('BlurredStackSection unlock CTA (Task 6 — the actually-reachable per-lead CTA)', () => {
  it('shows the $4 CTA for a sub-Gold blurred lead', () => {
    render(
      <BlurredStackSection
        blurred={[blurredLead()]}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
      />,
    );
    expect(screen.getByText('Unlock $4')).toBeInTheDocument();
  });

  it('shows the $150 hot-lead CTA for an is_hot blurred lead', () => {
    render(
      <BlurredStackSection
        blurred={[blurredLead({ is_hot: true, lead_tier: 'Platinum' })]}
        onUnlockLead={vi.fn()}
        onUnlockHotLead={vi.fn()}
      />,
    );
    expect(screen.getByText('Unlock $150')).toBeInTheDocument();
    expect(screen.queryByText('Unlock $4')).not.toBeInTheDocument();
  });

  it('calls onUnlockHotLead (not onUnlockLead) for a hot blurred lead', () => {
    const onUnlockLead = vi.fn();
    const onUnlockHotLead = vi.fn();
    render(
      <BlurredStackSection
        blurred={[blurredLead({ is_hot: true, property_id: 42 })]}
        onUnlockLead={onUnlockLead}
        onUnlockHotLead={onUnlockHotLead}
      />,
    );
    screen.getByText('Unlock $150').click();
    expect(onUnlockHotLead).toHaveBeenCalledWith(expect.objectContaining({ property_id: 42 }));
    expect(onUnlockLead).not.toHaveBeenCalled();
  });
});
