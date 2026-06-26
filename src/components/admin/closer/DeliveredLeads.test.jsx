import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../api/closer', () => ({
  fetchDeliveredLeads: vi.fn(),
  createTeachingCorrection: vi.fn(),
  deleteTeachingCorrection: vi.fn(),
}));

import {
  fetchDeliveredLeads,
  createTeachingCorrection,
  deleteTeachingCorrection,
} from '../../../api/closer';
import DeliveredLeads from './DeliveredLeads';

const TOKEN = 'tok';
const SUB = 42;

const LEADS = [
  { property_id: 1, address: '1234 Elm St', cds_score: 71, lead_tier: 'Gold',
    signals: ['foreclosures'], active_corrections: [] },
  { property_id: 2, address: '88 Oak Ave', cds_score: 44, lead_tier: 'Silver',
    signals: [], active_corrections: [
      { id: 9, correction_reason: 'non_residential', signal_type: null },
    ] },
];

function listResp(items = LEADS) {
  return { subscriber_id: SUB, count: items.length, items };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchDeliveredLeads.mockResolvedValue(listResp());
  createTeachingCorrection.mockResolvedValue({ id: 100 });
  deleteTeachingCorrection.mockResolvedValue({ id: 9 });
});

describe('DeliveredLeads', () => {
  it('fetches and renders delivered leads', async () => {
    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={vi.fn()} />);
    await waitFor(() => screen.getByText('1234 Elm St'));
    expect(screen.getByText('88 Oak Ave')).toBeInTheDocument();
    expect(fetchDeliveredLeads).toHaveBeenCalledWith(TOKEN, SUB);
  });

  it('shows existing active corrections as a Taught tag', async () => {
    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={vi.fn()} />);
    await waitFor(() => screen.getByText(/Taught/));
    expect(screen.getByText(/non_residential/)).toBeInTheDocument();
  });

  it('shows empty state when no leads', async () => {
    fetchDeliveredLeads.mockResolvedValue(listResp([]));
    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={vi.fn()} />);
    await waitFor(() => screen.getByText(/no leads delivered/i));
  });

  it('opens the Teach modal and submits a correction', async () => {
    const showToast = vi.fn();
    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={showToast} />);
    await waitFor(() => screen.getByText('1234 Elm St'));

    await userEvent.click(screen.getAllByRole('button', { name: /^teach$/i })[0]);
    await waitFor(() => screen.getByRole('dialog'));

    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'non_residential');
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));

    await waitFor(() => expect(createTeachingCorrection).toHaveBeenCalledWith(TOKEN, {
      subject_id: 1,
      correction_reason: 'non_residential',
    }));
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/rescored/i));
    // refetched after submit
    expect(fetchDeliveredLeads).toHaveBeenCalledTimes(2);
  });

  it('surfaces a 409 duplicate as a toast', async () => {
    const showToast = vi.fn();
    const err = new Error('correction already active');
    err.status = 409;
    createTeachingCorrection.mockRejectedValue(err);

    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={showToast} />);
    await waitFor(() => screen.getByText('1234 Elm St'));
    await userEvent.click(screen.getAllByRole('button', { name: /^teach$/i })[0]);
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'non_residential');
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(
      expect.stringMatching(/already active/i), 'error',
    ));
  });

  it('undoes an active correction', async () => {
    const showToast = vi.fn();
    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={showToast} />);
    await waitFor(() => screen.getByText(/Taught/));

    await userEvent.click(screen.getByRole('button', { name: /undo correction/i }));

    await waitFor(() => expect(deleteTeachingCorrection).toHaveBeenCalledWith(TOKEN, 9));
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/undone/i));
  });

  it('renders an error when the fetch fails', async () => {
    fetchDeliveredLeads.mockRejectedValue(new Error('boom'));
    render(<DeliveredLeads token={TOKEN} subscriberId={SUB} showToast={vi.fn()} />);
    await waitFor(() => screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });
});
