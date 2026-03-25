export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-white/10 border-t-yellow-400 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}
