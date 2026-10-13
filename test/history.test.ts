import { describe, expect, it } from 'vitest';
import { MAX_TURNS, MAX_USER_CHARS, buildRequest, type Turn } from '../widget/src/history';
import {
	MAX_MESSAGES,
	MAX_USER_CHARS as SERVER_MAX_USER_CHARS,
	parseMessages,
} from '../src/validate';

describe('buildRequest', () => {
	it('keeps the widget limits in step with the Worker', () => {
		expect(MAX_TURNS).toBe(MAX_MESSAGES);
		expect(MAX_USER_CHARS).toBe(SERVER_MAX_USER_CHARS);
	});

	it('appends the new question as a trimmed user turn', () => {
		expect(buildRequest([], '  hello  ')).toEqual([{ role: 'user', content: 'hello' }]);
	});

	it('truncates an overlong question to the server limit', () => {
		const [turn] = buildRequest([], 'x'.repeat(1000));
		expect(turn?.content).toHaveLength(MAX_USER_CHARS);
	});

	it('trims old history and never starts with an assistant turn', () => {
		const history: Turn[] = Array.from({ length: 10 }, (_, i) => ({
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: `m${i}`,
		}));
		const request = buildRequest(history, 'latest');
		expect(request.length).toBeLessThanOrEqual(MAX_TURNS);
		expect(request[0]?.role).toBe('user');
		expect(request[request.length - 1]).toEqual({ role: 'user', content: 'latest' });
	});

	it('always produces a request the Worker accepts', () => {
		const history: Turn[] = Array.from({ length: 12 }, (_, i) => ({
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: 'a'.repeat(i % 2 === 0 ? 300 : 600),
		}));
		const result = parseMessages({ messages: buildRequest(history, 'y'.repeat(500)) });
		expect(result.ok).toBe(true);
	});
});
