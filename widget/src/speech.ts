// Minimal typings: the Web Speech recognition API is not in TypeScript's DOM lib.
interface RecognitionAlternative {
	transcript: string;
}
interface RecognitionResult {
	readonly isFinal: boolean;
	readonly length: number;
	[index: number]: RecognitionAlternative | undefined;
}
interface RecognitionEvent {
	readonly resultIndex: number;
	readonly results: { readonly length: number; [index: number]: RecognitionResult | undefined };
}
interface RecognitionErrorEvent {
	readonly error: string;
}
interface Recognition {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	onresult: ((event: RecognitionEvent) => void) | null;
	onerror: ((event: RecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}
type RecognitionConstructor = new () => Recognition;

declare global {
	interface Window {
		SpeechRecognition?: RecognitionConstructor;
		webkitSpeechRecognition?: RecognitionConstructor;
	}
}

export interface TranscriberHandlers {
	onInterim(text: string): void;
	onFinal(text: string): void;
	onError(message: string): void;
	onEnd(): void;
}

/** Speech-to-text stage. Swap in a Whisper-backed one later without touching the UI. */
export interface Transcriber {
	readonly supported: boolean;
	start(handlers: TranscriberHandlers): void;
	stop(): void;
}

/** Text-to-speech stage. */
export interface Speaker {
	readonly supported: boolean;
	speak(text: string, handlers: { onStart(): void; onEnd(): void }): void;
	cancel(): void;
}

const ERROR_MESSAGES: Record<string, string> = {
	'not-allowed': 'Microphone access is blocked. Allow it in your browser, or type instead.',
	'service-not-allowed': 'Speech recognition is blocked in this browser. Please type instead.',
	'audio-capture': "I can't find a microphone. You can type your question instead.",
	network: 'Speech recognition needs an internet connection. Please type instead.',
	'no-speech': "I didn't hear anything. Tap the mic and try again.",
};

export class WebSpeechTranscriber implements Transcriber {
	private readonly Ctor: RecognitionConstructor | undefined =
		window.SpeechRecognition ?? window.webkitSpeechRecognition;
	private recognition: Recognition | null = null;

	get supported(): boolean {
		return this.Ctor !== undefined;
	}

	start(handlers: TranscriberHandlers): void {
		if (!this.Ctor) return handlers.onError('Voice input is not supported in this browser.');
		this.stop();

		const recognition = new this.Ctor();
		recognition.lang = navigator.language || 'en-US';
		recognition.continuous = false;
		recognition.interimResults = true;

		recognition.onresult = (event) => {
			let interim = '';
			let final = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				const text = result?.[0]?.transcript ?? '';
				if (result?.isFinal) final += text;
				else interim += text;
			}
			if (final.trim()) handlers.onFinal(final.trim());
			else if (interim.trim()) handlers.onInterim(interim.trim());
		};
		recognition.onerror = (event) => {
			const message = ERROR_MESSAGES[event.error];
			if (message) handlers.onError(message);
		};
		recognition.onend = () => {
			this.recognition = null;
			handlers.onEnd();
		};

		this.recognition = recognition;
		try {
			recognition.start();
		} catch {
			this.recognition = null;
			handlers.onError("I couldn't start the microphone. Please try again.");
			handlers.onEnd();
		}
	}

	stop(): void {
		this.recognition?.stop();
	}
}

export class SynthesisSpeaker implements Speaker {
	get supported(): boolean {
		return 'speechSynthesis' in window;
	}

	speak(text: string, handlers: { onStart(): void; onEnd(): void }): void {
		if (!this.supported) return handlers.onEnd();
		this.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = navigator.language || 'en-US';
		utterance.onstart = handlers.onStart;
		utterance.onend = handlers.onEnd;
		utterance.onerror = handlers.onEnd;
		window.speechSynthesis.speak(utterance);
	}

	cancel(): void {
		if (this.supported) window.speechSynthesis.cancel();
	}
}
