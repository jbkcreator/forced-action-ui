import { useState } from 'react';

const FAQS = [
  {
    q: 'What if my ZIP code is already taken?',
    a: "Each ZIP is exclusive per vertical. If yours is taken, you can join the waitlist and we'll notify you the moment it opens up. You can also check neighboring ZIPs — most contractors work across multiple territories.",
  },
  {
    q: 'How fresh are the leads?',
    a: 'Data is scraped nightly from county records, FEMA declarations, permit databases, and insurance filings. New leads land in your feed by 7 AM every morning, scored and ranked.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no long-term contracts. Cancel anytime from your dashboard. If you cancel within the first 30 days, you get a full refund.',
  },
  {
    q: 'What is the CDS score?',
    a: 'The Composite Distress Score (CDS) ranks every property from 0–100 across 14 distress signals — storm damage, permit activity, insurance claims, code violations, and more. Higher scores mean higher likelihood of needing your services.',
  },
  {
    q: "What's the founding rate?",
    a: 'Founding members get a permanently discounted rate that never increases, even as we raise prices. Once all 30 founding spots per vertical fill, new subscribers pay the regular rate.',
  },
  {
    q: 'What verticals do you support?',
    a: 'Roofing, Restoration, Public Adjusters, Wholesalers, Fix & Flip, and Attorneys. Each vertical gets its own scoring model optimized for that industry\'s lead signals.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">FAQ</span>
        <h2 className="text-3xl sm:text-4xl font-bold">Common Questions</h2>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="glass-card rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.q}</span>
              <svg
                className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className="grid transition-all duration-200"
              style={{ gridTemplateRows: openIndex === i ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
