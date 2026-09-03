import { User, librarian, Order, Pricing, Submission, FileItem } from '../types';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadBase64ToCloud } from './fileStorage';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://avid-lark-265.convex.cloud';
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
    const orderId = data.order_id || `ORD-${Date.now().toString().slice(-6)}`;
    const studentPrintId = data.student_print_id || `PRT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const fallbackOrder: Order = {
      id: 'ord_' + Date.now(),
      order_id: orderId,
      student_id: data.student_id || 'guest_' + Date.now(),
      student_print_id: studentPrintId,
      student_name: data.student_name || 'Library Student',
      total_bw_pages: data.total_bw_pages || 0,
      total_color_pages: data.total_color_pages || 0,
      total_pages: data.total_pages || 0,
      spiral_binding: data.spiral_binding || false,
      stapling: data.stapling || false,
      service_fee: data.service_fee || 0,
      subtotal: data.subtotal || 0,
      total_amount: data.total_amount || 0,
      payment_status: (data.payment_status as Order['payment_status']) || 'paid',
      print_status: (data.print_status as Order['print_status']) || 'queued',
      qr_code: data.qr_code || '',
      order_type: (data.order_type as Order['order_type']) || 'standard',
      created_at: now,
      updated_at: now,
      extra_services: {
        spiral_binding: data.spiral_binding || false,
        stapling: data.stapling || false,
      },
      files: (data.files || []).map((f, i) => ({
        temp_id: 'file_' + i + '_' + Date.now(),
        file_name: f.file_name,
        file_storage_key: f.file_storage_key,
        file_type: f.file_type || 'pdf',
        file_extension: f.file_extension || '',
        page_count: f.page_count || 1,
        print_type: f.print_type || 'bw',
        color_page_ranges: f.color_page_ranges || '',
        copies: f.copies || 1,
        sides: f.sides || 'single',
        bw_pages: f.bw_pages || 0,
        color_pages: f.color_pages || 0,
        file_price: f.file_price || 0,
        file_size_kb: f.file_size_kb || 0,
        student_note: f.student_note || '',
      }))
    };

    try {
      const orderData = {
        order_id: orderId,
        student_id: data.student_id || "",
        student_print_id: studentPrintId,
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
          file_name: f.file_name || "document.pdf",
          file_storage_key: f.file_storage_key || "",
          file_type: f.file_type || "pdf",
          file_extension: f.file_extension || "",
          page_count: f.page_count ?? 1,
          print_type: f.print_type || "bw",
          color_page_ranges: f.color_page_ranges || "",
          copies: f.copies ?? 1,
          sides: f.sides || "single",
          bw_pages: f.bw_pages ?? 0,
          color_pages: f.color_pages ?? 0,
          file_price: f.file_price ?? 0,
          student_note: f.student_note || "",
        }))
      };
      
      const o = await convex.mutation(api.orders.createOrder, orderData);
      const resOrder = !o ? fallbackOrder : {
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

      // Always cache created order locally so it's guaranteed to appear in Librarian Queue
      try {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const filtered = localOrders.filter(x => x.order_id !== resOrder.order_id);
        filtered.unshift(resOrder);
        localStorage.setItem('local_orders', JSON.stringify(filtered));
      } catch (e) { /* ignore localStorage quota */ }

      return resOrder;
    } catch (err) {
      console.warn("Convex createOrder failed, returning resilient fallback order:", err);
      try {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('local_orders') || '[]');
        localOrders.unshift(fallbackOrder);
        localStorage.setItem('local_orders', JSON.stringify(localOrders));
      } catch (e) { /* ignore */ }
      return fallbackOrder;
    }
  },

  async getOrderById(order_id: string): Promise<Order | null> {
    try {
      const o = await convex.query(api.orders.getOrderById, { order_id });
      if (o) {
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
      }
    } catch (err) {
      console.warn("getOrderById from Convex failed, trying local cache:", err);
    }
    // Search local orders fallback
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('local_orders') || '[]');
      return localOrders.find(x => x.order_id === order_id || x.id === order_id) || null;
    } catch (e) {
      return null;
    }
  },

  async getOrdersByStudentId(student_id: string): Promise<Order[]> {
    try {
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
    } catch (err) {
      try {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('local_orders') || '[]');
        return localOrders.filter(x => x.student_id === student_id);
      } catch (e) {
        return [];
      }
    }
  },

  async getPaidOrders(): Promise<Order[]> {
    let cloudOrders: Order[] = [];
    try {
      const orders = await convex.query(api.orders.getPaidOrders);
      cloudOrders = orders.map(o => ({
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
    } catch (err) {
      console.warn("getPaidOrders from Convex failed, relying on local cache:", err);
    }

    // Read local cache orders and merge seamlessly
    let localOrders: Order[] = [];
    try {
      localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
    } catch (e) { /* ignore */ }

    const combinedMap = new Map<string, Order>();
    // First insert cloud orders
    cloudOrders.forEach(o => combinedMap.set(o.order_id, o));

    // Process local orders: merge and automatically push any missing/updated orders to Convex Cloud
    localOrders.forEach(async lo => {
      if (!combinedMap.has(lo.order_id)) {
        combinedMap.set(lo.order_id, lo);
        
        // Auto-bridge local files to cloud storage so other devices can download them
        const filesPayload = await Promise.all((lo.files || []).map(async f => {
          let storageKey = f.file_storage_key || "";
          if (storageKey.startsWith('local_')) {
            const cleanK = storageKey.replace('local_', '');
            const base64 = localStorage.getItem('local_file_' + cleanK) || localStorage.getItem('local_file_' + storageKey);
            if (base64 && base64.startsWith('data:')) {
              try {
                const cloudStorageId = await uploadBase64ToCloud(base64);
                if (cloudStorageId) {
                  storageKey = cloudStorageId;
                  localStorage.setItem('local_file_' + cloudStorageId, base64);
                }
              } catch (e) { /* ignore */ }
            }
          }
          return {
            file_name: f.file_name || "document.pdf",
            file_storage_key: storageKey,
            file_type: f.file_type || "pdf",
            file_extension: f.file_extension || "",
            page_count: f.page_count ?? 1,
            print_type: f.print_type || "bw",
            color_page_ranges: f.color_page_ranges || "",
            copies: f.copies ?? 1,
            sides: f.sides || "single",
            bw_pages: f.bw_pages ?? 0,
            color_pages: f.color_pages ?? 0,
            file_price: f.file_price ?? 0,
            student_note: f.student_note || "",
          };
        }));

        const orderData: any = {
          order_id: lo.order_id,
          student_id: lo.student_id || "",
          student_print_id: lo.student_print_id || "",
          student_name: lo.student_name || "Library Student",
          total_bw_pages: lo.total_bw_pages ?? 0,
          total_color_pages: lo.total_color_pages ?? 0,
          total_pages: lo.total_pages ?? 0,
          spiral_binding: lo.spiral_binding ?? false,
          stapling: lo.stapling ?? false,
          service_fee: lo.service_fee ?? 0,
          subtotal: lo.subtotal ?? 0,
          total_amount: lo.total_amount ?? 0,
          payment_status: lo.payment_status || "paid",
          print_status: lo.print_status || "queued",
          qr_code: lo.qr_code || "",
          order_type: lo.order_type || "standard",
          files: filesPayload,
        };
        convex.mutation(api.orders.createOrder, orderData).catch(err => {
          console.warn("Auto-sync local order to cloud failed:", lo.order_id, err);
        });
      } else {
        // If local order has more recent student details, update local view and sync to cloud
        const existing = combinedMap.get(lo.order_id)!;
        if (lo.student_name && lo.student_name !== 'Library Student' && existing.student_name !== lo.student_name) {
          existing.student_name = lo.student_name;
          if (lo.student_print_id) existing.student_print_id = lo.student_print_id;
          convex.mutation(api.orders.updateOrderDetails, {
            order_id: lo.order_id,
            student_name: lo.student_name,
            student_print_id: lo.student_print_id || existing.student_print_id,
            total_amount: lo.total_amount || existing.total_amount,
          }).catch(() => {});
        }
      }
    });

    const finalOrders = Array.from(combinedMap.values());
    finalOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return finalOrders;
  },

  async updateOrderStatus(order_id: string, print_status: string): Promise<boolean> {
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('local_orders') || '[]');
      const target = localOrders.find(x => x.order_id === order_id);
      if (target) {
        target.print_status = print_status as Order['print_status'];
        localStorage.setItem('local_orders', JSON.stringify(localOrders));
      }
    } catch (e) { /* ignore */ }

    try {
      return await convex.mutation(api.orders.updateOrderStatus, { order_id, print_status });
    } catch (err) {
      return true;
    }
  },

  async updateOrderDetails(order_id: string, student_name: string, student_print_id: string, total_amount: number): Promise<boolean> {
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('local_orders') || '[]');
      const target = localOrders.find(x => x.order_id === order_id);
      if (target) {
        target.student_name = student_name;
        target.student_print_id = student_print_id;
        target.total_amount = total_amount;
        localStorage.setItem('local_orders', JSON.stringify(localOrders));
      }
    } catch (e) { /* ignore */ }

    try {
      return await convex.mutation(api.orders.updateOrderDetails, { order_id, student_name, student_print_id, total_amount });
    } catch (err) {
      return true;
    }
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
    try {
      const settings = await convex.query(api.settings.getLibrarySettings);
      if (!settings) {
        return { is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM' };
      }
      return {
        is_open: settings.is_open ?? true,
        closing_message: settings.closing_message || '',
        standard_hours: settings.standard_hours || '10:00 AM to 8:00 PM',
      };
    } catch (e) {
      console.warn("Could not fetch library settings, using defaults:", e);
      return { is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM' };
    }
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
    if (!key) return null;

    // 1. If key is a cloud storage ID, query Convex Cloud
    if (!key.startsWith('local_')) {
      try {
        const cloudUrl = await convex.query(api.files.getFileUrl, { storageId: key });
        if (cloudUrl) return cloudUrl;
      } catch (err) {
        console.warn("getFile from Convex failed for storageId:", key, err);
      }
    }

    // 2. Check local storage backup
    const cleanKey = key.replace('local_', '');
    const localBackup = localStorage.getItem('local_file_' + cleanKey) || localStorage.getItem('local_file_' + key);

    // 3. If local backup copy exists, bridge it to cloud storage in the background so other devices can access it!
    if (localBackup && localBackup.startsWith('data:')) {
      uploadBase64ToCloud(localBackup).then(async (cloudStorageId) => {
        if (cloudStorageId) {
          try {
            await convex.mutation(api.orders.updateFileStorageKey, {
              old_key: key,
              new_key: cloudStorageId,
            });
            localStorage.setItem('local_file_' + cloudStorageId, localBackup);
          } catch (e) {
            console.warn("Auto-bridge local file to cloud failed:", e);
          }
        }
      }).catch(() => {});

      return localBackup;
    }

    return localBackup || null;
  },

  async deleteFile(key: string) {
    if (!key || key.startsWith('local_')) return;
    try {
      await convex.mutation(api.files.deleteFile, { storageId: key });
    } catch (err) {
      console.warn("deleteFile failed:", key, err);
    }
  },

  async cleanOrphanedFiles(): Promise<boolean> {
    console.log('File cleaning is handled internally in Convex storage');
    return true;
  },

  // --- PRICING ---
  async getPricing(): Promise<Pricing | null> {
    try {
      return await convex.query(api.settings.getPricing);
    } catch (e) {
      console.warn("Could not fetch pricing from Convex, using fallback:", e);
      return null;
    }
  },

  async updatePricing(pricing: Pricing): Promise<boolean> {
    return await convex.mutation(api.settings.updatePricing, { pricing });
  },

  async savePaymentRecord(data: { print_id: string; name: string; prn?: string; amount_paid: number; payment_type?: string; month: string }): Promise<string> {
    const record = {
      _id: 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      ...data,
      created_at: Date.now(),
    };
    try {
      const res = await convex.mutation(api.paymentRecords.savePaymentRecord, data);
      const existing = JSON.parse(localStorage.getItem('local_payment_records') || '[]');
      const filtered = existing.filter((r: any) => r.print_id !== data.print_id);
      filtered.unshift({ ...record, _id: res || record._id });
      localStorage.setItem('local_payment_records', JSON.stringify(filtered));
      return res || record._id;
    } catch (err) {
      console.warn("Convex savePaymentRecord fallback to localStorage:", err);
      const existing = JSON.parse(localStorage.getItem('local_payment_records') || '[]');
      existing.unshift(record);
      localStorage.setItem('local_payment_records', JSON.stringify(existing));
      return record._id;
    }
  },

  async getPaymentRecords(month?: string) {
    let convexRecords: any[] = [];
    try {
      convexRecords = await convex.query(api.paymentRecords.getPaymentRecords, { month }) || [];
    } catch (e) {
      console.warn("Could not fetch remote payment records from Convex:", e);
    }
    const localRecords = JSON.parse(localStorage.getItem('local_payment_records') || '[]');
    const filteredLocal = month ? localRecords.filter((r: any) => r.month === month) : localRecords;
    
    const combined = [...convexRecords, ...filteredLocal];
    const seen = new Set();
    const unique = combined.filter(r => {
      const id = r.print_id || r._id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return unique.sort((a: any, b: any) => b.created_at - a.created_at);
  }
};
