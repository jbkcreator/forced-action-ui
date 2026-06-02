import { useState } from 'react';
import { useWLContext } from './WLContext.jsx';
import { wlUpdateAccount, wlUploadLogo } from '../../api/whiteLabelClient.js';

const VERTICAL_OPTIONS = ['roofing', 'restoration', 'wholesalers', 'fix_flip', 'attorneys', 'public_adjusters'];
const COUNTY_OPTIONS = ['hillsborough', 'pinellas', 'pasco', 'polk', 'manatee'];

export default function WLSettingsSection() {
  const { client, refreshClient } = useWLContext();
  const [displayName, setDisplayName] = useState(client?.display_name || '');
  const [primaryColor, setPrimaryColor] = useState(client?.primary_color || '#fbbf24');
  const [secondaryColor, setSecondaryColor] = useState(client?.secondary_color || '#a855f7');
  const [counties, setCounties] = useState(client?.counties_enabled || []);
  const [verticals, setVerticals] = useState(client?.verticals_enabled || []);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(client?.logo_url || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function toggleItem(list, setList, item) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      if (logoFile) {
        await wlUploadLogo(logoFile);
        setLogoFile(null);
      }
      await wlUpdateAccount({
        display_name: displayName || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        counties_enabled: counties.length ? counties : null,
        verticals_enabled: verticals.length ? verticals : null,
      });
      await refreshClient();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-fa-text-primary mb-6">Settings</h2>

      <div className="max-w-xl space-y-6">
        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Display name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder={client?.company_name}
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary" />
          <p className="text-xs text-fa-text-muted mt-1">Shown in reports and the dashboard header.</p>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-2">Logo</label>
          <div className="flex items-center gap-4">
            {logoPreview && <img src={logoPreview} alt="Logo" className="h-12 object-contain border border-fa-border-default rounded p-1" />}
            <label className="bg-fa-bg-card border border-fa-border-default rounded-lg px-4 py-2 text-sm text-fa-text-secondary cursor-pointer hover:bg-fa-bg-base">
              {logoPreview ? 'Change logo' : 'Upload logo'}
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-fa-text-muted mt-1">PNG or SVG, max 5 MB. Appears in PDF reports and the dashboard header.</p>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Primary color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
              <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="flex-1 bg-fa-bg-card border border-fa-border-default rounded px-2 py-1.5 text-fa-text-primary text-sm font-mono focus:outline-none focus:border-fa-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
              <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                className="flex-1 bg-fa-bg-card border border-fa-border-default rounded px-2 py-1.5 text-fa-text-primary text-sm font-mono focus:outline-none focus:border-fa-primary" />
            </div>
          </div>
        </div>

        {/* Counties */}
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-2">Enabled counties</label>
          <div className="flex flex-wrap gap-2">
            {COUNTY_OPTIONS.map(c => (
              <button key={c} type="button" onClick={() => toggleItem(counties, setCounties, c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  counties.includes(c) ? 'bg-fa-primary/20 border-fa-primary text-fa-primary' : 'border-fa-border-default text-fa-text-muted hover:border-fa-border-emphasis'
                }`}>
                {c}
              </button>
            ))}
          </div>
          <p className="text-xs text-fa-text-muted mt-1">Your account will only see leads from these counties.</p>
        </div>

        {/* Verticals */}
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-2">Enabled verticals</label>
          <div className="flex flex-wrap gap-2">
            {VERTICAL_OPTIONS.map(v => (
              <button key={v} type="button" onClick={() => toggleItem(verticals, setVerticals, v)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                  verticals.includes(v) ? 'bg-fa-primary/20 border-fa-primary text-fa-primary' : 'border-fa-border-default text-fa-text-muted hover:border-fa-border-emphasis'
                }`}>
                {v.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button onClick={handleSave} disabled={saving}
          className="bg-fa-primary text-fa-bg-base font-bold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
