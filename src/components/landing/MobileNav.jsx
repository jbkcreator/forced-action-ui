import { useState } from 'react';
import Icon from '../ui/Icon';

const NAV_LINKS = [
  { label: 'How It Works', href: 'how-it-works' },
  { label: 'Check ZIP', href: 'zip-check' },
  { label: 'Pricing', href: 'pricing' },
  { label: 'FAQ', href: 'faq' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  function scrollTo(id) {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-400 hover:text-white transition"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? (
          <Icon name="x-mark" size={24} />
        ) : (
          <Icon name="bars3" size={24} />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/[0.06] px-6 py-4 space-y-1 z-50">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left text-sm text-slate-300 hover:text-white font-medium py-2.5 px-2 rounded-lg hover:bg-white/5 transition"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
