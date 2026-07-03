import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Generate a secure upload URL for the frontend file upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Retrieve a signed retrieval URL for a given storage ID
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = args.storageId as Id<"_storage">;
      return await ctx.storage.getUrl(id);
    } catch (e) {
      console.error("getFileUrl failed for storageId:", args.storageId, e);
      return null;
    }
  },
});

// Delete a file from Convex storage
export const deleteFile = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    try {
      await ctx.storage.delete(args.storageId as Id<"_storage">);
      return true;
    } catch {
      return false;
    }
  },
});
