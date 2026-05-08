import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PartnerZipPicker from './PartnerZipPicker';

vi.mock('../../hooks/useTerritoryMap', () => ({
  default: vi.fn(),
}));
vi.mock('../ui/LoadingSpinner', () => ({ default: () => <div>Loading…</div> }));
vi.mock('../ui/ErrorState', () => ({ default: ({ message }) => <div role="alert">{message}</div> }));

import useTerritoryMap from '../../hooks/useTerritoryMap';

describe('PartnerZipPicker', () => {
  it('shows loading spinner while loading', () => {
    useTerritoryMap.mockReturnValue({ zips: [], loading: true, error: null });
    render(<PartnerZipPicker countyId="123" vertical="roofing" selected={[]} onToggle={vi.fn()} max={5} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error state when hook returns error', () => {
    useTerritoryMap.mockReturnValue({ zips: [], loading: false, error: new Error('fail') });
    render(<PartnerZipPicker countyId="123" vertical="roofing" selected={[]} onToggle={vi.fn()} max={5} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load available ZIPs.');
  });

  it('renders ZIP chips when data loads', () => {
    useTerritoryMap.mockReturnValue({
      zips: [
        { zip: '33601', status: 'available' },
        { zip: '33602', status: 'locked' },
      ],
      loading: false,
      error: null,
    });
    render(<PartnerZipPicker countyId="123" vertical="roofing" selected={[]} onToggle={vi.fn()} max={5} />);
    expect(screen.getByRole('button', { name: /33601/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /33602/i })).toBeInTheDocument();
  });
});
