import { api } from './client';

/**
 * Create a new chat session. Returns { session_id }.
 */
export async function createSession() {
  return api.post('/api/chat/sessions', {});
}

/**
 * Send a user message. Returns { session_id, reply }.
 */
export async function sendMessage({ sessionId, content }) {
  return api.post('/api/chat/messages', {
    session_id: sessionId,
    content,
  });
}
