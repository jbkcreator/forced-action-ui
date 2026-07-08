import { useRef, useState } from 'react';
import { importFounderPortfolio } from '../../api/admin';

// Template the founder fills in Excel and exports as CSV.
const TEMPLATE_HEADER =
  'parcel_id,address,city,zip,deal_date,profit_amount,outcome,vertical,days_to_close,notes';
const TEMPLATE_EXAMPLE =
  ',123 Main St,Tampa,33607,2024-03-14,18500,won,fix_flip,21,example BRRRR deal';
const TEMPLATE_CSV = `${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE}\n`;
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`;

export default function FounderImportCard({ token, onLogout = () => {} }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  function handleFile(f) {
    if (!f || !f.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!file) { setError('Please select a CSV file'); return; }
    setLoading(true);
    try {
      const data = await importFounderPortfolio(token, file);
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      if (err.status === 401) { onLogout(); return; }
      setError(err.detail || 'Import failed — check server logs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div
        className="rounded-2xl p-7"
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-white">Founder Portfolio Import</p>
          <a
            href={TEMPLATE_HREF}
            download="founder_deals_template.csv"
            className="text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
          >
            Download template
          </a>
        </div>

        {error && (
          <div role="alert" className="mb-5 text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="mb-5 rounded-xl p-4 bg-emerald-950/40 border border-emerald-800/40">
            <p className="text-sm font-semibold text-emerald-300 mb-3">
              Import complete — {result.matched} matched of {result.matched + (result.unmatched?.length || 0)} rows
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Imported', value: result.imported, color: 'emerald' },
                { label: 'Updated', value: result.updated, color: 'yellow' },
                { label: 'Unmatched', value: result.unmatched?.length || 0, color: 'red' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-lg p-3 text-center bg-${color}-900/30 border border-${color}-800/30`}>
                  <div className={`text-2xl font-bold text-${color}-300`}>{value ?? 0}</div>
                  <div className={`text-xs text-${color}-600 mt-0.5`}>{label}</div>
                </div>
              ))}
            </div>

            {result.unmatched?.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-red-300 cursor-pointer">
                  {result.unmatched.length} unmatched (no confident parcel — reconcile &amp; re-upload)
                </summary>
                <ul className="mt-2 text-xs text-slate-400 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.unmatched.map((u, i) => (
                    <li key={i}>
                      {u.identifier}
                      {u.best_confidence != null && ` (best match ${u.best_confidence}%)`}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {result.errors?.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-amber-300 cursor-pointer">
                  {result.errors.length} rows rejected (bad data)
                </summary>
                <ul className="mt-2 text-xs text-slate-400 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <li key={i}>row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className="cursor-pointer rounded-xl px-6 py-8 text-center transition-colors"
            style={{
              border: `2px dashed ${dragging ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.12)'}`,
              background: dragging ? 'rgba(250,204,21,0.04)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="text-yellow-300 text-sm font-medium">
                {file.name}
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                <span className="text-yellow-400 font-medium">Choose file</span> or drag &amp; drop —{' '}
                <code className="text-slate-500">.csv</code> from the template
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {loading ? 'Importing…' : 'Import Founder Deals'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-600">
          Loads the founder&apos;s deals as the highest-trust calibration layer. Each row must match a
          known parcel (parcel-id or address); unmatched rows are reported for reconciliation, never
          guessed. Re-uploading a corrected file updates in place.
        </p>
      </div>
    </div>
  );
}
