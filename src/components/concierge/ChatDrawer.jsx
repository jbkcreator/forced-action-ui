import ChatBody from './ChatBody';
import { CHAT_STRINGS } from '../../data/chatStrings';

export default function ChatDrawer({ messages, isLoading, error, onSend, onRetry, onReset, onClose }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-fa-accent/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-xl ring-1 ring-white/5"
      role="dialog"
      aria-label={CHAT_STRINGS.headerTitle}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
        <div>
          <p className="text-white font-semibold text-sm">{CHAT_STRINGS.headerTitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            aria-label="Start new chat"
            title="Start new chat"
            className="text-slate-400 hover:text-white p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={CHAT_STRINGS.closedLabel}
            className="text-slate-400 hover:text-white p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        <ChatBody
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={onSend}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}
