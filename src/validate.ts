import type { ChatMessage } from './brain';

export const MAX_MESSAGES = 6;
export const MAX_USER_CHARS = 300;
export const MAX_ASSISTANT_CHARS = 600;

export type ParseResult = { ok: true; messages: ChatMessage[] } | { ok: false; error: string };

/**
 * Validates the client-supplied history. The client is untrusted: it can only
 * send user/assistant turns (the system prompt is added server-side), the
 * conversation must end on a user turn, and every size is capped.
 */
export function parseMessages(body: unknown): ParseResult {
	if (typeof body !== 'object' || body === null || !('messages' in body)) {
		return { ok: false, error: 'Expected { messages: [...] }.' };
	}
	const raw = (body as { messages: unknown }).messages;
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) {
		return { ok: false, error: `messages must have 1 to ${MAX_MESSAGES} entries.` };
	}

	const messages: ChatMessage[] = [];
	for (const item of raw) {
		if (typeof item !== 'object' || item === null) {
			return { ok: false, error: 'Invalid message.' };
		}
		const { role, content } = item as { role?: unknown; content?: unknown };
		if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
			return { ok: false, error: 'Invalid message.' };
		}
		const text = content.trim();
		const limit = role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS;
		if (text.length === 0 || text.length > limit) {
			return { ok: false, error: `Each ${role} message must be 1 to ${limit} characters.` };
		}
		messages.push({ role, content: text });
	}

	if (messages[messages.length - 1]?.role !== 'user') {
		return { ok: false, error: 'The last message must be from the user.' };
	}
	return { ok: true, messages };
}
