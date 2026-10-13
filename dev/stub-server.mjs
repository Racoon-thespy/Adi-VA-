// Fake /chat, /transcribe and /speak endpoints for trying the widget UI without Cloudflare.
// Run: node dev/stub-server.mjs   (listens on http://localhost:8787)
import { createServer } from 'node:http';

const PORT = 8787;
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** A short 440 Hz beep as a WAV file, standing in for synthesised speech. */
function beep(seconds = 0.4, rate = 16000) {
	const count = Math.floor(seconds * rate);
	const buffer = Buffer.alloc(44 + count * 2);
	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + count * 2, 4);
	buffer.write('WAVEfmt ', 8);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20);
	buffer.writeUInt16LE(1, 22);
	buffer.writeUInt32LE(rate, 24);
	buffer.writeUInt32LE(rate * 2, 28);
	buffer.writeUInt16LE(2, 32);
	buffer.writeUInt16LE(16, 34);
	buffer.write('data', 36);
	buffer.writeUInt32LE(count * 2, 40);
	for (let i = 0; i < count; i++) {
		buffer.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 6000), 44 + i * 2);
	}
	return buffer;
}

createServer((req, res) => {
	const origin = req.headers.origin ?? '';
	const cors = LOCALHOST.test(origin)
		? {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				Vary: 'Origin',
			}
		: {};
	const json = (status, data) => {
		res.writeHead(status, { ...cors, 'Content-Type': 'application/json' });
		res.end(JSON.stringify(data));
	};

	if (req.method === 'OPTIONS') {
		res.writeHead(204, cors).end();
		return;
	}
	if (req.method !== 'POST' || !['/chat', '/transcribe', '/speak'].includes(req.url ?? '')) {
		res.writeHead(404, cors).end();
		return;
	}

	const chunks = [];
	req.on('data', (chunk) => chunks.push(chunk));
	req.on('end', () => {
		const body = Buffer.concat(chunks);

		if (req.url === '/transcribe') {
			const isWav = body.subarray(0, 4).toString() === 'RIFF';
			console.log(`transcribe: ${body.length} bytes, WAV header: ${isWav}`);
			setTimeout(() => json(isWav ? 200 : 400, { text: 'What does Aditya work on?' }), 500);
			return;
		}

		let parsed;
		try {
			parsed = JSON.parse(body.toString());
		} catch {
			return json(400, { error: 'bad request' });
		}

		if (req.url === '/speak') {
			setTimeout(() => {
				res.writeHead(200, { ...cors, 'Content-Type': 'audio/wav' });
				res.end(beep());
			}, 300);
			return;
		}

		const last = parsed?.messages?.at(-1)?.content;
		if (typeof last !== 'string') return json(400, { error: 'bad request' });
		setTimeout(
			() => json(200, { reply: `This is a stub answer. You asked: ${last.slice(0, 80)}` }),
			600,
		);
	});
}).listen(PORT, () => console.log(`stub API on http://localhost:${PORT}`));
