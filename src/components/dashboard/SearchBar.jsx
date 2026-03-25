import Icon from '../ui/Icon';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        placeholder="Search by address, city, or ZIP..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
          aria-label="Clear search"
        >
          <Icon name="x-mark" size={16} />
        </button>
      )}
    </div>
  );
}
