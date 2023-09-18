import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMe } from "./utils/misc";
import { omit, pick } from "../src/common/misc/misc";
import { ensure } from "../src/common/misc/ensure";
import { internal } from "./_generated/api";
import { canvasCommandsTableDefinition } from "./schema";

export const get = query({
  args: {
    commandId: v.id("canvasCommands"),
  },
  handler: async ({ db }, { commandId }) => {
    return ensure(await db.get(commandId), `could not find command ${commandId}`);
  },
});

export const list = query({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async ({ db, auth }, { canvasId }) => {
    const user = await getMe({ auth, db });

    const commands = await db
      .query("canvasCommands")
      .withIndex("by_canvasId", (q) => q.eq("canvasId", canvasId))
      .order("asc")
      .take(50);

    return Promise.all(
      commands.map(async (command) => ({
        ...omit(command, "authorUserId"),
        author: await db
          .get(command.authorUserId)
          .then(ensure)
          .then((user) => pick(user, "name", "_id", "pictureUrl")),
      })),
    );
  },
});

export const listRecentCommands = internalMutation({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async ({ db }, { canvasId }) => {
    return db
      .query("canvasCommands")
      .withIndex("by_canvasId", (q) => q.eq("canvasId", canvasId))
      .order("asc")
      .take(5);
  },
});

export const createCanvasDocumentMutation = mutation({
  args: {
    canvasId: v.id("canvases"),
    bytes: v.bytes(),
  },
  handler: async ({ db, auth, scheduler }, { canvasId, bytes }) => {
    const me = await getMe({ auth, db });

    // Make sure the canvas exists
    const canvas = ensure(await db.get(canvasId));

    // Create the command
    const command = await db.insert("canvasCommands", {
      canvasId,
      authorUserId: me._id,
      action: {
        kind: "mutate_canvas_document",
        status: {
          kind: "not_started",
          createdAt: Date.now(),
        },
        errorMessage: null,
        transcodedCommandText: null,
      },
    });

    // Lets start the workflow
    await scheduler.runAfter(
      0,
      internal.workflows.mutateCanvasDocument.beginMutateCanvasDocumentCommandWorkflow,
      {
        commandId: command,
        commandAudio: bytes,
        svgDocument: canvas.svgDocument,
        model: canvas.model,
      },
    );

    return command;
  },
});

export const updateAction = internalMutation({
  args: {
    commandId: v.id("canvasCommands"),
    action: canvasCommandsTableDefinition.action,
  },
  handler: async ({ db }, { commandId, action }) => {
    await db.patch(commandId, {
      action,
    });

    return ensure(await db.get(commandId));
  },
});
