import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { CHAT_STRINGS } from '../../data/chatStrings';

export default function ChatBody({ messages, isLoading, error, onSend, onEscalate }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {error && (
          <p className="text-red-400 text-xs text-center py-1">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={CHAT_STRINGS.placeholder}
            className="flex-1 resize-none rounded-xl bg-slate-800 border border-white/10 text-slate-100 placeholder-slate-500 text-sm px-3 py-2 focus:outline-none focus:border-fa-accent focus:ring-1 focus:ring-fa-accent/50 max-h-32"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 cta-primary text-sm px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? '…' : 'Send'}
          </button>
        </form>

        <button
          type="button"
          onClick={onEscalate}
          className="mt-2 w-full text-center text-slate-500 hover:text-slate-300 text-xs transition-colors"
        >
          {CHAT_STRINGS.escalateLabel}
        </button>
      </div>
    </div>
  );
}
