import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const canvasCommandsTableDefinition = {
  canvasId: v.id("canvases"),
  authorUserId: v.id("users"),
  action: v.object({
    kind: v.literal("mutate_canvas_document"),
    transcodedCommandText: v.union(v.string(), v.null()),
    status: v.union(
      v.object({
        kind: v.literal("not_started"),
        createdAt: v.number(),
      }),
      v.object({
        kind: v.literal("transcoding"),
        createdAt: v.number(),
      }),
      v.object({
        kind: v.literal("mutating"),
        createdAt: v.number(),
      }),
      v.object({
        kind: v.literal("errored"),
        createdAt: v.number(),
        message: v.string(),
      }),
      v.object({
        kind: v.literal("success"),
        createdAt: v.number(),
      }),
    ),
    errorMessage: v.union(v.string(), v.null()),
  }),
};

export default defineSchema({
  users: defineTable({
    name: v.string(),
    pictureUrl: v.union(v.string(), v.null()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  canvases: defineTable({
    svgDocument: v.string(),
    name: v.string(),
    memberIds: v.array(v.id("canvasMembers")),
  }),

  canvasMembers: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("editor")),
    canvasId: v.id("canvases"),
  }).index("by_userId", ["userId"]),

  canvasCommands: defineTable(canvasCommandsTableDefinition).index("by_canvasId", ["canvasId"]),
});

// This is probably overkill for now..

//svgDocumentSnapshot: v.string(),
// steps: v.array(
//   v.union(
//     v.object({
//       kind: v.literal("request_transcode"),
//       createdAt: v.number(),
//       lengthBytes: v.number(),
//       lengthSeconds: v.number(),
//     }),
//     v.object({
//       kind: v.literal("transcode_success"),
//       createdAt: v.number(),
//       transcodeText: v.string(),
//     }),
//     v.object({
//       kind: v.literal("transcode_error"),
//       createdAt: v.number(),
//       errorMessage: v.string(),
//     }),
//     v.object({
//       kind: v.literal("request_mutation_from_chatgpt"),
//       createdAt: v.number(),
//     }),
//     v.object({
//       kind: v.literal("gpt_mutation_success"),
//       createdAt: v.number(),
//       outputSvgDocumentSnapshot: v.string(),
//     }),
//     v.object({
//       kind: v.literal("gpt_mutation_error"),
//       createdAt: v.number(),
//       errorMessage: v.string(),
//     }),
//   ),
// ),
