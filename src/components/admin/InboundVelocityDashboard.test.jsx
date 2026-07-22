import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InboundVelocityDashboard from './InboundVelocityDashboard';

vi.mock('../../api/admin', () => ({
  fetchInboundVelocity: vi.fn(),
}));

import { fetchInboundVelocity } from '../../api/admin';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('InboundVelocityDashboard', () => {
  it('renders stats when hot inbounds exist', async () => {
    fetchInboundVelocity.mockResolvedValue({
      total: 10, called: 6, consent_blocked: 2, dnc_blocked: 1, failed: 1,
      p50_seconds: 45, p95_seconds: 90, hot_callback_rate: 0.6,
    });
    render(<InboundVelocityDashboard token="tok" />);
    await waitFor(() => screen.getByText('10'));
    expect(screen.getByText('45s')).toBeInTheDocument();
    expect(screen.getByText('90s')).toBeInTheDocument();
    expect(screen.getByText('60.0% rate')).toBeInTheDocument();
  });

  it('shows empty state when no hot inbounds', async () => {
    fetchInboundVelocity.mockResolvedValue({
      total: 0, called: 0, consent_blocked: 0, dnc_blocked: 0, failed: 0,
      p50_seconds: null, p95_seconds: null, hot_callback_rate: 0.0,
    });
    render(<InboundVelocityDashboard token="tok" />);
    await waitFor(() => screen.getByText(/no hot inbound calls recorded/i));
    expect(screen.getByText(/no hot inbound calls recorded/i)).toBeInTheDocument();
  });

  it('shows error on fetch failure', async () => {
    fetchInboundVelocity.mockRejectedValue({ detail: 'boom' });
    render(<InboundVelocityDashboard token="tok" />);
    await waitFor(() => screen.getByText('boom'));
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
