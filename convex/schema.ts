import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Librarians table
  librarians: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    library_name: v.string(),
    is_active: v.boolean(),
    upi_id: v.optional(v.string()),
    contact_number: v.optional(v.string()),
    created_at: v.number(), // Timestamp in milliseconds
  })
    .index("by_email", ["email"])
    .index("by_library_name", ["library_name"]),

  // Users table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    gender: v.optional(v.string()),
    student_print_id: v.optional(v.string()),
    is_verified: v.boolean(),
    created_at: v.number(), // Timestamp in milliseconds
  })
    .index("by_email", ["email"])
    .index("by_student_print_id", ["student_print_id"]),

  // Orders table
  orders: defineTable({
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
    created_at: v.number(), // Timestamp in milliseconds
    qr_code: v.optional(v.string()),
    order_type: v.string(),
    contact_number: v.optional(v.string()),
    college: v.optional(v.string()),
    department: v.optional(v.string()),
    receiving_date: v.optional(v.string()),
    is_archived: v.optional(v.boolean()),
    is_student_deleted: v.optional(v.boolean()),
  })
    .index("by_order_id", ["order_id"])
    .index("by_student_id", ["student_id"])
    .index("by_student_print_id", ["student_print_id"])
    .index("by_created_at", ["created_at"]),

  // Order Files table
  order_files: defineTable({
    order_id: v.id("orders"),
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
  })
    .index("by_order_id", ["order_id"])
    .index("by_file_storage_key", ["file_storage_key"]),

  // Submissions table
  submissions: defineTable({
    submission_id: v.string(),
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
    validation_status: v.optional(v.string()),
    created_at: v.number(), // Timestamp in milliseconds
  })
    .index("by_submission_id", ["submission_id"])
    .index("by_student_id", ["student_id"])
    .index("by_created_at", ["created_at"]),

  // Notices table
  notices: defineTable({
    submission_id: v.id("submissions"),
    type: v.optional(v.string()),
    message: v.optional(v.string()),
    created_at: v.number(), // Timestamp in milliseconds
  })
    .index("by_submission_id", ["submission_id"])
    .index("by_created_at", ["created_at"]),

  // File Storage table
  file_storage: defineTable({
    key: v.string(),
    file_data: v.optional(v.string()),
    created_at: v.number(), // Timestamp in milliseconds
  })
    .index("by_key", ["key"]),

  // Library Settings table
  library_settings: defineTable({
    is_open: v.boolean(),
    closing_message: v.optional(v.string()),
    standard_hours: v.optional(v.string()),
  }),

  // Settings table (General config like pricing)
  settings: defineTable({
    key: v.string(),
    value: v.any(),
  })
    .index("by_key", ["key"]),

  // Payment Records table (Permanent billing log)
  payment_records: defineTable({
    print_id: v.string(),
    name: v.string(),
    prn: v.optional(v.string()),
    amount_paid: v.number(),
    month: v.string(),
    created_at: v.number(),
  })
    .index("by_month", ["month"])
    .index("by_print_id", ["print_id"])
    .index("by_created_at", ["created_at"]),
});
