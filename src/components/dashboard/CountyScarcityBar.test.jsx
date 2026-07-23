import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountyScarcityBar from './CountyScarcityBar';

vi.mock('../../api/scarcity', () => ({
  fetchCountyScarcity: vi.fn(),
}));

import { fetchCountyScarcity } from '../../api/scarcity';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('CountyScarcityBar', () => {
  it('renders real open/locked county counts', async () => {
    fetchCountyScarcity.mockResolvedValue({
      zip_code: '34619',
      zip_status: 'available',
      county_id: 'pinellas',
      county_name: 'Pinellas',
      vertical: 'roofing',
      open_count: 12,
      locked_count: 35,
      total_count: 47,
    });

    render(<CountyScarcityBar zip="34619" vertical="roofing" />);

    await waitFor(() =>
      expect(screen.getByText(/one of 12 open ZIPs/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Pinellas/)).toBeInTheDocument();
    expect(screen.getByText(/35 locked/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '35');
  });

  it('renders nothing when county has no territory', async () => {
    fetchCountyScarcity.mockResolvedValue({
      zip_code: '99999',
      open_count: 0,
      locked_count: 0,
      total_count: 0,
      county_name: 'Nowhere',
    });
    const { container } = render(<CountyScarcityBar zip="99999" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('fires onLockClick with the zip', async () => {
    fetchCountyScarcity.mockResolvedValue({
      zip_code: '34619',
      open_count: 3,
      locked_count: 10,
      total_count: 13,
      county_name: 'Pinellas',
    });
    const onLockClick = vi.fn();
    render(<CountyScarcityBar zip="34619" onLockClick={onLockClick} />);

    const btn = await screen.findByRole('button', { name: /lock 34619/i });
    await userEvent.click(btn);
    expect(onLockClick).toHaveBeenCalledWith('34619');
  });
});
