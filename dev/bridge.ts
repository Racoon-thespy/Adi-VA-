// Runs the real Worker code locally, with model calls made through the `cf` CLI
// instead of the Workers AI binding. Lets you try real Whisper, Llama and MeloTTS
// without `wrangler dev` (which needs a workers.dev subdomain). Dev only.
//
// Run: npm run dev:real   (needs `cf auth login`; listens on http://localhost:8787)
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { WorkersAISpeechToText, WorkersAITextToSpeech } from '../src/audio';
import { WorkersAIBrain } from '../src/brain';
import { type Env, handle } from '../src/index';

const PORT = 8787;
const run = promisify(execFile);

async function cfRun(model: string, input: unknown): Promise<unknown> {
	const dir = await mkdtemp(join(tmpdir(), 'voice-agent-'));
	try {
		const file = join(dir, 'body.json');
		await writeFile(file, JSON.stringify(input));
		const { stdout } = await run('cf', ['ai', 'run', model, '--body', `@${file}`], {
			maxBuffer: 64 * 1024 * 1024,
		});
		return JSON.parse(stdout);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

// Stand-in for the Workers AI binding: same call shape, backed by the CLI.
const ai = { run: cfRun } as unknown as Ai;
const allow = { limit: async () => ({ success: true }) };
const env: Env = {
	AI: ai,
	RATE_LIMITER: allow,
	AUDIO_LIMITER: allow,
	ALLOWED_ORIGIN: 'https://racoon-thespy.github.io',
	DEV_ALLOW_LOCALHOST: 'true',
};
const deps = {
	brain: new WorkersAIBrain(ai),
	stt: new WorkersAISpeechToText(ai),
	tts: new WorkersAITextToSpeech(ai),
};

createServer(async (req, res) => {
	const startedAt = Date.now();
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (typeof value === 'string') headers.set(key, value);
	}
	const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
	const request = new Request(`http://localhost:${PORT}${req.url}`, {
		method: req.method,
		headers,
		body: hasBody ? Buffer.concat(chunks) : undefined,
	});

	const response = await handle(request, env, deps);
	res.writeHead(response.status, Object.fromEntries(response.headers));
	res.end(Buffer.from(await response.arrayBuffer()));
	console.log(`${req.method} ${req.url} -> ${response.status} (${Date.now() - startedAt} ms)`);
}).listen(PORT, () => console.log(`real-model bridge on http://localhost:${PORT}`));
