import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmsVariantPerformanceDashboard from './SmsVariantPerformanceDashboard';

vi.mock('../../api/admin', () => ({
  fetchSmsVariantPerformance: vi.fn(),
}));

import { fetchSmsVariantPerformance } from '../../api/admin';

const TOKEN = 'test-token';

const PERF_ROWS = [
  {
    prompt_version: 'v3', total_sent: 500, total_delivered: 490, total_replied: 60,
    total_clicked: 20, total_converted: 12, reply_rate_pct: '12.00', conversion_rate_pct: '2.40',
    avg_revenue_signal_score: '68.50', total_revenue_attributed: '3000.00',
  },
  {
    prompt_version: 'v2', total_sent: 300, total_delivered: 295, total_replied: 24,
    total_clicked: 8, total_converted: 4, reply_rate_pct: '8.00', conversion_rate_pct: '1.33',
    avg_revenue_signal_score: '55.20', total_revenue_attributed: '800.00',
  },
];

function perfResponse(rows = PERF_ROWS) {
  return { data: rows, group_by: 'prompt_version' };
}

beforeEach(() => {
  vi.resetAllMocks();
  fetchSmsVariantPerformance.mockResolvedValue(perfResponse());
});

describe('SmsVariantPerformanceDashboard — rendering', () => {
  it('renders grouped rows with reply and conversion rates', async () => {
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('v3'));
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('shows empty state when no data returned', async () => {
    fetchSmsVariantPerformance.mockResolvedValue({ data: [], group_by: 'prompt_version' });
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/no data/i));
  });

  it('shows error state when API fails', async () => {
    fetchSmsVariantPerformance.mockRejectedValue(new Error('Failed'));
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText(/failed/i));
  });
});

describe('SmsVariantPerformanceDashboard — group_by selector', () => {
  it('defaults to prompt_version group_by', async () => {
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await waitFor(() => {
      expect(fetchSmsVariantPerformance).toHaveBeenCalledWith(
        TOKEN,
        expect.objectContaining({ groupBy: 'prompt_version' }),
        expect.anything(),
      );
    });
  });

  it('reloads with new group_by when Load is clicked after changing selector', async () => {
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('v3'));

    await userEvent.selectOptions(screen.getByRole('combobox'), 'trade_vertical');
    fetchSmsVariantPerformance.mockResolvedValue({ data: [], group_by: 'trade_vertical' });
    await userEvent.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      const lastCall = fetchSmsVariantPerformance.mock.calls.at(-1);
      expect(lastCall[1].groupBy).toBe('trade_vertical');
    });
  });

  it('passes date range when set', async () => {
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await waitFor(() => screen.getByText('v3'));

    const [fromInput, toInput] = screen.getAllByDisplayValue('');
    const dateInputs = screen.getAllByDisplayValue('');
    await userEvent.type(dateInputs[0], '2026-05-01');
    await userEvent.type(dateInputs[1], '2026-05-31');
    await userEvent.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      const lastCall = fetchSmsVariantPerformance.mock.calls.at(-1);
      expect(lastCall[1].dateFrom).toBeTruthy();
    });
  });
});

describe('SmsVariantPerformanceDashboard — compound group_by', () => {
  it('renders compound group label correctly', async () => {
    fetchSmsVariantPerformance.mockResolvedValue({
      data: [
        {
          template_id: 'tmpl_1', variant_id: 'var_a',
          total_sent: 100, total_delivered: 98, total_replied: 10, total_clicked: 5,
          total_converted: 3, reply_rate_pct: '10.00', conversion_rate_pct: '3.00',
          avg_revenue_signal_score: '65.00', total_revenue_attributed: '750.00',
        },
      ],
      group_by: 'template_id,variant_id',
    });
    await userEvent.setup();
    render(<SmsVariantPerformanceDashboard token={TOKEN} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'template_id,variant_id');
    await userEvent.click(screen.getByRole('button', { name: /load/i }));
    await waitFor(() => screen.getByText('tmpl_1 / var_a'));
    expect(screen.getByText('tmpl_1 / var_a')).toBeInTheDocument();
  });
});
