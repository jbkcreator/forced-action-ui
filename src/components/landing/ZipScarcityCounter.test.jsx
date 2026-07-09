import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ZipScarcityCounter from './ZipScarcityCounter';

describe('ZipScarcityCounter', () => {
  it('renders "N of M ZIPs still open" from territory_availability', () => {
    render(<ZipScarcityCounter territoryAvailability={{ total_zips: 40, available_zips: 12, locked_zips: 28 }} />);
    expect(screen.getByText(/12 of 40 zips still open/i)).toBeInTheDocument();
  });

  it('renders nothing when territory_availability is null', () => {
    const { container } = render(<ZipScarcityCounter territoryAvailability={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
