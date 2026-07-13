import { useEffect, useRef, useState } from 'react';

const AUTO_ADVANCE_MS = 6000;

export default function FeaturedTestimonial({ testimonials }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials?.length || 0;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;

  const goNext = () => setIndex((i) => (i + 1) % count);
  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const current = testimonials[index];
  const { quote, name, role, company, outcome_label } = current;
  const initial = name?.trim()?.[0]?.toUpperCase() || '★';

  return (
    <section
      className="max-w-3xl mx-auto px-6 py-16"
      aria-label="Featured success stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">
          Success Story
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          What our members are saying
        </h2>
      </div>

      <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 card-glow px-8 py-10 text-center">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-slate-900 font-black text-lg shadow-lg shadow-yellow-400/20"
          aria-hidden="true"
        >
          &ldquo;
        </div>

        {count > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center"
          >
            ‹
          </button>
        )}
        {count > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next testimonial"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center"
          >
            ›
          </button>
        )}

        {outcome_label && (
          <p className="text-yellow-300 text-sm font-bold mb-3">{outcome_label}</p>
        )}
        <p className="text-white text-xl md:text-2xl font-medium italic leading-snug mb-6">
          &ldquo;{quote}&rdquo;
        </p>

        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-yellow-300 font-bold text-sm">
            {initial}
          </div>
          <p className="text-slate-400 text-sm text-left">
            <span className="text-white font-semibold">{name}</span>
            {role && `, ${role}`}
            {company && (
              <>
                <br className="md:hidden" />
                <span className="md:before:content-['_·_']">{company}</span>
              </>
            )}
          </p>
        </div>

        {count > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === index ? 'bg-yellow-400' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
