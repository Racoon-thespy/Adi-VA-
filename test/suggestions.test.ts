import { describe, expect, it } from 'vitest';
import { parseMessages } from '../src/validate';
import { SUGGESTIONS, matchSuggestion } from '../widget/src/suggestions';

describe('suggestion pills', () => {
	it('has a few distinct suggestions', () => {
		expect(SUGGESTIONS.length).toBeGreaterThanOrEqual(3);
		expect(new Set(SUGGESTIONS.map((s) => s.label)).size).toBe(SUGGESTIONS.length);
		expect(new Set(SUGGESTIONS.map((s) => s.question)).size).toBe(SUGGESTIONS.length);
	});

	it('keeps labels short enough to fit as pills', () => {
		for (const { label } of SUGGESTIONS) expect(label.length).toBeLessThanOrEqual(24);
	});

	it('only offers questions the Worker will accept unchanged', () => {
		for (const { question } of SUGGESTIONS) {
			const result = parseMessages({ messages: [{ role: 'user', content: question }] });
			expect(result.ok, question).toBe(true);
			if (result.ok) expect(result.messages[0]?.content, question).toBe(question);
		}
	});
});

describe('matchSuggestion', () => {
	const first = SUGGESTIONS[0];

	it('matches the exact question, so a tapped pill is retired', () => {
		for (const suggestion of SUGGESTIONS) {
			expect(matchSuggestion(suggestion.question)).toBe(suggestion);
		}
	});

	it('ignores case, spacing and surrounding whitespace, so a typed or spoken question also retires it', () => {
		expect(first && matchSuggestion(`  ${first.question.toUpperCase()}  `)).toBe(first);
		expect(first && matchSuggestion(first.question.replace(' ', '   '))).toBe(first);
	});

	it('also matches the pill label', () => {
		for (const suggestion of SUGGESTIONS) {
			expect(matchSuggestion(suggestion.label)).toBe(suggestion);
		}
	});

	it('does not retire anything for an unrelated question', () => {
		expect(matchSuggestion('What is his favourite film?')).toBeUndefined();
		expect(matchSuggestion('')).toBeUndefined();
	});
});
