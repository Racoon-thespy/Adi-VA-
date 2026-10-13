export type Role = 'user' | 'assistant';

export interface ChatMessage {
	role: Role;
	content: string;
}

/** Swappable language-model stage of the cascade. */
export interface Brain {
	reply(system: string, history: ChatMessage[]): Promise<string>;
}

export const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const MAX_OUTPUT_TOKENS = 200;

/**
 * Workers AI chat models answer in one of two shapes: `{ response }` (the
 * classic binding output) or an OpenAI-style `{ choices: [{ message }] }`.
 * Both are accepted so a change on Cloudflare's side doesn't silently blank every reply.
 */
export function extractReply(result: unknown): string {
	const output = result as {
		response?: unknown;
		choices?: { message?: { content?: unknown } }[];
	} | null;
	if (typeof output?.response === 'string') return output.response.trim();
	const content = output?.choices?.[0]?.message?.content;
	return typeof content === 'string' ? content.trim() : '';
}

export class WorkersAIBrain implements Brain {
	constructor(private readonly ai: Ai) {}

	async reply(system: string, history: ChatMessage[]): Promise<string> {
		const result: unknown = await this.ai.run(MODEL, {
			messages: [{ role: 'system', content: system }, ...history],
			max_tokens: MAX_OUTPUT_TOKENS,
			temperature: 0.3,
		});
		return extractReply(result);
	}
}
