import { useRef, useState } from 'react';
import { uploadVoterRegistry } from '../../api/admin';

const ACCEPTED = ['.csv', '.txt', '.zip'];

export default function VoterUploadCard({ token, onLogout = () => {}, hideHeader = true }) {
  const [countyId, setCountyId] = useState('hillsborough');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  function handleFile(f) {
    if (!f || !ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext))) {
      setError('Please select a .csv, .txt, or .zip file');
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

    if (!file) { setError('Please select a voter file'); return; }

    setLoading(true);
    try {
      const data = await uploadVoterRegistry(token, file, countyId);
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      if (err.status === 401) { onLogout(); return; }
      setError(err.detail || 'Upload failed — check server logs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
            <div>
              <p className="font-bold text-white leading-none">Data Upload</p>
              <p className="text-xs text-slate-500 mt-0.5">Voter Registry</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors">Sign out</button>
        </div>
      )}

      <div
        className="rounded-2xl p-7"
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {error && (
          <div role="alert" className="mb-5 text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="mb-5 rounded-xl p-4 bg-emerald-950/40 border border-emerald-800/40">
            <p className="text-sm font-semibold text-emerald-300 mb-3">
              Upload complete — {result.total_rows?.toLocaleString()} rows processed
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Inserted', value: result.inserted, color: 'emerald' },
                { label: 'Updated', value: result.updated, color: 'yellow' },
                { label: 'Quarantined', value: result.quarantined, color: 'red' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-lg p-3 text-center bg-${color}-900/30 border border-${color}-800/30`}>
                  <div className={`text-2xl font-bold text-${color}-300`}>{value?.toLocaleString()}</div>
                  <div className={`text-xs text-${color}-600 mt-0.5`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="voter-upload-county" className="block text-xs text-slate-400 mb-1.5">County ID</label>
            <input
              id="voter-upload-county"
              type="text"
              value={countyId}
              onChange={e => setCountyId(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label htmlFor="voter-upload-file" className="block text-xs text-slate-400 mb-1.5">Voter File</label>
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
                id="voter-upload-file"
                ref={fileRef}
                type="file"
                accept=".csv,.txt,.zip"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <div className="inline-flex items-center gap-2 text-yellow-300 text-sm font-medium mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {file.name}
                  </div>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-400">
                    <span className="text-yellow-400 font-medium">Choose file</span> or drag & drop
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    SOE export <code className="text-slate-500">.csv</code> /{' '}
                    <code className="text-slate-500">.txt</code> /{' '}
                    <code className="text-slate-500">.zip</code> — format auto-detected
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {loading ? 'Processing…' : 'Upload & Process'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-600">
          Accepts Hillsborough SOE &ldquo;All Eligible Voters&rdquo; export or FL DOS extract.
          Voters are matched to properties by residential address; unmatched rows are quarantined
          for review. Contacts are <span className="text-slate-500">never auto-dialed</span> (mail
          &amp; review only).
        </p>
      </div>
    </div>
  );
}
