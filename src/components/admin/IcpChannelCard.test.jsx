/**
 * IcpChannelCard — unit tests for Force Activate behaviour.
 *
 * Key scenarios:
 *   1. Gated REI Investor: Activate disabled, Force Activate enabled (authorized admin)
 *   2. Gated REI Investor: both disabled when canForceActivate=false
 *   3. All-green channel: Activate enabled, Force Activate not shown
 *   4. Default contractor ICP: no action buttons at all
 *   5. Retired channel: no action buttons
 *   6. Force modal flow: opens on click, requires reason ≥10 chars, submits with force=true
 *   7. Force modal cancel: closes without calling onActivate
 *   8. Normal activate: calls onActivate without force flag
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IcpChannelCard from './IcpChannelCard';

// ── Test fixtures ──────────────────────────────────────────────────────────────

const BLOCKED_CHANNEL = {
  key: 'rei_investor',
  display_name: 'REI Investor',
  status: 'gated',
  is_default: false,
  gate_required: true,
  gate_blocked: true,
  blocking_reasons: ['contractor MRR < $50K', 'first_payment_rate yellow'],
  gates: {
    first_payment_rate:  { color: 'yellow', value: 25, threshold: 30 },
    contractor_mrr_usd:  { color: 'red',    value: null, threshold: 50000 },
  },
  target_audience: 'Real estate investors',
};

const GREEN_CHANNEL = {
  ...BLOCKED_CHANNEL,
  gate_blocked: false,
  blocking_reasons: [],
  gates: {
    first_payment_rate:  { color: 'green', value: 35, threshold: 30 },
    contractor_mrr_usd:  { color: 'green', value: 55000, threshold: 50000 },
  },
};

const DEFAULT_CHANNEL = {
  ...BLOCKED_CHANNEL,
  key: 'contractor',
  display_name: 'Contractor',
  status: 'live',
  is_default: true,
  gate_required: false,
  gate_blocked: false,
  blocking_reasons: [],
};

const RETIRED_CHANNEL = {
  ...BLOCKED_CHANNEL,
  status: 'retired',
};

function setup(props = {}) {
  const onActivate = props.onActivate ?? vi.fn();
  const onPause    = props.onPause    ?? vi.fn();
  const onKill     = props.onKill     ?? vi.fn();
  const result = render(
    <IcpChannelCard
      channel={props.channel ?? BLOCKED_CHANNEL}
      onActivate={onActivate}
      onPause={onPause}
      onKill={onKill}
      loading={props.loading ?? false}
      canForceActivate={props.canForceActivate ?? true}
    />,
  );
  return { ...result, onActivate, onPause, onKill };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('IcpChannelCard — blocked/gated channel (REI Investor)', () => {
  it('renders the channel name and gated status', () => {
    setup();
    expect(screen.getByText('REI Investor')).toBeInTheDocument();
    expect(screen.getByText('gated')).toBeInTheDocument();
  });

  it('Activate button is disabled when gates are blocked', () => {
    setup();
    const activateBtn = screen.getByTestId('btn-activate');
    expect(activateBtn).toBeDisabled();
  });

  it('Force Activate button is enabled for authorized admin even when gates blocked', () => {
    setup({ canForceActivate: true });
    const forceBtn = screen.getByTestId('btn-force-activate');
    expect(forceBtn).not.toBeDisabled();
  });

  it('Force Activate button has descriptive title for authorized admin', () => {
    setup({ canForceActivate: true });
    const forceBtn = screen.getByTestId('btn-force-activate');
    expect(forceBtn.title).toMatch(/bypass/i);
  });

  it('Activate button is disabled when canForceActivate=false', () => {
    setup({ canForceActivate: false });
    const activateBtn = screen.getByTestId('btn-activate');
    expect(activateBtn).toBeDisabled();
  });

  it('Force Activate button is disabled and shows permission tooltip when canForceActivate=false', () => {
    setup({ canForceActivate: false });
    const forceBtn = screen.getByTestId('btn-force-activate');
    expect(forceBtn).toBeDisabled();
    expect(forceBtn.title).toMatch(/permission/i);
  });

  it('both action buttons disabled while loading', () => {
    setup({ loading: true });
    expect(screen.getByTestId('btn-activate')).toBeDisabled();
    expect(screen.getByTestId('btn-force-activate')).toBeDisabled();
  });
});

describe('IcpChannelCard — force modal flow', () => {
  it('force modal opens when Force Activate is clicked', async () => {
    setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    expect(screen.getByTestId('force-modal')).toBeInTheDocument();
    expect(screen.getByTestId('force-reason-input')).toBeInTheDocument();
  });

  it('Confirm button disabled when reason is empty', async () => {
    setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    expect(screen.getByTestId('btn-confirm-force')).toBeDisabled();
  });

  it('Confirm button disabled when reason is < 10 chars', async () => {
    setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    await userEvent.type(screen.getByTestId('force-reason-input'), 'too short');
    expect(screen.getByTestId('btn-confirm-force')).toBeDisabled();
  });

  it('Confirm button enabled when reason has ≥10 chars', async () => {
    setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    await userEvent.type(screen.getByTestId('force-reason-input'), 'Ops approved this activation for Q4 launch.');
    expect(screen.getByTestId('btn-confirm-force')).not.toBeDisabled();
  });

  it('submits onActivate with force=true and the typed reason', async () => {
    const { onActivate } = setup();
    const reason = 'Ops approved this activation for Q4 launch.';
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    await userEvent.type(screen.getByTestId('force-reason-input'), reason);
    await userEvent.click(screen.getByTestId('btn-confirm-force'));
    expect(onActivate).toHaveBeenCalledOnce();
    expect(onActivate).toHaveBeenCalledWith('rei_investor', { force: true, reason });
  });

  it('modal closes after successful submission', async () => {
    setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    await userEvent.type(screen.getByTestId('force-reason-input'), 'Approved by ops team for Q4 rollout.');
    await userEvent.click(screen.getByTestId('btn-confirm-force'));
    expect(screen.queryByTestId('force-modal')).not.toBeInTheDocument();
  });

  it('cancel closes modal without calling onActivate', async () => {
    const { onActivate } = setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    await userEvent.click(screen.getByTestId('btn-cancel-force'));
    expect(screen.queryByTestId('force-modal')).not.toBeInTheDocument();
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('reason input is cleared on cancel', async () => {
    setup();
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    await userEvent.type(screen.getByTestId('force-reason-input'), 'Some reason here for approval');
    await userEvent.click(screen.getByTestId('btn-cancel-force'));
    // Re-open — reason field should be empty
    await userEvent.click(screen.getByTestId('btn-force-activate'));
    expect(screen.getByTestId('force-reason-input').value).toBe('');
  });
});

describe('IcpChannelCard — all-green channel', () => {
  it('Activate button is enabled when all gates are green', () => {
    setup({ channel: GREEN_CHANNEL });
    expect(screen.getByTestId('btn-activate')).not.toBeDisabled();
  });

  it('Force Activate button is NOT shown when all gates are green (not needed)', () => {
    setup({ channel: GREEN_CHANNEL });
    expect(screen.queryByTestId('btn-force-activate')).not.toBeInTheDocument();
  });

  it('normal activate calls onActivate without force flag', async () => {
    const { onActivate } = setup({ channel: GREEN_CHANNEL });
    await userEvent.click(screen.getByTestId('btn-activate'));
    expect(onActivate).toHaveBeenCalledWith('rei_investor', {});
  });
});

describe('IcpChannelCard — default contractor ICP', () => {
  it('shows no Activate or Force Activate buttons for default channel', () => {
    setup({ channel: DEFAULT_CHANNEL });
    expect(screen.queryByTestId('btn-activate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-force-activate')).not.toBeInTheDocument();
  });

  it('shows gate-exempt label', () => {
    setup({ channel: DEFAULT_CHANNEL });
    // Use getAllByText since the status pill also has 'live' but the exempt label is unique text
    expect(screen.getByText(/Gate-exempt \(default contractor ICP\)/i)).toBeInTheDocument();
  });
});

describe('IcpChannelCard — retired channel', () => {
  it('shows no action buttons for a retired channel', () => {
    setup({ channel: RETIRED_CHANNEL });
    expect(screen.queryByTestId('btn-activate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-force-activate')).not.toBeInTheDocument();
  });

  it('shows retired terminal message', () => {
    setup({ channel: RETIRED_CHANNEL });
    // Status pill says "retired" (lowercase); terminal message uses distinct exact text
    expect(screen.getByText('Retired — terminal state.')).toBeInTheDocument();
  });
});
