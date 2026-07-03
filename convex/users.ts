import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all users
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const parsedId = ctx.db.normalizeId("users", args.id);
      if (!parsedId) return null;
      return await ctx.db.get(parsedId);
    } catch {
      return null;
    }
  },
});

// Create new user
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    gender: v.optional(v.string()),
    student_print_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      return existing;
    }
    
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      gender: args.gender || "Other",
      student_print_id: args.student_print_id,
      is_verified: true,
      created_at: Date.now(),
    });
    
    return await ctx.db.get(userId);
  },
});
