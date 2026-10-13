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
- **Speech in:** Whisper (`@cf/openai/whisper-large-v3-turbo`) on Workers AI, via a `/transcribe` endpoint. Serverless, so no live server. The widget records with `MediaRecorder`, ends the recording on silence, and converts it to 16 kHz mono WAV in the browser so the Worker only ever handles one tested format. A vocabulary hint (`initial_prompt`) fixes names such as "Aditya". Works in every modern browser, including Firefox.
- **Speech out:** MeloTTS (`@cf/myshell-ai/melotts`) on Workers AI, via a `/speak` endpoint. The reply is split into sentences that are synthesised in parallel and played in order, so audio starts after the first sentence. The Worker detects the audio type from the bytes, because the model's output is labelled MP3 but is WAV.
- **Rejected: browser Web Speech API.** Voice quality depends on the visitor's OS and browser, Chrome sends audio to Google, and Firefox has no recognition. Rejected after trying it.
- **Rejected: Deepgram Aura voices on Workers AI.** Better sounding, but about 1,400 to 2,700 neurons per 1,000 characters, which would use up the free daily allowance in roughly a dozen replies. MeloTTS costs about 19 neurons per audio minute. The `Speaker` interface keeps this swappable.
- **Brain:** Cloudflare Worker (TypeScript) calling Workers AI (free daily allowance, no API key to expire). No cold starts, deployed with `wrangler deploy`. Chosen over FastAPI because free Python hosts sleep and cold-start.
- **Knowledge:** a single `profile.md` injected into the system prompt. No vector DB at this size. It contains only content already public on the portfolio, since the model can be made to repeat it.
- **Delivery:** the Worker returns the full text reply; latency is reduced on the audio side by sentence-level parallel synthesis. Token streaming (SSE) is a possible later improvement.
- **Widget:** one self-contained script using Shadow DOM, added to the portfolio with a single `<script>` tag.
- **Prompt-injection defence (layered):**
  1. System prompt scoped to the author's background; `profile.md` marked as trusted data, user text as untrusted; off-topic requests get a short deflection.
  2. Input cap (length and turns); conversation history is not trusted from the client.
  3. Output cap (`max_tokens`).
  4. **No tools and no secrets** available to the model, so the worst case is a bad answer. This is a deliberate constraint.
  5. A Vitest suite of known attacks (instruction override, system-prompt extraction, role-play jailbreaks, off-topic) run against the Worker.
- **Guardrails:** CORS locked to the portfolio origin (a dev-only exception allows localhost). Per-IP rate limits using the Workers rate-limiting binding (approximate is acceptable at this traffic): a strict one on `/chat`, which is the costly LLM call, and a separate one shared by `/transcribe` and `/speak`. Audio uploads are capped in size, must be WAV, and are read with a streaming size limit. `/speak` input is capped at the length of a model reply.
- **Tooling:** TypeScript, Vitest, ESLint + Prettier, Wrangler. GitHub Actions CI after launch. No runtime dependencies.

## Development and deployment

- Develop on localhost: static server for the widget, `wrangler dev` for the Worker. Localhost is a secure context, so the microphone works without HTTPS.
- Deploy the Worker with `wrangler deploy`; ship the widget by pushing the script tag to the portfolio repo.

## Phasing

- **v1 (ship first):** Worker with `/chat`, `/transcribe` and `/speak`, `profile.md`, injection defences and tests, and the Whisper + MeloTTS widget with a text box as fallback.
- **v1.1:** token streaming, CI, an injection eval run against the live model.
- **Later:** compare other models and voices using the latency log (time to transcript, reply, first audio).

## Consequences

- Voice quality is bounded by MeloTTS, chosen for its tiny free-tier cost, not for being the best-sounding voice.
- Voice needs the Worker and Workers AI, so it cannot be tried offline. Visitors' recordings are sent to Cloudflare Workers AI, which the site should disclose.
- Chrome's WebM/Opus recording was not tested against Whisper directly. Converting to WAV in the browser avoids depending on it.
- Free-tier limits and model catalog can change, so the model call stays swappable and the model should be chosen by testing against real questions.
- Adding a TypeScript backend means learning a second language, accepted as part of the project.
