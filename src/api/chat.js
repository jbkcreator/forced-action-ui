import { api } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Create a new anonymous chat session. Returns { session_id }.
 * Sets an HttpOnly cookie on the response.
 */
export async function createSession(mode = 'pre_signup') {
  return api.post('/api/chat/sessions', { mode });
}

/**
 * Send a user message. Returns { session_id, turn_id, intent, payment_event, waitlist_zip }.
 */
export async function sendMessage({ sessionId, content, mode, feedUuid }) {
  return api.post('/api/chat/messages', {
    session_id: sessionId,
    content,
    mode,
    feed_uuid: feedUuid || null,
  });
}

/**
 * Link an anonymous session to a subscriber after signup.
 */
export async function linkSession(sessionId, subscriberId) {
  return api.post(`/api/chat/sessions/${sessionId}/link`, {
    subscriber_id: subscriberId,
  });
}

/**
 * Request human escalation for a session.
 */
export async function escalateSession(sessionId, reason = 'user_requested') {
  return api.post(`/api/chat/sessions/${sessionId}/escalate`, { reason });
}

/**
 * Open an EventSource for the SSE stream of a specific turn.
 * Returns a cleanup function.
 *
 * onChunk(text: string) — called for each text delta
 * onDone()              — called when stream closes normally
 * onError(message)      — called on stream error
 */
export function streamTurn({ sessionId, turnId, onChunk, onDone, onError }) {
  const url = `${API_BASE}/api/chat/stream?session_id=${encodeURIComponent(sessionId)}&turn_id=${turnId}`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'chunk') {
        onChunk?.(data.text);
      } else if (data.type === 'done') {
        es.close();
        onDone?.();
      } else if (data.type === 'error') {
        es.close();
        onError?.(data.message || 'Stream error');
      }
    } catch {
      // ignore malformed frames
    }
  };

  es.onerror = () => {
    es.close();
    onError?.('Connection lost');
  };

  return () => es.close();
}
