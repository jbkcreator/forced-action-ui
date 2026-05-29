import { useCallback, useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { detectIntent } from './intent';
import WalletTopupModal from '../dashboard/WalletTopupModal';

const NEAR_BOTTOM_PX = 80;

const QUICK_ACTIONS = [
  {
    label: 'Pricing',
    text: 'How much does it cost?',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 6v2M12 16v2" />
      </svg>
    ),
  },
  {
    label: 'Coverage',
    text: 'What ZIP codes do you cover?',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'Check ZIP',
    text: 'Check if my ZIP code is available',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
];

export default function ChatBody({ messages, isLoading, error, onSend, onRetry, onInjectAssistantMessage, mode, feedUuid }) {
  const [input, setInput] = useState('');
  const [pinned, setPinned] = useState(true);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const scrollRef = useRef(null);

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

  const submit = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const intent = detectIntent(trimmed);
    if (intent?.kind === 'wallet' && mode === 'post_signup') {
      setWalletModalOpen(true);
    }
    if (intent?.kind === 'annual') {
      onInjectAssistantMessage(
        "Annual pricing depends on your tier and ZIP count — " +
        "email [support@forcedaction.ai](mailto:support@forcedaction.ai) " +
        "and they'll set it up."
      );
      setPinned(true);
      setInput('');
      return;
    }
    setPinned(true);
    onSend(trimmed);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(input);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(input);
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);
  const currentFollowups = Array.isArray(lastAssistant?.followups) ? lastAssistant.followups : [];

  return (
    <div className="relative flex flex-col h-full">
      {/* Message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-5 space-y-6"
      >
        {/* Day divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--fa-text-dimmed)' }}>Today</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onRetry={onRetry} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <p className="text-red-400 text-xs text-center py-1">{error}</p>
        )}
      </div>

      {/* New messages chip */}
      {!pinned && (
        <button
          type="button"
          onClick={() => { setPinned(true); scrollToBottom(); }}
          className="absolute left-1/2 -translate-x-1/2 bottom-32 z-10 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg"
          style={{ background: 'var(--fa-color-primary)', color: 'var(--fa-bg-base)' }}
        >
          New messages
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Dynamic follow-up chips from AI */}
      {currentFollowups.length > 0 && !isLoading && (
        <div className="px-5 pt-2 pb-1 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {currentFollowups.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border text-slate-300 whitespace-nowrap transition-colors hover:text-white"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Static quick action chips */}
      <div className="px-5 pt-3 pb-2 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map(({ label, text, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => submit(text)}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11.5px] font-medium text-slate-300 transition-colors hover:text-amber-200 hover:border-amber-500/40 hover:bg-amber-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            >
              <span style={{ color: 'var(--fa-color-primary)' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-1 flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'var(--fa-bg-chat-composer)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask the concierge…"
            disabled={isLoading}
            className="flex-1 bg-transparent text-[13.5px] text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--fa-color-primary)', color: 'var(--fa-bg-base)' }}
          >
            {isLoading ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-9-9" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2 21l21-9L2 3l5 9-5 9zm5-9l-1.2-4.4L17.5 12 5.8 16.4 7 12z" />
              </svg>
            )}
          </button>
        </form>
        <p className="mt-2 text-[10px] text-center" style={{ color: 'var(--fa-text-dimmed)' }}>
          Concierge may make mistakes — verify critical answers.
        </p>
      </div>

      {walletModalOpen && feedUuid && (
        <WalletTopupModal
          isOpen={walletModalOpen}
          feedUuid={feedUuid}
          onClose={() => setWalletModalOpen(false)}
        />
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Assistant is typing">
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
