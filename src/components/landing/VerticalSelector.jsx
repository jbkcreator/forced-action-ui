import { VERTICAL_LABELS, VERTICAL_ICONS } from '../../config/constants';
import { useLanding } from './LandingContext';
import Icon from '../ui/Icon';

export default function VerticalSelector() {
  const { selectedVertical, setSelectedVertical } = useLanding();

  return (
    <div className="flex flex-wrap justify-center gap-2.5 mb-12 animate-fade-in-up delay-400" role="group" aria-label="Select your vertical">
      {Object.entries(VERTICAL_LABELS).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setSelectedVertical(key)}
          aria-pressed={selectedVertical === key}
          className={`vertical-btn border border-white/[0.12] rounded-full px-5 py-2.5 text-sm font-medium text-slate-300 flex items-center gap-2 ${
            selectedVertical === key ? 'active' : ''
          }`}
        >
          <Icon name={VERTICAL_ICONS[key]} size={16} className="text-current" /> {label}
        </button>
      ))}
    </div>
  );
}
