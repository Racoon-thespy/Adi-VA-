/** Speech-to-text stage of the cascade (browser audio in, text out). */
export interface SpeechToText {
	transcribe(wav: Uint8Array): Promise<string>;
}

/** Text-to-speech stage of the cascade. */
export interface TextToSpeech {
	synthesize(text: string): Promise<{ bytes: Uint8Array; contentType: string }>;
}

export const STT_MODEL = '@cf/openai/whisper-large-v3-turbo';
export const TTS_MODEL = '@cf/myshell-ai/melotts';

// Biases Whisper towards the names and terms visitors are likely to say.
const STT_HINT =
	'Questions about Aditya Pratap Singh, a developer who uses LangGraph, FastAPI, RAG, PyTorch and Google ADK.';

const CHUNK = 0x8000;

export function toBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i += CHUNK) {
		binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/** True for a RIFF/WAVE header, the only upload format the widget produces. */
export function isWav(bytes: Uint8Array): boolean {
	const tag = (start: number) => String.fromCharCode(...bytes.subarray(start, start + 4));
	return bytes.length > 44 && tag(0) === 'RIFF' && tag(8) === 'WAVE';
}

/**
 * Workers AI labels MeloTTS output "MP3" but returns WAV, so the type is read
 * from the bytes instead of trusting the label.
 */
export function sniffAudioType(bytes: Uint8Array): string {
	if (isWav(bytes)) return 'audio/wav';
	const tag = String.fromCharCode(...bytes.subarray(0, 3));
	if (tag === 'ID3' || (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0))
		return 'audio/mpeg';
	return 'application/octet-stream';
}

export class WorkersAISpeechToText implements SpeechToText {
	constructor(private readonly ai: Ai) {}

	async transcribe(wav: Uint8Array): Promise<string> {
		const result = (await this.ai.run(STT_MODEL, {
			audio: toBase64(wav),
			initial_prompt: STT_HINT,
		})) as { text?: string };
		return (result.text ?? '').trim();
	}
}

export class WorkersAITextToSpeech implements TextToSpeech {
	constructor(private readonly ai: Ai) {}

	async synthesize(text: string): Promise<{ bytes: Uint8Array; contentType: string }> {
		const result: unknown = await this.ai.run(TTS_MODEL, { prompt: text, lang: 'en' });
		const bytes = await toBytes(result);
		return { bytes, contentType: sniffAudioType(bytes) };
	}
}

// The binding returns { audio: <base64> }, but the schema also allows raw binary.
async function toBytes(result: unknown): Promise<Uint8Array> {
	if (result instanceof ReadableStream)
		return new Uint8Array(await new Response(result).arrayBuffer());
	if (result instanceof ArrayBuffer) return new Uint8Array(result);
	if (result instanceof Uint8Array) return result;
	const audio = (result as { audio?: unknown } | null)?.audio;
	if (typeof audio === 'string' && audio.length > 0) return fromBase64(audio);
	throw new Error('Unexpected text-to-speech output');
}
