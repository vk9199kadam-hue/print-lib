import { User, librarian, Order, Pricing, Session, Submission, Notice } from '../types';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export const ApiClient = {
  // --- AUTH ---
  async verifylibrarian(email: string, password: string): Promise<librarian | null> {
    const { data: users, error } = await supabase.from('shopkeepers').select('*').eq('email', email);
    if (error || !users || users.length === 0) return null;
    
    const user = users[0];
    let isValid = false;
    
    // Check if password is plain text (migration) or hashed
    if (user.password === password) {
       isValid = true;
       const newHash = await bcrypt.hash(password, 10);
       await supabase.from('shopkeepers').update({ password: newHash }).eq('id', user.id);
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

  // --- ORDERS ---
  async createOrder(data: Partial<Order>): Promise<Order> {
    const order_id = `ORD-${Date.now().toString().slice(-6)}`;
    const { data: order, error } = await supabase.from('orders').insert({
      ...data,
      order_id,
      payment_status: data.payment_status || 'paid',
      print_status: data.print_status || 'queued'
    }).select().single();
    
    if (error) throw error;
    
    if (data.files && data.files.length > 0) {
      const filesWithOrderId = data.files.map(f => ({
        ...f,
        order_id: order.id,
        paper_size: f.paper_size || 'A4'
      }));
      const { error: fErr } = await supabase.from('order_files').insert(filesWithOrderId);
      if (fErr) throw fErr;
    }
    
    return order;
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

  // --- FILE STORAGE (Direct to Supabase Storage) ---
  async saveFile(key: string, base64: string) {
    // This is handled via supabase-js in the FileUpload component usually
    console.log('File saving is handled via storage component');
  },

  async deleteFile(key: string) {
    await supabase.storage.from('library_print_files').remove([key]);
  }
};
