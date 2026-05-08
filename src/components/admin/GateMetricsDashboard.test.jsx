import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GateMetricsDashboard from './GateMetricsDashboard';

vi.mock('../../api/admin', () => ({
  fetchGateMetrics: vi.fn(),
  fetchKillSwitchStatus: vi.fn(),
  fetchDecisionAudit: vi.fn(),
}));

import { fetchGateMetrics, fetchKillSwitchStatus } from '../../api/admin';

const mockMetrics = (days) => ({
  graphs: [],
  top_block_reasons: [{ reason: 'gate_a', count: 42 }],
  days,
});

beforeEach(() => {
  vi.resetAllMocks();
  fetchKillSwitchStatus.mockResolvedValue({ features: [] });
});

describe('GateMetricsDashboard — top block reasons title', () => {
  it('shows "Top Block Reasons (1d)" when days=1', async () => {
    fetchGateMetrics.mockResolvedValue(mockMetrics(1));
    render(<GateMetricsDashboard token="tok" />);
    await waitFor(() => screen.getByText(/top block reasons \(1d\)/i));
    expect(screen.getByText(/top block reasons \(1d\)/i)).toBeInTheDocument();
  });

  it('updates title to "(30d)" when 30d selected', async () => {
    fetchGateMetrics
      .mockResolvedValueOnce(mockMetrics(1))
      .mockResolvedValueOnce(mockMetrics(30));

    render(<GateMetricsDashboard token="tok" />);
    await waitFor(() => screen.getByText(/top block reasons \(1d\)/i));

    await userEvent.click(screen.getByRole('button', { name: '30d' }));
    await waitFor(() => screen.getByText(/top block reasons \(30d\)/i));
    expect(screen.getByText(/top block reasons \(30d\)/i)).toBeInTheDocument();
  });
});
