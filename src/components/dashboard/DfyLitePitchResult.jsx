import { useState } from 'react';
import Button from '../ui/Button';

const SECTION_LABELS = {
  email_subject:    'Email Subject',
  email_pitch:      'Email Body',
  sms_pitch:        'SMS Pitch',
  call_script:      'Call Script',
  linkedin_message: 'LinkedIn Message',
  evidence_summary: 'Evidence Summary',
};

const SECTION_ORDER = [
  'evidence_summary',
  'email_subject',
  'email_pitch',
  'sms_pitch',
  'call_script',
  'linkedin_message',
];

const SECTION_ROWS = {
  email_pitch:      8,
  call_script:      6,
  evidence_summary: 4,
  email_subject:    2,
  sms_pitch:        3,
  linkedin_message: 4,
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }
  return (
    <Button variant="secondary" className="text-xs px-3 py-1 shrink-0" onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

function OutputSection({ sectionKey, content, editable, onChange }) {
  if (!content && !editable) return null;
  if (editable && content == null) return null;

  const isEvidence = sectionKey === 'evidence_summary';

  return (
    <div className={`rounded-xl p-4 border ${
      isEvidence
        ? 'bg-blue-500/[0.06] border-blue-500/[0.15]'
        : 'bg-white/[0.04] border-white/[0.08]'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {SECTION_LABELS[sectionKey] || sectionKey}
        </p>
        {!editable && <CopyButton text={content} />}
      </div>
      {editable ? (
        <textarea
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/50 resize-none leading-relaxed"
          rows={SECTION_ROWS[sectionKey] ?? 3}
          value={content ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>
      )}
    </div>
  );
}

export default function DfyLitePitchResult({ output, onBack, onClose, editable = false, onSave }) {
  const [draft, setDraft] = useState(() => ({ ...output }));
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  function handleChange(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveErr(null);
    try {
      await onSave?.(draft);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch {
      setSaveErr('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadAll() {
    const src = editable ? draft : output;
    const parts = SECTION_ORDER
      .filter((k) => src[k])
      .map((k) => `=== ${SECTION_LABELS[k] || k} ===\n${src[k]}`)
      .join('\n\n');
    const blob = new Blob([parts], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pitch-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayOutput = editable ? draft : output;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {editable ? 'Edit Pitch' : 'Your Pitch'}
        </p>
        {editable ? (
          <p className="text-xs text-slate-400">Changes are saved to your account.</p>
        ) : (
          <p className="text-xs text-slate-400">Review before sending — do not auto-send.</p>
        )}
      </div>

      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
        {SECTION_ORDER.map((key) =>
          displayOutput[key] ? (
            <OutputSection
              key={key}
              sectionKey={key}
              content={displayOutput[key]}
              editable={editable}
              onChange={(val) => handleChange(key, val)}
            />
          ) : null,
        )}
      </div>

      {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}

      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.06]">
        {editable ? (
          <>
            <Button
              variant="primary"
              className="text-sm px-4 py-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Changes'}
            </Button>
            <Button variant="secondary" className="text-sm px-4 py-2" onClick={onBack}>
              Cancel
            </Button>
            <Button variant="secondary" className="text-sm px-4 py-2 ml-auto" onClick={handleDownloadAll}>
              Download
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" className="text-sm px-4 py-2" onClick={onBack}>
              Back
            </Button>
            <Button variant="secondary" className="text-sm px-4 py-2" onClick={handleDownloadAll}>
              Download All
            </Button>
            <Button variant="secondary" className="text-sm px-4 py-2 ml-auto" onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
