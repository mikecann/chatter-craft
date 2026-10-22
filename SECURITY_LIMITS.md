# Speech and GPT abuse controls

## Limits and privacy

- `CHATTER_GLOBAL_DAILY_LIMIT`: **30** Whisper/GPT editing workflows globally per UTC day, with 3/minute globally. Each authenticated user gets 4/hour and 10/day.

Canvas membership is checked before reserving quota or scheduling a command. `canvasMembers.listForCanvas` and `findForUser` use the same rule as `canvases.get`: the caller's identity comes from the server and they must be a member of that canvas. The command, reservation and scheduled action commit together. Public command/transcript reads also require membership, while scheduled workflows use an internal lookup. `users.get` now returns only a profile to authenticated callers, excluding email and authentication identifiers. Member-role authorization uses the acting user's membership.

A recording must be WebM/Opus or Ogg/Opus audio, at most 512000 bytes and 15 seconds. The length comes from the Opus packets themselves (each packet's TOC byte), never from a client or container duration, so a small file with a forged duration or a long, heavily compressed recording cannot get past the cap. WebM checks also cover cluster/block timestamps, codec/tracks, sample rate and container metadata, and accept the unknown-size Segment and Clusters that browsers stream. Ogg must be a single logical stream with a valid CRC on every page, consecutive page numbers and no trailing or chained data, so the packets counted are the ones a decoder reads. Whisper receives the matching file extension and MIME type. Laced/multitrack WebM is rejected.

The recorder asks the browser for `audio/webm;codecs=opus`, then `audio/ogg;codecs=opus`, instead of its default type, so current Chrome, Edge and Firefox record a supported format. MP4/AAC (what older Safari records) is rejected with a clear message: an MP4's playable length comes from its sample tables, and checking those as strictly as Opus packets would need a much larger parser, so it is not accepted unverified. On a browser with neither Opus type, Start Recording explains the problem before asking for the microphone. The microphone and audio context are released if setup fails, and upload errors (format or usage limit) are shown to the user. The UI still records for at most 10 seconds.

SVG input/output is capped at 12000 UTF-8 bytes, transcripts at 1000 characters and recent-history entries at 200 characters each. OpenAI retries are disabled and requests have 30-second timeouts, one completion per edit.

The `update_svg_document` call returns the whole document as escaped JSON, so bytes alone don't say whether an edit can finish. `convex/workflows/editBudget.ts` counts cl100k_base text tokens with `gpt-tokenizer`, pinned at 2.9.0 with no dependencies or install scripts. The completion needs the existing document's JSON tokens plus 64 framing tokens plus 512 for the edit, and gets `max_tokens` = the smallest of 4096, the model's output limit and what's left of its context after the prompt and function schema. gpt-4 has an 8,192-token context and gpt-3.5-turbo 16,385 with 4,096 max output ([gpt-4](https://developers.openai.com/api/docs/models/gpt-4), [gpt-3.5-turbo](https://developers.openai.com/api/docs/models/gpt-3.5-turbo)).

The first check runs before Whisper with 600 tokens held for the transcript and history, so a document that already cannot fit fails with "too detailed" before any paid call. A second check uses the actual transcript and recent history before GPT; if those exceed the reserved allowance, this check can refuse an edit after transcription has been charged. In practice an editable canvas is about 3,300 tokens of SVG on gpt-4 and 3,500 on gpt-3.5-turbo, roughly 6.5 KB of dense, quote-heavy markup. The 12000-byte ceiling stays as the outer guard and simple canvases still fit. The tokenizer's ~1 MB rank table only loads in the Node action, never in mutations. The reservation is still used by a refused workflow, as with any other failure.

No existing canvas documents are rewritten or deleted. Oversized existing canvases remain viewable but need to be reduced before requesting another AI edit. The fixtures are generated silence or a 440 Hz tone, not user audio. `bun tests/make-audio-fixtures.ts` regenerates the tone fixtures with local ffmpeg/libopus and rewrites the WebM into the layout Chrome's MediaRecorder streams.

## Reservation behavior and schema

The additive `abuseLimits` table has `key: string`, `windowStart: number`, and `used: number`, indexed by `by_key`. Each scope reuses its counter row. No existing business records, API keys, or data need migration or deletion.

All applicable counters are checked and incremented in one mutation before paid work or its scheduler entry. Conflicting requests rely on [Convex atomic transactions and OCC](https://docs.convex.dev/database/advanced/occ). Failed provider attempts still consume reservations; there are no refunds that could permit retry abuse. Daily windows reset at midnight UTC, with fixed minute/hour windows where listed. These limits count requests, rather than estimating a dollar balance.

The new environment variables are optional numeric daily ceilings. Unset, empty, negative, fractional, or malformed values use the documented default; integers above 100000 also use the default. An explicit `0` stops that operation. There is no bypass flag. Per-user limits use the authenticated server identity. Anonymous demos retain shared global limits.

## Review and setup

Deploy the additive schema and functions through the normal project workflow, then smoke-test the normal flow. Tests mock paid providers and never send real transactions or generated content. Existing provider credentials remain required and unchanged. Defaults apply without adding any environment variables.


## Validation

Run `bun --no-env-file test tests/security.test.ts`. These tests invoke registered Convex handlers against a test database with mocked providers; they do not contact a deployment.

Run `./node_modules/.bin/tsc -p convex --noEmit --pretty false` for backend types. Run `./node_modules/.bin/tsc --noEmit --pretty false` for app types.

Expected test count after this change: 10.

## Netlify builds

`netlify.toml` uses `scripts/netlify-build.mjs`. Production builds the frontend with Netlify's configured backend URL, then deploys Convex using the pinned 1.2.1 CLI's supported command. Deploy previews and branch builds only build the frontend, defaulting to the existing development backend if no `VITE_CONVEX_URL` is configured. All frontend builds remove `CONVEX_DEPLOY_KEY` from their environment. A preview cannot deploy its branch to production through the old dashboard build command.

## Files changed

- `SECURITY_LIMITS.md`
- `convex/_generated/api.d.ts`
- `convex/abuse.ts`
- `convex/audio.ts`
- `convex/canvasCommands.ts`
- `convex/canvasMembers.ts`
- `convex/openai.ts`
- `convex/schema.ts`
- `convex/users.ts`
- `convex/workflows/editBudget.ts`
- `convex/workflows/mutateCanvasDocument.ts`
- `package.json`
- `src/canvas/AudioRecorder.tsx`
- `src/canvas/RecorderAndUploader.tsx`
- `tests/fixtures/command-16s.ogg`
- `tests/fixtures/command-1s.m4a`
- `tests/fixtures/command-3s.ogg`
- `tests/fixtures/short-command.webm`
- `tests/fixtures/streaming-16s.webm`
- `tests/fixtures/streaming-3s.webm`
- `tests/make-audio-fixtures.ts`
- `tests/security.test.ts`
- `tests/support.ts`
- `yarn.lock`
