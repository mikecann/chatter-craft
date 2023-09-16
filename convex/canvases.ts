import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMe } from "./utils/misc";
import { isNotNullOrUndefined } from "../src/common/misc/filter";
import { Id } from "./_generated/dataModel";
import { omit } from "../src/common/misc/misc";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async ({ auth, db }, { name }) => {
    const user = await getMe({ auth, db });

    const canvas = await db.insert("canvases", {
      memberIds: [],
      name,
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

export const list = query({
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

    const getUserFromMember = async (memberId: Id<"canvasMembers">) => {
      const member = await db.get(memberId);
      if (!member) return null;
      const user = await db.get(member.userId);
      if (!user) return null;
      return {
        id: member._id,
        userId: user._id,
        name: user.name,
        pictureUrl: user.pictureUrl,
      };
    };

    const canvasesWithMembers = await Promise.all(
      canvases.map(async (canvas) => ({
        ...omit(canvas, "memberIds"),
        members: await Promise.all(canvas.memberIds.map(getUserFromMember)).then((x) =>
          x.filter(isNotNullOrUndefined),
        ),
      })),
    );

    return canvasesWithMembers;
  },
});

export const get = query({
  args: {
    id: v.id("canvases"),
  },
  handler: async ({ db, auth }, { id }) => {
    const user = await getMe({ auth, db });
    const canvas = await db.get(id);

    return canvas;
  },
});
