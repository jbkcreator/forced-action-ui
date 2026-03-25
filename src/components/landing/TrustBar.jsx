import { TRUST_STATS } from '../../config/constants';

export default function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-12 animate-fade-in-up delay-300">
      {TRUST_STATS.map((stat, i) => (
        <span key={i} className="contents">
          {i > 0 && <span className="w-1 h-1 bg-yellow-400/40 rounded-full hidden sm:block" />}
          <span className="text-base text-slate-400 font-medium">
            {stat.label && <>{stat.label} </>}
            <span className="text-white font-semibold">{stat.value}</span>
            {stat.suffix && <> {stat.suffix}</>}
          </span>
        </span>
      ))}
    </div>
  );
}
