"use node";
import OpenAI, { toFile } from "openai";
import { internalAction } from "./_generated/server";
import { ensure } from "../src/common/misc/ensure";
import { v } from "convex/values";
import { validateCommandAudio } from "./audio";

export const transcode = internalAction({
  args: { bytes: v.bytes() },
  handler: async (_, { bytes }) => {
    const format = validateCommandAudio(bytes);
    const openai = new OpenAI({
      apiKey: ensure(process.env.OPENAI_API_KEY, `missing OPENAI_API_KEY`),
      maxRetries: 0,
      timeout: 30_000,
    });

    console.log(`transcode of ${bytes.byteLength} starting..`);
    const response = await openai.audio.transcriptions.create({
      file: await toFile(bytes, `${Date.now()}.${format.extension}`, {
        type: format.mimeType,
      }),
      model: "whisper-1",
    });
    console.log(`transcode complete`, response);

    return response.text;
  },
});
