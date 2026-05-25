import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession, sendMessage, streamTurn } from '../api/chat';
import { CHAT_STRINGS } from '../data/chatStrings';

const SESSION_KEY = 'fa_chat_session_id';

/**
 * Primary hook for Concierge Chat.
 *
 * Returns:
 *   messages          — array of { id, role, text, streaming }
 *   isOpen            — bool
 *   isLoading         — bool (while waiting for turn_id)
 *   error             — string | null
 *   paymentEvent      — { type, sku, zip, source, deeplink_after } | null — consume and clear
 *   waitlistZip       — string | null — ZIP to offer waitlist for
 *   send(text)        — send a user message
 *   open()            — open the chat bubble
 *   close()           — close the chat drawer
 *   clearPaymentEvent — call after consuming paymentEvent
 *   clearWaitlistZip  — call after consuming waitlistZip
 */
export default function useConciergeChat({ mode = 'pre_signup', feedUuid = null } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [waitlistZip, setWaitlistZip] = useState(null);

  const streamCleanupRef = useRef(null);

  // ── Session initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionId(stored);
    }
    // Insert welcome message
    setMessages([
      { id: 'welcome', role: 'assistant', text: CHAT_STRINGS.welcomeMessage, streaming: false },
    ]);
  }, []);

  // ── Send a message ──────────────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    if (!text?.trim()) return;
    setError(null);
    setIsLoading(true);

    // Optimistically append user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: text.trim(), streaming: false },
    ]);

    // Placeholder streaming assistant message
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', text: '', streaming: true },
    ]);

    let currentSessionId = sessionId;

    try {
      const result = await sendMessage({
        sessionId: currentSessionId,
        content: text.trim(),
        mode,
        feedUuid,
      });

      // Persist session
      if (result.session_id && result.session_id !== currentSessionId) {
        currentSessionId = result.session_id;
        setSessionId(currentSessionId);
        localStorage.setItem(SESSION_KEY, currentSessionId);
      }

      // Surface payment event
      if (result.payment_event) {
        setPaymentEvent(result.payment_event);
      }
      if (result.waitlist_zip) {
        setWaitlistZip(result.waitlist_zip);
      }

      setIsLoading(false);

      // Stream the assistant response via SSE for a typewriter UX
      if (result.turn_id) {
        streamCleanupRef.current?.();

        const cleanup = streamTurn({
          sessionId: currentSessionId,
          turnId: result.turn_id,
          onChunk: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, text: m.text + chunk } : m,
              ),
            );
          },
          onDone: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, streaming: false } : m,
              ),
            );
          },
          onError: () => {
            // SSE failed — fall back to the content already in the POST response
            const fallback = result.content || CHAT_STRINGS.errorRetry;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, text: fallback, streaming: false }
                  : m,
              ),
            );
          },
        });
        streamCleanupRef.current = cleanup;
      } else if (result.content) {
        // No turn_id — show content directly (should not happen in normal flow)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, text: result.content, streaming: false }
              : m,
          ),
        );
      }
    } catch (err) {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, text: CHAT_STRINGS.errorRetry, streaming: false }
            : m,
        ),
      );
      setError(err?.message || CHAT_STRINGS.errorConnect);
    }
  }, [sessionId, mode, feedUuid]);

  // ── Cleanup stream on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamCleanupRef.current?.();
    };
  }, []);

  return {
    messages,
    isOpen,
    isLoading,
    error,
    paymentEvent,
    waitlistZip,
    send,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    clearPaymentEvent: () => setPaymentEvent(null),
    clearWaitlistZip: () => setWaitlistZip(null),
  };
}
