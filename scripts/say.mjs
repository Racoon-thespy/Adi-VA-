// Hear how the agent will pronounce a sentence, using the same /speak endpoint the widget uses.
// Needs a server on :8787 (npm run dev:real, or npm run dev).
//
//   npm run say -- "Aditya builds AI agents with FastAPI and LangGraph."
//   npm run say -- --no-play "text"        (just save the file)
//
// To fix a mispronounced word, edit src/pronounce.ts, restart the server, and run this again.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const play = !args.includes('--no-play');
const text = args
	.filter((arg) => arg !== '--no-play')
	.join(' ')
	.trim();
if (!text) {
	console.error('Usage: npm run say -- "some text to speak"');
	process.exit(1);
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8787';
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:8000';

const response = await fetch(`${BASE_URL}/speak`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
	body: JSON.stringify({ text }),
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
console.log(`saved ${file}`);

if (play) {
	// afplay is macOS only.
	spawn('afplay', [file], { stdio: 'inherit' }).on('error', () =>
		console.error('afplay not found; open the file above to listen.'),
	);
}
