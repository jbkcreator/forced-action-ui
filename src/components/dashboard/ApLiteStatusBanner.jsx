import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

export default function ApLiteStatusBanner({ autoModeEnabled, manualActionsThisWeek }) {
  const automated = autoModeEnabled === true;
  const stillManual = Number(manualActionsThisWeek || 0);

  return (
    <div className="mb-4 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0 flex items-start gap-3">
        <Icon name="zap" size={22} className="text-cyan-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-bold text-base flex items-center gap-2">
            AutoPilot Lite is active
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                automated
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
              }`}
              data-testid="ap-lite-automode-pill"
            >
              {automated ? 'Auto Mode ON' : 'Auto Mode OFF'}
            </span>
          </p>
          <p className="text-slate-300 text-xs mt-1 max-w-md">
            Auto skip, auto text, voicemail drops, and 3-touch sequences run for you.{' '}
            {stillManual > 0 ? (
              <>You still did <strong className="text-white">{stillManual}</strong> manual action{stillManual === 1 ? '' : 's'} this week — AP Lite handled the rest.</>
            ) : (
              <>Nothing manual logged this week — AP Lite is doing the work.</>
            )}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <Link
          to="../settings"
          relative="path"
          className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700 text-white text-sm rounded-lg border border-slate-600 inline-block"
        >
          Automation settings →
        </Link>
      </div>
    </div>
  );
}
