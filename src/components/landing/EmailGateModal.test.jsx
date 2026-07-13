import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmailGateModal from './EmailGateModal';

vi.mock('../ui/Modal', () => ({
  default: ({ isOpen, children }) => isOpen ? <div>{children}</div> : null,
  ModalClose: ({ onClick }) => <button onClick={onClick}>×</button>,
}));

describe('EmailGateModal — free-signup success state', () => {
  it('shows a "check your email" screen instead of the form when successEmail is set', () => {
    render(
      <EmailGateModal isOpen onClose={vi.fn()} onProceed={vi.fn()} successEmail="test@example.com" />
    );

    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('you@example.com')).not.toBeInTheDocument();
  });

  it('renders the normal email form when successEmail is absent', () => {
    render(<EmailGateModal isOpen onClose={vi.fn()} onProceed={vi.fn()} />);

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it('calls onClose when dismissing the success screen', () => {
    const onClose = vi.fn();
    render(
      <EmailGateModal isOpen onClose={onClose} onProceed={vi.fn()} successEmail="test@example.com" />
    );

    fireEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
