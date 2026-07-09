import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CountyForm } from './CountyManagementDashboard';

describe('CountyForm — Task 8 landing fields', () => {
  it('starts with one empty testimonial row and submits it', () => {
    const onSave = vi.fn();
    render(<CountyForm initial={{ county_id: 'hillsborough', display_name: 'Hillsborough County' }} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/testimonial 1 quote/i), { target: { value: 'Closed 2 jobs in a week.' } });
    fireEvent.change(screen.getByLabelText(/testimonial 1 name/i), { target: { value: 'Sarah M.' } });
    fireEvent.change(screen.getByLabelText(/founding price deadline/i), { target: { value: '2026-08-01T00:00' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const payload = onSave.mock.calls[0][0];
    expect(payload.landing_featured_testimonials).toEqual([{ quote: 'Closed 2 jobs in a week.', name: 'Sarah M.' }]);
    expect(payload.founding_price_deadline_at).toBe(new Date('2026-08-01T00:00').toISOString());
  });

  it('sends an empty list and null deadline when fields are left blank', () => {
    const onSave = vi.fn();
    render(<CountyForm initial={{ county_id: 'pasco', display_name: 'Pasco County' }} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const payload = onSave.mock.calls[0][0];
    expect(payload.landing_featured_testimonials).toEqual([]);
    expect(payload.founding_price_deadline_at).toBeNull();
  });

  it('adds another testimonial row and submits both in order', () => {
    const onSave = vi.fn();
    render(<CountyForm initial={{ county_id: 'hillsborough', display_name: 'Hillsborough County' }} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/testimonial 1 quote/i), { target: { value: 'First quote.' } });
    fireEvent.click(screen.getByRole('button', { name: /add testimonial/i }));
    fireEvent.change(screen.getByLabelText(/testimonial 2 quote/i), { target: { value: 'Second quote.' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const payload = onSave.mock.calls[0][0];
    expect(payload.landing_featured_testimonials).toEqual([
      { quote: 'First quote.' },
      { quote: 'Second quote.' },
    ]);
  });

  it('removes a testimonial row', () => {
    const onSave = vi.fn();
    render(<CountyForm initial={{ county_id: 'hillsborough', display_name: 'Hillsborough County' }} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/testimonial 1 quote/i), { target: { value: 'First quote.' } });
    fireEvent.click(screen.getByRole('button', { name: /add testimonial/i }));
    fireEvent.change(screen.getByLabelText(/testimonial 2 quote/i), { target: { value: 'Second quote.' } });
    fireEvent.click(screen.getByRole('button', { name: /remove testimonial 1/i }));

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const payload = onSave.mock.calls[0][0];
    expect(payload.landing_featured_testimonials).toEqual([{ quote: 'Second quote.' }]);
  });

  it('pre-fills existing testimonials from initial county data', () => {
    render(<CountyForm
      initial={{
        county_id: 'hillsborough',
        display_name: 'Hillsborough County',
        landing_featured_testimonials: [
          { quote: 'Existing quote.', name: 'Existing Name' },
        ],
      }}
      onSave={vi.fn()}
      onCancel={vi.fn()}
    />);

    expect(screen.getByLabelText(/testimonial 1 quote/i)).toHaveValue('Existing quote.');
    expect(screen.getByLabelText(/testimonial 1 name/i)).toHaveValue('Existing Name');
  });
});
