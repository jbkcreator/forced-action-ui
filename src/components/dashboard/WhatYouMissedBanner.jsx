import Icon from '../ui/Icon';

const VERTICAL_LABEL = {
  roofing: 'roofing',
  restoration: 'restoration',
  public_adjuster: 'public adjuster',
  wholesalers: 'wholesale',
  fix_flip: 'fix & flip',
  attorneys: 'attorney',
};

export default function WhatYouMissedBanner({ whatYouMissed, onView }) {
  if (!whatYouMissed) return null;
  const { gold_count, top_zip, competing_viewers, vertical } = whatYouMissed;
  if (!gold_count || gold_count <= 0) return null;

  const verticalLabel = VERTICAL_LABEL[vertical] || vertical || 'qualified';

  return (
    <div
      data-testid="what-you-missed-banner"
      className="mb-4 rounded-xl border border-purple-400/40 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 p-5 flex items-center justify-between gap-4 flex-wrap"
    >
      <div className="min-w-0 flex items-start gap-3">
        <Icon name="eye-off" size={22} className="text-purple-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-bold text-base">
            You missed <span className="text-purple-200">{gold_count}</span> gold {verticalLabel} lead{gold_count === 1 ? '' : 's'} while you were away.
          </p>
          <p className="text-slate-300 text-xs mt-1 max-w-lg">
            All in <strong className="text-white">{top_zip}</strong>.
            {competing_viewers > 0 && (
              <> <span className="text-purple-200">{competing_viewers}</span> other operator{competing_viewers === 1 ? ' is' : 's are'} watching the same ZIP right now.</>
            )}
          </p>
        </div>
      </div>
      {onView && (
        <div className="shrink-0">
          <button
            type="button"
            onClick={onView}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/20 transition-all"
          >
            See the leads →
          </button>
        </div>
      )}
    </div>
  );
}
