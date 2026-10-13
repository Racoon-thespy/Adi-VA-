// A fake /chat endpoint for trying the widget UI without Cloudflare.
// Run: node dev/stub-server.mjs   (listens on http://localhost:8787)
import { createServer } from 'node:http';

const PORT = 8787;
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

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

	if (req.method === 'OPTIONS') {
		res.writeHead(204, cors).end();
		return;
	}
	if (req.method !== 'POST' || req.url !== '/chat') {
		res.writeHead(404, cors).end();
		return;
	}

	let body = '';
	req.on('data', (chunk) => (body += chunk));
	req.on('end', () => {
		let last = '';
		try {
			last = JSON.parse(body).messages.at(-1).content;
		} catch {
			res.writeHead(400, cors).end(JSON.stringify({ error: 'bad request' }));
			return;
		}
		const reply = `This is a stub answer. You asked: ${last.slice(0, 80)}`;
		setTimeout(() => {
			res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ reply }));
		}, 600);
	});
}).listen(PORT, () => console.log(`stub API on http://localhost:${PORT}`));
