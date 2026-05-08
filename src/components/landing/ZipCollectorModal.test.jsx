import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ZipCollectorModal from './ZipCollectorModal';

vi.mock('./LandingContext', () => ({
  useLanding: () => ({ selectedVertical: 'roofing', countyId: 'hillsborough' }),
}));
vi.mock('../../api/landing', () => ({
  fetchZipAvailability: vi.fn().mockResolvedValue({ zips: [] }),
}));
vi.mock('../ui/Modal', () => ({
  default: ({ isOpen, children }) => isOpen ? <div>{children}</div> : null,
  ModalClose: ({ onClick }) => <button onClick={onClick}>×</button>,
}));

const zipObj = { zip: '33601', status: 'available', active_viewers: 0, lead_count: 5 };

describe('ZipCollectorModal', () => {
  it('does not crash when initialZip is a full ZIP object (regression: error #31)', () => {
    expect(() =>
      render(
        <ZipCollectorModal
          isOpen
          initialZip={zipObj}
          tier="starter"
          onClose={vi.fn()}
          onProceed={vi.fn()}
        />
      )
    ).not.toThrow();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    expect(screen.getByText('33601')).toBeInTheDocument();
  });

  it('renders the zip code string chip when initialZip is a plain string', () => {
    render(
      <ZipCollectorModal
        isOpen
        initialZip="33602"
        tier="starter"
        onClose={vi.fn()}
        onProceed={vi.fn()}
      />
    );
    expect(screen.getByText('33602')).toBeInTheDocument();
  });
});
