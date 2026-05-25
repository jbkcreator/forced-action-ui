import { CHAT_STRINGS } from '../../data/chatStrings';

export default function ChatBubble({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={CHAT_STRINGS.bubbleLabel}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-fa-accent hover:brightness-110 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-xl transition-all"
    >
      {/* Chat icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {CHAT_STRINGS.bubbleLabel}
    </button>
  );
}
