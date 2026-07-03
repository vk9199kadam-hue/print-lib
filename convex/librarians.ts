import { action, internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { Doc } from "./_generated/dataModel";

// Check backend status
export const health = query({
  args: {},
  handler: async (ctx) => {
    const librariansCount = (await ctx.db.query("librarians").collect()).length;
    return { status: "ok", db: true, librarians: librariansCount };
  },
});

// Internal helper query to fetch a librarian by email
export const getLibrarianByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("librarians")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Internal helper mutation to update hashed password (migration)
export const updateLibrarianPasswordInternal = internalMutation({
  args: { id: v.id("librarians"), newHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { password: args.newHash });
  },
});

// verifyLibrarian node action for bcrypt operations
export const verifyLibrarian = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<Omit<Doc<"librarians">, "password"> | null> => {
    // 1. Fetch librarian internal record
    const user: Doc<"librarians"> | null = await ctx.runQuery(internal.librarians.getLibrarianByEmailInternal, { email: args.email });
    if (!user) return null;
    
    let isValid = false;
    
    // 2. Perform safe bcrypt verification
    if (user.password === args.password) {
      isValid = true;
      const newHash = await bcrypt.hash(args.password, 10);
      await ctx.runMutation(internal.librarians.updateLibrarianPasswordInternal, {
        id: user._id,
        newHash,
      });
    } else {
      isValid = await bcrypt.compare(args.password, user.password);
    }
    
    if (!isValid) return null;
    
    // 3. Return sanitized user record
    const { password, ...safeUser } = user;
    return safeUser;
  },
});

// Update librarian profile
export const updateLibrarianProfile = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    library_name: v.string(),
    upi_id: v.optional(v.string()),
    contact_number: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parsedId = ctx.db.normalizeId("librarians", args.id);
    if (!parsedId) return false;
    
    await ctx.db.patch(parsedId, {
      name: args.name,
      library_name: args.library_name,
      upi_id: args.upi_id,
      contact_number: args.contact_number,
    });
    return true;
  },
});
