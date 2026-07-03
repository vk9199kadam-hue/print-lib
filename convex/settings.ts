import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Retrieve library settings (status, message, hours)
export const getLibrarySettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("library_settings").first();
    if (!settings) {
      return { is_open: true };
    }
    return settings;
  },
});

// Update library settings
export const updateLibrarySettings = mutation({
  args: {
    is_open: v.boolean(),
    closing_message: v.optional(v.string()),
    standard_hours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const first = await ctx.db.query("library_settings").first();
    if (first) {
      await ctx.db.patch(first._id, args);
    } else {
      await ctx.db.insert("library_settings", args);
    }
    return true;
  },
});

// Retrieve pricing configs
export const getPricing = query({
  args: {},
  handler: async (ctx) => {
    const pricing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "pricing"))
      .unique();
    if (!pricing) return null;
    return pricing.value;
  },
});

// Update pricing configs
export const updatePricing = mutation({
  args: {
    pricing: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "pricing"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.pricing });
    } else {
      await ctx.db.insert("settings", { key: "pricing", value: args.pricing });
    }
    return true;
  },
});
