import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create order and attached file records
export const createOrder = mutation({
  args: {
    order_id: v.string(),
    student_id: v.string(),
    student_print_id: v.string(),
    student_name: v.string(),
    total_bw_pages: v.optional(v.number()),
    total_color_pages: v.optional(v.number()),
    total_pages: v.optional(v.number()),
    spiral_binding: v.boolean(),
    stapling: v.boolean(),
    service_fee: v.optional(v.number()),
    subtotal: v.optional(v.number()),
    total_amount: v.optional(v.number()),
    payment_status: v.optional(v.string()),
    print_status: v.optional(v.string()),
    qr_code: v.optional(v.string()),
    order_type: v.string(),
    contact_number: v.optional(v.string()),
    college: v.optional(v.string()),
    department: v.optional(v.string()),
    receiving_date: v.optional(v.string()),
    files: v.array(v.object({
      file_name: v.string(),
      file_storage_key: v.string(),
      file_type: v.optional(v.string()),
      file_extension: v.optional(v.string()),
      page_count: v.optional(v.number()),
      print_type: v.optional(v.string()),
      color_page_ranges: v.optional(v.string()),
      copies: v.number(),
      sides: v.string(),
      bw_pages: v.optional(v.number()),
      color_pages: v.optional(v.number()),
      file_price: v.optional(v.number()),
      student_note: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const { files, ...orderData } = args;
    const orderDocId = await ctx.db.insert("orders", {
      ...orderData,
      created_at: Date.now(),
    });
    
    const filesWithOrderId = [];
    for (const f of files) {
      const fileId = await ctx.db.insert("order_files", {
        ...f,
        order_id: orderDocId,
      });
      const fileDoc = await ctx.db.get(fileId);
      if (fileDoc) {
        filesWithOrderId.push(fileDoc);
      }
    }
    
    const orderDoc = await ctx.db.get(orderDocId);
    return { ...orderDoc, files: filesWithOrderId, id: orderDocId };
  }
});

// Fetch order by order_id
export const getOrderById = query({
  args: { order_id: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("order_id", args.order_id))
      .unique();
    if (!order) return null;
    
    const files = await ctx.db
      .query("order_files")
      .withIndex("by_order_id", (q) => q.eq("order_id", order._id))
      .collect();
      
    return { ...order, files, id: order._id };
  }
});

// Fetch all orders for a student ID
export const getOrdersByStudentId = query({
  args: { student_id: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_student_id", (q) => q.eq("student_id", args.student_id))
      .collect();
      
    orders.sort((a, b) => b.created_at - a.created_at);
    
    const results = [];
    for (const order of orders) {
      const files = await ctx.db
        .query("order_files")
        .withIndex("by_order_id", (q) => q.eq("order_id", order._id))
        .collect();
      results.push({ ...order, files, id: order._id });
    }
    return results;
  }
});

// Fetch all paid orders for queue dashboard
export const getPaidOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .collect();
      
    const paid = orders.filter(o => o.payment_status === "paid");
    paid.sort((a, b) => b.created_at - a.created_at);
    
    const results = [];
    for (const order of paid) {
      const files = await ctx.db
        .query("order_files")
        .withIndex("by_order_id", (q) => q.eq("order_id", order._id))
        .collect();
      results.push({ ...order, files, id: order._id });
    }
    return results;
  }
});

// Update printing state of an order
export const updateOrderStatus = mutation({
  args: { order_id: v.string(), print_status: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("order_id", args.order_id))
      .unique();
    if (!order) return false;
    
    await ctx.db.patch(order._id, { print_status: args.print_status });
    return true;
  }
});

// Delete an order and its child file records
export const deleteOrder = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const parsedId = ctx.db.normalizeId("orders", args.id);
      if (!parsedId) return false;
      
      const files = await ctx.db
        .query("order_files")
        .withIndex("by_order_id", (q) => q.eq("order_id", parsedId))
        .collect();
      for (const f of files) {
        await ctx.db.delete(f._id);
      }
      
      await ctx.db.delete(parsedId);
      return true;
    } catch {
      return false;
    }
  }
});
