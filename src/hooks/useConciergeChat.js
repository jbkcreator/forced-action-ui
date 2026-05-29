import { useCallback, useEffect, useRef, useState } from 'react';
import { sendMessage } from '../api/chat';
import { CHAT_STRINGS } from '../data/chatStrings';

const SESSION_KEY = 'fa_chat_session_id';
const MESSAGES_KEY = 'fa_chat_messages';

const STARTER_FOLLOWUPS = [
  'Do you cover my ZIP code',
  'How does Forced Action help me find distressed property leads?',
];

const WELCOME_MESSAGE = {
  id: 'welcome-v2',
  role: 'assistant',
  text: CHAT_STRINGS.welcomeMessage,
  followups: STARTER_FOLLOWUPS,
  animate: true,
};

function loadInitialMessages() {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Bust stale sessions from before welcome-v2
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id === WELCOME_MESSAGE.id) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return [WELCOME_MESSAGE];
}

/**
 * Concierge Chat hook.
 *
 * Returns:
 *   messages, isOpen, isLoading, error,
 *   unreadCount      — count of assistant replies received while closed
 *   send(text)       — send a user message
 *   retryLast()      — re-send last failed user message
 *   reset()          — start a fresh session (new id, welcome only)
 *   open(), close()
 */
export default function useConciergeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(loadInitialMessages);
  const [sessionId, setSessionId] = useState(() => {
    try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const lastUserTextRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const injectAssistantMessage = useCallback((text) => {
    setMessages((prev) => [
      ...prev,
      { id: `assistant-injected-${Date.now()}`, role: 'assistant', text, followups: [] },
    ]);
    if (!isOpenRef.current) setUnreadCount((n) => n + 1);
  }, []);

  // Persist messages to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // quota or disabled — ignore
    }
  }, [messages]);

  const _sendInternal = useCallback(async (text, { replaceErrorId = null } = {}) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    setIsLoading(true);
    lastUserTextRef.current = trimmed;

    // If retrying, remove the failed assistant bubble first
    if (replaceErrorId) {
      setMessages((prev) => prev.filter((m) => m.id !== replaceErrorId));
    } else {
      // Fresh send — append user message
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: trimmed, timestamp: Date.now() },
      ]);
    }

    try {
      const result = await sendMessage({
        sessionId,
        content: trimmed,
      });

      if (result.session_id && result.session_id !== sessionId) {
        setSessionId(result.session_id);
        try { localStorage.setItem(SESSION_KEY, result.session_id); } catch {}
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: result.reply || CHAT_STRINGS.errorRetry,
          followups: Array.isArray(result.followups) ? result.followups.slice(0, 2) : [],
        },
      ]);
      if (!isOpenRef.current) setUnreadCount((n) => n + 1);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: CHAT_STRINGS.errorRetry,
          error: true,
        },
      ]);
      setError(err?.message || CHAT_STRINGS.errorConnect);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const send = useCallback((text) => _sendInternal(text), [_sendInternal]);

  const retryLast = useCallback((errorMessageId) => {
    const text = lastUserTextRef.current;
    if (!text) return;
    _sendInternal(text, { replaceErrorId: errorMessageId });
  }, [_sendInternal]);

  const reset = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
    setError(null);
    setUnreadCount(0);
    lastUserTextRef.current = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(MESSAGES_KEY);
    } catch {}
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return {
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
  };
}
