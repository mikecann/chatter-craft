"use node";
import OpenAI, { toFile } from "openai";
import { action } from "./_generated/server";
import { ensure } from "../src/common/misc/ensure";
import { v } from "convex/values";
import { createReadStream, ReadStream } from "fs";
import { Readable } from "stream";

export const transcode = action({
  args: { bytes: v.bytes() },
  handler: async (_, { bytes }) => {
    console.log(`got some bytes...`, bytes.byteLength);

    const openai = new OpenAI({
      apiKey: ensure(process.env.OPENAI_API_KEY, `missing OPENAI_API_KEY`),
    });

    console.log(`sending blob to openAI.....`);

    //const stream = Readable.fromWeb(bytes);

    const response = await openai.audio.transcriptions.create({
      file: await toFile(bytes, `${Date.now()}.webm`, {
        type: "audio/webm;codecs=opus",
      }),
      model: "whisper-1",
    });
    console.log(`SENT!`, response);

    return "done";
  },
});
