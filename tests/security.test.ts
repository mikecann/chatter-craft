import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { TestDb, invoke } from "./support";
import { createCanvasDocumentMutation } from "../convex/canvasCommands";
import { get as getUser } from "../convex/users";
import { validateCommandAudio } from "../convex/audio";
import { reserveLimits, DAY } from "../convex/abuse";
import { getFunctionName } from "convex/server";
import { listForCanvas, findForUser } from "../convex/canvasMembers";
import { pickRecordingType } from "../src/canvas/AudioRecorder";
import { countTokens } from "gpt-tokenizer/esm/encoding/cl100k_base";
import { EDIT_ROOM_TOKENS, MAX_OUTPUT_TOKENS } from "../convex/workflows/editBudget";

afterEach(() => {
  delete process.env.CHATTER_GLOBAL_DAILY_LIMIT;
});
const recording = await Bun.file(
  new URL("./fixtures/short-command.webm", import.meta.url),
).arrayBuffer();
const fixture = (name: string) =>
  Bun.file(new URL(`./fixtures/${name}`, import.meta.url)).arrayBuffer();
const auth = (token: string | null) => ({
  getUserIdentity: async () => (token ? { tokenIdentifier: token } : null),
});

function seedCanvas(
  db: TestDb,
  token: string,
  svgDocument = '<svg xmlns="http://www.w3.org/2000/svg"/>',
  model = "chat_gpt_4",
) {
  const userId = db.seed("users", {
    tokenIdentifier: token,
    email: `${token}@example.invalid`,
    name: token,
    pictureUrl: null,
  });
  const canvasId = db.seed("canvases", {
    memberIds: [],
    svgDocument,
    model,
  });
  const memberId = db.seed("canvasMembers", { canvasId, userId, role: "owner" });
  db.rows.get(canvasId).memberIds = [memberId];
  return { userId, canvasId };
}

test("anonymous callers and nonmembers cannot schedule paid edits", async () => {
  const db = new TestDb();
  const { canvasId } = seedCanvas(db, "owner");
  seedCanvas(db, "other");
  const runAfter = mock(async () => "scheduled");
  for (const token of [null, "other"]) {
    await expect(
      invoke(
        createCanvasDocumentMutation,
        { db, auth: auth(token), scheduler: { runAfter } },
        { canvasId, bytes: recording },
      ),
    ).rejects.toThrow();
  }
  expect(runAfter).not.toHaveBeenCalled();
  expect(await db.query("canvasCommands").collect()).toHaveLength(0);
  expect(await db.query("abuseLimits").collect()).toHaveLength(0);
});

test("normal recordings schedule a workflow and new accounts share the daily ceiling", async () => {
  process.env.CHATTER_GLOBAL_DAILY_LIMIT = "1";
  const db = new TestDb();
  const first = seedCanvas(db, "one");
  const second = seedCanvas(db, "two");
  const runAfter = mock(async () => "scheduled");
  const ctx = (token: string) => ({ db, auth: auth(token), scheduler: { runAfter } });
  await invoke(createCanvasDocumentMutation, ctx("one"), {
    canvasId: first.canvasId,
    bytes: recording,
  });
  await expect(
    invoke(createCanvasDocumentMutation, ctx("two"), {
      canvasId: second.canvasId,
      bytes: recording,
    }),
  ).rejects.toThrow("limit");
  expect(runAfter).toHaveBeenCalledTimes(1);
  expect(await db.query("canvasCommands").collect()).toHaveLength(1);
});

test("user profiles expose neither email addresses nor token identifiers", async () => {
  const db = new TestDb();
  const { userId } = seedCanvas(db, "owner");
  expect(await invoke(getUser, { db, auth: auth(null) }, { id: userId })).toBeNull();
  const profile = await invoke(getUser, { db, auth: auth("reader") }, { id: userId });
  expect(profile.name).toBe("owner");
  expect(profile).not.toHaveProperty("email");
  expect(profile).not.toHaveProperty("tokenIdentifier");
});

test("audio validation accepts real Opus, rejects invalid/oversized files and forged short durations", () => {
  expect(() => validateCommandAudio(recording)).not.toThrow();
  expect(() => validateCommandAudio(new ArrayBuffer(512_001))).toThrow();
  expect(() => validateCommandAudio(new TextEncoder().encode("not audio").buffer)).toThrow();
  // Every packet below claims timestamp zero. Real decoded packet durations still
  // add up to more than 15 seconds, even with no container duration metadata.
  expect(() => validateCommandAudio(webmWithPackets(750))).not.toThrow();
  expect(() => validateCommandAudio(webmWithPackets(751))).toThrow();
});

test("secondary quota refusals write nothing and rollover reuses the counter row", async () => {
  const db = new TestDb();
  const ctx = { db } as any;
  await reserveLimits(ctx, [{ key: "full", windowMs: DAY, maximum: 1 }], 0);
  await expect(
    reserveLimits(
      ctx,
      [
        { key: "new", windowMs: DAY, maximum: 1 },
        { key: "full", windowMs: DAY, maximum: 1 },
      ],
      1,
    ),
  ).rejects.toThrow();
  expect(await db.query("abuseLimits").collect()).toHaveLength(1);
  await reserveLimits(ctx, [{ key: "full", windowMs: DAY, maximum: 1 }], DAY);
  expect(await db.query("abuseLimits").collect()).toHaveLength(1);
});

