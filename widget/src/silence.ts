export interface SilenceConfig {
	/** RMS level (0 to 1) above which the microphone counts as hearing speech. */
	speechThreshold: number;
	/** Silence after speech that ends the recording. */
	silenceMs: number;
	/** Hard cap on recording length; keeps uploads under the Worker's size limit. */
	maxMs: number;
	/** Give up if nothing is said for this long. */
	noSpeechMs: number;
}

export const DEFAULT_SILENCE: SilenceConfig = {
	speechThreshold: 0.02,
	silenceMs: 1200,
	maxMs: 15_000,
	noSpeechMs: 7000,
};

export type Verdict = 'listening' | 'stop';

/** Decides when to end a recording, so the visitor never has to press stop. */
export class SilenceDetector {
	private startedAt: number | null = null;
	private lastSpeechAt = 0;
	private heard = false;

	constructor(private readonly config: SilenceConfig = DEFAULT_SILENCE) {}

	get heardSpeech(): boolean {
		return this.heard;
	}

	feed(rms: number, now: number): Verdict {
		this.startedAt ??= now;
		if (rms >= this.config.speechThreshold) {
			this.heard = true;
			this.lastSpeechAt = now;
		}
		const elapsed = now - this.startedAt;
		if (elapsed >= this.config.maxMs) return 'stop';
		if (this.heard && now - this.lastSpeechAt >= this.config.silenceMs) return 'stop';
		if (!this.heard && elapsed >= this.config.noSpeechMs) return 'stop';
		return 'listening';
	}
}
