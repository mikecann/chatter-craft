# Speech and GPT abuse controls

## Limits and privacy

- `CHATTER_GLOBAL_DAILY_LIMIT`: **30** Whisper/GPT editing workflows globally per UTC day, with 3/minute globally. Each authenticated user gets 4/hour and 10/day.

Canvas membership is checked before reserving quota or scheduling a command. `canvasMembers.listForCanvas` and `findForUser` use the same rule as `canvases.get`: the caller's identity comes from the server and they must be a member of that canvas. The command, reservation and scheduled action commit together. Public command/transcript reads also require membership, while scheduled workflows use an internal lookup. `users.get` now returns only a profile to authenticated callers, excluding email and authentication identifiers. Member-role authorization uses the acting user's membership.

A recording must be WebM/Opus or Ogg/Opus audio, at most 512000 bytes and 15 seconds. The length comes from the Opus packets themselves (each packet's TOC byte), never from a client or container duration, so a small file with a forged duration or a long, heavily compressed recording cannot get past the cap. WebM checks also cover cluster/block timestamps, codec/tracks, sample rate and container metadata, and accept the unknown-size Segment and Clusters that browsers stream. Ogg must be a single logical stream with a valid CRC on every page, consecutive page numbers and no trailing or chained data, so the packets counted are the ones a decoder reads. Whisper receives the matching file extension and MIME type. Laced/multitrack WebM is rejected.

The recorder asks the browser for `audio/webm;codecs=opus`, then `audio/ogg;codecs=opus`, instead of its default type, so current Chrome, Edge and Firefox record a supported format. MP4/AAC (what older Safari records) is rejected with a clear message: an MP4's playable length comes from its sample tables, and checking those as strictly as Opus packets would need a much larger parser, so it is not accepted unverified. On a browser with neither Opus type, Start Recording explains the problem before asking for the microphone. The microphone and audio context are released if setup fails, and upload errors (format or usage limit) are shown to the user. The UI still records for at most 10 seconds.

SVG input/output is capped at 12000 UTF-8 bytes, transcripts at 1000 characters and recent-history entries at 200 characters each. GPT produces at most 2048 output tokens, one completion; OpenAI retries are disabled and requests have 30-second timeouts.

No existing canvas documents are rewritten or deleted. Oversized existing canvases remain viewable but need to be reduced before requesting another AI edit. The fixtures are generated silence or a 440 Hz tone, not user audio. `bun tests/make-audio-fixtures.ts` regenerates the tone fixtures with local ffmpeg/libopus and rewrites the WebM into the layout Chrome's MediaRecorder streams.

## Reservation behavior and schema

The additive `abuseLimits` table has `key: string`, `windowStart: number`, and `used: number`, indexed by `by_key`. Each scope reuses its counter row. No existing business records, API keys, or data need migration or deletion.

All applicable counters are checked and incremented in one mutation before paid work or its scheduler entry. Conflicting requests rely on [Convex atomic transactions and OCC](https://docs.convex.dev/database/advanced/occ). Failed provider attempts still consume reservations; there are no refunds that could permit retry abuse. Daily windows reset at midnight UTC, with fixed minute/hour windows where listed. These limits count requests, rather than estimating a dollar balance.

The new environment variables are optional numeric daily ceilings. Unset, empty, negative, fractional, or malformed values use the documented default; integers above 100000 also use the default. An explicit `0` stops that operation. There is no bypass flag. Per-user limits use the authenticated server identity. Anonymous demos retain shared global limits.

## Review and setup

Changes are local and uncommitted. No deploy, merge, push, credential rotation, or real provider/deployment test was run. Root should review the diff, deploy the additive schema with the functions through the normal project workflow, and smoke-test the normal flow. Existing provider credentials remain required and unchanged. Defaults apply without adding any environment variables.


## Validation

Run `bun --no-env-file test tests/security.test.ts`. These tests invoke registered Convex handlers against a test database with mocked providers; they do not contact a deployment.

Run `./node_modules/.bin/tsc -p convex --noEmit --pretty false` for backend types. Run `./node_modules/.bin/tsc --noEmit --pretty false` for app types.

Expected test count after this change: 9.

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
- `convex/workflows/mutateCanvasDocument.ts`
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
