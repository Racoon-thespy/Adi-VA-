import { describe, expect, it } from 'vitest';
import {
	type SpeechToText,
	type TextToSpeech,
	WorkersAITextToSpeech,
	fromBase64,
	isWav,
	sniffAudioType,
	toBase64,
} from '../src/audio';
import { type Deps, type Env, handle } from '../src/index';
import { MAX_AUDIO_BYTES, MAX_SPEAK_CHARS } from '../src/validate';

const ORIGIN = 'https://racoon-thespy.github.io';

/** A minimal valid-looking WAV: RIFF....WAVE header plus silence. */
function wav(length = 1000): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(length);
	bytes.set(new TextEncoder().encode('RIFF'), 0);
	bytes.set(new TextEncoder().encode('WAVE'), 8);
	return bytes;
}

function makeEnv(chatOk = true, audioOk = true): Env {
	return {
		AI: {} as Ai,
		RATE_LIMITER: { limit: async () => ({ success: chatOk }) },
		AUDIO_LIMITER: { limit: async () => ({ success: audioOk }) },
		ALLOWED_ORIGIN: ORIGIN,
	};
}

function makeDeps(overrides: Partial<Deps> = {}) {
	const calls = { stt: [] as Uint8Array[], tts: [] as string[] };
	const stt: SpeechToText = {
		transcribe: async (bytes) => {
			calls.stt.push(bytes);
			return 'what does aditya do';
		},
	};
	const tts: TextToSpeech = {
		synthesize: async (text) => {
			calls.tts.push(text);
			return { bytes: wav(), contentType: 'audio/wav' };
		},
	};
	return { deps: { brain: { reply: async () => 'ok' }, stt, tts, ...overrides }, calls };
}

const post = (path: string, body: BodyInit, contentType: string, origin: string | null = ORIGIN) =>
	new Request(`https://worker.test${path}`, {
		method: 'POST',
		headers: { 'Content-Type': contentType, ...(origin ? { Origin: origin } : {}) },
		body,
	});

describe('POST /transcribe', () => {
	it('transcribes a WAV upload', async () => {
		const { deps, calls } = makeDeps();
		const res = await handle(post('/transcribe', wav(), 'audio/wav'), makeEnv(), deps);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ text: 'what does aditya do' });
		expect(calls.stt).toHaveLength(1);
	});

	it('rejects non-WAV bytes without calling the model', async () => {
		const { deps, calls } = makeDeps();
		const res = await handle(
			post('/transcribe', new Uint8Array(500).fill(7), 'audio/wav'),
			makeEnv(),
			deps,
		);
		expect(res.status).toBe(400);
		expect(calls.stt).toHaveLength(0);
	});

	it('rejects oversized recordings', async () => {
		const { deps, calls } = makeDeps();
		const res = await handle(
			post('/transcribe', wav(MAX_AUDIO_BYTES + 1), 'audio/wav'),
			makeEnv(),
			deps,
		);
		expect(res.status).toBe(413);
		expect(calls.stt).toHaveLength(0);
	});

	it('caps the transcript length at the chat input limit', async () => {
		const { deps } = makeDeps({ stt: { transcribe: async () => 'a'.repeat(5000) } });
		const res = await handle(post('/transcribe', wav(), 'audio/wav'), makeEnv(), deps);
		const { text } = (await res.json()) as { text: string };
		expect(text).toHaveLength(300);
	});

	it('enforces the origin check and the audio rate limit', async () => {
		const { deps, calls } = makeDeps();
		const foreign = await handle(
			post('/transcribe', wav(), 'audio/wav', 'https://evil.example'),
			makeEnv(),
			deps,
		);
		expect(foreign.status).toBe(403);
		const limited = await handle(
			post('/transcribe', wav(), 'audio/wav'),
			makeEnv(true, false),
			deps,
		);
		expect(limited.status).toBe(429);
		expect(calls.stt).toHaveLength(0);
	});

	it('returns 503 without leaking details when transcription fails', async () => {
		const { deps } = makeDeps({
			stt: {
				transcribe: async () => {
					throw new Error('secret quota detail');
				},
			},
		});
		const res = await handle(post('/transcribe', wav(), 'audio/wav'), makeEnv(), deps);
		expect(res.status).toBe(503);
		expect(await res.text()).not.toContain('secret');
	});
});

