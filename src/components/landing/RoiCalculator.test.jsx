import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoiCalculator from './RoiCalculator';
import { computeRoi } from '../../config/verticals';

describe('computeRoi (locked math)', () => {
  it('roofing default: 20 leads * 2% * $12K = $4,800/mo', () => {
    const r = computeRoi({ leadsPerMonth: 20, closeRatePct: 2, dealValue: 12000 });
    expect(r.dealsPerMonth).toBeCloseTo(0.4);
    expect(r.monthlyEarnings).toBe(4800);
    expect(r.annualEarnings).toBe(57600);
  });

  it('public adjusters: fee = 10% of settlement', () => {
    const r = computeRoi({ leadsPerMonth: 20, closeRatePct: 2, dealValue: 50000, feePct: 10 });
    expect(r.earningsPerDeal).toBe(5000);
    expect(r.monthlyEarnings).toBe(2000);
  });

  it('returns zeros for invalid / negative input (no NaN)', () => {
    expect(computeRoi({ leadsPerMonth: -1, closeRatePct: 2, dealValue: 12000 }).monthlyEarnings).toBe(0);
    expect(computeRoi({ leadsPerMonth: 'x', closeRatePct: 2, dealValue: 1 }).monthlyEarnings).toBe(0);
  });
});

describe('RoiCalculator', () => {
  it('always shows the mandatory disclaimer', () => {
    render(<RoiCalculator />);
    expect(screen.getByTestId('roi-disclaimer')).toHaveTextContent(
      /illustrative estimate, not a guarantee/i,
    );
  });

  it('seeds the vertical from the `vertical` prop (VideoAsk seam)', () => {
    render(<RoiCalculator vertical="public_adjusters" />);
    expect(screen.getByLabelText(/your vertical/i)).toHaveValue('public_adjusters');
    // PA fee label surfaces the 10% fee
    expect(screen.getByText(/your fee = 10%/i)).toBeInTheDocument();
  });

  it('recomputes the live estimate when inputs change', () => {
    render(<RoiCalculator vertical="roofing" />);
    expect(screen.getByTestId('roi-monthly')).toHaveTextContent('$4,800');
    fireEvent.change(screen.getByLabelText(/leads worked/i), { target: { value: '40' } });
    expect(screen.getByTestId('roi-monthly')).toHaveTextContent('$9,600');
  });
});
