export default function ReactivateBanner({ onReactivate }) {
  return (
    <div className="mb-8 reactivate-pulse bg-red-950/40 border-2 border-red-500/30 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap animate-in">
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-red-300 text-base">Your subscription has been cancelled</p>
          <p className="text-sm text-slate-400 mt-0.5">Your access expires soon. Reactivate to keep your ZIP territories and founding rate.</p>
        </div>
      </div>
      <button
        onClick={onReactivate}
        className="shrink-0 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30"
      >
        Reactivate Subscription
      </button>
    </div>
  );
}
