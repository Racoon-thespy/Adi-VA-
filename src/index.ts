import { type Brain, WorkersAIBrain } from './brain';
import { SYSTEM_PROMPT } from './prompt';
import { parseMessages } from './validate';

export interface Env {
	AI: Ai;
	RATE_LIMITER: RateLimit;
	ALLOWED_ORIGIN: string;
	/** Set to "true" in .dev.vars only; lets the widget on localhost call the Worker. */
	DEV_ALLOW_LOCALHOST?: string;
}

const MAX_BODY_BYTES = 4096;
const MAX_REPLY_CHARS = 600;
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin: string | null, env: Env): origin is string {
	if (!origin) return false;
	if (origin === env.ALLOWED_ORIGIN) return true;
	return env.DEV_ALLOW_LOCALHOST === 'true' && LOCALHOST.test(origin);
}

function json(data: unknown, status: number, origin: string | null): Response {
	const headers: Record<string, string> = { 'Content-Type': 'application/json', Vary: 'Origin' };
	if (origin) {
		headers['Access-Control-Allow-Origin'] = origin;
	}
	return new Response(JSON.stringify(data), { status, headers });
}

export async function handle(request: Request, env: Env, brain: Brain): Promise<Response> {
	const origin = request.headers.get('Origin');
	const url = new URL(request.url);

	if (url.pathname !== '/chat') {
		return json({ error: 'Not found.' }, 404, null);
	}
	if (!isAllowedOrigin(origin, env)) {
		return json({ error: 'Origin not allowed.' }, 403, null);
	}

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
				Vary: 'Origin',
			},
		});
	}
	if (request.method !== 'POST') {
		return json({ error: 'Method not allowed.' }, 405, origin);
	}

	const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
	const { success } = await env.RATE_LIMITER.limit({ key: ip });
	if (!success) {
		return json({ error: 'Too many requests. Please wait a moment.' }, 429, origin);
	}

	const declared = Number(request.headers.get('Content-Length') ?? 0);
	if (declared > MAX_BODY_BYTES) {
		return json({ error: 'Request too large.' }, 413, origin);
	}
	const text = await request.text();
	if (text.length > MAX_BODY_BYTES) {
		return json({ error: 'Request too large.' }, 413, origin);
	}

	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch {
		return json({ error: 'Invalid JSON.' }, 400, origin);
	}
	const parsed = parseMessages(body);
	if (!parsed.ok) {
		return json({ error: parsed.error }, 400, origin);
	}

	try {
		const reply = (await brain.reply(SYSTEM_PROMPT, parsed.messages)).slice(0, MAX_REPLY_CHARS);
		return json(
			{ reply: reply || "Sorry, I didn't catch that. Could you ask again?" },
			200,
			origin,
		);
	} catch (error) {
		console.error('brain failed', error);
		return json({ error: 'The assistant is unavailable right now.' }, 503, origin);
	}
}

export default {
	fetch(request: Request, env: Env): Promise<Response> {
		return handle(request, env, new WorkersAIBrain(env.AI));
	},
} satisfies ExportedHandler<Env>;
