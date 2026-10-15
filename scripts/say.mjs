// Hear how the agent will pronounce text, using the same /speak endpoint the widget uses.
// Needs a server on :8787 (npm run dev:real, or npm run dev).
//
//   npm run say -- "Aditya builds AI agents with FastAPI and LangGraph."
//   npm run say -- --no-play "text"                    (just save the file)
//   npm run say -- --variants "Uh dit yuh|Adit ya|Adithya"
//                                                      (play each respelling in turn)
//
// Variants are sent as written. They still pass through src/pronounce.ts, so avoid words
// that rule rewrites. To make a respelling permanent, edit WORDS in src/pronounce.ts and
// restart the server.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const play = !args.includes('--no-play');
const variantsAt = args.indexOf('--variants');
const variants =
	variantsAt >= 0
		? (args[variantsAt + 1] ?? '')
				.split('|')
				.map((v) => v.trim())
				.filter(Boolean)
		: [];
const text = args
	.filter((arg, i) => arg !== '--no-play' && arg !== '--variants' && i !== variantsAt + 1)
	.join(' ')
	.trim();

if (variants.length === 0 && !text) {
	console.error('Usage: npm run say -- "some text"   or   npm run say -- --variants "a|b|c"');
	process.exit(1);
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8787';
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:8000';

async function synthesize(input) {
	const response = await fetch(`${BASE_URL}/speak`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
		body: JSON.stringify({ text: input }),
	}).catch(() => null);
	if (!response) {
		console.error(`Could not reach ${BASE_URL}. Start the server first: npm run dev:real`);
		process.exit(1);
	}
	if (!response.ok) {
		console.error(`/speak returned ${response.status}: ${await response.text()}`);
		process.exit(1);
	}
	const file = join(tmpdir(), `voice-agent-say-${Date.now()}.wav`);
	await writeFile(file, Buffer.from(await response.arrayBuffer()));
	return file;
}

// afplay is macOS only.
const playFile = (file) =>
	new Promise((resolve) => {
		const player = spawn('afplay', [file], { stdio: 'inherit' });
		player.on('error', () => {
			console.error('afplay not found; open the saved file to listen.');
			resolve();
		});
		player.on('exit', resolve);
	});

if (variants.length > 0) {
	// A short carrier phrase puts the word in a natural sentence, which is how it will be heard.
	const carrier = text || '{}';
	for (const [i, variant] of variants.entries()) {
		const sentence = carrier.includes('{}')
			? carrier.replace('{}', variant)
			: `${carrier} ${variant}`;
		const spoken = text ? sentence : variant;
		console.log(`${i + 1}/${variants.length}  "${variant}"`);
		const file = await synthesize(spoken);
		if (play) await playFile(file);
	}
} else {
	const file = await synthesize(text);
	console.log(`saved ${file}`);
	if (play) await playFile(file);
}
