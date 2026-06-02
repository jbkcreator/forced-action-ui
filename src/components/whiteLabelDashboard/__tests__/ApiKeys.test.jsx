/**
 * Vitest unit tests for the WL API Keys section.
 * Tests key generation UI, one-time display, copy button, and revocation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api/whiteLabelClient.js', () => ({
  wlGetApiKeys: vi.fn(),
  wlCreateApiKey: vi.fn(),
  wlRevokeApiKey: vi.fn(),
}));

vi.mock('../../../hooks/useApi.js', () => ({
  default: vi.fn(),
}));

vi.mock('../WLContext.jsx', () => ({
  useWLContext: () => ({ client: { plan_tier: 'standard' }, branding: null, isLoading: false }),
}));

import WLApiKeysSection from '../WLApiKeysSection.jsx';
import { wlCreateApiKey, wlRevokeApiKey } from '../../../api/whiteLabelClient.js';
import useApi from '../../../hooks/useApi.js';

const MOCK_KEYS = [
  { id: 1, key_prefix: 'fa_wl_a1b2', label: 'Production', is_active: true, requests_today: 42, total_requests: 1337, last_used_at: '2026-05-30T10:00:00Z' },
  { id: 2, key_prefix: 'fa_wl_c3d4', label: 'Old Key', is_active: false, requests_today: 0, total_requests: 55, last_used_at: null },
];

function renderSection() {
  return render(
    <MemoryRouter>
      <WLApiKeysSection />
    </MemoryRouter>
  );
}

describe('WLApiKeysSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApi.mockReturnValue({ data: MOCK_KEYS, loading: false, error: null, refetch: vi.fn() });
  });

  it('renders existing API keys', () => {
    renderSection();
    expect(screen.getByText('Production')).toBeDefined();
    expect(screen.getByText('fa_wl_a1b2…')).toBeDefined();
  });

  it('shows Active/Revoked status correctly', () => {
    renderSection();
    const activeElements = screen.getAllByText('Active');
    expect(activeElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Revoked')).toBeDefined();
  });

  it('opens generate key modal on button click', async () => {
    renderSection();
    fireEvent.click(screen.getByText('+ Generate Key'));
    await waitFor(() => {
      expect(screen.getByText('Generate API Key')).toBeDefined();
    });
  });

  it('calls wlCreateApiKey with label on form submit', async () => {
    wlCreateApiKey.mockResolvedValue({
      id: 3,
      key: 'fa_wl_' + 'x'.repeat(64),
      key_prefix: 'fa_wl_xxxx',
      label: 'Staging',
      is_active: true,
      created_at: '2026-05-30T12:00:00Z',
    });
    const refetch = vi.fn();
    useApi.mockReturnValue({ data: MOCK_KEYS, loading: false, error: null, refetch });

    renderSection();
    fireEvent.click(screen.getByText('+ Generate Key'));

    await waitFor(() => screen.getByText('Generate API Key'));

    const labelInput = screen.getByPlaceholderText('e.g. Production');
    fireEvent.change(labelInput, { target: { value: 'Staging' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(wlCreateApiKey).toHaveBeenCalledWith('Staging');
    });
  });

  it('shows generated key with copy button', async () => {
    const rawKey = 'fa_wl_' + 'a'.repeat(64);
    wlCreateApiKey.mockResolvedValue({
      id: 3, key: rawKey, key_prefix: 'fa_wl_aaaa',
      label: 'New', is_active: true, created_at: '2026-05-30T12:00:00Z',
    });
    useApi.mockReturnValue({ data: MOCK_KEYS, loading: false, error: null, refetch: vi.fn() });

    renderSection();
    fireEvent.click(screen.getByText('+ Generate Key'));
    await waitFor(() => screen.getByText('Generate API Key'));
    const labelInput = screen.getByPlaceholderText('e.g. Production');
    fireEvent.change(labelInput, { target: { value: 'New' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(screen.getByText(rawKey)).toBeDefined();
      expect(screen.getByText('Copy')).toBeDefined();
    });
  });

  it('calls wlRevokeApiKey when Revoke is clicked', async () => {
    wlRevokeApiKey.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useApi.mockReturnValue({ data: MOCK_KEYS, loading: false, error: null, refetch: vi.fn() });

    renderSection();
    const revokeBtn = screen.getByText('Revoke');
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(wlRevokeApiKey).toHaveBeenCalledWith(1);
    });
  });
});
