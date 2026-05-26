import { useCallback, useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';

const NEAR_BOTTOM_PX = 80;

export default function ChatBody({ messages, isLoading, error, onSend, onRetry }) {
  const [input, setInput] = useState('');
  const [pinned, setPinned] = useState(true); // user is near bottom?
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Auto-grow textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 144) + 'px'; // ~6 lines max
  }, [input]);

  // ── Smart auto-scroll ───────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (pinned) scrollToBottom();
  }, [messages, isLoading, pinned, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPinned(distanceFromBottom < NEAR_BOTTOM_PX);
  };

  // ── Submit handlers ─────────────────────────────────────────────────────
  const submit = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setPinned(true); // sending always pins
    onSend(trimmed);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(input);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  // Most-recent assistant message drives the suggestion chip strip
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);
  const currentFollowups = Array.isArray(lastAssistant?.followups) ? lastAssistant.followups : [];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-full">
      {/* Message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-3 space-y-1"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onRetry={onRetry}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <p className="text-red-400 text-xs text-center py-1">{error}</p>
        )}
      </div>

      {/* New message chip — visible only when not pinned */}
      {!pinned && (
        <button
          type="button"
          onClick={() => { setPinned(true); scrollToBottom(); }}
          className="absolute left-1/2 -translate-x-1/2 bottom-24 z-10 inline-flex items-center gap-1 bg-fa-accent text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:brightness-110"
        >
          New messages
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Follow-up chip strip — horizontally scrollable, scrollbar hidden */}
      {currentFollowups.length > 0 && !isLoading && (
        <div className="border-t border-slate-700/40 bg-slate-900/40 px-3 pt-2 pb-2 flex-shrink-0">
          <div
            className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {currentFollowups.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-slate-800/70 text-slate-200 border border-fa-accent/40 hover:bg-fa-accent/15 hover:border-fa-accent hover:text-white shadow-sm transition-colors whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-slate-700/60 bg-slate-900/60 px-3 py-3 flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-xl bg-slate-800/80 border border-slate-700 focus-within:border-fa-accent focus-within:ring-1 focus-within:ring-fa-accent/40 shadow-inner transition-colors px-2 py-1"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your message…"
            className="flex-1 resize-none bg-transparent text-slate-100 placeholder-slate-500 text-sm px-2 py-2 focus:outline-none leading-snug overflow-y-auto"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-fa-accent text-white text-sm font-medium shadow-sm hover:bg-fa-accent/90 active:bg-fa-accent disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-9-9" />
              </svg>
            ) : (
              <>
                <span>Send</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3" aria-label="Assistant is typing">
      <div className="bg-slate-800 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
