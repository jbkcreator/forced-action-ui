import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TYPE_SPEED_MS = 18;

const MD_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="underline underline-offset-2 hover:opacity-80"
       style={{ color: 'var(--fa-color-primary)', textDecorationColor: 'rgba(251,191,36,0.4)' }}>
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => <code className="bg-black/30 rounded px-1 py-0.5 text-xs">{children}</code>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-white/20">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-2 py-1 border-t border-white/10">{children}</td>,
};

function useTypewriter(fullText, enabled) {
  const [shown, setShown] = useState(enabled ? '' : fullText);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setShown(fullText);
      setDone(true);
      return;
    }
    let i = 0;
    setShown('');
    setDone(false);
    const id = setInterval(() => {
      i += 1;
      setShown(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(id);
        setDone(true);
      }
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { shown, done };
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function MessageBubble({ message, onRetry }) {
  const isUser = message.role === 'user';
  const isError = !!message.error;

  const { shown, done } = useTypewriter(message.text || '', !isUser && !!message.animate);

  // User message — amber bubble with timestamp
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end max-w-[80%]">
          {message.timestamp && (
            <span className="text-[10px] mb-1.5 mr-1" style={{ color: 'var(--fa-text-dimmed)' }}>
              {formatTime(message.timestamp)}
            </span>
          )}
          <div
            className="px-3.5 py-2 rounded-2xl rounded-br-md text-[13.5px] leading-snug font-medium"
            style={{ background: 'var(--fa-color-primary)', color: 'var(--fa-bg-base)' }}
          >
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  // Error message
  if (isError) {
    return (
      <div className="flex flex-col items-start max-w-[94%]">
        <div
          className="text-[13.5px] leading-[1.6] px-4 py-2.5 rounded-2xl rounded-bl-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
        >
          {message.text}
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 transition-colors hover:opacity-80"
              style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Assistant — editorial prose, no bubble
  return (
    <div className="text-[13.5px] leading-[1.6] max-w-[94%]" style={{ color: 'var(--fa-text-secondary)' }}>
      {message.animate ? (
        <span>
          {shown}
          {!done && (
            <span
              className="inline-block w-1 h-3.5 ml-0.5 opacity-70 animate-pulse align-middle"
              style={{ background: 'var(--fa-text-secondary)' }}
            />
          )}
        </span>
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
          {message.text || ''}
        </ReactMarkdown>
      )}
    </div>
  );
}
