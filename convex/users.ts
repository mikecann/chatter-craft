import { mutation, query } from "./_generated/server";
import { ensure } from "../src/common/misc/ensure";
import { v } from "convex/values";
import * as misc from "./utils/misc";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = ensure(await ctx.auth.getUserIdentity(), `not authenticated`);

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user) {
      // If we've seen this identity before but the name has changed, patch the value.
      if (user.name !== identity.name) await ctx.db.patch(user._id, { name: identity.name });
      if (user.pictureUrl !== identity.pictureUrl)
        await ctx.db.patch(user._id, { pictureUrl: identity.pictureUrl ?? null });
      return user._id;
    }

    // Create a the new user
    const createdUser = await ctx.db.insert("users", {
      name: identity.name!,
      tokenIdentifier: identity.tokenIdentifier,
      pictureUrl: identity.pictureUrl ?? null,
    });

    return createdUser;
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async ({ db }, { id }) => {
    return await db.get(id);
  },
});

export const findMe = query({
  handler: misc.findMe,
});
