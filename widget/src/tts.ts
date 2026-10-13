import { splitSentences } from './sentences';
import type { Speaker } from './speech';
import { encodeWav } from './wav';

/**
 * Speaks replies with Workers AI text-to-speech. The reply is split into
 * sentences that are synthesised in parallel and played in order, so audio
 * starts as soon as the first sentence is ready.
 */
export class WorkersSpeaker implements Speaker {
	readonly supported = typeof Audio !== 'undefined';

	private readonly audio = this.supported ? new Audio() : null;
	private controller: AbortController | null = null;
	private generation = 0;
	private abortPlayback: (() => void) | null = null;

	constructor(private readonly baseUrl: string) {}

	prime(): void {
		if (!this.audio || this.audio.src) return;
		// Playing a silent clip during a click unlocks later playback in Safari.
		const silence = URL.createObjectURL(
			new Blob([encodeWav(new Float32Array(160))], { type: 'audio/wav' }),
		);
		this.audio.src = silence;
		this.audio.play().catch(() => {});
	}

	speak(text: string, handlers: { onStart(): void; onEnd(): void }): void {
		this.cancel();
		const parts = splitSentences(text);
		if (!this.audio || parts.length === 0) return handlers.onEnd();

		const generation = ++this.generation;
		const controller = new AbortController();
		this.controller = controller;
		const clips = parts.map((part) => this.fetchClip(part, controller.signal));
		void this.playAll(clips, generation, handlers);
	}

	cancel(): void {
		this.generation++;
		this.controller?.abort();
		this.controller = null;
		this.abortPlayback?.();
		this.audio?.pause();
	}

	private async fetchClip(text: string, signal: AbortSignal): Promise<string | null> {
		try {
			const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/speak`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
				signal,
			});
			if (!response.ok) return null;
			return URL.createObjectURL(await response.blob());
		} catch {
			return null;
		}
	}

	private async playAll(
		clips: Promise<string | null>[],
		generation: number,
		handlers: { onStart(): void; onEnd(): void },
	): Promise<void> {
		let started = false;
		for (const clip of clips) {
			const url = await clip;
			if (!url) continue;
			if (generation !== this.generation) {
				URL.revokeObjectURL(url); // cancelled: drain and free the remaining clips
				continue;
			}
			const played = await this.play(url, () => {
				if (!started) {
					started = true;
					handlers.onStart();
				}
			});
			URL.revokeObjectURL(url);
			if (!played && generation !== this.generation) break;
		}
		if (generation === this.generation) handlers.onEnd();
	}

	private play(url: string, onPlaying: () => void): Promise<boolean> {
		const audio = this.audio;
		if (!audio) return Promise.resolve(false);
		return new Promise((resolve) => {
			const done = (ok: boolean) => {
				audio.onended = null;
				audio.onerror = null;
				this.abortPlayback = null;
				resolve(ok);
			};
			this.abortPlayback = () => done(false);
			audio.onended = () => done(true);
			audio.onerror = () => done(false);
			audio.src = url;
			audio.play().then(onPlaying, () => done(false));
		});
	}
}
