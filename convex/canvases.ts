import { DatabaseReader, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMe } from "./utils/misc";
import { isNotNullOrUndefined } from "../src/common/misc/filter";
import { Id } from "./_generated/dataModel";
import { omit } from "../src/common/misc/misc";
import { ensure } from "../src/common/misc/ensure";
import { canvasVisibility, chatGPTModel } from "./schema";

export const create = mutation({
  args: {
    name: v.string(),
    model: chatGPTModel,
  },
  handler: async ({ auth, db }, { name, model }) => {
    const user = await getMe({ auth, db });

    const canvas = await db.insert("canvases", {
      memberIds: [],
      name,
      model,
      visibility: "private",
      svgDocument: `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg"></svg>`,
    });

    const member = await db.insert("canvasMembers", {
      userId: user._id,
      canvasId: canvas,
      role: "owner",
    });

    await db.patch(canvas, {
      memberIds: [member],
    });

    return canvas;
  },
});

export const findCanvasMembershipForUser = async ({
  canvasId,
  userId,
  db,
}: {
  canvasId: Id<"canvases">;
  userId: Id<"users">;
  db: DatabaseReader;
}) => {
  const canvas = ensure(await db.get(canvasId), `Canvas ${canvasId} not found`);
  const members = await Promise.all(canvas.memberIds.map((memberId) => db.get(memberId))).then(
    (m) => m.filter(isNotNullOrUndefined),
  );
  return members.find((m) => m.userId === userId);
};

export const editSettings = mutation({
  args: {
    canvasId: v.id("canvases"),
    name: v.string(),
    model: chatGPTModel,
  },
  handler: async ({ auth, db }, { name, canvasId, model }) => {
    const user = await getMe({ auth, db });

    const membership = await findCanvasMembershipForUser({ db, userId: user._id, canvasId });
    if (!membership) throw new Error(`User ${user._id} is not a member of canvas ${canvasId}`);

    await db.patch(canvasId, {
      name,
      model,
    });
  },
});

export const changeVisibility = mutation({
  args: {
    canvasId: v.id("canvases"),
    visibility: canvasVisibility,
  },
  handler: async ({ auth, db }, { canvasId, visibility }) => {
    const user = await getMe({ auth, db });

    const membership = await findCanvasMembershipForUser({ db, userId: user._id, canvasId });
    if (!membership) throw new Error(`User ${user._id} is not a member of canvas ${canvasId}`);

    if (membership.role !== "owner")
      throw new Error(
        `User ${user._id} is not an owner of canvas ${canvasId}, cannot change the visibility!`,
      );

    await db.patch(canvasId, {
      visibility,
    });
  },
});

export const destroy = mutation({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async ({ auth, db }, { canvasId }) => {
    const user = await getMe({ auth, db });

    const membership = await findCanvasMembershipForUser({ db, userId: user._id, canvasId });
    if (!membership) throw new Error(`User ${user._id} is not a member of canvas ${canvasId}`);

    if (membership.role !== "owner")
      throw new Error(
        `User ${user._id} is not an owner of canvas ${canvasId}, cannot edit its settings!`,
      );

    const canvas = ensure(await db.get(canvasId));

    // Delete all the members first
    await Promise.all(canvas.memberIds.map((memberId) => db.delete(memberId)));

    // Then delete all the commands
    const commands = await db
      .query("canvasCommands")
      .withIndex("by_canvasId", (q) => q.eq("canvasId", canvasId))
      .take(1000);
    await Promise.all(commands.map((c) => db.delete(c._id)));

    // Finally delete the canvas
    await db.delete(canvasId);
  },
});

export const listMyPrivateCanvases = query({
  args: {},
  handler: async ({ db, auth }, {}) => {
    const user = await getMe({ auth, db });

    const members = await db
      .query("canvasMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(20);

    const canvases = await Promise.all(members.map((m) => db.get(m.canvasId))).then((c) =>
      c.filter(isNotNullOrUndefined),
    );

    const getContributorFromMember = async (memberId: Id<"canvasMembers">) => {
      const member = await db.get(memberId);
      if (!member) return null;
      const user = await db.get(member.userId);
      if (!user) return null;
      return {
        id: member._id,
        userId: user._id,
        name: user.name,
        pictureUrl: user.pictureUrl,
        role: member.role,
      };
    };

    const canvasesWithMembers = await Promise.all(
      canvases.map(async (canvas) => ({
        ...omit(canvas, "memberIds"),
        contributors: await Promise.all(canvas.memberIds.map(getContributorFromMember)).then((x) =>
          x.filter(isNotNullOrUndefined),
        ),
      })),
    );

    return canvasesWithMembers.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: {
    id: v.id("canvases"),
  },
  handler: async ({ db, auth }, { id }) => {
    const user = await getMe({ auth, db });
    const canvas = await db.get(id);

    const membership = await findCanvasMembershipForUser({ db, userId: user._id, canvasId: id });
    if (!membership) throw new Error(`You are not a member of this canvas, cannot view it!`);

    return canvas;
  },
});

export const updateSvgDocument = internalMutation({
  args: {
    canvasId: v.id("canvases"),
    svgDocument: v.string(),
  },
  handler: async ({ db }, { canvasId, svgDocument }) => {
    await db.patch(canvasId, {
      svgDocument,
    });
  },
});
