import ChatBody from './ChatBody';
import { CHAT_STRINGS } from '../../data/chatStrings';

export default function ChatDrawer({ messages, isLoading, error, onSend, onRetry, onReset, onClose, mode, feedUuid, onInjectAssistantMessage }) {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] h-[600px] max-h-[calc(100vh-2.5rem)] flex flex-col rounded-2xl overflow-hidden text-white font-sans"
      style={{
        background: 'var(--fa-bg-chat)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)',
      }}
      role="dialog"
      aria-label={CHAT_STRINGS.headerTitle}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with status dot */}
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                style={{
                  background: 'linear-gradient(135deg, var(--fa-color-primary), var(--fa-color-primary-dark))',
                  color: 'var(--fa-bg-base)',
                  boxShadow: '0 0 0 2px rgba(251,191,36,0.3)',
                }}
              >
                FA
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{ background: 'var(--fa-status-available)', boxShadow: '0 0 0 2px var(--fa-bg-chat)' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold leading-tight">{CHAT_STRINGS.headerTitle}</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--fa-text-secondary)' }}>
                Available now · replies in seconds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <HeaderIconBtn title="New chat" onClick={onReset}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </HeaderIconBtn>
            <HeaderIconBtn title={CHAT_STRINGS.closedLabel} onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </HeaderIconBtn>
          </div>
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
          onInjectAssistantMessage={onInjectAssistantMessage}
          mode={mode}
          feedUuid={feedUuid}
        />
      </div>
    </div>
  );
}

function HeaderIconBtn({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors text-fa-text-muted hover:text-white hover:bg-white/5"
    >
      {children}
    </button>
  );
}