describe('POST /speak', () => {
	const speak = (body: unknown, origin: string | null = ORIGIN) =>
		post('/speak', JSON.stringify(body), 'application/json', origin);

	it('returns audio with the detected content type', async () => {
		const { deps, calls } = makeDeps();
		const res = await handle(speak({ text: 'Hello there.' }), makeEnv(), deps);
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('audio/wav');
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
		expect((await res.arrayBuffer()).byteLength).toBe(1000);
		expect(calls.tts).toEqual(['Hello there.']);
	});

	it('rejects empty, oversized and malformed input without calling the model', async () => {
		const { deps, calls } = makeDeps();
		const env = makeEnv();
		expect((await handle(speak({ text: '   ' }), env, deps)).status).toBe(400);
		expect((await handle(speak({ text: 'x'.repeat(MAX_SPEAK_CHARS + 1) }), env, deps)).status).toBe(
			400,
		);
		expect((await handle(speak({ text: 42 }), env, deps)).status).toBe(400);
		expect((await handle(speak('nope'), env, deps)).status).toBe(400);
		expect(calls.tts).toHaveLength(0);
	});

	it('enforces the origin check and the audio rate limit', async () => {
		const { deps, calls } = makeDeps();
		expect(
			(await handle(speak({ text: 'hi' }, 'https://evil.example'), makeEnv(), deps)).status,
		).toBe(403);
		expect((await handle(speak({ text: 'hi' }), makeEnv(true, false), deps)).status).toBe(429);
		expect(calls.tts).toHaveLength(0);
	});

	it('is limited separately from /chat', async () => {
		const { deps } = makeDeps();
		// Chat limiter exhausted, audio limiter fine: speech still works.
		const res = await handle(speak({ text: 'hi' }), makeEnv(false, true), deps);
		expect(res.status).toBe(200);
	});

	it('answers the CORS preflight for the audio routes', async () => {
		const { deps } = makeDeps();
		for (const path of ['/transcribe', '/speak']) {
			const req = new Request(`https://worker.test${path}`, {
				method: 'OPTIONS',
				headers: { Origin: ORIGIN },
			});
			const res = await handle(req, makeEnv(), deps);
			expect(res.status).toBe(204);
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
		}
	});
});

describe('audio helpers', () => {
	it('round-trips bytes through base64, including large buffers', () => {
		const bytes = Uint8Array.from({ length: 100_000 }, (_, i) => i % 256);
		expect(fromBase64(toBase64(bytes))).toEqual(bytes);
	});

	it('detects WAV and MP3 from the bytes, not from a label', () => {
		expect(isWav(wav())).toBe(true);
		expect(isWav(new Uint8Array(100))).toBe(false);
		expect(sniffAudioType(wav())).toBe('audio/wav');
		expect(sniffAudioType(Uint8Array.of(0x49, 0x44, 0x33, 4, 0))).toBe('audio/mpeg');
		expect(sniffAudioType(Uint8Array.of(1, 2, 3, 4))).toBe('application/octet-stream');
	});

	it('accepts the text-to-speech binding returning base64 JSON or raw bytes', async () => {
		const bytes = wav(200);
		const asJson = new WorkersAITextToSpeech({
			run: async () => ({ audio: toBase64(bytes) }),
		} as unknown as Ai);
		const asBytes = new WorkersAITextToSpeech({ run: async () => bytes } as unknown as Ai);
		expect((await asJson.synthesize('hi')).bytes).toEqual(bytes);
		expect((await asBytes.synthesize('hi')).contentType).toBe('audio/wav');
	});

	it('fails clearly on unexpected text-to-speech output', async () => {
		const broken = new WorkersAITextToSpeech({
			run: async () => ({ nope: true }),
		} as unknown as Ai);
		await expect(broken.synthesize('hi')).rejects.toThrow('Unexpected');
	});
});
