import ZipChecker from './ZipChecker';

export default function SoldOutVariant({ county_id, county_display_name }) {
  return (
    <div className="gradient-bg min-h-screen text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Sold Out</span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Some territory in {county_display_name} is full right now</h1>
          <p className="text-slate-400 text-lg">
            Check your ZIP — if it&apos;s open, claim it. If not, join the waitlist.
          </p>
        </div>
        <ZipChecker countyId={county_id} />
      </div>
    </div>
  );
}