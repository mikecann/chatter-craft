// Regenerates the recording fixtures from a synthetic tone with local ffmpeg/libopus.
// No microphone or provider is involved. Run: bun tests/make-audio-fixtures.ts
//
// The WebM output is rewritten into the layout Chrome's MediaRecorder streams:
// an unknown-size Segment holding Info, Tracks and unknown-size Clusters of
// SimpleBlocks, with no SeekHead, Cues, Tags or container Duration.

const dir = new URL("./fixtures/", import.meta.url).pathname;

function ffmpeg(seconds: number, format: string, extra: string[]): Uint8Array {
  const result = Bun.spawnSync([
    "ffmpeg",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=440:sample_rate=48000:duration=${seconds}`,
    "-ac",
    "1",
    ...extra,
    "-fflags",
    "+bitexact",
    "-f",
    format,
    "-",
  ]);
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
  return result.stdout;
}

function vint(data: Uint8Array, pos: number, isId: boolean) {
  let length = 1;
  while (!(data[pos] & (0x80 >> (length - 1)))) length++;
  let value = isId ? data[pos] : data[pos] & ((0x80 >> (length - 1)) - 1);
  let unknown = !isId && value === (0x80 >> (length - 1)) - 1;
  for (let i = 1; i < length; i++) {
    value = value * 256 + data[pos + i];
    unknown = unknown && data[pos + i] === 255;
  }
  return { value, length, unknown };
}

const UNKNOWN_SIZE = [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

function chromeStyleWebm(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  let pos = 0;
  while (pos < input.length) {
    const id = vint(input, pos, true);
    const size = vint(input, pos + id.length, false);
    const content = pos + id.length + size.length;
    if (id.value !== 0x18538067) {
      out.push(...input.subarray(pos, content + size.value));
      pos = content + size.value;
      continue;
    }
    out.push(...input.subarray(pos, pos + id.length), ...UNKNOWN_SIZE);
    pos = content;
    while (pos < input.length) {
      const child = vint(input, pos, true);
      const childSize = vint(input, pos + child.length, false);
      const childContent = pos + child.length + childSize.length;
      if (childSize.unknown) throw new Error("Unexpected unknown-size child");
      const next = childContent + childSize.value;
      if (child.value === 0x1f43b675) {
        out.push(...input.subarray(pos, pos + child.length), ...UNKNOWN_SIZE);
        out.push(...input.subarray(childContent, next));
      } else if (child.value === 0x1549a966) {
        out.push(...withoutDuration(input.subarray(pos, next), child.length));
      } else if (child.value === 0x1654ae6b) {
        out.push(...input.subarray(pos, next));
      } // SeekHead, Void, Cues and Tags are dropped.
      pos = next;
    }
  }
  return new Uint8Array(out);
}

function withoutDuration(info: Uint8Array, idLength: number): number[] {
  const size = vint(info, idLength, false);
  const children: number[] = [];
  let pos = idLength + size.length;
  while (pos < info.length) {
    const id = vint(info, pos, true);
    const childSize = vint(info, pos + id.length, false);
    const next = pos + id.length + childSize.length + childSize.value;
    if (id.value !== 0x4489) children.push(...info.subarray(pos, next));
    pos = next;
  }
  // An 8-byte size keeps this simple; it is a valid EBML encoding.
  const length = children.length;
  return [
    ...info.subarray(0, idLength),
    0x01,
    0,
    0,
    0,
    0,
    (length >> 16) & 255,
    (length >> 8) & 255,
    length & 255,
    ...children,
  ];
}

const opus = ["-c:a", "libopus", "-b:a", "16k", "-frame_duration", "20"];
const webm = [...opus, "-live", "1", "-cluster_time_limit", "1000"];
const write = (name: string, bytes: Uint8Array) => Bun.write(dir + name, bytes);

await write("streaming-3s.webm", chromeStyleWebm(ffmpeg(3, "webm", webm)));
await write("streaming-16s.webm", chromeStyleWebm(ffmpeg(16, "webm", webm)));
await write("command-3s.ogg", ffmpeg(3, "ogg", opus));
await write("command-16s.ogg", ffmpeg(16, "ogg", opus));
await write(
  "command-1s.m4a",
  ffmpeg(1, "mp4", ["-c:a", "aac", "-b:a", "32k", "-movflags", "frag_keyframe+empty_moov"]),
);
