import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmsOutcomesDashboard from './SmsOutcomesDashboard';

vi.mock('../../api/admin', () => ({
  fetchMessageOutcomes:      vi.fn(),
  fetchMessageOutcomeDetail: vi.fn(),
}));

import { fetchMessageOutcomes, fetchMessageOutcomeDetail } from '../../api/admin';

const TOKEN = 'test-token';

const OUTCOME_ROW = {
  id: 10, subscriber_id: 5,
  message_type: 'sms', template_id: 'tmpl_fomo', variant_id: 'var_a',
  channel: 'telnyx', conversion_type: 'unlock', conversion_within_24h: true,
  revenue_attributed: '250.00',
  sent_at: '2026-05-15T09:00:00Z', delivered_at: '2026-05-15T09:01:00Z',
  replied_at: '2026-05-15T10:00:00Z',
  trade_vertical: 'fix_flip', county_id: 'hillsborough',
  behavioral_segment: 'high_intent', revenue_signal_score: 72,
  revenue_signal_score_band: 'gold', last_action_recency_band: 'recent',
  prompt_version: 'v3', has_context_snapshot: true,
};

const OUTCOME_DETAIL = {
  ...OUTCOME_ROW,
  clicked_at: null,
  conversion_within_4h: false,
  conversion_within_48h: true,
  created_at: '2026-05-15T09:00:00Z',
  context_snapshot: { score: 72, vertical: 'fix_flip', segment: 'high_intent' },
};

function listResponse(rows = [OUTCOME_ROW]) {
  return { data: rows, total: rows.length, page: 1, per_page: 50 };
}

beforeEach(() => {
  vi.resetAllMocks();
  fetchMessageOutcomes.mockResolvedValue(listResponse());
  fetchMessageOutcomeDetail.mockResolvedValue(OUTCOME_DETAIL);
});

describe('SmsOutcomesDashboard — list rendering', () => {
  it('renders table with fa038 personalization fields', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    // fix_flip and high_intent also appear in dropdowns; use getAllByText
    await waitFor(() => expect(screen.getAllByText('fix_flip').length).toBeGreaterThanOrEqual(2));
    expect(screen.getAllByText('high_intent').length).toBeGreaterThanOrEqual(2);
    // hillsborough only in table (not in any dropdown)
    expect(screen.getByText('hillsborough')).toBeInTheDocument();
    expect(screen.getAllByText('v3').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "JSON" badge for rows with context_snapshot', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('JSON'));
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('does not render context_snapshot data in list', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('hillsborough'));
    expect(screen.queryByText(/"vertical": "fix_flip"/)).not.toBeInTheDocument();
  });

  it('shows empty state when no rows returned', async () => {
    fetchMessageOutcomes.mockResolvedValue(listResponse([]));
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/no message outcomes found/i));
  });

  it('shows error state when API fails', async () => {
    fetchMessageOutcomes.mockRejectedValue(new Error('Server error'));
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/server error/i));
  });

  it('renders conversion_type badge', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getAllByText('unlock'));
    expect(screen.getAllByText('unlock').length).toBeGreaterThanOrEqual(1);
  });
});

describe('SmsOutcomesDashboard — filters', () => {
  it('applies trade_vertical filter', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('hillsborough'));

    // find the trade_vertical select by its "All Verticals" option
    const verticalSelect = screen.getAllByRole('combobox').find(
      s => s.querySelector('option[value="fix_flip"]')
    );
    await userEvent.selectOptions(verticalSelect, 'wholesaler');
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => {
      const lastCall = fetchMessageOutcomes.mock.calls.at(-1);
      expect(lastCall[1].trade_vertical).toBe('wholesaler');
    });
  });

  it('includes subscriber_id filter when typed', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('hillsborough'));

    await userEvent.type(screen.getByPlaceholderText(/subscriber id/i), '42');
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => {
      const lastCall = fetchMessageOutcomes.mock.calls.at(-1);
      expect(lastCall[1].subscriber_id).toBe('42');
    });
  });

  it('applies conversion_type filter', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('hillsborough'));

    const convSelect = screen.getAllByRole('combobox').find(
      s => s.querySelector('option[value="unlock"]')
    );
    await userEvent.selectOptions(convSelect, 'wallet');
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => {
      const lastCall = fetchMessageOutcomes.mock.calls.at(-1);
      expect(lastCall[1].conversion_type).toBe('wallet');
    });
  });
});

describe('SmsOutcomesDashboard — detail modal', () => {
  it('opens detail modal on row click', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    // hillsborough is unique to the table row
    await waitFor(() => screen.getByText('hillsborough'));
    await userEvent.click(screen.getByText('hillsborough'));
    await waitFor(() => expect(fetchMessageOutcomeDetail).toHaveBeenCalledWith(TOKEN, 10));
  });

  it('shows context_snapshot in detail modal', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('hillsborough'));
    await userEvent.click(screen.getByText('hillsborough'));
    await waitFor(() => screen.getByText(/context snapshot/i));
    expect(screen.getByText(/context snapshot/i)).toBeInTheDocument();
  });

  it('closes detail modal', async () => {
    render(<SmsOutcomesDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('hillsborough'));
    await userEvent.click(screen.getByText('hillsborough'));
    await waitFor(() => screen.getByRole('dialog'));
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