const transcribe = mock(async (..._args: any[]) => ({ text: "Add a circle" }));
let reply = "";
const complete = mock(async (..._args: any[]) => ({
  choices: [
    {
      message: {
        function_call: {
          name: "update_svg_document",
          arguments: JSON.stringify({ svgDocument: reply }),
        },
      },
    },
  ],
}));
const toFile = mock(async (..._args: any[]) => new Blob());
mock.module("openai", () => ({
  default: class {
    audio = { transcriptions: { create: transcribe } };
    chat = { completions: { create: complete } };
  },
  toFile: toFile,
}));

// Schedules an edit through the real mutation, then runs the scheduled workflow
// with mocked providers. The model echoes `replySvg` back as its edit.
async function runEditWorkflow(svgDocument: string, model: string, replySvg: string) {
  transcribe.mockClear();
  complete.mockClear();
  toFile.mockClear();
  reply = replySvg;
  const { beginMutateCanvasDocumentCommandWorkflow } = await import(
    "../convex/workflows/mutateCanvasDocument"
  );
  const commands = await import("../convex/canvasCommands");
  const { updateSvgDocument } = await import("../convex/canvases");
  const db = new TestDb();
  const { canvasId } = seedCanvas(db, "owner", svgDocument, model);
  let scheduled: any;
  const commandId = await invoke(
    createCanvasDocumentMutation,
    {
      db,
      auth: auth("owner"),
      scheduler: {
        runAfter: async (_delay: number, _ref: any, args: any) => {
          scheduled = args;
        },
      },
    },
    { canvasId, bytes: recording },
  );
  const log = spyOn(console, "log").mockImplementation(() => {});
  const error = spyOn(console, "error").mockImplementation(() => {});
  process.env.OPENAI_API_KEY = "test-only-openai-key";
  try {
    await invoke(
      beginMutateCanvasDocumentCommandWorkflow,
      {
        runQuery: async (_ref: any, args: any) => invoke(commands.getInternal, { db }, args),
        runMutation: async (ref: any, args: any) => {
          const name = getFunctionName(ref);
          const fn =
            name === "canvasCommands:updateAction"
              ? commands.updateAction
              : name === "canvasCommands:listRecentCommands"
              ? commands.listRecentCommands
              : updateSvgDocument;
          return invoke(fn, { db }, args);
        },
      },
      scheduled,
    );
  } finally {
    log.mockRestore();
    error.mockRestore();
    delete process.env.OPENAI_API_KEY;
  }
  const command = await db.get(commandId);
  return { status: command.action.status, svg: (await db.get(canvasId)).svgDocument };
}

// Dense SVG whose JSON form needs heavy escaping: quotes, backslashes, entities, non-ASCII.
function complexSvg(shapes: number) {
  const body = Array.from(
    { length: shapes },
    (_, i) =>
      `<path d="M${(i * 7) % 500} ${(i * 13) % 500}l${i % 9}.5 ${i % 7}.25z" fill="#${((i * 99991) % 0xffffff)
        .toString(16)
        .padStart(6, "0")}"/><text x="${i}">"q\\${i}" &amp; é</text>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">${body.join("\n")}</svg>`;
}

test("a reserved workflow completes without browser auth and caps GPT output", async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
  const result = await runEditWorkflow('<svg xmlns="http://www.w3.org/2000/svg"/>', "chat_gpt_4", svg);
  expect(result.status.kind).toBe("success");
  expect(result.svg).toBe(svg);
  expect(transcribe).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenCalledTimes(1);
  expect((complete.mock.calls[0] as any)[0].max_tokens).toBe(MAX_OUTPUT_TOKENS);
  expect(toFile.mock.calls[0][1]).toEndWith(".webm");
  expect(toFile.mock.calls[0][2]).toEqual({ type: "audio/webm" });
});

test("the completion budget fits the whole existing document, or the edit is refused before paid calls", async () => {
  // Near the gpt-4 limit: prompt + returned document + edit room only just fit 8,192 tokens.
  const nearLimit = complexSvg(81);
  const ok = await runEditWorkflow(nearLimit, "chat_gpt_4", nearLimit);
  expect(ok.status.kind).toBe("success");
  expect(ok.svg).toBe(nearLimit);
  const request = (complete.mock.calls[0] as any)[0];
  const returned = countTokens(JSON.stringify({ svgDocument: nearLimit }));
  expect(request.max_tokens).toBeGreaterThanOrEqual(returned + EDIT_ROOM_TOKENS);
  expect(request.max_tokens).toBeLessThanOrEqual(MAX_OUTPUT_TOKENS);
  const promptTokens =
    countTokens(request.messages[0].content) + countTokens(JSON.stringify(request.functions));
  expect(promptTokens + request.max_tokens).toBeLessThanOrEqual(8_192);

  // Under the 12,000-byte ceiling, but the document can't be returned in full.
  for (const [svg, model] of [
    [complexSvg(82), "chat_gpt_4"],
    [complexSvg(140), "chat_gpt_3.5_turbo"],
  ]) {
    expect(new TextEncoder().encode(svg).byteLength).toBeLessThan(12_000);
    const refused = await runEditWorkflow(svg, model, svg);
    expect(refused.status.kind).toBe("errored");
    expect(refused.status.message).toContain("too detailed");
    expect(refused.svg).toBe(svg);
    expect(transcribe).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  }
});

