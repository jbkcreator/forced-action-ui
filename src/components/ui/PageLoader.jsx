export default function PageLoader({ visible }) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-fa-bg-base transition-opacity duration-200 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-8 h-8 border-2 border-white/10 border-t-yellow-400 rounded-full animate-spin" />
    </div>
  );
}
