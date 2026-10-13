import type { Turn } from './history';

/** The language-model stage, as seen from the browser. */
export interface ChatClient {
	ask(messages: Turn[]): Promise<string>;
}

export class ApiError extends Error {
	constructor(
		readonly userMessage: string,
		readonly status?: number,
	) {
		super(userMessage);
	}
}

const REQUEST_TIMEOUT_MS = 20_000;

export class HttpChatClient implements ChatClient {
	constructor(private readonly baseUrl: string) {}

	async ask(messages: Turn[]): Promise<string> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		let response: Response;
		try {
			response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages }),
				signal: controller.signal,
			});
		} catch {
			throw new ApiError("I couldn't reach the assistant. Please try again in a moment.");
		} finally {
			clearTimeout(timer);
		}

		if (response.status === 429) {
			throw new ApiError('That was a lot of questions at once. Give it a few seconds.', 429);
		}
		if (!response.ok) {
			throw new ApiError(
				'The assistant is unavailable right now. Please try again later.',
				response.status,
			);
		}

		const data: unknown = await response.json().catch(() => null);
		const reply = (data as { reply?: unknown } | null)?.reply;
		if (typeof reply !== 'string' || reply.length === 0) {
			throw new ApiError('I got an empty answer. Could you ask again?');
		}
		return reply;
	}
}
