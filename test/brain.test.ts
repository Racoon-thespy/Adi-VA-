import { describe, expect, it } from 'vitest';
import { WorkersAIBrain, extractReply } from '../src/brain';

describe('extractReply', () => {
	it('reads the classic { response } shape', () => {
		expect(extractReply({ response: '  Hello there.  ' })).toBe('Hello there.');
	});

	it('reads the OpenAI-style choices shape', () => {
		const result = { choices: [{ message: { role: 'assistant', content: ' Hi. ' } }] };
		expect(extractReply(result)).toBe('Hi.');
	});

	it('returns an empty string for anything unexpected', () => {
		for (const result of [null, undefined, {}, { response: 42 }, { choices: [] }, 'text']) {
			expect(extractReply(result)).toBe('');
		}
	});
});

describe('WorkersAIBrain', () => {
	it('sends the system prompt first, then the history, with capped output', async () => {
		let seen: { model: string; input: unknown } | undefined;
		const ai = {
			run: async (model: string, input: unknown) => {
				seen = { model, input };
				return { choices: [{ message: { content: 'ok' } }] };
			},
		} as unknown as Ai;

		const reply = await new WorkersAIBrain(ai).reply('SYSTEM', [{ role: 'user', content: 'hi' }]);
		expect(reply).toBe('ok');
		const input = seen?.input as { messages: unknown[]; max_tokens: number };
		expect(input.messages).toEqual([
			{ role: 'system', content: 'SYSTEM' },
			{ role: 'user', content: 'hi' },
		]);
		expect(input.max_tokens).toBeLessThanOrEqual(200);
	});
});
