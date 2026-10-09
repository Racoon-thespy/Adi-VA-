# 0001: Stack for the portfolio voice agent

## Status
Proposed

## Context
- Must be free to host and need no maintenance ("fire and forget").
- Must not depend on any paid or personal AI subscription staying active.
- Embedded in a static portfolio site.
- Learning project: favour simple, conventional, well-tested practices.

## Decision
- **Speech in/out:** browser Web Speech API (SpeechRecognition + speechSynthesis). Free, no server. Text input is the fallback where unsupported (e.g. Firefox).
- **Brain:** Cloudflare Worker calling Workers AI (free daily allowance, no API key to expire). The model is behind a thin interface so it can be swapped.
- **Knowledge:** a single `profile.md` injected into the system prompt. No vector DB at this size.
- **Guardrails:** CORS locked to the portfolio origin, per-IP rate limit, capped input and output length.
- **Tooling:** TypeScript, Vitest, ESLint + Prettier, GitHub Actions CI, Wrangler for deploys.

## Consequences
- Voice quality is whatever the browser provides.
- Free-tier limits can change, so the model call stays swappable.
