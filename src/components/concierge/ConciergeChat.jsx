/**
 * ConciergeChat — Markdown-grounded chat widget (always mounted).
 *
 * Mount once. Renders either the floating bubble (closed) or the chat
 * panel (open). State is held in useConciergeChat so messages and
 * unread count persist across open/close within the tab.
 */
import useConciergeChat from '../../hooks/useConciergeChat';
import ChatBubble from './ChatBubble';
import ChatDrawer from './ChatDrawer';
import ChatFullScreen from './ChatFullScreen';

const isMobile = () => window.innerWidth < 768;

export default function ConciergeChat({ mode = 'pre_signup', feedUuid = null }) {
  const {
    messages,
    isOpen,
    isLoading,
    error,
    unreadCount,
    send,
    retryLast,
    reset,
    open,
    close,
    injectAssistantMessage,
  } = useConciergeChat();

  if (!isOpen) {
    return <ChatBubble onClick={open} unreadCount={unreadCount} />;
  }

  const ChatPanel = isMobile() ? ChatFullScreen : ChatDrawer;

  return (
    <ChatPanel
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSend={send}
      onRetry={retryLast}
      onReset={reset}
      onClose={close}
      mode={mode}
      feedUuid={feedUuid}
      onInjectAssistantMessage={injectAssistantMessage}
    />
  );
}
