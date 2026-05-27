import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoraIncidentsDashboard from './CoraIncidentsDashboard';

vi.mock('../../api/admin', () => ({
  fetchCoraIncidents:       vi.fn(),
  fetchCoraIncidentDetail:  vi.fn(),
  acknowledgeCoraIncident:  vi.fn(),
  resolveCoraIncident:      vi.fn(),
}));

import {
  fetchCoraIncidents, fetchCoraIncidentDetail,
  acknowledgeCoraIncident, resolveCoraIncident,
} from '../../api/admin';

const TOKEN = 'test-token';

const OPEN_INCIDENT = {
  id: 1, metric_name: 'reply_rate', feature_name: 'fomo_graph',
  county_id: 'hillsborough', severity: 'yellow',
  observed_value: '0.0400', threshold_value: '0.0500', baseline_value: '0.1000',
  breach_started: '2026-05-01T10:00:00Z', breach_resolved: null,
  duration_hours: null, action_taken: 'no_op', action_details: null,
  updated_at: '2026-05-01T10:00:00Z',
};

const RESOLVED_INCIDENT = {
  ...OPEN_INCIDENT, id: 2, breach_resolved: '2026-05-02T10:00:00Z',
  duration_hours: 24, action_taken: 'resolved',
};

function listResponse(incidents = [OPEN_INCIDENT]) {
  return { data: incidents, total: incidents.length, limit: 50, offset: 0 };
}

beforeEach(() => {
  vi.resetAllMocks();
  fetchCoraIncidents.mockResolvedValue(listResponse());
  fetchCoraIncidentDetail.mockResolvedValue({ ...OPEN_INCIDENT });
  acknowledgeCoraIncident.mockResolvedValue({ id: 1, action_taken: 'human_escalated', upgraded: true, action_details: {} });
  resolveCoraIncident.mockResolvedValue({ id: 1, action_taken: 'resolved', breach_resolved: '2026-05-02T10:00:00Z', duration_hours: 24, action_details: {} });
});

describe('CoraIncidentsDashboard — list rendering', () => {
  it('renders the incidents table with metric_name', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('reply_rate'));
    expect(screen.getByText('reply_rate')).toBeInTheDocument();
  });

  it('shows "Open" for unresolved incidents', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('Open'));
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows empty state when no incidents returned', async () => {
    fetchCoraIncidents.mockResolvedValue(listResponse([]));
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/no cora incidents found/i));
  });

  it('shows error state when API fails', async () => {
    fetchCoraIncidents.mockRejectedValue(new Error('Network error'));
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/network error/i));
  });
});

describe('CoraIncidentsDashboard — filters', () => {
  it('passes open_only=true when checkbox is checked', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('reply_rate'));

    const checkbox = screen.getByRole('checkbox', { name: /open only/i });
    await userEvent.click(checkbox);
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => {
      const lastCall = fetchCoraIncidents.mock.calls.at(-1);
      expect(lastCall[1].open_only).toBe(true);
    });
  });

  it('passes severity filter when set', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('reply_rate'));

    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'red');
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => {
      const lastCall = fetchCoraIncidents.mock.calls.at(-1);
      expect(lastCall[1].severity).toBe('red');
    });
  });

  it('clears all filters on Clear click', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('reply_rate'));

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    await waitFor(() => {
      const lastCall = fetchCoraIncidents.mock.calls.at(-1);
      expect(lastCall[1].severity).toBeFalsy();
      expect(lastCall[1].open_only).toBeFalsy();
    });
  });
});

describe('CoraIncidentsDashboard — acknowledge action', () => {
  it('calls acknowledgeCoraIncident with correct id and notes', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getAllByRole('button', { name: /ack/i }));

    await userEvent.click(screen.getAllByRole('button', { name: /ack/i })[0]);

    const noteInput = await screen.findByPlaceholderText(/investigating/i);
    await userEvent.type(noteInput, 'Looking into this');

    await userEvent.click(screen.getByRole('button', { name: /^acknowledge$/i }));

    await waitFor(() => {
      expect(acknowledgeCoraIncident).toHaveBeenCalledWith(
        TOKEN, 1,
        expect.objectContaining({ notes: 'Looking into this', acknowledged_by: 'admin' }),
      );
    });
  });

  it('shows success message after acknowledge', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getAllByRole('button', { name: /ack/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /ack/i })[0]);
    await userEvent.click(await screen.findByRole('button', { name: /^acknowledge$/i }));
    await waitFor(() => screen.getByText(/acknowledged/i));
  });
});

describe('CoraIncidentsDashboard — resolve action', () => {
  it('calls resolveCoraIncident with correct id', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getAllByRole('button', { name: /resolve/i }));

    await userEvent.click(screen.getAllByRole('button', { name: /resolve/i })[0]);
    await userEvent.click(await screen.findByRole('button', { name: /confirm resolve/i }));

    await waitFor(() => {
      expect(resolveCoraIncident).toHaveBeenCalledWith(
        TOKEN, 1,
        expect.objectContaining({ resolved_by: 'admin' }),
      );
    });
  });

  it('shows success message after resolve', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getAllByRole('button', { name: /resolve/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /resolve/i })[0]);
    await userEvent.click(await screen.findByRole('button', { name: /confirm resolve/i }));
    // success message: "Incident #1 resolved." — use the # to distinguish from the "resolved" option text
    await waitFor(() => screen.getByText(/incident #1 resolved/i));
  });
});

describe('CoraIncidentsDashboard — detail modal', () => {
  it('opens detail modal on row click and shows metric_name', async () => {
    render(<CoraIncidentsDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('reply_rate'));
    await userEvent.click(screen.getAllByText('reply_rate')[0]);
    await waitFor(() => screen.getByText(/incident detail/i));
    expect(fetchCoraIncidentDetail).toHaveBeenCalledWith(TOKEN, 1);
  });
});
