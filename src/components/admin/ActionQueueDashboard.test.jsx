import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ActionQueueDashboard from './ActionQueueDashboard';

vi.mock('../../api/admin', () => ({
  fetchActionQueue: vi.fn(),
}));

import { fetchActionQueue } from '../../api/admin';

const TOKEN = 'test-token';

const APPROVAL_ROW = {
  type: 'approval', source: 'cora', category: 'legal', lane: 'approvals',
  id: 1, title: 'feature_killed: tracerfy match_rate', subtitle: 'feature_killed · degraded provider',
  severity: 'red', created_at: '2026-07-21T04:00:00Z',
  amount_cents: null, county_id: 'hillsborough', action_url: '/admin/cora?tab=incidents',
};

const FAILURE_ROW = {
  type: 'source_failure', source: 'scraper', category: 'source', lane: 'failures',
  id: 20, title: 'zero_records: court_docket', subtitle: 'hillsborough',
  severity: 'red', created_at: '2026-07-21T09:20:00Z',
  amount_cents: null, county_id: 'hillsborough', action_url: '/admin/scrapers',
};

function queueResponse({ approvals = [], failures = [] } = {}) {
  return {
    approvals, failures,
    counts: {
      approvals: approvals.length, failures: failures.length,
      cora_approvals_waiting: approvals.filter(a => a.category === 'legal').length,
      source_failures: failures.filter(f => f.source === 'scraper').length,
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  fetchActionQueue.mockResolvedValue(queueResponse());
});

describe('ActionQueueDashboard — approvals lane', () => {
  it('renders an approval row title', async () => {
    fetchActionQueue.mockResolvedValue(queueResponse({ approvals: [APPROVAL_ROW] }));
    render(<ActionQueueDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/feature_killed: tracerfy match_rate/i));
  });
});

describe('ActionQueueDashboard — failures lane', () => {
  it('renders a failure row title under the Failures section, separate from Approvals', async () => {
    fetchActionQueue.mockResolvedValue(
      queueResponse({ approvals: [APPROVAL_ROW], failures: [FAILURE_ROW] })
    );
    render(<ActionQueueDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/zero_records: court_docket/i));

    expect(screen.getByText(/approvals/i)).toBeInTheDocument();
    expect(screen.getByText(/failures/i)).toBeInTheDocument();
  });
});

describe('ActionQueueDashboard — empty states', () => {
  it('shows a per-lane empty message when a lane has no rows', async () => {
    fetchActionQueue.mockResolvedValue(queueResponse({ approvals: [APPROVAL_ROW], failures: [] }));
    render(<ActionQueueDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/feature_killed: tracerfy match_rate/i));
    expect(screen.getByText(/nothing pending/i)).toBeInTheDocument();
  });

  it('shows "All clear" when both lanes are empty', async () => {
    fetchActionQueue.mockResolvedValue(queueResponse());
    render(<ActionQueueDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/all clear/i));
  });
});

describe('ActionQueueDashboard — deep links', () => {
  it('links an approval row to its action_url', async () => {
    fetchActionQueue.mockResolvedValue(queueResponse({ approvals: [APPROVAL_ROW] }));
    render(<ActionQueueDashboard token={TOKEN} />);
    const link = await screen.findByRole('link', { name: /feature_killed: tracerfy match_rate/i });
    expect(link).toHaveAttribute('href', '/admin/cora?tab=incidents');
  });
});

describe('ActionQueueDashboard — error state', () => {
  it('shows an error message when the fetch fails', async () => {
    fetchActionQueue.mockRejectedValue(new Error('Network error'));
    render(<ActionQueueDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/network error/i));
  });
});
