import {
	type SpeechToText,
	type TextToSpeech,
	WorkersAISpeechToText,
	WorkersAITextToSpeech,
	isWav,
} from './audio';
import { type Brain, WorkersAIBrain } from './brain';
import { guardReply } from './guard';
import { forSpeech } from './pronounce';
import { SYSTEM_PROMPT } from './prompt';
import { MAX_AUDIO_BYTES, MAX_TRANSCRIPT_CHARS, parseMessages, parseSpeakBody } from './validate';

export interface Env {
	AI: Ai;
	/** Guards the costly LLM endpoint. */
	RATE_LIMITER: RateLimit;
	/** Guards /transcribe and /speak, which are cheap but called several times per question. */
	AUDIO_LIMITER: RateLimit;
	ALLOWED_ORIGIN: string;
	/** Set to "true" in .dev.vars only; lets the widget on localhost call the Worker. */
	DEV_ALLOW_LOCALHOST?: string;
}

/** The three swappable stages of the cascade. */
export interface Deps {
	brain: Brain;
	stt: SpeechToText;
	tts: TextToSpeech;
}

const MAX_JSON_BYTES = 4096;
const MAX_REPLY_CHARS = 600;
const ROUTES = new Set(['/chat', '/transcribe', '/speak']);
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin: string | null, env: Env): origin is string {
	if (!origin) return false;
	if (origin === env.ALLOWED_ORIGIN) return true;
	return env.DEV_ALLOW_LOCALHOST === 'true' && LOCALHOST.test(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
	return origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
}

function json(data: unknown, status: number, origin: string | null): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
	});
}

/** Reads a request body, stopping as soon as it exceeds the limit. Returns null if too large. */
async function readLimited(request: Request, maxBytes: number): Promise<Uint8Array | null> {
	if (Number(request.headers.get('Content-Length') ?? 0) > maxBytes) return null;
	if (!request.body) return new Uint8Array();

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.length;
		if (total > maxBytes) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.length;
	}
	return bytes;
}

async function readJson(request: Request): Promise<{ body: unknown } | Response> {
	const origin = request.headers.get('Origin');
	const bytes = await readLimited(request, MAX_JSON_BYTES);
	if (!bytes) return json({ error: 'Request too large.' }, 413, origin);
	try {
		return { body: JSON.parse(new TextDecoder().decode(bytes)) };
	} catch {
		return json({ error: 'Invalid JSON.' }, 400, origin);
	}
}

async function handleChat(request: Request, deps: Deps, origin: string): Promise<Response> {
	const read = await readJson(request);
	if (read instanceof Response) return read;

	const parsed = parseMessages(read.body);
	if (!parsed.ok) return json({ error: parsed.error }, 400, origin);

	try {
		const raw = await deps.brain.reply(SYSTEM_PROMPT, parsed.messages);
		const reply = guardReply(raw).slice(0, MAX_REPLY_CHARS);
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

async function handleTranscribe(request: Request, deps: Deps, origin: string): Promise<Response> {
	const bytes = await readLimited(request, MAX_AUDIO_BYTES);
	if (!bytes) return json({ error: 'Recording too large.' }, 413, origin);
	if (!isWav(bytes)) return json({ error: 'Expected a WAV recording.' }, 400, origin);

	try {
		const text = (await deps.stt.transcribe(bytes)).slice(0, MAX_TRANSCRIPT_CHARS);
		return json({ text }, 200, origin);
	} catch (error) {
		console.error('transcription failed', error);
		return json({ error: 'Transcription is unavailable right now.' }, 503, origin);
	}
}

async function handleSpeak(request: Request, deps: Deps, origin: string): Promise<Response> {
	const read = await readJson(request);
	if (read instanceof Response) return read;

	const parsed = parseSpeakBody(read.body);
	if (!parsed.ok) return json({ error: parsed.error }, 400, origin);

	try {
		const { bytes, contentType } = await deps.tts.synthesize(forSpeech(parsed.text));
		return new Response(bytes.slice(), {
			headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store', ...corsHeaders(origin) },
		});
	} catch (error) {
		console.error('speech synthesis failed', error);
		return json({ error: 'Speech is unavailable right now.' }, 503, origin);
	}
}

export async function handle(request: Request, env: Env, deps: Deps): Promise<Response> {
	const origin = request.headers.get('Origin');
	const { pathname } = new URL(request.url);

	if (!ROUTES.has(pathname)) return json({ error: 'Not found.' }, 404, null);
	if (!isAllowedOrigin(origin, env)) return json({ error: 'Origin not allowed.' }, 403, null);

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				...corsHeaders(origin),
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
			},
		});
	}
	if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);

	const limiter = pathname === '/chat' ? env.RATE_LIMITER : env.AUDIO_LIMITER;
	const { success } = await limiter.limit({
		key: request.headers.get('CF-Connecting-IP') ?? 'unknown',
	});
	if (!success) return json({ error: 'Too many requests. Please wait a moment.' }, 429, origin);

	if (pathname === '/chat') return handleChat(request, deps, origin);
	if (pathname === '/transcribe') return handleTranscribe(request, deps, origin);
	return handleSpeak(request, deps, origin);
}

export default {
	fetch(request: Request, env: Env): Promise<Response> {
		return handle(request, env, {
			brain: new WorkersAIBrain(env.AI),
			stt: new WorkersAISpeechToText(env.AI),
			tts: new WorkersAITextToSpeech(env.AI),
		});
	},
} satisfies ExportedHandler<Env>;
