export interface Turn {
	role: 'user' | 'assistant';
	content: string;
}

// Must match the Worker's limits in src/validate.ts.
export const MAX_TURNS = 6;
export const MAX_USER_CHARS = 300;

/**
 * Builds the messages to send: the recent history plus the new question,
 * trimmed to the Worker's limits. Leading assistant turns are dropped so the
 * model never sees a conversation that opens with its own reply.
 */
export function buildRequest(history: Turn[], question: string): Turn[] {
	const text = question.trim().slice(0, MAX_USER_CHARS);
	const turns = [...history, { role: 'user' as const, content: text }].slice(-MAX_TURNS);
	while (turns.length > 1 && turns[0]?.role === 'assistant') {
		turns.shift();
	}
	return turns;
}
