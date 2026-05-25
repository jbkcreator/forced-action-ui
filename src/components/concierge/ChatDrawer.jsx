import ChatBody from './ChatBody';
import { CHAT_STRINGS } from '../../data/chatStrings';

export default function ChatDrawer({ messages, isLoading, error, onSend, onEscalate, onClose }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
      role="dialog"
      aria-label={CHAT_STRINGS.headerTitle}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div>
          <p className="text-white font-semibold text-sm">{CHAT_STRINGS.headerTitle}</p>
          <p className="text-slate-400 text-xs">{CHAT_STRINGS.headerSubtitle}</p>
        </div>
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

      {/* Body */}
      <div className="flex-1 min-h-0">
        <ChatBody
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={onSend}
          onEscalate={onEscalate}
        />
      </div>
    </div>
  );
}
