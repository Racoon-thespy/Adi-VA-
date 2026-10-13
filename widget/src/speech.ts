export interface TranscriberHandlers {
	/** Recording finished and the audio is being transcribed. */
	onProcessing(): void;
	onFinal(text: string): void;
	onError(message: string): void;
	/** Called exactly once, after the final result or error. */
	onEnd(): void;
}

/** Speech-to-text stage: records the visitor, then hands back text. */
export interface Transcriber {
	readonly supported: boolean;
	start(handlers: TranscriberHandlers): void;
	/** Finish recording now and transcribe what was captured. */
	stop(): void;
	/** Abandon the recording without transcribing it. */
	cancel(): void;
}

/** Text-to-speech stage. */
export interface Speaker {
	readonly supported: boolean;
	/** Call from a click handler so browsers (Safari especially) allow audio to play later. */
	prime(): void;
	speak(text: string, handlers: { onStart(): void; onEnd(): void }): void;
	cancel(): void;
}
