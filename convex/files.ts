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

// Automatic cleanup mutation: delete files older than 24 hours
export const cleanupOldFiles = mutation({
  args: {},
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // Only target completed or archived orders older than 24 hours
    const allOrders = await ctx.db.query("orders").collect();
    const oldOrders = allOrders.filter(
      (o) => (o.print_status === "completed" || o.is_archived) && o.created_at < oneDayAgo
    );
      
    let deletedCount = 0;
    
    for (const order of oldOrders) {
      const files = await ctx.db
        .query("order_files")
        .withIndex("by_order_id", (q) => q.eq("order_id", order._id))
        .collect();
        
      for (const file of files) {
        if (file.file_storage_key && file.file_storage_key !== "" && file.file_storage_key !== "deleted") {
          try {
            await ctx.storage.delete(file.file_storage_key as Id<"_storage">);
            deletedCount++;
          } catch (e) {
            console.error("Failed to delete file from cloud storage:", file.file_storage_key, e);
          }
          await ctx.db.patch(file._id, { file_storage_key: "deleted" });
        }
      }
    }
    
    return { success: true, deletedCount };
  },
});
