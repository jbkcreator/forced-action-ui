import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminContext } from '../adminContext';
import LeadDeliverySection from './LeadDeliverySection';

vi.mock('../../../api/deliveries', () => ({ fetchDeliveries: vi.fn() }));
import { fetchDeliveries } from '../../../api/deliveries';

const ROW_A = {
  delivery_id: 1, property_id: 970489, account_id: 'acc-aaa', company_name: 'Acme Roofing',
  grade: 'Gold', vertical: 'roofing', status: 'delivered', rejection_reason: null,
  rejected_at: null, billing_period_end: null, delivered_at: '2099-06-12T00:00:00+00:00',
  source: 'sweep',
};
const ROW_B = {
  delivery_id: 2, property_id: 970490, account_id: 'acc-bbb', company_name: 'BuildRight',
  grade: 'Bronze', vertical: 'roofing', status: 'rejected', rejection_reason: 'disconnected',
  rejected_at: '2099-06-13T00:00:00+00:00', billing_period_end: null,
  delivered_at: '2099-06-10T00:00:00+00:00', source: 'sweep',
};

function envelope(items, extra = {}) {
  return { total: items.length, limit: 50, offset: 0, items, ...extra };
}

function renderSection(entries = ['/admin/deliveries']) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <AdminContext.Provider value={{ token: 'tok' }}>
        <LeadDeliverySection />
      </AdminContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('LeadDeliverySection — display', () => {
  it('renders a row per delivery with contractor, grade and status', async () => {
    fetchDeliveries.mockResolvedValue(envelope([ROW_A, ROW_B]));
    renderSection();

    await waitFor(() => screen.getByText('Acme Roofing'));
    expect(screen.getByText('Acme Roofing')).toBeInTheDocument();
    expect(screen.getByText('BuildRight')).toBeInTheDocument();
    // scope to table cells — "Gold"/"Rejected" also appear as filter <option>s
    expect(screen.getByRole('cell', { name: 'Gold' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Rejected' })).toBeInTheDocument();
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    fetchDeliveries.mockResolvedValue(envelope([]));
    renderSection();
    await waitFor(() => screen.getByText(/no leads match/i));
    expect(screen.getByText(/no leads match/i)).toBeInTheDocument();
  });

  it('shows the error detail with a Retry on failure', async () => {
    fetchDeliveries.mockRejectedValue({ status: 500, detail: 'kaboom' });
    renderSection();
    await waitFor(() => screen.getByText(/kaboom/i));
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows a session-expired message on 401', async () => {
    fetchDeliveries.mockRejectedValue({ status: 401, detail: 'Not authenticated' });
    renderSection();
    await waitFor(() => screen.getByText(/session expired/i));
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
  });
});

describe('LeadDeliverySection — interaction', () => {
  it('refetches with the status param when the Status filter changes', async () => {
    fetchDeliveries.mockResolvedValue(envelope([ROW_A]));
    renderSection();
    await waitFor(() => screen.getByText('Acme Roofing'));

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'rejected');

    await waitFor(() => {
      expect(fetchDeliveries.mock.calls.at(-1)[1].status).toBe('rejected');
    });
  });

  it('paginates: Next advances the offset and shows the range/count', async () => {
    fetchDeliveries.mockResolvedValue(envelope([ROW_A, ROW_B], { total: 120 }));
    renderSection();
    await waitFor(() => screen.getByText(/1–50 of 120/));

    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(fetchDeliveries.mock.calls.at(-1)[1].offset).toBe(50);
    });
    expect(screen.getByText(/51–100 of 120/)).toBeInTheDocument();
  });

  it('clicking a contractor filters to that account', async () => {
    fetchDeliveries.mockResolvedValue(envelope([ROW_A]));
    renderSection();
    await waitFor(() => screen.getByText('Acme Roofing'));

    await userEvent.click(screen.getByRole('button', { name: 'Acme Roofing' }));

    await waitFor(() => {
      expect(fetchDeliveries.mock.calls.at(-1)[1].account_id).toBe('acc-aaa');
    });
  });

  it('reads account_id from the URL on first load (deep-link)', async () => {
    fetchDeliveries.mockResolvedValue(envelope([ROW_A]));
    renderSection(['/admin/deliveries?account_id=acc-xyz']);
    await waitFor(() => screen.getByText('Acme Roofing'));
    expect(fetchDeliveries.mock.calls[0][1].account_id).toBe('acc-xyz');
  });
});
