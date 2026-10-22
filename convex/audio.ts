// The recorder sends WebM/Opus, or Ogg/Opus where that is all the browser offers.
// Check decoded packet duration as well as bytes: a tiny, low-bitrate file or forged
// container duration must not buy hours of Whisper.
const MAX_BYTES = 512_000;
const MAX_DURATION_MS = 15_000;

export type CommandAudioFormat = {
  mimeType: "audio/webm" | "audio/ogg";
  extension: "webm" | "ogg";
};

const invalid = (): never => {
  throw new Error("Record up to 15 seconds of WebM or Ogg Opus audio (maximum 500 KiB)");
};

const ascii = (data: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...data.subarray(start, end));

// Duration of one Opus packet from its TOC byte (RFC 6716 section 3.1), whatever the container says.
function opusPacketMs(data: Uint8Array, packet: number, end: number): number {
  if (packet >= end) return invalid();
  const toc = data[packet];
  const config = toc >> 3;
  const frameMs =
    config >= 16
      ? 2.5 * 2 ** (config & 3)
      : config >= 12
      ? 10 * 2 ** (config & 1)
      : [10, 20, 40, 60][config & 3];
  const code = toc & 3;
  if (code === 3 && packet + 1 >= end) return invalid();
  const frames = code === 0 ? 1 : code < 3 ? 2 : data[packet + 1] & 0x3f;
  const duration = frameMs * frames;
  if (!frames || duration > 120) return invalid();
  return duration;
}

function isOpusHead(packet: Uint8Array): boolean {
  return (
    packet.length === 19 &&
    ascii(packet, 0, 8) === "OpusHead" &&
    packet[8] === 1 &&
    [1, 2].includes(packet[9]) &&
    packet[18] === 0
  );
}

export function validateCommandAudio(buffer: ArrayBuffer): CommandAudioFormat {
  const data = new Uint8Array(buffer);
  if (!data.length || data.length > MAX_BYTES) invalid();
  if (ascii(data, 0, 4) === "OggS") {
    validateOggOpus(data);
    return { mimeType: "audio/ogg", extension: "ogg" };
  }
  if (ascii(data, 4, 8) === "ftyp")
    throw new Error(
      "MP4/AAC recordings are not supported. Please use a browser that records WebM or Ogg Opus audio",
    );
  validateWebmOpus(buffer, data);
  return { mimeType: "audio/webm", extension: "webm" };
}

function validateWebmOpus(buffer: ArrayBuffer, data: Uint8Array): void {
  const uint = (start: number, end: number) => {
    if (end - start > 6) return invalid();
    let n = 0;
    for (let i = start; i < end; i++) n = n * 256 + data[i];
    return n;
  };
  const vint = (start: number, end: number, isId = false) => {
    if (start >= end || data[start] === 0) return invalid();
    let length = 1;
    let mask = 0x80;
    while (!(data[start] & mask)) {
      mask >>= 1;
      length++;
    }
    if (length > (isId ? 4 : 8) || start + length > end) return invalid();
    let value = isId ? data[start] : data[start] & (mask - 1);
    let unknown = !isId && value === mask - 1;
    for (let i = 1; i < length; i++) {
      value = value * 256 + data[start + i];
      unknown = unknown && data[start + i] === 255;
    }
    if (!unknown && !Number.isSafeInteger(value)) return invalid();
    return { value, length, unknown };
  };

  type Block = { start: number; end: number; clusterTime: number };
  const blocks: Block[] = [];
  const tracks: { number: number; codec: string; type: number; opus: boolean }[] = [];
  let elements = 0;
  let segments = 0;
  let docType = "";
  let scale = 1_000_000;
  const walk = (
    start: number,
    end: number,
    parent: number,
    depth: number,
    inheritedTime = 0,
  ): number => {
    if (depth > 8) return invalid();
    let pos = start;
    let clusterTime = inheritedTime;
    const track = { number: 0, codec: "", type: 0, opus: false };
    while (pos < end) {
      if (++elements > 10_000) return invalid();
      const id = vint(pos, end, true);
      // Unknown-size streaming clusters finish at the next cluster or segment index.
      if (parent === 0x1f43b675 && (id.value === 0x1f43b675 || id.value === 0x1c53bb6b)) return pos;
      const size = vint(pos + id.length, end);
      const content = pos + id.length + size.length;
      const next = size.unknown ? end : content + size.value;
      if (next > end || next < content) return invalid();
      if (size.unknown && id.value !== 0x18538067 && id.value !== 0x1f43b675) return invalid();

      if (id.value === 0x4282) docType = new TextDecoder().decode(data.subarray(content, next));
      else if (id.value === 0x2ad7b1) scale = uint(content, next);
      else if (id.value === 0x4489) {
        if (next - content !== 4 && next - content !== 8) return invalid();
        const view = new DataView(buffer, content, next - content);
        const duration = next - content === 4 ? view.getFloat32(0) : view.getFloat64(0);
        if (!Number.isFinite(duration) || duration < 0 || duration > MAX_DURATION_MS)
          return invalid();
      } else if (parent === 0xae && id.value === 0xd7) track.number = uint(content, next);
      else if (parent === 0xae && id.value === 0x83) track.type = uint(content, next);
      else if (parent === 0xae && id.value === 0x86)
        track.codec = new TextDecoder().decode(data.subarray(content, next));
      else if (parent === 0xae && id.value === 0x63a2) {
        if (!isOpusHead(data.subarray(content, next))) return invalid();
        track.opus = true;
      } else if (parent === 0xae && id.value === 0x6d80)
        return invalid(); // compressed/encrypted tracks
      else if (id.value === 0x9f && ![1, 2].includes(uint(content, next))) return invalid();
      else if (id.value === 0xb5) {
        if (next - content !== 4 && next - content !== 8) return invalid();
        const view = new DataView(buffer, content, next - content);
        const rate = next - content === 4 ? view.getFloat32(0) : view.getFloat64(0);
        if (rate !== 48_000) return invalid();
      } else if (id.value === 0xe7 && parent === 0x1f43b675) clusterTime = uint(content, next);
      else if (id.value === 0xa3 || id.value === 0xa1) {
        blocks.push({ start: content, end: next, clusterTime });
      }

      if (
        [0x1a45dfa3, 0x18538067, 0x1549a966, 0x1654ae6b, 0xae, 0xe1, 0x1f43b675, 0xa0].includes(
          id.value,
        )
      ) {
        if (id.value === 0x18538067 && ++segments !== 1) return invalid();
        pos = walk(content, next, id.value, depth + 1, clusterTime);
      } else pos = next;
      if (pos <= start) return invalid();
    }
    if (parent === 0xae) tracks.push(track);
    return pos;
  };

  if (data.length < 4 || uint(0, 4) !== 0x1a45dfa3) return invalid();
  walk(0, data.length, 0, 0);
  if (
    docType !== "webm" ||
    segments !== 1 ||
    scale !== 1_000_000 ||
    tracks.length !== 1 ||
    tracks[0].codec !== "A_OPUS" ||
    tracks[0].type !== 2 ||
    !tracks[0].opus ||
    !blocks.length
  )
    return invalid();

  let totalMs = 0;
  for (const block of blocks) {
    const track = vint(block.start, block.end);
    const header = block.start + track.length;
    if (track.value !== tracks[0].number || header + 3 >= block.end) return invalid();
    const timestamp = block.clusterTime + new DataView(buffer).getInt16(header);
    const flags = data[header + 2];
    if (flags & 0x06) return invalid(); // the browser recorder uses one packet per block, without lacing
    const duration = opusPacketMs(data, header + 3, block.end);
    if (timestamp < 0 || timestamp + duration > MAX_DURATION_MS) return invalid();
    totalMs += duration;
    if (totalMs > MAX_DURATION_MS) return invalid();
  }
}

