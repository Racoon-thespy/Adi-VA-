import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Mirrors wrangler's `rules` entry that loads *.md files as text modules.
const markdownAsText = {
	name: 'markdown-as-text',
	transform(_code: string, id: string) {
		if (!id.endsWith('.md')) return null;
		return { code: `export default ${JSON.stringify(readFileSync(id, 'utf8'))};`, map: null };
	},
};

export default defineConfig({
	plugins: [markdownAsText],
	test: { include: ['test/**/*.test.ts'] },
});
