import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EnrichmentHealthDashboard from './EnrichmentHealthDashboard';

vi.mock('../../api/admin', () => ({
  fetchEnrichmentHealth: vi.fn(),
}));

import { fetchEnrichmentHealth } from '../../api/admin';

const payload = {
  providers: [
    { provider: 'tracerfy', hit_rate: 0.41, floor: 0.2, sample_size: 220, degraded: false, skipped: false },
    { provider: 'batchdata', hit_rate: 0.0, floor: 0.02, sample_size: 56, degraded: true, skipped: false },
  ],
  recent_anomalies: [
    { provider: 'batchdata', detected_at: '2026-06-26T09:12:00Z', observed_hit_rate: 0.0, floor_hit_rate: 0.02, records_affected: 18 },
  ],
};

beforeEach(() => vi.resetAllMocks());

describe('EnrichmentHealthDashboard', () => {
  it('renders a row per provider', async () => {
    fetchEnrichmentHealth.mockResolvedValue(payload);
    render(<EnrichmentHealthDashboard token="tok" />);
    await waitFor(() => screen.getByText('tracerfy'));
    expect(screen.getByText('tracerfy')).toBeInTheDocument();
    // batchdata appears in both the providers row and the anomaly row.
    expect(screen.getAllByText('batchdata').length).toBeGreaterThanOrEqual(1);
  });

  it('flags the degraded provider as degraded', async () => {
    fetchEnrichmentHealth.mockResolvedValue(payload);
    render(<EnrichmentHealthDashboard token="tok" />);
    await waitFor(() => screen.getByText('tracerfy'));
    expect(screen.getByText(/degraded/i)).toBeInTheDocument();
  });

  it('renders recent anomaly rows', async () => {
    fetchEnrichmentHealth.mockResolvedValue(payload);
    render(<EnrichmentHealthDashboard token="tok" />);
    await waitFor(() => screen.getByText(/recent anomalies/i));
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('shows an error message on failure', async () => {
    fetchEnrichmentHealth.mockRejectedValue(new Error('boom'));
    render(<EnrichmentHealthDashboard token="tok" />);
    await waitFor(() => screen.getByText(/boom/i));
    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });
});
