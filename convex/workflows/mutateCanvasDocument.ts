"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import OpenAI, { toFile } from "openai";
import { ensure } from "../../src/common/misc/ensure";
import { internal } from "../_generated/api";
import { errorToString } from "../../src/common/misc/errors";
import isSvg from "is-svg";
import { chatGPTModel } from "../schema";
import { validateCommandAudio } from "../audio";
import { MAX_SVG_BYTES } from "../abuse";
import {
  SVG_FUNCTIONS,
  UNKNOWN_TEXT_ALLOWANCE_TOKENS,
  buildEditPrompt,
  planEditCompletion,
} from "./editBudget";

export const beginMutateCanvasDocumentCommandWorkflow = internalAction({
  args: {
    commandId: v.id("canvasCommands"),
    model: chatGPTModel,
    commandAudio: v.bytes(),
    svgDocument: v.string(),
  },
  handler: async ({ runQuery, runMutation }, { commandId, commandAudio, svgDocument, model }) => {
    let command = await runQuery(internal.canvasCommands.getInternal, { commandId });

    try {
      const format = validateCommandAudio(commandAudio);
      if (new TextEncoder().encode(svgDocument).byteLength > MAX_SVG_BYTES)
        throw new Error("Canvas is too large");
      const openAIModel = model == "chat_gpt_4" ? "gpt-4" : "gpt-3.5-turbo";
      // Refuse before Whisper if the document can't be returned in full by this model.
      planEditCompletion(
        openAIModel,
        svgDocument,
        buildEditPrompt(svgDocument, "", ""),
        UNKNOWN_TEXT_ALLOWANCE_TOKENS,
      );
      const openai = new OpenAI({
        apiKey: ensure(process.env.OPENAI_API_KEY, `missing OPENAI_API_KEY`),
        maxRetries: 0,
        timeout: 30_000,
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
        file: await toFile(commandAudio, `${Date.now()}.${format.extension}`, {
          type: format.mimeType,
        }),
        model: "whisper-1",
      });

      if (response.text.length > 1000) throw new Error("Recording transcript is too long");
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
        .map((c, i) => `${i + 1}. ${c.action.transcodedCommandText?.slice(0, 200) ?? ""}`)
        .join("\n");

      const prompt = buildEditPrompt(
        svgDocument,
        command.action.transcodedCommandText ?? "",
        reccentCommandsStr,
      );
      const maxTokens = planEditCompletion(openAIModel, svgDocument, prompt);

      console.log(`sending command`, prompt);

      const chatGPTResponse = await openai.chat.completions.create({
        model: openAIModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        n: 1,
        functions: SVG_FUNCTIONS,
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
      if (
        typeof updatedSvgDocument !== "string" ||
        new TextEncoder().encode(updatedSvgDocument).byteLength > MAX_SVG_BYTES
      )
        throw new Error("Generated SVG is too large");
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
