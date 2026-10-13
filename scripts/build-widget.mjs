import { build } from 'esbuild';

// One self-contained classic script, so the static portfolio needs no build step.
await build({
	entryPoints: ['widget/src/main.ts'],
	outfile: 'dist/agent.js',
	bundle: true,
	minify: true,
	format: 'iife',
	target: 'es2020',
	legalComments: 'none',
});
console.log('built dist/agent.js');
