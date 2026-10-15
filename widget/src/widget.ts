import { ApiError, type ChatClient } from './api';
import { buildRequest, type Turn } from './history';
import type { Speaker, Transcriber } from './speech';
import { CSS, MARKUP } from './styles';
import { SUGGESTIONS, type Suggestion, matchSuggestion } from './suggestions';

type State = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

export interface WidgetDeps {
	api: ChatClient;
	transcriber: Transcriber;
	speaker: Speaker;
}

const GREETING =
	"Hi, I'm an AI assistant for Aditya's portfolio. Ask me about his work, skills or how to reach him.";
const STATUS: Record<State, string> = {
	idle: '',
	listening: 'Listening',
	transcribing: 'Transcribing',
	thinking: 'Thinking',
	speaking: 'Speaking',
};

export function mountWidget({ api, transcriber, speaker }: WidgetDeps): void {
	const host = document.createElement('div');
	host.id = 'aditya-voice-agent';
	const shadow = host.attachShadow({ mode: 'open' });
	shadow.innerHTML = `<style>${CSS}</style>${MARKUP}`;
	document.body.append(host);

	const find = <T extends Element>(selector: string): T => {
		const el = shadow.querySelector<T>(selector);
		if (!el) throw new Error(`voice-agent: missing ${selector}`);
		return el;
	};
	const root = find<HTMLElement>('.root');
	const log = find<HTMLElement>('.log');
	const input = find<HTMLInputElement>('.form input');
	const form = find<HTMLFormElement>('.form');
	const mic = find<HTMLButtonElement>('.mic');
	const send = find<HTMLButtonElement>('.send');
	const status = find<HTMLElement>('.status');
	const voiceToggle = find<HTMLButtonElement>('.voice-toggle');
	const pills = find<HTMLElement>('.pills');

	const pillButtons = new Map<Suggestion, HTMLButtonElement>();
	const history: Turn[] = [];
	let state: State = 'idle';
	let spokenReplies = speaker.supported;

	function setState(next: State): void {
		state = next;
		root.dataset.state = next;
		status.textContent = STATUS[next];
		const busy = next === 'thinking' || next === 'transcribing';
		input.disabled = busy;
		send.disabled = busy;
		mic.setAttribute('aria-pressed', String(next === 'listening'));
	}

	function addMessage(kind: 'user' | 'bot' | 'error' | 'pending', text: string): HTMLElement {
		const el = document.createElement('div');
		el.className = `msg ${kind}`;
		el.textContent = text; // never innerHTML: model and visitor text are untrusted
		log.append(el);
		log.scrollTop = log.scrollHeight;
		return el;
	}

	/** Removes the pill whose question was just asked, however it was asked (tap, type or voice). */
	function retirePill(text: string): void {
		const suggestion = matchSuggestion(text);
		if (!suggestion) return;
		pillButtons.get(suggestion)?.remove();
		pillButtons.delete(suggestion);
		if (pillButtons.size === 0) pills.hidden = true;
	}

	function stopAudio(): void {
		speaker.cancel();
		transcriber.cancel();
	}

	async function ask(question: string): Promise<void> {
		const text = question.trim();
		if (!text || state === 'thinking') return;

		stopAudio();
		input.value = '';
		retirePill(text); // a suggestion disappears once its question has been asked
		addMessage('user', text);
		const pending = addMessage('pending', '...');
		setState('thinking');
		const startedAt = performance.now();

		try {
			const request = buildRequest(history, text);
			const reply = await api.ask(request);
			history.push({ role: 'user', content: request[request.length - 1]?.content ?? text });
			history.push({ role: 'assistant', content: reply });
			pending.className = 'msg bot';
			pending.textContent = reply;
			console.debug(`voice-agent: reply in ${Math.round(performance.now() - startedAt)} ms`);

			// Leave "thinking" first: speech starts asynchronously, and onStart moves to "speaking".
			setState('idle');
			if (spokenReplies) {
				speaker.speak(reply, {
					onStart: () => setState('speaking'),
					onEnd: () => {
						if (state === 'speaking') setState('idle');
					},
				});
			}
		} catch (error) {
			pending.className = 'msg error';
			pending.textContent =
				error instanceof ApiError ? error.userMessage : 'Something went wrong. Please try again.';
			setState('idle');
		}
		log.scrollTop = log.scrollHeight;
	}

	function startListening(): void {
		speaker.cancel();
		setState('listening');
		input.value = '';
		transcriber.start({
			onProcessing: () => setState('transcribing'),
			onFinal: (text) => {
				void ask(text);
			},
			onError: (message) => {
				addMessage('error', message);
			},
			onEnd: () => {
				if (state === 'listening' || state === 'transcribing') setState('idle');
			},
		});
	}

	function open(): void {
		speaker.prime();
		root.dataset.open = 'true';
		input.focus();
	}

	function close(): void {
		stopAudio();
		root.dataset.open = 'false';
		if (state !== 'thinking') setState('idle');
	}

	addMessage('bot', GREETING);
	if (!transcriber.supported) {
		mic.hidden = true;
		addMessage(
			'pending',
			"Voice input isn't available in this browser, so please type your question.",
		);
	} else {
		addMessage(
			'pending',
			'Tap the mic and speak. Your recording is sent to Cloudflare Workers AI to be transcribed.',
		);
	}
	if (!speaker.supported) voiceToggle.hidden = true;
	voiceToggle.setAttribute('aria-pressed', String(spokenReplies));

	for (const suggestion of SUGGESTIONS) {
		const pill = document.createElement('button');
		pill.type = 'button';
		pill.className = 'pill';
		pill.textContent = suggestion.label;
		pill.addEventListener('click', () => {
			speaker.prime(); // a tap is a user gesture, which lets audio play later
			void ask(suggestion.question);
		});
		pillButtons.set(suggestion, pill);
		pills.append(pill);
	}

	// Pulse the mic until the visitor first uses it, to show that they can simply talk.
	if (transcriber.supported) mic.dataset.nudge = 'true';

	find<HTMLButtonElement>('.launcher').addEventListener('click', open);
	find<HTMLButtonElement>('.close').addEventListener('click', close);
	voiceToggle.addEventListener('click', () => {
		spokenReplies = !spokenReplies;
		voiceToggle.setAttribute('aria-pressed', String(spokenReplies));
		if (!spokenReplies) {
			speaker.cancel();
			if (state === 'speaking') setState('idle');
		}
	});
	mic.addEventListener('click', () => {
		delete mic.dataset.nudge; // they found it; stop pulsing for the rest of the session
		speaker.prime();
		if (state === 'listening') transcriber.stop();
		else if (state === 'idle' || state === 'speaking') startListening();
	});
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		speaker.prime();
		void ask(input.value);
	});
	shadow.addEventListener('keydown', (event) => {
		if ((event as KeyboardEvent).key === 'Escape') close();
	});
	window.addEventListener('pagehide', stopAudio);
}
