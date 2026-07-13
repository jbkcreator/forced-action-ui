import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FeaturedTestimonial from './FeaturedTestimonial';

const testimonials = [
  { quote: 'We closed two jobs in the first week.', name: 'Sarah M.', company: 'Tampa Roofing Co.' },
  { quote: 'Best ROI of any lead source.', name: 'Mike T.', company: 'Gulf Coast Restoration' },
  { quote: 'Paid for itself in month one.', name: 'Dana K.', company: 'Bay Adjusters' },
];

describe('FeaturedTestimonial', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the first testimonial and a heading', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    expect(screen.getByText(/we closed two jobs/i)).toBeInTheDocument();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders nothing when testimonials is null or empty', () => {
    const { container: c1 } = render(<FeaturedTestimonial testimonials={null} />);
    expect(c1).toBeEmptyDOMElement();
    const { container: c2 } = render(<FeaturedTestimonial testimonials={[]} />);
    expect(c2).toBeEmptyDOMElement();
  });

  it('renders a single card with no carousel controls when only one testimonial is given', () => {
    render(<FeaturedTestimonial testimonials={[testimonials[0]]} />);
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('advances to the next testimonial when the next arrow is clicked', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/best roi/i)).toBeInTheDocument();
  });

  it('wraps back to the first testimonial from the last via next', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/we closed two jobs/i)).toBeInTheDocument();
  });

  it('goes to the previous testimonial (wrapping to the last) via the prev arrow', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/paid for itself/i)).toBeInTheDocument();
  });

  it('jumps to a testimonial when its dot indicator is clicked', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    fireEvent.click(screen.getByRole('button', { name: /go to testimonial 3/i }));
    expect(screen.getByText(/paid for itself/i)).toBeInTheDocument();
  });

  it('auto-advances to the next testimonial after the interval', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(screen.getByText(/best roi/i)).toBeInTheDocument();
  });

  it('pauses auto-advance while hovered', () => {
    render(<FeaturedTestimonial testimonials={testimonials} />);
    const region = screen.getByLabelText(/featured success stories/i);
    fireEvent.mouseEnter(region);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText(/we closed two jobs/i)).toBeInTheDocument();
  });
});