const OGG_CRC = Array.from({ length: 256 }, (_, i) => {
  let r = i << 24;
  for (let j = 0; j < 8; j++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
  return r >>> 0;
});

// One logical Ogg/Opus stream (RFC 7845), every page CRC-checked so the packets counted
// here are exactly what a decoder would read. Granule positions are not trusted.
function validateOggOpus(data: Uint8Array): void {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const packets: Uint8Array[] = [];
  let pending: Uint8Array[] = [];
  let serial = 0;
  let pages = 0;
  let ended = false;
  let pos = 0;
  while (pos < data.length) {
    if (++pages > 2_000 || ended) return invalid();
    if (pos + 27 > data.length || ascii(data, pos, pos + 4) !== "OggS" || data[pos + 4] !== 0)
      return invalid();
    const flags = data[pos + 5];
    const first = pages === 1;
    if (flags & ~0x07 || Boolean(flags & 0x02) !== first) return invalid();
    if (Boolean(flags & 0x01) !== pending.length > 0) return invalid();
    if (first) serial = view.getUint32(pos + 14, true);
    else if (view.getUint32(pos + 14, true) !== serial) return invalid();
    if (view.getUint32(pos + 18, true) !== pages - 1) return invalid();
    ended = Boolean(flags & 0x04);

    const segments = data[pos + 26];
    let body = pos + 27 + segments;
    if (body > data.length) return invalid();
    const lacing = data.subarray(pos + 27, body);
    const end = body + lacing.reduce((sum, n) => sum + n, 0);
    if (end > data.length) return invalid();

    let crc = 0;
    for (let i = pos; i < end; i++) {
      const byte = i >= pos + 22 && i < pos + 26 ? 0 : data[i];
      crc = ((crc << 8) ^ OGG_CRC[((crc >>> 24) ^ byte) & 0xff]) >>> 0;
    }
    if (crc !== view.getUint32(pos + 22, true)) return invalid();

    for (const size of lacing) {
      pending.push(data.subarray(body, body + size));
      body += size;
      if (size < 255) {
        const packet = new Uint8Array(pending.reduce((sum, chunk) => sum + chunk.length, 0));
        pending.reduce((offset, chunk) => (packet.set(chunk, offset), offset + chunk.length), 0);
        packets.push(packet);
        pending = [];
      }
    }
    pos = end;
  }
  if (pending.length || packets.length < 3) return invalid();
  if (!isOpusHead(packets[0]) || ascii(packets[1], 0, 8) !== "OpusTags") return invalid();

  let totalMs = 0;
  for (const packet of packets.slice(2)) {
    totalMs += opusPacketMs(packet, 0, packet.length);
    if (totalMs > MAX_DURATION_MS) return invalid();
  }
}
