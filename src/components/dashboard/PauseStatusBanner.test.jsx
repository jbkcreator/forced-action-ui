import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PauseStatusBanner from './PauseStatusBanner';

vi.mock('../../api/pause', () => ({
  resumeSubscription: vi.fn(),
}));

import { resumeSubscription } from '../../api/pause';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PauseStatusBanner', () => {
  it('re-enables button after successful resume', async () => {
    resumeSubscription.mockResolvedValue({ status: 'active' });
    const onResumed = vi.fn();
    render(<PauseStatusBanner feedUuid="feed-1" onResumed={onResumed} />);

    const btn = screen.getByRole('button', { name: /resume now/i });
    await userEvent.click(btn);

    // after full async settle, button must be re-enabled (finally block ran)
    expect(btn).not.toBeDisabled();
    expect(onResumed).toHaveBeenCalledWith({ status: 'active' });
  });

  it('re-enables button and shows error on failure', async () => {
    resumeSubscription.mockRejectedValue({ message: 'Network error' });
    render(<PauseStatusBanner feedUuid="feed-1" />);

    const btn = screen.getByRole('button', { name: /resume now/i });
    await userEvent.click(btn);

    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });

  it('shows auto-resume date when resumeAt provided', () => {
    render(<PauseStatusBanner feedUuid="feed-1" resumeAt="2025-07-01T00:00:00Z" />);
    expect(screen.getByText(/auto-resumes/i)).toBeInTheDocument();
  });
});
