import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Fetch all submissions with joined notices
export const getSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("submissions").collect();
    subs.sort((a, b) => b.created_at - a.created_at);
    
    const results = [];
    for (const sub of subs) {
      const notices = await ctx.db
        .query("notices")
        .withIndex("by_submission_id", (q) => q.eq("submission_id", sub._id))
        .collect();
        
      const mappedNotices = notices.map(n => ({
        id: n._id,
        type: (n.type as "acknowledgment" | "missing" | "approved" | "rejected" | "resubmit" | undefined) || "acknowledgment",
        message: n.message || "",
        created_at: new Date(n.created_at).toISOString(),
      }));

      results.push({
        ...sub,
        id: sub._id,
        notices: mappedNotices,
      });
    }
    return results;
  }
});

// Create a remote project submission
export const createSubmission = mutation({
  args: {
    student_id: v.optional(v.string()),
    student_name: v.optional(v.string()),
    roll_number: v.optional(v.string()),
    department: v.optional(v.string()),
    academic_year: v.optional(v.string()),
    guide_name: v.optional(v.string()),
    project_title: v.optional(v.string()),
    document_type: v.optional(v.string()),
    remarks: v.optional(v.string()),
    file_name: v.optional(v.string()),
    file_storage_key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission_id = `SUB-${Date.now().toString().slice(-6)}`;
    const subId = await ctx.db.insert("submissions", {
      ...args,
      submission_id,
      validation_status: "received",
      created_at: Date.now(),
    });
    
    const sub = await ctx.db.get(subId);
    return { ...sub, id: subId, notices: [] };
  }
});

// Update review status of a submission
export const updateSubmissionStatus = mutation({
  args: { submission_id: v.string(), validation_status: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("submissions")
      .withIndex("by_submission_id", (q) => q.eq("submission_id", args.submission_id))
      .first();
    if (!sub) return false;
    
    await ctx.db.patch(sub._id, { validation_status: args.validation_status });
    return true;
  }
});

// Add administrative feedback/notice to a submission
export const addNoticeToSubmission = mutation({
  args: { submission_id: v.string(), type: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("submissions")
      .withIndex("by_submission_id", (q) => q.eq("submission_id", args.submission_id))
      .first();
    if (!sub) return false;
    
    await ctx.db.insert("notices", {
      submission_id: sub._id,
      type: args.type,
      message: args.message,
      created_at: Date.now(),
    });
    return true;
  }
});
