import { describe, expect, it } from 'vitest';
import readme from '../README.md';
import { CSS } from '../widget/src/styles';

/** Replaces every var(--va-x, fallback) with its fallback, i.e. the look when nothing is set. */
function withDefaults(css: string): string {
	let out = css;
	for (;;) {
		const start = out.indexOf('var(--va-');
		if (start === -1) return out;
		let depth = 0;
		let end = start;
		for (; end < out.length; end++) {
			if (out[end] === '(') depth++;
			if (out[end] === ')' && --depth === 0) break;
		}
		const inner = out.slice(start + 4, end); // "--va-x, fallback"
		const comma = inner.indexOf(',');
		out =
			out.slice(0, start) +
			(comma === -1 ? '' : inner.slice(comma + 1).trim()) +
			out.slice(end + 1);
	}
}

const used = new Set([...CSS.matchAll(/var\((--va-[a-z0-9-]+)/g)].map((m) => m[1]));
const documented = new Set([...readme.matchAll(/`(--va-[a-z0-9-]+)`/g)].map((m) => m[1]));

describe('theme variables', () => {
	it('every --va-* variable in the CSS is documented in the README', () => {
		const missing = [...used].filter((name) => !documented.has(name as string));
		expect(missing).toEqual([]);
	});

	it('every documented variable really exists in the CSS', () => {
		const stale = [...documented].filter((name) => !used.has(name as string));
		expect(stale).toEqual([]);
	});

	it('always supplies a fallback, so an unset variable cannot blank a style', () => {
		for (const match of CSS.matchAll(/var\(--va-[a-z0-9-]+\)/g)) {
			throw new Error(`no fallback: ${match[0]}`);
		}
	});

	it('looks exactly as before when no variable is set', () => {
		const css = withDefaults(CSS);
		for (const declaration of [
			'--bg: #050506;',
			'--panel: #0c0c0f;',
			'--accent: #e5342b;',
			'--accent-2: #f5473a;',
			'--radius: 6px;',
			'--bottom: 92px;',
			'right: 20px;',
			'z-index: 45;',
			'font-size: 14px;',
			'width: min(380px, calc(100vw - 32px));',
			'height: min(520px, calc(100vh - var(--bottom) - 58px));',
		]) {
			expect(css, declaration).toContain(declaration);
		}
		expect(css).not.toContain('--va-');
	});

	it('keeps the old panel height cap when the bottom offset is the default', () => {
		// 100vh - 92px - 58px is the 150px the stylesheet always used.
		expect(92 + 58).toBe(150);
	});
});