test("Chrome-style streaming WebM and Ogg Opus pass; longer or unverifiable recordings do not", async () => {
  // Generated by tests/make-audio-fixtures.ts: unknown-size Segment and Clusters,
  // SimpleBlocks, no Cues or container Duration, like a MediaRecorder stream.
  const [webm, longWebm, ogg, longOgg, mp4] = await Promise.all(
    [
      "streaming-3s.webm",
      "streaming-16s.webm",
      "command-3s.ogg",
      "command-16s.ogg",
      "command-1s.m4a",
    ].map(fixture),
  );
  expect(validateCommandAudio(webm)).toEqual({
    mimeType: "audio/webm",
    extension: "webm",
  });
  expect(() => validateCommandAudio(longWebm)).toThrow("15 seconds");

  expect(validateCommandAudio(ogg)).toEqual({ mimeType: "audio/ogg", extension: "ogg" });
  expect(() => validateCommandAudio(longOgg)).toThrow("15 seconds");

  // A changed byte fails the page CRC rather than being counted differently from a decoder.
  const tampered = new Uint8Array(ogg.slice(0));
  tampered[tampered.length - 5] ^= 0xff;
  expect(() => validateCommandAudio(tampered.buffer)).toThrow();
  // Trailing data or a second chained stream is refused.
  const chained = new Uint8Array([...new Uint8Array(ogg), ...new Uint8Array(ogg)]);
  expect(() => validateCommandAudio(chained.buffer)).toThrow();

  expect(() => validateCommandAudio(mp4)).toThrow("MP4/AAC");
});

test("the recorder asks for a verifiable Opus type instead of the browser default", () => {
  const supports = (types: string[]) => ({ isTypeSupported: (t: string) => types.includes(t) });
  expect(pickRecordingType(supports(["audio/webm;codecs=opus", "audio/ogg;codecs=opus"]))).toBe(
    "audio/webm;codecs=opus",
  );
  expect(pickRecordingType(supports(["audio/ogg;codecs=opus"]))).toBe("audio/ogg;codecs=opus");
  expect(pickRecordingType(supports(["audio/mp4"]))).toBeNull();
  expect(pickRecordingType(undefined)).toBeNull();
});

test("canvas member lists are only visible to members of that canvas", async () => {
  const db = new TestDb();
  const { canvasId, userId } = seedCanvas(db, "owner");
  seedCanvas(db, "outsider");
  await expect(invoke(listForCanvas, { db, auth: auth(null) }, { canvasId })).rejects.toThrow();
  await expect(invoke(listForCanvas, { db, auth: auth("outsider") }, { canvasId })).rejects.toThrow(
    "not a member",
  );
  const members = await invoke(listForCanvas, { db, auth: auth("owner") }, { canvasId });
  expect(members.map((m: any) => m.userId)).toEqual([userId]);
  for (const token of [null, "outsider"]) {
    await expect(
      invoke(findForUser, { db, auth: auth(token) }, { canvasId, userId }),
    ).rejects.toThrow();
  }
  const member = await invoke(
    findForUser, { db, auth: auth("owner") }, { canvasId, userId },
  );
  expect(member.userId).toBe(userId);
});

function webmWithPackets(count: number): ArrayBuffer {
  const text = (value: string) => [...new TextEncoder().encode(value)];
  const element = (id: number[], bytes: number[]) => {
    const size =
      bytes.length < 127 ? [0x80 | bytes.length] : [0x40 | (bytes.length >> 8), bytes.length & 255];
    return [...id, ...size, ...bytes];
  };
  const opusHead = [...text("OpusHead"), 1, 1, 0, 0, 0x80, 0xbb, 0, 0, 0, 0, 0];
  const track = element(
    [0xae],
    [
      ...element([0xd7], [1]),
      ...element([0x83], [2]),
      ...element([0x86], text("A_OPUS")),
      ...element([0x63, 0xa2], opusHead),
    ],
  );
  // A 20 ms Opus silence packet, following a one-track SimpleBlock header.
  const block = element([0xa3], [0x81, 0, 0, 0x80, 0xf8, 0xff, 0xfe]);
  const cluster = element(
    [0x1f, 0x43, 0xb6, 0x75],
    Array.from({ length: count }, () => block).flat(),
  );
  return new Uint8Array([
    ...element([0x1a, 0x45, 0xdf, 0xa3], element([0x42, 0x82], text("webm"))),
    ...element([0x18, 0x53, 0x80, 0x67], [...element([0x16, 0x54, 0xae, 0x6b], track), ...cluster]),
  ]).buffer;
}
