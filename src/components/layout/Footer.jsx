import { theme } from '../../theme/ThemeProvider';

export default function Footer() {
  const { brand } = theme;

  return (
    <footer className="border-t border-white/[0.06] mt-20 px-6 pt-16 pb-10 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <span className="text-black font-black text-sm">{brand.shortName}</span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                {brand.name.split(' ')[0]} <span className="gradient-text">{brand.name.split(' ').slice(1).join(' ')}</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">{brand.footerTagline}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>14 Distress Signals</li>
              <li>CDS Scoring Engine</li>
              <li>Exclusive ZIP Territories</li>
              <li>Skip-Traced Contacts</li>
              <li>Daily Lead Delivery</li>
              <li><a href="/wins" className="hover:text-white transition">Recent contractor wins</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href={`mailto:${brand.supportEmail}`} className="hover:text-white transition">{brand.supportEmail}</a></li>
              <li>{brand.location}, FL</li>
              <li className="text-slate-600 pt-2 text-xs">Expanding to more counties soon</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs">&copy; {brand.copyright}</p>
          <p className="text-slate-600 text-xs">{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
