import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a payment record submitted by the student or shopkeeper (online vs xerox)
export const savePaymentRecord = mutation({
  args: {
    print_id: v.string(),
    name: v.string(),
    prn: v.optional(v.string()),
    amount_paid: v.number(),
    payment_type: v.optional(v.string()),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const recordId = await ctx.db.insert("payment_records", {
      ...args,
      payment_type: args.payment_type || "online",
      created_at: Date.now(),
    });
    return recordId;
  },
});

// Retrieve all payment records, optionally filtered by month YYYY-MM
export const getPaymentRecords = query({
  args: {
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let records;

    if (args.month) {
      const month = args.month; // narrow type to string (not undefined)
      records = await ctx.db
        .query("payment_records")
        .withIndex("by_month", (q) => q.eq("month", month))
        .collect();
    } else {
      records = await ctx.db.query("payment_records").collect();
    }

    // Sort descending by created_at
    return records.sort((a, b) => b.created_at - a.created_at);
  },
});

