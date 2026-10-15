// Tokens mirror the portfolio's style.css (near-black stage, one red tally-light accent).
export const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.root {
	--bg: #050506;
	--panel: #0c0c0f;
	--ink: #f4f4f1;
	--muted: #8b8b93;
	--muted-2: #5c5c63;
	--radius: 6px;
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
	gap: 8px;
	margin-left: auto;
	padding: 9px 16px 9px 12px;
	background: var(--bg);
	border: 1px solid var(--line-strong);
	border-radius: 999px;
	transition: border-color 0.2s ease, color 0.2s ease;
}
.launcher:hover { border-color: var(--accent); color: var(--accent); }
.dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--accent);
	animation: pulse 2.4s ease-in-out infinite;
}
.root[data-open='true'] .launcher { display: none; }

/* Panel */
.panel {
	display: none;
	flex-direction: column;
	width: min(380px, calc(100vw - 32px));
	height: min(520px, calc(100vh - 150px));
	position: relative;
	--vf-color: var(--line-strong);
	background: var(--panel);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	overflow: hidden;
	transition: border-color 0.2s ease;
}
.root[data-open='true'] .panel { display: flex; }

/* Viewfinder corners + edge ticks, same recipe as the site's .viewfinder. */
.panel::before, .panel::after { content: ''; position: absolute; inset: 12px; pointer-events: none; z-index: 1; }
.panel::before {
	background:
		linear-gradient(var(--vf-color), var(--vf-color)) top left / 18px 1px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) top left / 1px 18px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) top right / 18px 1px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) top right / 1px 18px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) bottom left / 18px 1px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) bottom left / 1px 18px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) bottom right / 18px 1px no-repeat,
		linear-gradient(var(--vf-color), var(--vf-color)) bottom right / 1px 18px no-repeat;
}
.panel::after {
	background:
		radial-gradient(circle, rgba(255, 255, 255, 0.22) 2.5px, transparent 2.5px) top center / 5px 5px no-repeat,
		radial-gradient(circle, rgba(255, 255, 255, 0.22) 2.5px, transparent 2.5px) bottom center / 5px 5px no-repeat,
		radial-gradient(circle, rgba(255, 255, 255, 0.22) 2.5px, transparent 2.5px) center left / 5px 5px no-repeat,
		radial-gradient(circle, rgba(255, 255, 255, 0.22) 2.5px, transparent 2.5px) center right / 5px 5px no-repeat;
}

.head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 14px 18px 12px;
	border-bottom: 1px solid var(--line);
}
.head .title { flex: 1; color: var(--accent); }
.rec { display: none; align-items: center; gap: 6px; color: var(--accent-2); }
.root[data-state='listening'] .rec { display: inline-flex; }
.root[data-state='listening'] .rec .dot { animation: pulse 1s ease-in-out infinite; }
.status { color: var(--muted-2); }
.icon-btn { padding: 6px; border-radius: 4px; color: var(--muted); }
.icon-btn:hover { color: var(--ink); }
.icon-btn[aria-pressed='true'] { color: var(--accent-2); }

.log {
	flex: 1;
	overflow-y: auto;
	padding: 18px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	overscroll-behavior: contain;
}
/* Flat, left-ruled transcript lines with a mono speaker label, like the
   site's reel cards, instead of generic chat bubbles. */
.msg {
	max-width: 92%;
	padding: 0 0 0 12px;
	border-left: 1px solid var(--line-strong);
	color: var(--muted);
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.msg::before {
	display: block;
	margin-bottom: 2px;
	font-family: 'Space Mono', ui-monospace, monospace;
	font-size: 11px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--muted-2);
}
.msg.user { align-self: flex-end; color: var(--ink); }
.msg.user::before { content: 'You'; color: var(--accent); }
.msg.bot { align-self: flex-start; }
.msg.bot::before { content: 'A.P.S.'; }
.msg.error { align-self: flex-start; color: var(--accent-2); }
.msg.error::before { content: 'Error'; color: var(--accent); }
.msg.pending { color: var(--muted-2); }
.msg.pending::before { content: none; }
.hint { color: var(--muted-2); font-size: 11px; }

.pills { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 14px; }
.pills[hidden] { display: none; }
.pill {
	padding: 3px 8px;
	font-family: 'Space Mono', ui-monospace, monospace;
	font-size: 11px;
	letter-spacing: 0.06em;
	color: var(--muted);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	transition: border-color 0.2s ease, color 0.2s ease;
}
.pill:hover { border-color: var(--accent); color: var(--ink); }
.pill:disabled { opacity: 0.5; cursor: default; }

.foot { border-top: 1px solid var(--line); padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; }
.form { display: flex; gap: 8px; align-items: center; }
.form input {
	flex: 1;
	min-width: 0;
	padding: 9px 12px;
	font: inherit;
	color: var(--ink);
	background: var(--bg);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	transition: border-color 0.2s ease;
}
.form input:focus { border-color: var(--line-strong); }
.form input::placeholder { color: var(--muted); }
.form input:disabled { opacity: 0.6; }
.mic, .send {
	flex: none;
	width: 38px;
	height: 38px;
	display: grid;
	place-items: center;
	border: 1px solid var(--line);
	border-radius: var(--radius);
	transition: border-color 0.2s ease, color 0.2s ease;
}
.mic:hover, .send:hover { border-color: var(--accent); }
.mic[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); animation: none; }
/* Draws the eye to the mic until it is first used. */
.mic[data-nudge='true'] {
	color: var(--accent-2);
	border-color: var(--accent);
	animation: micPulse 1.8s ease-out infinite;
}
.send { background: rgba(229, 52, 43, 0.18); color: var(--ink); border-color: rgba(229, 52, 43, 0.4); }
.send:hover { background: rgba(229, 52, 43, 0.3); border-color: rgba(229, 52, 43, 0.6); }
.send:disabled { opacity: 0.5; cursor: default; }

svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes micPulse {
	0% { box-shadow: 0 0 0 0 rgba(229, 52, 43, 0.55); }
	70% { box-shadow: 0 0 0 12px rgba(229, 52, 43, 0); }
	100% { box-shadow: 0 0 0 0 rgba(229, 52, 43, 0); }
}
@media (prefers-reduced-motion: reduce) {
	.dot, .root[data-state='listening'] .rec .dot { animation: none; }
	.mic[data-nudge='true'] { animation: none; } /* keeps the accent colour, drops the motion */
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
		<div class="pills" role="group" aria-label="Suggested questions"></div>
		<div class="foot">
			<form class="form">
				<input type="text" maxlength="300" placeholder="Type, or tap the mic to talk" aria-label="Your question" autocomplete="off" />
				<button class="mic" type="button" aria-pressed="false" aria-label="Speak your question">${MIC}</button>
				<button class="send" type="submit" aria-label="Send">${SEND}</button>
			</form>
		</div>
	</section>
</div>
`;
