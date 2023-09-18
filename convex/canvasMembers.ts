import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensure } from "../src/common/misc/ensure";
import { isNotNullOrUndefined } from "../src/common/misc/filter";
import { getMe } from "./utils/misc";
import { canvasMemberRole } from "./schema";
import { findCanvasMembershipForUser } from "./canvases";

export const listForCanvas = query({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async ({ db, auth }, { canvasId }) => {
    const canvas = ensure(await db.get(canvasId));

    const members = await Promise.all(canvas.memberIds.map((memberId) => db.get(memberId))).then(
      (m) => m.filter(isNotNullOrUndefined),
    );

    return members;
  },
});

export const findForUser = query({
  args: {
    canvasId: v.id("canvases"),
    userId: v.id("users"),
  },
  handler: async ({ db, auth }, { canvasId, userId }) => {
    return findCanvasMembershipForUser({
      canvasId,
      userId,
      db,
    });
  },
});

export const changeMemberRole = mutation({
  args: {
    memberId: v.id("canvasMembers"),
    role: canvasMemberRole,
  },
  handler: async ({ db, auth }, { memberId, role }) => {
    const me = await getMe({ auth, db });
    const member = ensure(await db.get(memberId));

    if (me._id == member.userId) throw new Error(`Cannot change your own role`);

    const myMembership = await findCanvasMembershipForUser({
      canvasId: member.canvasId,
      userId: member.userId,
      db,
    });

    if (myMembership?.role != "owner")
      throw new Error(`You must have owner role to change member roles`);

    await db.patch(memberId, {
      role,
    });
  },
});

export const addMember = mutation({
  args: {
    email: v.string(),
    canvasId: v.id("canvases"),
  },
  handler: async ({ db, auth }, { email, canvasId }) => {
    const me = await getMe({ auth, db });

    const myMembership = await findCanvasMembershipForUser({
      canvasId: canvasId,
      userId: me._id,
      db,
    });

    if (myMembership?.role != "owner")
      throw new Error(`You must have owner role to change member roles`);

    const user = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (!user) throw new Error(`No user with email ${email} found`);

    const existingMembership = await findCanvasMembershipForUser({
      canvasId: canvasId,
      userId: user._id,
      db,
    });

    if (existingMembership)
      throw new Error(`User ${user._id} is already a member of canvas ${canvasId}`);

    const newMember = await db.insert("canvasMembers", {
      userId: user._id,
      canvasId: canvasId,
      role: "editor",
    });

    const canvas = ensure(await db.get(canvasId));

    await db.patch(canvasId, {
      memberIds: [...canvas.memberIds, newMember],
    });
  },
});

export const removeMember = mutation({
  args: {
    memberId: v.id("canvasMembers"),
  },
  handler: async ({ db, auth }, { memberId }) => {
    const me = await getMe({ auth, db });

    const member = ensure(await db.get(memberId));

    const myMembership = await findCanvasMembershipForUser({
      canvasId: member.canvasId,
      userId: me._id,
      db,
    });

    if (myMembership?.role != "owner") throw new Error(`You must have owner to remove a member!`);

    await db.delete(memberId);
  },
});
