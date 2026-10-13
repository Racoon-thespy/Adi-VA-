// Tokens mirror the portfolio's style.css (near-black stage, one red tally-light accent).
export const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.root {
	--bg: #050506;
	--panel: #0c0c0f;
	--ink: #f4f4f1;
	--muted: #8b8b93;
	--line: rgba(255, 255, 255, 0.1);
	--line-strong: rgba(255, 255, 255, 0.2);
	--accent: #e5342b;
	--accent-2: #f5473a;
	position: fixed;
	right: 20px;
	bottom: 92px; /* clears the portfolio's 72px fixed scrubber */
	z-index: 45;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	line-height: 1.5;
	color: var(--ink);
}
.mono {
	font-family: 'Space Mono', ui-monospace, monospace;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	font-size: 11px;
}

button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
button:focus-visible, input:focus-visible, a:focus-visible {
	outline: 2px solid var(--accent-2);
	outline-offset: 2px;
}

/* Launcher */
.launcher {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-left: auto;
	padding: 10px 16px 10px 12px;
	background: var(--panel);
	border: 1px solid var(--line-strong);
	border-radius: 999px;
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
	transition: border-color 0.2s;
}
.launcher:hover { border-color: var(--accent); }
.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0 8px var(--accent);
}
.root[data-open='true'] .launcher { display: none; }

/* Panel */
.panel {
	display: none;
	flex-direction: column;
	width: min(380px, calc(100vw - 32px));
	height: min(520px, calc(100vh - 150px));
	background: var(--panel);
	border: 1px solid var(--line-strong);
	border-radius: 8px;
	box-shadow: 0 16px 50px rgba(0, 0, 0, 0.6);
	overflow: hidden;
}
.root[data-open='true'] .panel { display: flex; }

.head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 14px;
	border-bottom: 1px solid var(--line);
}
.head .title { flex: 1; }
.rec { display: none; align-items: center; gap: 6px; color: var(--accent-2); }
.root[data-state='listening'] .rec { display: inline-flex; }
.root[data-state='listening'] .rec .dot { animation: pulse 1s ease-in-out infinite; }
.status { color: var(--muted); }
.icon-btn { padding: 6px; border-radius: 4px; color: var(--muted); }
.icon-btn:hover { color: var(--ink); }
.icon-btn[aria-pressed='true'] { color: var(--accent-2); }

.log {
	flex: 1;
	overflow-y: auto;
	padding: 14px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	overscroll-behavior: contain;
}
.msg {
	max-width: 88%;
	padding: 8px 12px;
	border-radius: 6px;
	border: 1px solid var(--line);
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.msg.user { align-self: flex-end; background: rgba(229, 52, 43, 0.12); border-color: rgba(229, 52, 43, 0.35); }
.msg.bot { align-self: flex-start; background: rgba(255, 255, 255, 0.04); }
.msg.error { align-self: flex-start; color: var(--accent-2); border-color: rgba(229, 52, 43, 0.35); }
.msg.pending { color: var(--muted); }
.hint { color: var(--muted); font-size: 12px; }

.foot { border-top: 1px solid var(--line); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.form { display: flex; gap: 8px; align-items: center; }
.form input {
	flex: 1;
	min-width: 0;
	padding: 9px 12px;
	font: inherit;
	color: var(--ink);
	background: var(--bg);
	border: 1px solid var(--line-strong);
	border-radius: 6px;
}
.form input::placeholder { color: var(--muted); }
.form input:disabled { opacity: 0.6; }
.mic, .send {
	flex: none;
	width: 38px;
	height: 38px;
	display: grid;
	place-items: center;
	border: 1px solid var(--line-strong);
	border-radius: 6px;
}
.mic:hover, .send:hover { border-color: var(--accent); }
.mic[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); }
.send { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.send:disabled { opacity: 0.5; cursor: default; }
.links { display: flex; justify-content: space-between; align-items: center; }
.links a { color: var(--muted); text-decoration: underline; text-underline-offset: 3px; }
.links a:hover { color: var(--ink); }

svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@media (prefers-reduced-motion: reduce) {
	.root[data-state='listening'] .rec .dot { animation: none; }
}
@media (max-width: 480px) {
	.root { right: 16px; left: 16px; }
	.panel { width: 100%; }
}
`;

const MIC = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`;
const SEND = `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
const SPEAKER = `<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="3 9 7 9 12 5 12 19 7 15 3 15"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>`;
const CLOSE = `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;

// Static markup only: visitor and model text is always inserted with textContent.
export const MARKUP = `
<div class="root" data-open="false" data-state="idle">
	<button class="launcher mono" type="button" aria-label="Open the voice assistant">
		<span class="dot" aria-hidden="true"></span>Ask about Aditya
	</button>
	<section class="panel" role="dialog" aria-label="Voice assistant">
		<div class="head">
			<span class="title mono">AI assistant</span>
			<span class="rec mono"><span class="dot" aria-hidden="true"></span>Rec</span>
			<span class="status mono" aria-live="polite"></span>
			<button class="icon-btn voice-toggle" type="button" aria-pressed="true" aria-label="Spoken replies">${SPEAKER}</button>
			<button class="icon-btn close" type="button" aria-label="Close the assistant">${CLOSE}</button>
		</div>
		<div class="log" role="log" aria-live="polite"></div>
		<div class="foot">
			<form class="form">
				<input type="text" maxlength="300" placeholder="Ask a question" aria-label="Your question" autocomplete="off" />
				<button class="mic" type="button" aria-pressed="false" aria-label="Speak your question">${MIC}</button>
				<button class="send" type="submit" aria-label="Send">${SEND}</button>
			</form>
			<div class="links">
				<span class="hint">AI-generated. May make mistakes.</span>
				<a class="contact" href="#contact">Contact Aditya</a>
			</div>
		</div>
	</section>
</div>
`;
