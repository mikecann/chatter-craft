"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import OpenAI, { toFile } from "openai";
import { ensure } from "../../src/common/misc/ensure";
import { api, internal } from "../_generated/api";
import { errorToString } from "../../src/common/misc/errors";
import isSvg from "is-svg";
import { listRecentCommands } from "../canvasCommands";

export const beginMutateCanvasDocumentCommandWorkflow = internalAction({
  args: {
    commandId: v.id("canvasCommands"),
    commandAudio: v.bytes(),
    svgDocument: v.string(),
  },
  handler: async ({ runQuery, runMutation }, { commandId, commandAudio, svgDocument }) => {
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

      command = await runMutation(internal.canvasCommands.updateAction, {
        commandId,
        action: {
          ...command.action,
          transcodedCommandText: response.text,
          status: {
            kind: "mutating",
            createdAt: Date.now(),
          },
        },
      });

      const recentCommands = await runMutation(internal.canvasCommands.listRecentCommands, {
        canvasId: command.canvasId,
      });

      const reccentCommandsStr = recentCommands
        .map((c, i) => `${i + 1}. ${c.action.transcodedCommandText}`)
        .join("\n");

      const prompt = `You are going to help me edit an existing SVG document. Here is the existing document:\n\n${svgDocument}\n\nThe edit I would like you to make is: "${command.action.transcodedCommandText}"\n\nFor added context here are the 5 most recent prompts I used to edit the document from most recent to least recent:\n\n${reccentCommandsStr}`;

      console.log(`sending command`, prompt);

      const chatGPTResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        functions: [
          {
            name: "update_svg_document",
            description: "Updates the SVG document",
            parameters: {
              type: "object",
              properties: {
                svgDocument: {
                  type: "string",
                  description: "The text that makes up the entire SVG document",
                },
              },
              required: ["svgDocument"],
            },
          },
        ],
        function_call: "auto", // auto is default, but we'll be explicit
      });

      console.log(`got chat gpt response`, JSON.stringify(chatGPTResponse, null, 2));

      const responseMessage = chatGPTResponse.choices[0]?.message;

      if (!responseMessage) throw new Error(`No response message from chat GPT`);

      if (!responseMessage.function_call)
        throw new Error(`No function call from chat GPT, content was: ${responseMessage.content}`);

      if (responseMessage.function_call.name != "update_svg_document")
        throw new Error(
          `Unexpected function call from chat GPT, content was: ${responseMessage.content}`,
        );

      console.log(`Attempting to parse function args..`, responseMessage.function_call.arguments);
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      const updatedSvgDocument = functionArgs.svgDocument;

      console.log(`validating generated text is valid SVG..`);
      if (!isSvg(updatedSvgDocument)) throw new Error(`AI generated an invalid SVG document`);

      await runMutation(internal.canvases.updateSvgDocument, {
        canvasId: command.canvasId,
        svgDocument: updatedSvgDocument,
      });

      await runMutation(internal.canvasCommands.updateAction, {
        commandId,
        action: {
          ...command.action,
          status: {
            kind: "success",
            createdAt: Date.now(),
          },
        },
      });

      console.log(`transcode complete`, response);
    } catch (e) {
      console.error(`errored`, e);

      const errString = errorToString(e);

      command = await runMutation(internal.canvasCommands.updateAction, {
        commandId,
        action: {
          ...command.action,
          errorMessage: errString,
          status: {
            kind: "errored",
            createdAt: Date.now(),
            message: errString,
          },
        },
      });
    }
  },
});
