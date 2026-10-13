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

export class WorkersAIBrain implements Brain {
	constructor(private readonly ai: Ai) {}

	async reply(system: string, history: ChatMessage[]): Promise<string> {
		const result = (await this.ai.run(MODEL, {
			messages: [{ role: 'system', content: system }, ...history],
			max_tokens: MAX_OUTPUT_TOKENS,
			temperature: 0.3,
		})) as { response?: string };
		return (result.response ?? '').trim();
	}
}
