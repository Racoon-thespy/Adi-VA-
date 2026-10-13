# 0001: Stack for the portfolio voice agent

## Status

Proposed

## Context

- Must be free to host and need no maintenance ("fire and forget").
- Must not depend on any paid or personal AI subscription staying active.
- Embedded in a static portfolio site (plain HTML/CSS/JS on GitHub Pages, no build step).
- Very low traffic: a few visitors at most.
- Learning project: favour simple, conventional, well-tested practices.
- Author knows Python/FastAPI and cascade (STT -> LLM -> TTS) agents; TypeScript is new.

## Decision

- **Pipeline:** cascade, with each stage behind its own interface: `Transcriber`, `Brain`, `Speaker`. Any stage can be swapped without touching the others.
- **Speech in/out (v1):** browser Web Speech API (SpeechRecognition + speechSynthesis). Free, no server. Text input is the fallback where unsupported (e.g. Firefox).
- **Speech in (later):** a `WhisperTranscriber` using Whisper on Workers AI (serverless, no live server), for cross-browser consistency and accuracy. Compare against Web Speech using a small latency log (time to transcript, first token, first audio).
- **Brain:** Cloudflare Worker (TypeScript) calling Workers AI (free daily allowance, no API key to expire). No cold starts, deployed with `wrangler deploy`. Chosen over FastAPI because free Python hosts sleep and cold-start.
- **Knowledge:** a single `profile.md` injected into the system prompt. No vector DB at this size. It contains only content already public on the portfolio, since the model can be made to repeat it.
- **Delivery:** first version returns the full reply. Token streaming (SSE) with sentence-by-sentence speech follows after launch.
- **Widget:** one self-contained script using Shadow DOM, added to the portfolio with a single `<script>` tag.
- **Prompt-injection defence (layered):**
  1. System prompt scoped to the author's background; `profile.md` marked as trusted data, user text as untrusted; off-topic requests get a short deflection.
  2. Input cap (length and turns); conversation history is not trusted from the client.
  3. Output cap (`max_tokens`).
  4. **No tools and no secrets** available to the model, so the worst case is a bad answer. This is a deliberate constraint.
  5. A Vitest suite of known attacks (instruction override, system-prompt extraction, role-play jailbreaks, off-topic) run against the Worker.
- **Guardrails:** CORS locked to the portfolio origin (a dev-only exception allows localhost), per-IP rate limit using the Workers rate-limiting binding (approximate is acceptable at this traffic).
- **Tooling:** TypeScript, Vitest, ESLint + Prettier, Wrangler. GitHub Actions CI after launch. No runtime dependencies.

## Development and deployment

- Develop on localhost: static server for the widget, `wrangler dev` for the Worker. Localhost is a secure context, so the microphone works without HTTPS.
- Deploy the Worker with `wrangler deploy`; ship the widget by pushing the script tag to the portfolio repo.

## Phasing

- **v1 (ship first):** Worker `/chat`, `profile.md`, injection defences and tests, Web Speech widget with text fallback.
- **v1.1:** token streaming with sentence-by-sentence speech, CI.
- **v2:** `WhisperTranscriber`, latency comparison.

## Consequences

- Voice quality in v1 is whatever the browser provides; Chrome sends audio to Google for recognition, which the site should disclose.
- Free-tier limits and model catalog can change, so the model call stays swappable and the model should be chosen by testing against real questions.
- Adding a TypeScript backend means learning a second language, accepted as part of the project.
