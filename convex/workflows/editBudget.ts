"use node";
// Node-only: the cl100k_base rank table is about 1 MB, so keep it out of Convex mutations.
import { countTokens } from "gpt-tokenizer/esm/encoding/cl100k_base";

// gpt-4 and gpt-3.5-turbo both use cl100k_base. Limits from
// https://developers.openai.com/api/docs/models/gpt-4 and .../gpt-3.5-turbo
const MODEL_LIMITS = {
  "gpt-4": { contextWindow: 8_192, maxOutput: 8_192 },
  "gpt-3.5-turbo": { contextWindow: 16_385, maxOutput: 4_096 },
} as const;
export type EditModel = keyof typeof MODEL_LIMITS;

/** Hard ceiling on one completion, whatever the model allows. */
export const MAX_OUTPUT_TOKENS = 4_096;
/** Room beyond the existing document for the requested edit itself. */
export const EDIT_ROOM_TOKENS = 512;
/** Chat framing and the function-call wrapper, which are not in the counted text. */
const FRAMING_TOKENS = 64;
/** Held back for the transcript and recent history before they are known. */
export const UNKNOWN_TEXT_ALLOWANCE_TOKENS = 600;

export const SVG_FUNCTIONS = [
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
];

export function buildEditPrompt(svgDocument: string, edit: string, recentCommands: string) {
  return `You are going to help me edit an existing SVG document. Here is the existing document:\n\n${svgDocument}\n\nThe edit I would like you to make is: "${edit}"\n\nFor added context here are the 5 most recent prompts I used to edit the document from most recent to least recent:\n\n${recentCommands}\n\nDo not verify with me first or ask for any additional information or questions, simply do the edit, nothing more.`;
}

/**
 * The function call has to return the whole document as escaped JSON, so the
 * completion needs at least that many tokens plus room for the edit, and the
 * prompt (which also holds the document) has to fit beside it in the context.
 * Returns max_tokens for the request, or throws if that budget cannot fit.
 */
export function planEditCompletion(
  model: EditModel,
  svgDocument: string,
  prompt: string,
  unknownTextAllowance = 0,
): number {
  const limits = MODEL_LIMITS[model];
  const promptTokens =
    countTokens(prompt) +
    countTokens(JSON.stringify(SVG_FUNCTIONS)) +
    FRAMING_TOKENS +
    unknownTextAllowance;
  const needed = countTokens(JSON.stringify({ svgDocument })) + FRAMING_TOKENS + EDIT_ROOM_TOKENS;
  const available = Math.min(
    MAX_OUTPUT_TOKENS,
    limits.maxOutput,
    limits.contextWindow - promptTokens,
  );
  if (needed > available)
    throw new Error(
      "This canvas is too detailed for an AI edit with this model. Simplify the drawing and try again.",
    );
  return available;
}
