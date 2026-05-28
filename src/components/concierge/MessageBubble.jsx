import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TYPE_SPEED_MS = 18;

const MD_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-black/30 rounded px-1 py-0.5 text-xs">{children}</code>
  ),
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

export default function MessageBubble({ message, onRetry }) {
  const isUser = message.role === 'user';
  const isError = !!message.error;

  const { shown, done } = useTypewriter(message.text || '', !isUser && !!message.animate);

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-fa-accent text-white rounded-br-sm'
            : isError
              ? 'bg-red-950/40 text-red-100 rounded-bl-sm border border-red-500/40'
              : 'bg-slate-800/90 text-slate-100 rounded-bl-sm border border-white/10'
        }`}
      >
        {isUser ? (
          message.text
        ) : message.animate ? (
          <span>
            {shown}
            {!done && <span className="inline-block w-1 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />}
          </span>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {message.text || ''}
          </ReactMarkdown>
        )}

        {isError && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(message.id)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-md px-2 py-1 transition-colors"
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
