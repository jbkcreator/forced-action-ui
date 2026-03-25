export default function Button({ variant = 'primary', className = '', disabled, children, ...props }) {
  const base = 'font-bold rounded-xl transition-all duration-200';

  const variants = {
    primary: 'btn-primary bg-yellow-400 hover:bg-yellow-300 text-black',
    secondary: 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]',
    gradient: 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
    ghost: 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
