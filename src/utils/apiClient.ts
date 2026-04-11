import { User, librarian, Order, Pricing, Session, Submission, Notice } from '../types';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export const ApiClient = {
  // --- AUTH ---
  async verifylibrarian(email: string, password: string): Promise<librarian | null> {
    const { data: users, error } = await supabase.from('librarians').select('*').eq('email', email);
    if (error || !users || users.length === 0) return null;
    
    const user = users[0];
    let isValid = false;
    
    // Check if password is plain text (migration) or hashed
    if (user.password === password) {
       isValid = true;
       const newHash = await bcrypt.hash(password, 10);
       await supabase.from('librarians').update({ password: newHash }).eq('id', user.id);
    } else {
       isValid = await bcrypt.compare(password, user.password);
    }
    
    if (!isValid) return null;
    delete user.password;
    return user;
  },

  async verifyStudent(email: string, password: string): Promise<User | null> {
    const { data: users, error } = await supabase.from('users').select('*').eq('email', email);
    if (error || !users || users.length === 0) return null;
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    delete user.password;
    return user;
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) return null;
    return data;
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async createUser(data: any): Promise<User | null> {
    const { data: user, error } = await supabase.from('users').insert(data).select().single();
    if (error) throw error;
    return user;
  },

  // --- ORDERS ---
  async createOrder(data: Partial<Order>): Promise<Order> {
    const { files, ...orderData } = data;
    const order_id = orderData.order_id || `ORD-${Date.now().toString().slice(-6)}`;
    
    const { data: order, error } = await supabase.from('orders').insert({
      ...orderData,
      order_id,
      payment_status: orderData.payment_status || 'paid',
      print_status: orderData.print_status || 'queued'
    }).select().single();
    
    if (error) throw error;
    
    if (files && files.length > 0) {
      const filesWithOrderId = files.map(f => ({
        ...f,
        order_id: order.id,
        paper_size: f.paper_size || 'A4'
      }));
      const { error: fErr } = await supabase.from('order_files').insert(filesWithOrderId);
      if (fErr) throw fErr;
      order.files = filesWithOrderId;
    }
    
    return order;
  },

  async getOrderById(order_id: string): Promise<Order | null> {
    const { data, error } = await supabase.from('orders').select('*, order_files(*)').eq('order_id', order_id).single();
    if (error || !data) return null;
    return { ...data, files: data.order_files };
  },

  async getOrdersByStudentId(student_id: string): Promise<Order[]> {
    const { data, error } = await supabase.from('orders').select('*, order_files(*)').eq('student_id', student_id).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(o => ({ ...o, files: o.order_files }));
  },

  async getPaidOrders(): Promise<Order[]> {
    const { data, error } = await supabase.from('orders').select('*, order_files(*)').eq('payment_status', 'paid').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(o => ({ ...o, files: o.order_files }));
  },

  async updateOrderStatus(order_id: string, print_status: string): Promise<boolean> {
    const { error } = await supabase.from('orders').update({ print_status }).eq('order_id', order_id);
    return !error;
  },

  async deleteOrder(id: string): Promise<boolean> {
    // Delete order files first (on cascade would handle this but being explicit is safer)
    await supabase.from('order_files').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    return !error;
  },

  // --- SHOP SETTINGS ---
  async getShopSettings(): Promise<any> {
    const { data, error } = await supabase.from('shop_settings').select('*').eq('id', 1).single();
    if (error || !data) return { is_open: true };
    return data;
  },

  async updateShopSettings(data: any): Promise<boolean> {
    const { error } = await supabase.from('shop_settings').update(data).eq('id', 1);
    return !error;
  },

  // --- SUBMISSIONS ---
  async getSubmissions(): Promise<Submission[]> {
    const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createSubmission(data: Partial<Submission>): Promise<Submission> {
    const { data: sub, error } = await supabase.from('submissions').insert(data).select().single();
    if (error) throw error;
    return sub;
  },

  async updateSubmissionStatus(submission_id: string, validation_status: string): Promise<boolean> {
    const { error } = await supabase.from('submissions').update({ validation_status }).eq('submission_id', submission_id);
    return !error;
  },

  async addNoticeToSubmission(submission_id: string, type: string, message: string): Promise<boolean> {
    // Get the internal UUID for the submission first
    const { data: sub } = await supabase.from('submissions').select('id').eq('submission_id', submission_id).single();
    if (!sub) return false;
    
    const { error } = await supabase.from('notices').insert({
      submission_id: sub.id,
      type,
      message
    });
    return !error;
  },

  // --- FILE STORAGE (Direct to Supabase Storage) ---
  async saveFile(key: string, base64: string) {
    // This is handled via supabase-js in the FileUpload component usually
    console.log('File saving is handled via storage component');
  },

  async deleteFile(key: string) {
    await supabase.storage.from('library_print_files').remove([key]);
  },

  // --- PRICING ---
  async getPricing(): Promise<Pricing | null> {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'pricing').single();
    if (error || !data) return null;
    return data.value as Pricing;
  },

  async updatePricing(pricing: Pricing): Promise<boolean> {
    const { error } = await supabase.from('settings').upsert({ key: 'pricing', value: pricing });
    return !error;
  }
};
