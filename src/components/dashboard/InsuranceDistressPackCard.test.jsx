import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InsuranceDistressPackCard from './InsuranceDistressPackCard';

describe('InsuranceDistressPackCard', () => {
  it('renders nothing when there are no qualifying zips', () => {
    const { container } = render(
      <InsuranceDistressPackCard zips={[]} amount={29900} currency="usd" onBuy={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per qualifying zip with the count and premium price', () => {
    render(
      <InsuranceDistressPackCard
        zips={[{ zip_code: '33601', count: 7 }]}
        amount={29900}
        currency="usd"
        onBuy={vi.fn()}
      />
    );
    expect(screen.getByText(/7 storm-damaged flips in 33601/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy pack \$299/i })).toBeInTheDocument();
  });

  it('calls onBuy with the zip code when clicked', async () => {
    const onBuy = vi.fn();
    render(
      <InsuranceDistressPackCard
        zips={[{ zip_code: '33601', count: 7 }]}
        amount={29900}
        currency="usd"
        onBuy={onBuy}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /buy pack/i }));
    expect(onBuy).toHaveBeenCalledWith('33601');
  });
});
