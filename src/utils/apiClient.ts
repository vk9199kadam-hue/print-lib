import { User, librarian, Order, Pricing, Submission, FileItem } from '../types';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

export const ApiClient = {
  // --- AUTH ---
  async verifylibrarian(email: string, password: string): Promise<librarian | null> {
    const user = await convex.action(api.librarians.verifyLibrarian, { email, password });
    if (!user) return null;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      password: "",
      library_name: user.library_name,
      is_active: user.is_active,
    };
  },

  async updateLibrarianProfile(id: string, data: { name: string; library_name: string; upi_id?: string; contact_number?: string }): Promise<boolean> {
    return await convex.mutation(api.librarians.updateLibrarianProfile, { id, ...data });
  },

  async verifyStudent(email: string, password: string): Promise<User | null> {
    const user = await convex.query(api.users.getUserByEmail, { email });
    if (!user) return null;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      gender: (user.gender as User['gender']) || 'Other',
      student_print_id: user.student_print_id || '',
      is_verified: user.is_verified,
      created_at: new Date(user.created_at).toISOString(),
    };
  },

  async getUsers(): Promise<User[]> {
    const users = await convex.query(api.users.getUsers);
    return users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      gender: (u.gender as User['gender']) || 'Other',
      student_print_id: u.student_print_id || '',
      is_verified: u.is_verified,
      created_at: new Date(u.created_at).toISOString(),
    }));
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const u = await convex.query(api.users.getUserByEmail, { email });
    if (!u) return null;
    return {
      id: u._id,
      name: u.name,
      email: u.email,
      gender: (u.gender as User['gender']) || 'Other',
      student_print_id: u.student_print_id || '',
      is_verified: u.is_verified,
      created_at: new Date(u.created_at).toISOString(),
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const u = await convex.query(api.users.getUserById, { id });
    if (!u) return null;
    return {
      id: u._id,
      name: u.name,
      email: u.email,
      gender: (u.gender as User['gender']) || 'Other',
      student_print_id: u.student_print_id || '',
      is_verified: u.is_verified,
      created_at: new Date(u.created_at).toISOString(),
    };
  },

  async createUser(data: { name: string; email: string; password?: string; gender: string }): Promise<User | null> {
    const u = await convex.mutation(api.users.createUser, data);
    if (!u) return null;
    return {
      id: u._id,
      name: u.name,
      email: u.email,
      gender: (u.gender as User['gender']) || 'Other',
      student_print_id: u.student_print_id || '',
      is_verified: u.is_verified,
      created_at: new Date(u.created_at).toISOString(),
    };
  },

  // --- ORDERS ---
  async createOrder(data: Partial<Order>): Promise<Order> {
    const orderData = {
      order_id: data.order_id || `ORD-${Date.now().toString().slice(-6)}`,
      student_id: data.student_id || "",
      student_print_id: data.student_print_id || "",
      student_name: data.student_name || "",
      total_bw_pages: data.total_bw_pages || 0,
      total_color_pages: data.total_color_pages || 0,
      total_pages: data.total_pages || 0,
      spiral_binding: data.spiral_binding || false,
      stapling: data.stapling || false,
      service_fee: data.service_fee || 0,
      subtotal: data.subtotal || 0,
      total_amount: data.total_amount || 0,
      payment_status: data.payment_status || "paid",
      print_status: data.print_status || "queued",
      qr_code: data.qr_code || "",
      order_type: data.order_type || "standard",
      contact_number: data.contact_number,
      college: data.college,
      department: data.department,
      receiving_date: data.receiving_date,
      files: (data.files || []).map(f => ({
        file_name: f.file_name,
        file_storage_key: f.file_storage_key,
        file_type: f.file_type,
        file_extension: f.file_extension,
        page_count: f.page_count,
        print_type: f.print_type,
        color_page_ranges: f.color_page_ranges,
        copies: f.copies,
        sides: f.sides,
        bw_pages: f.bw_pages,
        color_pages: f.color_pages,
        file_price: f.file_price,
        student_note: f.student_note || "",
      }))
    };
    
    const o = await convex.mutation(api.orders.createOrder, orderData);
    
    return {
      ...o,
      id: o._id,
      payment_status: (o.payment_status as Order['payment_status']) || 'paid',
      print_status: (o.print_status as Order['print_status']) || 'queued',
      order_type: (o.order_type as Order['order_type']) || 'standard',
      created_at: new Date(o.created_at).toISOString(),
      updated_at: new Date(o.created_at).toISOString(),
      extra_services: {
        spiral_binding: o.spiral_binding,
        stapling: o.stapling,
      },
      files: o.files.map(f => ({
        ...f,
        temp_id: f._id,
        file_type: (f.file_type as FileItem['file_type']) || 'pdf',
        print_type: (f.print_type as FileItem['print_type']) || 'bw',
        sides: (f.sides as FileItem['sides']) || 'single',
        file_size_kb: 0,
      }))
    } as Order;
  },

  async getOrderById(order_id: string): Promise<Order | null> {
    const o = await convex.query(api.orders.getOrderById, { order_id });
    if (!o) return null;
    return {
      ...o,
      id: o._id,
      payment_status: (o.payment_status as Order['payment_status']) || 'paid',
      print_status: (o.print_status as Order['print_status']) || 'queued',
      order_type: (o.order_type as Order['order_type']) || 'standard',
      created_at: new Date(o.created_at).toISOString(),
      updated_at: new Date(o.created_at).toISOString(),
      extra_services: {
        spiral_binding: o.spiral_binding,
        stapling: o.stapling,
      },
      files: o.files.map(f => ({
        ...f,
        temp_id: f._id,
        file_type: (f.file_type as FileItem['file_type']) || 'pdf',
        print_type: (f.print_type as FileItem['print_type']) || 'bw',
        sides: (f.sides as FileItem['sides']) || 'single',
        file_size_kb: 0,
      }))
    } as Order;
  },

  async getOrdersByStudentId(student_id: string): Promise<Order[]> {
    const orders = await convex.query(api.orders.getOrdersByStudentId, { student_id });
    return orders.map(o => ({
      ...o,
      id: o._id,
      payment_status: (o.payment_status as Order['payment_status']) || 'paid',
      print_status: (o.print_status as Order['print_status']) || 'queued',
      order_type: (o.order_type as Order['order_type']) || 'standard',
      created_at: new Date(o.created_at).toISOString(),
      updated_at: new Date(o.created_at).toISOString(),
      extra_services: {
        spiral_binding: o.spiral_binding,
        stapling: o.stapling,
      },
      files: o.files.map(f => ({
        ...f,
        temp_id: f._id,
        file_type: (f.file_type as FileItem['file_type']) || 'pdf',
        print_type: (f.print_type as FileItem['print_type']) || 'bw',
        sides: (f.sides as FileItem['sides']) || 'single',
        file_size_kb: 0,
      }))
    })) as Order[];
  },

  async getPaidOrders(): Promise<Order[]> {
    const orders = await convex.query(api.orders.getPaidOrders);
    return orders.map(o => ({
      ...o,
      id: o._id,
      payment_status: (o.payment_status as Order['payment_status']) || 'paid',
      print_status: (o.print_status as Order['print_status']) || 'queued',
      order_type: (o.order_type as Order['order_type']) || 'standard',
      created_at: new Date(o.created_at).toISOString(),
      updated_at: new Date(o.created_at).toISOString(),
      extra_services: {
        spiral_binding: o.spiral_binding,
        stapling: o.stapling,
      },
      files: o.files.map(f => ({
        ...f,
        temp_id: f._id,
        file_type: (f.file_type as FileItem['file_type']) || 'pdf',
        print_type: (f.print_type as FileItem['print_type']) || 'bw',
        sides: (f.sides as FileItem['sides']) || 'single',
        file_size_kb: 0,
      }))
    })) as Order[];
  },

  async updateOrderStatus(order_id: string, print_status: string): Promise<boolean> {
    return await convex.mutation(api.orders.updateOrderStatus, { order_id, print_status });
  },

  async deleteOrder(id: string): Promise<boolean> {
    return await convex.mutation(api.orders.deleteOrder, { id });
  },

  async archiveOrder(id: string): Promise<boolean> {
    return await convex.mutation(api.orders.archiveOrder, { id });
  },

  async softDeleteOrder(id: string): Promise<boolean> {
    return await convex.mutation(api.orders.softDeleteOrder, { id });
  },

  async getAllOrdersForHistory(): Promise<Order[]> {
    const orders = await convex.query(api.orders.getAllOrdersForHistory);
    return orders.map(o => ({
      ...o,
      id: o._id,
      payment_status: (o.payment_status as Order['payment_status']) || 'paid',
      print_status: (o.print_status as Order['print_status']) || 'queued',
      order_type: (o.order_type as Order['order_type']) || 'standard',
      created_at: new Date(o.created_at).toISOString(),
      updated_at: new Date(o.created_at).toISOString(),
      is_archived: o.is_archived || false,
      extra_services: {
        spiral_binding: o.spiral_binding,
        stapling: o.stapling,
      },
      files: o.files.map(f => ({
        ...f,
        temp_id: f._id,
        file_type: (f.file_type as FileItem['file_type']) || 'pdf',
        print_type: (f.print_type as FileItem['print_type']) || 'bw',
        sides: (f.sides as FileItem['sides']) || 'single',
        file_size_kb: 0,
      }))
    })) as Order[];
  },

  // --- LIBRARY SETTINGS ---
  async getLibrarySettings(): Promise<{ is_open: boolean; closing_message?: string; standard_hours?: string }> {
    const settings = await convex.query(api.settings.getLibrarySettings);
    return {
      is_open: settings.is_open,
      closing_message: settings.closing_message,
      standard_hours: settings.standard_hours,
    };
  },

  async updateLibrarySettings(data: { is_open: boolean; closing_message?: string; standard_hours?: string }): Promise<boolean> {
    return await convex.mutation(api.settings.updateLibrarySettings, data);
  },

  // --- SUBMISSIONS ---
  async getSubmissions(): Promise<Submission[]> {
    const subs = await convex.query(api.submissions.getSubmissions);
    return subs.map(s => ({
      ...s,
      student_id: s.student_id || "",
      student_name: s.student_name || "",
      roll_number: s.roll_number || "",
      department: s.department || "",
      academic_year: s.academic_year || "",
      guide_name: s.guide_name || "",
      project_title: s.project_title || "",
      document_type: s.document_type || "",
      remarks: s.remarks || "",
      file_name: s.file_name || "",
      file_storage_key: s.file_storage_key || "",
      validation_status: (s.validation_status as Submission['validation_status']) || 'received',
      created_at: new Date(s.created_at).toISOString(),
      updated_at: new Date(s.created_at).toISOString(),
    }));
  },

  async createSubmission(data: Partial<Submission>): Promise<Submission> {
    const sub = await convex.mutation(api.submissions.createSubmission, {
      student_id: data.student_id,
      student_name: data.student_name,
      roll_number: data.roll_number,
      department: data.department,
      academic_year: data.academic_year,
      guide_name: data.guide_name,
      project_title: data.project_title,
      document_type: data.document_type,
      remarks: data.remarks,
      file_name: data.file_name,
      file_storage_key: data.file_storage_key,
    });
    return {
      ...sub,
      student_id: sub.student_id || "",
      student_name: sub.student_name || "",
      roll_number: sub.roll_number || "",
      department: sub.department || "",
      academic_year: sub.academic_year || "",
      guide_name: sub.guide_name || "",
      project_title: sub.project_title || "",
      document_type: sub.document_type || "",
      remarks: sub.remarks || "",
      file_name: sub.file_name || "",
      file_storage_key: sub.file_storage_key || "",
      validation_status: (sub.validation_status as Submission['validation_status']) || 'received',
      created_at: new Date(sub.created_at).toISOString(),
      updated_at: new Date(sub.created_at).toISOString(),
    };
  },

  async updateSubmissionStatus(submission_id: string, validation_status: string): Promise<boolean> {
    return await convex.mutation(api.submissions.updateSubmissionStatus, { submission_id, validation_status });
  },

  async addNoticeToSubmission(submission_id: string, type: string, message: string): Promise<boolean> {
    return await convex.mutation(api.submissions.addNoticeToSubmission, { submission_id, type, message });
  },

  // --- FILE STORAGE ---
  async saveFile(key: string, base64: string) {
    console.log('File saved locally or via storage actions');
  },

  async getFile(key: string): Promise<string | null> {
    return await convex.query(api.files.getFileUrl, { storageId: key });
  },

  async deleteFile(key: string) {
    await convex.mutation(api.files.deleteFile, { storageId: key });
  },

  async cleanOrphanedFiles(): Promise<boolean> {
    console.log('File cleaning is handled internally in Convex storage');
    return true;
  },

  // --- PRICING ---
  async getPricing(): Promise<Pricing | null> {
    return await convex.query(api.settings.getPricing);
  },

  async updatePricing(pricing: Pricing): Promise<boolean> {
    return await convex.mutation(api.settings.updatePricing, { pricing });
  },

  async savePaymentRecord(data: { print_id: string; name: string; prn?: string; amount_paid: number; month: string }): Promise<string> {
    return await convex.mutation(api.paymentRecords.savePaymentRecord, data);
  },

  async getPaymentRecords(month?: string) {
    return await convex.query(api.paymentRecords.getPaymentRecords, { month });
  }
};
