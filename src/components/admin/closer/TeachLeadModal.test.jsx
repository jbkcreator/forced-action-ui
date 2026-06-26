import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeachLeadModal from './TeachLeadModal';

const LEAD = {
  property_id: 1234,
  address: '1234 Elm St',
  cds_score: 71,
  lead_tier: 'Gold',
  signals: ['foreclosures', 'tax_delinquencies'],
};

function setup(props = {}) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<TeachLeadModal lead={LEAD} onSubmit={onSubmit} onClose={onClose} {...props} />);
  return { onSubmit, onClose };
}

describe('TeachLeadModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the lead address and score', () => {
    setup();
    expect(screen.getByText('1234 Elm St')).toBeInTheDocument();
    expect(screen.getByText(/Gold/)).toBeInTheDocument();
  });

  it('blocks submit with no reason selected', async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/pick a reason/i);
  });

  it('submits a non_residential correction with subject_id', async () => {
    const { onSubmit } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'non_residential');
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      subject_id: 1234,
      correction_reason: 'non_residential',
    });
  });

  it('shows signal picker only for wrong_distress', async () => {
    setup();
    expect(screen.queryByLabelText(/which signal/i)).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'wrong_distress');
    expect(screen.getByLabelText(/which signal/i)).toBeInTheDocument();
  });

  it('constrains signal options to the lead’s signals', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'wrong_distress');
    const picker = screen.getByLabelText(/which signal/i);
    // 2 lead signals + the placeholder option
    expect(picker.querySelectorAll('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Foreclosure' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tax delinquency' })).toBeInTheDocument();
  });

  it('blocks wrong_distress submit without a signal', async () => {
    const { onSubmit } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'wrong_distress');
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/which signal/i);
  });

  it('submits wrong_distress with signal_type', async () => {
    const { onSubmit } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'wrong_distress');
    await userEvent.selectOptions(screen.getByLabelText(/which signal/i), 'foreclosures');
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      subject_id: 1234,
      correction_reason: 'wrong_distress',
      signal_type: 'foreclosures',
    });
  });

  it('includes a trimmed note when provided', async () => {
    const { onSubmit } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'bad_contact');
    await userEvent.type(screen.getByLabelText(/note/i), '  phone disconnected  ');
    await userEvent.click(screen.getByRole('button', { name: /apply correction/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      subject_id: 1234,
      correction_reason: 'bad_contact',
      note: 'phone disconnected',
    });
  });

  it('disables submit for wrong_distress when lead has no signals', async () => {
    setup({ lead: { ...LEAD, signals: [] } });
    await userEvent.selectOptions(screen.getByLabelText(/what.s wrong/i), 'wrong_distress');
    expect(screen.getByText(/no recorded signals/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply correction/i })).toBeDisabled();
  });

  it('calls onClose from the Cancel button', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
