import { describe, expect, it } from 'vitest';
import { isWav } from '../src/audio';
import { DEFAULT_SILENCE, SilenceDetector } from '../widget/src/silence';
import { splitSentences } from '../widget/src/sentences';
import { WAV_SAMPLE_RATE, encodeWav } from '../widget/src/wav';

describe('encodeWav', () => {
	it('writes a 16 kHz mono 16-bit PCM header the Worker accepts', () => {
		const bytes = new Uint8Array(encodeWav(new Float32Array(1600)));
		const view = new DataView(bytes.buffer);
		expect(isWav(bytes)).toBe(true);
		expect(bytes.byteLength).toBe(44 + 3200);
		expect(view.getUint32(4, true)).toBe(36 + 3200);
		expect(view.getUint16(20, true)).toBe(1); // PCM
		expect(view.getUint16(22, true)).toBe(1); // mono
		expect(view.getUint32(24, true)).toBe(WAV_SAMPLE_RATE);
		expect(view.getUint16(34, true)).toBe(16);
		expect(view.getUint32(40, true)).toBe(3200);
	});

	it('scales samples to 16-bit and clamps out-of-range values', () => {
		const view = new DataView(encodeWav(Float32Array.of(0, 1, -1, 5, -5, 0.5)));
		const sample = (i: number) => view.getInt16(44 + i * 2, true);
		expect(sample(0)).toBe(0);
		expect(sample(1)).toBe(32767);
		expect(sample(2)).toBe(-32768);
		expect(sample(3)).toBe(32767);
		expect(sample(4)).toBe(-32768);
		expect(sample(5)).toBe(Math.trunc(0.5 * 0x7fff));
	});

	it('keeps a maximum-length recording under the Worker upload cap', async () => {
		const { MAX_AUDIO_BYTES } = await import('../src/validate');
		const samples = (DEFAULT_SILENCE.maxMs / 1000) * WAV_SAMPLE_RATE;
		expect(44 + samples * 2).toBeLessThan(MAX_AUDIO_BYTES);
	});
});

describe('SilenceDetector', () => {
	const LOUD = 0.2;
	const QUIET = 0.001;

	it('keeps listening while the visitor is speaking', () => {
		const detector = new SilenceDetector();
		for (let t = 0; t < 3000; t += 50) expect(detector.feed(LOUD, t)).toBe('listening');
		expect(detector.heardSpeech).toBe(true);
	});

	it('stops after a pause that follows speech', () => {
		const detector = new SilenceDetector();
		detector.feed(LOUD, 0);
		detector.feed(LOUD, 500);
		expect(detector.feed(QUIET, 500 + DEFAULT_SILENCE.silenceMs - 50)).toBe('listening');
		expect(detector.feed(QUIET, 500 + DEFAULT_SILENCE.silenceMs)).toBe('stop');
	});

	it('gives up when nothing is said, without having heard speech', () => {
		const detector = new SilenceDetector();
		expect(detector.feed(QUIET, 0)).toBe('listening');
		expect(detector.feed(QUIET, DEFAULT_SILENCE.noSpeechMs)).toBe('stop');
		expect(detector.heardSpeech).toBe(false);
	});

	it('stops at the maximum length even if the visitor keeps talking', () => {
		const detector = new SilenceDetector();
		detector.feed(LOUD, 0);
		expect(detector.feed(LOUD, DEFAULT_SILENCE.maxMs)).toBe('stop');
	});
});

describe('splitSentences', () => {
	it('returns nothing for blank text', () => {
		expect(splitSentences('   ')).toEqual([]);
	});

	it('keeps a short reply as a single clip', () => {
		expect(splitSentences('Sure thing.')).toEqual(['Sure thing.']);
	});

	it('splits a longer reply at sentence ends', () => {
		const text =
			'Aditya builds AI agents with LangGraph and FastAPI. He has also made cascade voice agents that chain speech and language models. Ask me about either one of those projects.';
		expect(splitSentences(text)).toEqual([
			'Aditya builds AI agents with LangGraph and FastAPI.',
			'He has also made cascade voice agents that chain speech and language models.',
			'Ask me about either one of those projects.',
		]);
	});

	it('merges a trailing sentence into a clip that is still short', () => {
		expect(splitSentences('He builds agents. Ask me about them anytime you like.')).toEqual([
			'He builds agents. Ask me about them anytime you like.',
		]);
	});

	it('merges tiny fragments into the previous clip', () => {
		expect(splitSentences('Yes. He builds AI agents with LangGraph and FastAPI.')).toEqual([
			'Yes. He builds AI agents with LangGraph and FastAPI.',
		]);
	});

	it('never produces more clips than the cap and loses no text', () => {
		const text = Array.from(
			{ length: 8 },
			(_, i) => `This is a reasonably long sentence number ${i}.`,
		).join(' ');
		const parts = splitSentences(text);
		expect(parts.length).toBeLessThanOrEqual(3);
		expect(parts.join(' ')).toBe(text);
	});

	it('handles text without terminal punctuation', () => {
		expect(splitSentences('no punctuation here at all')).toEqual(['no punctuation here at all']);
	});
});
