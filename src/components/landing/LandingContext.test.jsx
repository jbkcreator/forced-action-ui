import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LandingProvider, useLanding } from './LandingContext';

vi.mock('../../api/client', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { api } from '../../api/client';

function AttrProbe() {
  const { attribution } = useLanding();
  return (
    <div data-testid="probe">{JSON.stringify(attribution)}</div>
  );
}

function DashboardProbe() {
  return <div data-testid="dashboard">DASHBOARD</div>;
}

function renderAt(initialPath, ui) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard/:feedUuid" element={<DashboardProbe />} />
        <Route path="*" element={<LandingProvider>{ui}</LandingProvider>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  api.post.mockResolvedValue({});
});

describe('LandingContext attribution capture', () => {
  it('captures signup_source + utm_* + campaign_id from URL', async () => {
    renderAt(
      '/?signup_source=dbpr_email&utm_source=dbpr&utm_campaign=q2&campaign_id=DBPR-Q2',
      <AttrProbe />,
    );
    await waitFor(() => {
      const json = JSON.parse(screen.getByTestId('probe').textContent || '{}');
      expect(json.signupSource).toBe('dbpr_email');
      expect(json.utmSource).toBe('dbpr');
      expect(json.utmCampaign).toBe('q2');
      expect(json.campaignId).toBe('DBPR-Q2');
    });
  });

  it('defaults to landing_page when no params present', async () => {
    renderAt('/', <AttrProbe />);
    await waitFor(() => {
      const json = JSON.parse(screen.getByTestId('probe').textContent || '{}');
      expect(json.signupSource).toBe('landing_page');
    });
  });

  it('treats ?ref=XYZ as referral source', async () => {
    renderAt('/?ref=ABC123', <AttrProbe />);
    await waitFor(() => {
      const json = JSON.parse(screen.getByTestId('probe').textContent || '{}');
      expect(json.signupSource).toBe('referral');
      expect(json.referralCode).toBe('ABC123');
    });
  });

  it('rejects unknown signup_source values to "unknown"... actually falls back to landing_page when no referral', async () => {
    renderAt('/?signup_source=facebook_ad', <AttrProbe />);
    await waitFor(() => {
      const json = JSON.parse(screen.getByTestId('probe').textContent || '{}');
      // not in the allow-list AND no referral_code → landing_page default
      expect(json.signupSource).toBe('landing_page');
    });
  });

  it('persists attribution to sessionStorage', async () => {
    renderAt('/?signup_source=lifecycle_sms', <AttrProbe />);
    await waitFor(() => {
      const stored = JSON.parse(sessionStorage.getItem('fa.attribution') || '{}');
      expect(stored.signupSource).toBe('lifecycle_sms');
    });
  });

  it('fires LANDING_PAGE_VIEWED business event on mount', async () => {
    renderAt('/?signup_source=dbpr_email', <AttrProbe />);
    await waitFor(() => {
      const calls = api.post.mock.calls.filter(
        (c) => c[0] === '/api/business-event',
      );
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][1]).toMatchObject({ event_type: 'LANDING_PAGE_VIEWED' });
    });
  });
});

describe('LandingContext signed-token resolve', () => {
  it('POSTs token to /api/landing/resolve-token and navigates to dashboard', async () => {
    api.post.mockImplementation((path) => {
      if (path === '/api/landing/resolve-token') {
        return Promise.resolve({ feed_uuid: 'abc-uuid', subscriber_id: 7, signup_source: 'missed_call' });
      }
      return Promise.resolve({});
    });

    renderAt('/?signup_source=missed_call&token=fake.signed.token', <AttrProbe />);

    await waitFor(
      () => expect(screen.queryByTestId('dashboard')).toBeInTheDocument(),
      { timeout: 2000 },
    );

    const resolveCall = api.post.mock.calls.find(
      (c) => c[0] === '/api/landing/resolve-token',
    );
    expect(resolveCall).toBeDefined();
    expect(resolveCall[1]).toEqual({ token: 'fake.signed.token' });
  });

  it('silently ignores invalid token and continues with landing flow', async () => {
    api.post.mockImplementation((path) => {
      if (path === '/api/landing/resolve-token') {
        return Promise.reject({ detail: { error: 'invalid_or_expired_token' } });
      }
      return Promise.resolve({});
    });

    renderAt('/?signup_source=missed_call&token=bad', <AttrProbe />);

    // Probe should still be rendered (no redirect happened)
    await waitFor(() => {
      expect(screen.getByTestId('probe')).toBeInTheDocument();
    });
    // Dashboard route should NOT have been reached
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});
