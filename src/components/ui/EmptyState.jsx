export default function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border border-white/10 mb-6">
        <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-slate-300 mb-2">No leads yet</p>
      <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
        Your feed populates as new distress signals are scraped nightly. Fresh leads are delivered every morning — check back tomorrow.
      </p>
    </div>
  );
}
