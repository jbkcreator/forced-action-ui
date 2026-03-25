import { theme } from '../../theme/ThemeProvider';

export default function ErrorState({ message }) {
  return (
    <div className="text-center py-24">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-slate-300 mb-2">Unable to load your feed</p>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        {message || <>Something went wrong on our end. If this persists, contact{' '}
        <a href={`mailto:${theme.brand.supportEmail}`} className="text-yellow-400/80 hover:text-yellow-400 underline underline-offset-2 transition-colors">
          {theme.brand.supportEmail}
        </a></>}
      </p>
    </div>
  );
}
