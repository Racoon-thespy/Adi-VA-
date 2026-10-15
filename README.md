# voice-agent

A voice agent for my portfolio that answers questions about me and my work.

Visitors tap the mic or type. Speech is transcribed by Whisper, a Llama model answers from
`src/profile.md`, and MeloTTS speaks the reply. The backend is a Cloudflare Worker (free tier,
no servers); the widget is one dependency-free script on the static portfolio.

See `docs/adr/` for design decisions.

## Where things live

| What                              | Where                           | Goes live by                                      |
| --------------------------------- | ------------------------------- | ------------------------------------------------- |
| What the agent knows              | `src/profile.md`                | `npm run deploy`                                  |
| How it behaves and its guardrails | `src/prompt.ts`, `src/guard.ts` | `npm run deploy`                                  |
| How words are pronounced          | `src/pronounce.ts`              | `npm run deploy`                                  |
| The widget (logic and look)       | `widget/src/`                   | `npm run publish:widget`, then push the portfolio |

## Everyday commands

```
npm test                 # unit tests
npm run typecheck        # Worker and widget
npm run dev:real         # run the real Worker code locally against live models (needs `cf auth login`)
npm run eval:injection   # 28 prompt-injection attacks against a running server
npm run say -- "text"    # hear how a sentence is pronounced (needs a running server)
```

## Changing the agent (Worker, prompt, profile, pronunciation)

Edit, then `npm test`, then `npm run deploy`. The portfolio does not need touching. Check the result
against the live Worker with:

```
BASE_URL=https://voice-agent.fancy-bread-e0d1.workers.dev ORIGIN=https://racoon-thespy.github.io npm run eval:injection
```

## Changing the widget (look or behaviour)

The widget is edited here, in `widget/src/` (the look is in `widget/src/styles.ts`). The file in the
portfolio repo, `agent.js`, is a minified build, so do not edit it by hand.

```
npm run publish:widget   # build and copy to ../Portfolio/agent.js
```

That only copies the file. Commit and push the Portfolio repo yourself, because pushing it publishes the
live site. The command refuses to run if `agent.js` in the portfolio has uncommitted edits, so hand
changes are never overwritten silently. Use `--force` to override, or set `PORTFOLIO_DIR` if the
portfolio is not at `../Portfolio`.

## Styling from the portfolio

The widget lives in a Shadow DOM, so the page's CSS cannot reach inside it. CSS custom properties do pass
through, so the portfolio's own `style.css` can restyle the widget with no rebuild and no republish:

```css
#aditya-voice-agent {
	--va-accent: #ff4d3d;
	--va-bottom: 96px;
}
```

Every variable is optional. With none set the widget looks exactly as it does now. Changing the accent also
recolours the send button and the mic pulse.

| Variable            | Controls                                    | Default                      |
| ------------------- | ------------------------------------------- | ---------------------------- |
| `--va-accent`       | main accent (title, glow, mic, send button) | `#e5342b`                    |
| `--va-accent-2`     | lighter accent (status, focus rings)        | `#f5473a`                    |
| `--va-bg`           | launcher and input background               | `#050506`                    |
| `--va-panel`        | chat panel background                       | `#0c0c0f`                    |
| `--va-ink`          | main text                                   | `#f4f4f1`                    |
| `--va-muted`        | secondary text                              | `#8b8b93`                    |
| `--va-muted-2`      | tertiary text and labels                    | `#5c5c63`                    |
| `--va-line`         | faint borders                               | `rgba(255, 255, 255, 0.1)`   |
| `--va-line-strong`  | stronger borders                            | `rgba(255, 255, 255, 0.2)`   |
| `--va-radius`       | corner radius of panel, input, pills        | `6px`                        |
| `--va-font`         | body font                                   | `'Inter', system-ui`         |
| `--va-font-mono`    | labels and pills                            | `'Space Mono', ui-monospace` |
| `--va-font-size`    | base text size                              | `15px`                       |
| `--va-right`        | distance from the right edge                | `20px`                       |
| `--va-bottom`       | distance from the bottom edge               | `92px` (clears the scrubber) |
| `--va-z-index`      | stacking order                              | `45`                         |
| `--va-width`        | panel width                                 | `380px`                      |
| `--va-height`       | panel height                                | `520px`                      |
| `--va-inset-mobile` | left and right margin on narrow screens     | `16px`                       |

Changing the layout itself (adding, removing or rearranging elements) still means editing `widget/src/`
and running `npm run publish:widget`.

## Free-tier limits

Workers AI allows 10,000 neurons a day. One voice question costs roughly 70 to 100, so expect about
100 conversations a day. When the allowance runs out the agent simply stops until 00:00 UTC; the free
plan cannot incur charges.
