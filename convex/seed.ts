import { mutation } from "./_generated/server";

export default mutation(async (ctx) => {
  const now = Date.now();

  const librarian = await ctx.db.insert("librarians", {
    name: "RIT Library Admin",
    email: "admin@ritlibrary.edu",
    password: "password123",
    library_name: "RIT Library",
    is_active: true,
    created_at: now,
  });

  const user = await ctx.db.insert("users", {
    name: "Amit Sharma",
    email: "amit.sharma@student.rit.edu",
    password: "password123",
    gender: "Male",
    student_print_id: "RIT2026-001",
    is_verified: true,
    created_at: now,
  });

  const order = await ctx.db.insert("orders", {
    order_id: "ORD-1001",
    student_id: "RIT2026-001",
    student_print_id: "RIT2026-001",
    student_name: "Amit Sharma",
    total_bw_pages: 12,
    total_color_pages: 3,
    total_pages: 15,
    spiral_binding: true,
    stapling: false,
    service_fee: 20.0,
    subtotal: 120.0,
    total_amount: 140.0,
    payment_status: "paid",
    print_status: "processing",
    created_at: now,
    qr_code: "QR-CODE-ORD-1001",
    order_type: "standard",
    contact_number: "+91-9876543210",
    college: "RIT Library",
    department: "Computer Science",
    receiving_date: "2026-07-03",
  });

  await ctx.db.insert("order_files", {
    order_id: order,
    file_name: "project_report.pdf",
    file_storage_key: "project_report_1001.pdf",
    file_type: "application/pdf",
    file_extension: "pdf",
    page_count: 15,
    print_type: "double-sided",
    color_page_ranges: "1-3",
    copies: 1,
    sides: "double",
    bw_pages: 12,
    color_pages: 3,
    file_price: 120.0,
    student_note: "Please print with a blue cover.",
  });

  const submission = await ctx.db.insert("submissions", {
    submission_id: "SUB-2001",
    student_id: "RIT2026-001",
    student_name: "Amit Sharma",
    roll_number: "RIT-001",
    department: "Computer Science",
    academic_year: "2026",
    guide_name: "Dr. Priya Singh",
    project_title: "AI for Library Automation",
    document_type: "Thesis",
    remarks: "First version submission",
    file_name: "ai_library_automation.pdf",
    file_storage_key: "ai_library_automation_2001.pdf",
    validation_status: "pending",
    created_at: now,
  });

  await ctx.db.insert("notices", {
    submission_id: submission,
    type: "review",
    message: "Your project submission is under review.",
    created_at: now,
  });

  await ctx.db.insert("file_storage", {
    key: "project_report_1001.pdf",
    file_data: "Sample file data for project_report_1001.pdf",
    created_at: now,
  });

  return {
    librarian,
    user,
    order,
    submission,
    message: "Seed data inserted successfully",
  };
});
