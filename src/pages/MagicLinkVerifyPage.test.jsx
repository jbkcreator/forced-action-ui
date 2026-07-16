import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MagicLinkVerifyPage from './MagicLinkVerifyPage';

const navigate = vi.fn();
const verifyMagicLink = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../hooks/useSubscriberAuth.js', () => ({
  default: () => ({ verifyMagicLink }),
}));

describe('MagicLinkVerifyPage routing', () => {
  beforeEach(() => {
    navigate.mockReset();
    verifyMagicLink.mockReset();
  });

  it('routes investor signups to the deal-intake hook after verification', async () => {
    verifyMagicLink.mockResolvedValue({
      feed_uuid: 'feed-investor',
      vertical: 'investor',
    });

    render(
      <MemoryRouter initialEntries={['/auth/verify?token=abc']}>
        <MagicLinkVerifyPage />
      </MemoryRouter>
    );

    await screen.findByText(/You're signed in!/i);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/deals/submit?feed_uuid=feed-investor');
    }, { timeout: 2500 });
  });

  it('keeps non-investor signups on the generic feed route', async () => {
    verifyMagicLink.mockResolvedValue({
      feed_uuid: 'feed-roofing',
      vertical: 'roofing',
    });

    render(
      <MemoryRouter initialEntries={['/auth/verify?token=abc']}>
        <MagicLinkVerifyPage />
      </MemoryRouter>
    );

    await screen.findByText(/You're signed in!/i);
    fireEvent.click(screen.getByRole('button', { name: /continue to feed/i }));

    expect(navigate).toHaveBeenCalledWith('/dashboard/feed-roofing');
  });
});