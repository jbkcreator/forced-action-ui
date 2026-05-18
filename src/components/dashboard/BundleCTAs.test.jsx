import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BundleCTAs from './BundleCTAs';

vi.mock('../../api/phase2b', () => ({
  logBusinessEvent: vi.fn(),
}));

describe('BundleCTAs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('disables Weekend Bundle outside the Friday-Sunday window', () => {
    vi.setSystemTime(new Date('2025-02-03T12:00:00Z'));

    render(
      <BundleCTAs
        feedUuid="feed-123"
        vertical="roofing"
        lockedZips={['33647']}
      />
    );

    expect(screen.getByText('Weekend Bundle').closest('button')).toBeDisabled();
    expect(screen.getByText('Available Friday through Sunday.')).toBeInTheDocument();
    expect(screen.getByText('$89/mo')).toBeInTheDocument();
  });

  it('disables ZIP-scoped bundles when there are no locked ZIPs and keeps Monthly Reload enabled', () => {
    vi.setSystemTime(new Date('2025-02-07T12:00:00Z'));

    render(
      <BundleCTAs
        feedUuid="feed-456"
        vertical="roofing"
        lockedZips={[]}
      />
    );

    expect(screen.getByText('Weekend Bundle').closest('button')).toBeDisabled();
    expect(screen.getByText('Storm Bundle').closest('button')).toBeDisabled();
    expect(screen.getByText('ZIP Booster').closest('button')).toBeDisabled();
    expect(screen.getByText('Monthly Reload').closest('button')).toBeEnabled();
    expect(screen.getAllByText('Requires a locked ZIP first.')).toHaveLength(3);
  });
});
