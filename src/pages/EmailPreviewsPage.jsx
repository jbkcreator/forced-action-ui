import { theme } from '../theme/ThemeProvider';
import emailTemplates from '../data/emailTemplates';

export default function EmailPreviewsPage() {
  return (
    <div style={{ background: '#020617', color: '#e2e8f0', padding: '40px 20px', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          {theme.brand.name.split(' ')[0]}{' '}
          <span style={{ color: '#fbbf24' }}>{theme.brand.name.split(' ').slice(1).join(' ')}</span>
          {' '}&mdash; Email Previews
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          All {emailTemplates.length} email types with example data. Emails marked "text-only" have been rendered into matching HTML for preview.
        </p>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '48px' }}>
        {emailTemplates.map((t, i) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            style={{
              display: 'inline-block', padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: '#94a3b8', textDecoration: 'none',
              fontSize: '13px', fontWeight: 500,
            }}
          >
            {i + 1}. {t.label}
          </a>
        ))}
      </div>

      {/* Email Sections */}
      {emailTemplates.map((t, i) => (
        <div key={t.id}>
          <div id={t.id} style={{ maxWidth: '700px', margin: '0 auto 64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                {i + 1}. {t.label}
              </h2>
              {t.tags.map((tag) => (
                <span
                  key={tag.text}
                  style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                    borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    ...tagStyles[tag.type],
                  }}
                >
                  {tag.text}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              <strong style={{ color: '#94a3b8' }}>Subject:</strong> {t.subject}<br />
              <strong style={{ color: '#94a3b8' }}>To:</strong> {t.to}
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', background: '#0f172a' }}>
              <iframe
                srcDoc={t.html}
                title={t.label}
                style={{ width: '100%', height: '650px', border: 'none' }}
              />
            </div>
          </div>
          {i < emailTemplates.length - 1 && (
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '64px auto', maxWidth: '700px' }} />
          )}
        </div>
      ))}
    </div>
  );
}

const tagStyles = {
  html: { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
  text: { background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' },
  trigger: { background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' },
};
