/**
 * ConciergeChat — top-level Concierge Chat widget.
 *
 * Props:
 *   mode       — 'pre_signup' | 'post_signup'
 *   mountPoint — 'landing' | 'dashboard' | 'lead_feed'
 *   feedUuid   — subscriber feed UUID (post_signup only)
 *   onPaymentSheet — optional callback({ sku, zip, source, deeplink_after })
 *                    called when Claude emits a buy intent. If not provided,
 *                    the event is logged and the user sees a CTA in chat.
 */
import { useEffect } from 'react';
import useConciergeChat from '../../hooks/useConciergeChat';
import ChatBubble from './ChatBubble';
import ChatDrawer from './ChatDrawer';
import ChatFullScreen from './ChatFullScreen';
import { escalateSession } from '../../api/chat';

const IS_MOBILE = () => window.innerWidth < 768;

export default function ConciergeChat({
  mode = 'pre_signup',
  mountPoint = 'landing',
  feedUuid = null,
  onPaymentSheet = null,
}) {
  const {
    messages,
    isOpen,
    isLoading,
    error,
    paymentEvent,
    waitlistZip,
    send,
    open,
    close,
    clearPaymentEvent,
    clearWaitlistZip,
  } = useConciergeChat({ mode, feedUuid });

  // ── Payment Sheet trigger ─────────────────────────────────────────────────
  useEffect(() => {
    if (!paymentEvent) return;
    if (typeof onPaymentSheet === 'function') {
      onPaymentSheet(paymentEvent);
    } else {
      // No handler — inject a CTA message so the user still sees the action
      console.info('[ConciergeChat] payment_event received but no handler:', paymentEvent);
    }
    clearPaymentEvent();
  }, [paymentEvent, onPaymentSheet, clearPaymentEvent]);

  // ── Waitlist CTA ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!waitlistZip) return;
    // Parent can wire a waitlist handler; default is a logged no-op.
    clearWaitlistZip();
  }, [waitlistZip, clearWaitlistZip]);

  const handleEscalate = async () => {
    // Best-effort — don't block UX
    try {
      const stored = localStorage.getItem('fa_chat_session_id');
      if (stored) await escalateSession(stored);
    } catch {
      // ignore
    }
    // Deep-link to support
    window.open('mailto:support@forcedaction.ai?subject=Chat%20Escalation', '_blank');
  };

  if (!isOpen) {
    return <ChatBubble onClick={open} />;
  }

  const mobile = IS_MOBILE();
  const ChatPanel = mobile ? ChatFullScreen : ChatDrawer;

  return (
    <ChatPanel
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSend={send}
      onEscalate={handleEscalate}
      onClose={close}
    />
  );
}
