"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import OpenAI, { toFile } from "openai";
import { ensure } from "../../src/common/misc/ensure";
import { api, internal } from "../_generated/api";
import { errorToString } from "../../src/common/misc/useErrors";

export const beginMutateCanvasDocumentCommandWorkflow = internalAction({
  args: {
    commandId: v.id("canvasCommands"),
    commandAudio: v.bytes(),
  },
  handler: async ({ runQuery, runMutation }, { commandId, commandAudio }) => {
    let command = await runQuery(api.canvasCommands.get, { commandId });

    try {
      const openai = new OpenAI({
        apiKey: ensure(process.env.OPENAI_API_KEY, `missing OPENAI_API_KEY`),
      });

      command = await runMutation(internal.canvasCommands.updateAction, {
        commandId,
        action: {
          ...command.action,
          status: {
            kind: "transcoding",
            createdAt: Date.now(),
          },
        },
      });

      console.log(`transcode of ${commandAudio.byteLength} starting..`);
      const response = await openai.audio.transcriptions.create({
        file: await toFile(commandAudio, `${Date.now()}.webm`, {
          type: "audio/webm;codecs=opus",
        }),
        model: "whisper-1",
      });

      await runMutation(internal.canvasCommands.updateAction, {
        commandId,
        action: {
          ...action,
          transcodedCommandText: response.text,
          status: {
            kind: "mutating",
            createdAt: Date.now(),
          },
        },
      });

      console.log(`transcode complete`, response);
    } catch (e) {
      console.error(`errored`, e);

      await runMutation(internal.canvasCommands.updateAction, {
        commandId,
        action: {
          ...action,
          status: {
            kind: "errored",
            createdAt: Date.now(),
            message: errorToString(e),
          },
        },
      });
    }
  },
});
