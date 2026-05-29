import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CountyLanding from '../pages/CountyLanding';
import { getCountyLanding, fetchPricing } from '../api/landing';
import { LandingProvider } from '../components/landing/LandingContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/landing');

describe('CountyLanding page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchPricing.mockResolvedValue({ pricing: {} });
  });

  it('renders ComingSoonVariant for queued county', async () => {
    getCountyLanding.mockResolvedValue({
      county_id: 'pinellas',
      county_display_name: 'Pinellas',
      waitlist_type: 'coming_soon',
      zip_count: 47,
      vertical_waitlist_counts: { roofing: 5 },
    });

    render(
      <MemoryRouter initialEntries={['/landing/pinellas']}>
        <LandingProvider>
          <CountyLanding />
        </LandingProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pinellas is opening soon/i)).toBeTruthy();
    });
  });

  it('renders SoldOutVariant for launched county with taken ZIPs', async () => {
    getCountyLanding.mockResolvedValue({
      county_id: 'hillsborough',
      county_display_name: 'Hillsborough',
      waitlist_type: 'sold_out',
      zip_count: 12,
      vertical_waitlist_counts: { roofing: 10 },
    });

    render(
      <MemoryRouter initialEntries={['/landing/hillsborough']}>
        <LandingProvider>
          <CountyLanding />
        </LandingProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Some territory in Hillsborough is full/i)).toBeTruthy();
    });
  });

  it('renders NotFoundPage for 404 response', async () => {
    const error = new Error('Not found');
    error.status = 404;
    getCountyLanding.mockRejectedValue(error);

    render(
      <MemoryRouter initialEntries={['/landing/unknown']}>
        <LandingProvider>
          <CountyLanding />
        </LandingProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Page Not Found/i)).toBeTruthy();
    });
  });
});