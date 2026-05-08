import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapZipPopup from './MapZipPopup';

const baseZip = { zip: '33601', status: 'available', lead_count: 5, active_viewers: 0 };
const lockedZip = { zip: '33602', status: 'locked' };

describe('MapZipPopup', () => {
  it('shows "Lock this ZIP" button for available ZIP', () => {
    render(<MapZipPopup zip={baseZip} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /lock this zip/i })).toBeInTheDocument();
  });

  it('shows "Close" button (not "Join waitlist") for locked ZIP', () => {
    render(<MapZipPopup zip={lockedZip} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^close$/i })).toBeInTheDocument();
    expect(screen.queryByText(/waitlist/i)).not.toBeInTheDocument();
  });

  it('calls onClose when Close clicked on locked ZIP', async () => {
    const onClose = vi.fn();
    render(<MapZipPopup zip={lockedZip} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onSelect with the full zip object when Lock is clicked (consumer must extract .zip)', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<MapZipPopup zip={baseZip} onClose={onClose} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /lock this zip/i }));
    expect(onSelect).toHaveBeenCalledWith(baseZip);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
