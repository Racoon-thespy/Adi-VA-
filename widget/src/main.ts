import { HttpChatClient } from './api';
import { WorkersSpeaker } from './tts';
import { WhisperTranscriber } from './whisper';
import { mountWidget } from './widget';

// Read synchronously: document.currentScript is only set while the script first runs.
const apiUrl = (document.currentScript as HTMLScriptElement | null)?.dataset.api;

function start(): void {
	if (!apiUrl) {
		console.error('voice-agent: add data-api="https://your-worker.example" to the script tag.');
		return;
	}
	mountWidget({
		api: new HttpChatClient(apiUrl),
		transcriber: new WhisperTranscriber(apiUrl),
		speaker: new WorkersSpeaker(apiUrl),
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start);
} else {
	start();
}
