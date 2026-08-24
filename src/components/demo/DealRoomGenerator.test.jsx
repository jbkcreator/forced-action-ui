import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../api/dealRoom', () => ({
  createDemoDealRoom: vi.fn(),
}));

import { createDemoDealRoom } from '../../api/dealRoom';
import DealRoomGenerator from './DealRoomGenerator';

const TOKEN = 'demo-tok';

async function fillAndSubmit() {
  await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Jane Roofer');
  await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'jane@example.com');
  await userEvent.type(screen.getByPlaceholderText('33601'), '33601');
  await userEvent.type(screen.getByPlaceholderText('5000'), '5000');
  await userEvent.type(screen.getByPlaceholderText('20'), '20');
  await userEvent.click(screen.getByRole('button', { name: /generate deal room/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DealRoomGenerator', () => {
  it('shows the 422 inventory-gate message as an inline ZIP error', async () => {
    const err = { status: 422, detail: { error: 'insufficient_leads', message: 'Only 2 qualified leads available for this ZIP/vertical combination' } };
    createDemoDealRoom.mockRejectedValue(err);

    render(<DealRoomGenerator token={TOKEN} onUnauthorized={vi.fn()} />);
    await fillAndSubmit();

    expect(await screen.findByText(err.detail.message)).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });

  it('falls back to a default message when a dict-detail error has none', async () => {
    createDemoDealRoom.mockRejectedValue({ status: 400, detail: { error: 'vertical_mismatch' } });

    render(<DealRoomGenerator token={TOKEN} onUnauthorized={vi.fn()} />);
    await fillAndSubmit();

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });

  it('still renders the generated links on success', async () => {
    createDemoDealRoom.mockResolvedValue({
      deal_room_url: 'https://example.com/deal-room/abc',
      prefilled_checkout_url: 'https://example.com/?hold=abc',
    });

    render(<DealRoomGenerator token={TOKEN} onUnauthorized={vi.fn()} />);
    await fillAndSubmit();

    expect(await screen.findByText('https://example.com/deal-room/abc')).toBeInTheDocument();
  });
});
