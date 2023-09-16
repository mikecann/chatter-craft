"use node";
import OpenAI, { toFile } from "openai";
import { internalAction } from "./_generated/server";
import { ensure } from "../src/common/misc/ensure";
import { v } from "convex/values";

export const transcode = internalAction({
  args: { bytes: v.bytes() },
  handler: async (_, { bytes }) => {
    const openai = new OpenAI({
      apiKey: ensure(process.env.OPENAI_API_KEY, `missing OPENAI_API_KEY`),
    });

    console.log(`transcode of ${bytes.byteLength} starting..`);
    const response = await openai.audio.transcriptions.create({
      file: await toFile(bytes, `${Date.now()}.webm`, {
        type: "audio/webm;codecs=opus",
      }),
      model: "whisper-1",
    });
    console.log(`transcode complete`, response);

    return response.text;
  },
});
