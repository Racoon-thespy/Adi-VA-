import { build } from 'esbuild';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Bundle first so the Worker's profile.md import resolves, then run it in this process.
await build({
	entryPoints: ['dev/bridge.ts'],
	outfile: 'dist/bridge.mjs',
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node22',
	loader: { '.md': 'text' },
	logLevel: 'warning',
});
await import(pathToFileURL(resolve('dist/bridge.mjs')).href);
