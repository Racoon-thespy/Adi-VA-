import { SilenceDetector } from './silence';
import type { Transcriber, TranscriberHandlers } from './speech';
import { blobToWav } from './wav';

interface Run {
	cancelled: boolean;
	finish: (() => void) | null;
}

const POLL_MS = 50;

function micErrorMessage(error: unknown): string {
	const name = (error as { name?: string } | null)?.name;
	if (name === 'NotAllowedError' || name === 'SecurityError') {
		return 'Microphone access is blocked. Allow it in your browser, or type instead.';
	}
	if (name === 'NotFoundError')
		return "I can't find a microphone. You can type your question instead.";
	return "I couldn't start the microphone. Please try again, or type your question.";
}

/** Records with MediaRecorder, ends on silence, and transcribes with Whisper via the Worker. */
export class WhisperTranscriber implements Transcriber {
	private current: Run | null = null;

	constructor(private readonly baseUrl: string) {}

	get supported(): boolean {
		return (
			typeof MediaRecorder !== 'undefined' &&
			typeof AudioContext !== 'undefined' &&
			typeof navigator.mediaDevices?.getUserMedia === 'function'
		);
	}

	start(handlers: TranscriberHandlers): void {
		this.cancel();
		const run: Run = { cancelled: false, finish: null };
		this.current = run;
		void this.record(run, handlers);
	}

	stop(): void {
		this.current?.finish?.();
	}

	cancel(): void {
		if (!this.current) return;
		this.current.cancelled = true;
		this.current.finish?.();
		this.current = null;
	}

	private async record(run: Run, handlers: TranscriberHandlers): Promise<void> {
		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true },
			});
		} catch (error) {
			if (!run.cancelled) handlers.onError(micErrorMessage(error));
			handlers.onEnd();
			return;
		}

		const chunks: Blob[] = [];
		const recorder = new MediaRecorder(stream);
		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.push(event.data);
		};
		const stopped = new Promise<void>((resolve) => {
			recorder.onstop = () => resolve();
		});

		const context = new AudioContext();
		const analyser = context.createAnalyser();
		analyser.fftSize = 1024;
		context.createMediaStreamSource(stream).connect(analyser);
		const samples = new Float32Array(analyser.fftSize);
		const detector = new SilenceDetector();

		const finish = () => {
			if (recorder.state !== 'inactive') recorder.stop();
		};
		run.finish = finish;
		// cancel() may have arrived while the permission prompt was open.
		if (run.cancelled) finish();
		const timer = setInterval(() => {
			analyser.getFloatTimeDomainData(samples);
			let sum = 0;
			for (const value of samples) sum += value * value;
			const rms = Math.sqrt(sum / samples.length);
			if (detector.feed(rms, performance.now()) === 'stop') finish();
		}, POLL_MS);

		if (!run.cancelled) recorder.start();
		else stopped.then(undefined, () => {});
		if (recorder.state === 'recording') await stopped;

		clearInterval(timer);
		for (const track of stream.getTracks()) track.stop();
		void context.close();

		if (run.cancelled) return handlers.onEnd();
		if (!detector.heardSpeech || chunks.length === 0) {
			handlers.onError("I didn't hear anything. Tap the mic and try again.");
			return handlers.onEnd();
		}

		handlers.onProcessing();
		const startedAt = performance.now();
		try {
			const wav = await blobToWav(new Blob(chunks, { type: recorder.mimeType }));
			if (run.cancelled) return handlers.onEnd();

			const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/transcribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'audio/wav' },
				body: wav,
			});
			if (run.cancelled) return handlers.onEnd();
			if (response.status === 429) {
				handlers.onError('That was a lot at once. Give it a few seconds.');
				return handlers.onEnd();
			}
			if (!response.ok) throw new Error(`transcribe ${response.status}`);

			const { text } = (await response.json()) as { text?: unknown };
			console.debug(`voice-agent: transcribed in ${Math.round(performance.now() - startedAt)} ms`);
			if (run.cancelled) return handlers.onEnd();
			if (typeof text === 'string' && text.trim()) handlers.onFinal(text.trim());
			else handlers.onError("I couldn't make that out. Try again, or type your question.");
		} catch {
			if (!run.cancelled) {
				handlers.onError('Transcription failed. Please try again, or type your question.');
			}
		}
		handlers.onEnd();
	}
}
