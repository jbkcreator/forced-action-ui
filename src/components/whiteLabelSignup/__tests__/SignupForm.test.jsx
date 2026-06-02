/**
 * Vitest unit tests for the WL signup flow.
 * Tests form validation and API call sequence.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock the API module
vi.mock('../../../api/whiteLabelClient.js', () => ({
  wlSignup: vi.fn(),
  wlCreateCheckout: vi.fn(),
}));

import WLSignupPage from '../../../pages/WLSignupPage.jsx';
import { wlSignup } from '../../../api/whiteLabelClient.js';

function renderSignup() {
  return render(
    <MemoryRouter>
      <WLSignupPage />
    </MemoryRouter>
  );
}

describe('WLSignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 company info form', () => {
    renderSignup();
    expect(screen.getByText('Company information')).toBeDefined();
    expect(screen.getByPlaceholderText(/company/i) || screen.getAllByRole('textbox')).toBeTruthy();
  });

  it('rejects short passwords', async () => {
    renderSignup();
    const inputs = screen.getAllByRole('textbox');
    // Fill company name, admin name, email
    fireEvent.change(inputs[0], { target: { value: 'Acme Corp' } });
    fireEvent.change(inputs[1], { target: { value: 'Jane Smith' } });
    fireEvent.change(inputs[2], { target: { value: 'jane@acme.com' } });

    // Find password input
    const pwInput = document.querySelector('input[type="password"]');
    fireEvent.change(pwInput, { target: { value: 'short' } });

    fireEvent.click(screen.getByText(/Continue/));

    await waitFor(() => {
      expect(screen.getByText(/at least 8/i)).toBeDefined();
    });
    expect(wlSignup).not.toHaveBeenCalled();
  });

  it('progresses to step 2 on valid step 1', async () => {
    renderSignup();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Acme Corp' } });
    fireEvent.change(inputs[1], { target: { value: 'Jane Smith' } });
    fireEvent.change(inputs[2], { target: { value: 'jane@acme.com' } });
    const pwInput = document.querySelector('input[type="password"]');
    fireEvent.change(pwInput, { target: { value: 'validpassword123' } });

    fireEvent.click(screen.getByText(/Continue/));

    await waitFor(() => {
      expect(screen.getByText('Brand your dashboard')).toBeDefined();
    });
  });

  it('calls wlSignup on final step submission', async () => {
    wlSignup.mockResolvedValue({ client_id: 99, message: 'Account created.' });

    renderSignup();
    // Step 1
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Test Corp' } });
    fireEvent.change(inputs[1], { target: { value: 'Admin' } });
    fireEvent.change(inputs[2], { target: { value: 'admin@test.com' } });
    const pwInput = document.querySelector('input[type="password"]');
    fireEvent.change(pwInput, { target: { value: 'mypassword123' } });
    fireEvent.click(screen.getByText(/Continue/));

    // Step 2
    await waitFor(() => screen.getByText('Brand your dashboard'));
    fireEvent.click(screen.getByText(/Continue/));

    // Step 3 — plan selection
    await waitFor(() => screen.getByText('Choose your plan'));
    fireEvent.click(screen.getByText(/Create account/));

    await waitFor(() => {
      expect(wlSignup).toHaveBeenCalledWith(
        'Test Corp', 'Admin', 'admin@test.com', 'mypassword123', 'standard'
      );
    });
  });

  it('shows success state after signup', async () => {
    wlSignup.mockResolvedValue({ client_id: 99, message: 'Account created.' });

    renderSignup();
    // Complete all steps (abbreviated)
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'My Co' } });
    fireEvent.change(inputs[1], { target: { value: 'Me' } });
    fireEvent.change(inputs[2], { target: { value: 'me@myco.com' } });
    const pwInput = document.querySelector('input[type="password"]');
    fireEvent.change(pwInput, { target: { value: 'password456' } });
    fireEvent.click(screen.getByText(/Continue/));
    await waitFor(() => screen.getByText('Brand your dashboard'));
    fireEvent.click(screen.getByText(/Continue/));
    await waitFor(() => screen.getByText('Choose your plan'));
    fireEvent.click(screen.getByText(/Create account/));

    await waitFor(() => {
      expect(screen.getByText(/Check your email/)).toBeDefined();
    });
  });
});
