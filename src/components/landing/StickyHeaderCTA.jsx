import { useState, useEffect } from 'react';

export default function StickyHeaderCTA({ targetRef }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!targetRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );

    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [targetRef]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-yellow-400/95 to-amber-500/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
        <span className="text-black text-sm font-bold hidden sm:block">Founding rates are filling fast</span>
        <span className="text-black text-xs font-bold sm:hidden">Limited founding spots</span>
        <a
          href="#pricing"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-black text-yellow-400 text-sm font-bold px-5 py-1.5 rounded-full hover:bg-gray-900 transition"
        >
          Claim Founding Rate &rarr;
        </a>
      </div>
    </div>
  );
}
