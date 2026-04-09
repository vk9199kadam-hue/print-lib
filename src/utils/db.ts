import { User, librarian, Order, Pricing, Session, Submission, Notice } from '../types';
import { CockroachDB } from './cockroachDb';

const KEYS = {
  SESSION: 'Library Print_session',
  PRICING: 'Library Print_pricing',
} as const;

export const DB = {
  async getUsers(): Promise<User[]> {
    return CockroachDB.getUsers();
  },
  async getUserByEmail(email: string): Promise<User | null> {
    return CockroachDB.getUserByEmail(email);
  },
  async verifyStudent(email: string, password: string): Promise<User | null> {
    return CockroachDB.verifyStudent(email, password);
  },
  async getUserById(id: string): Promise<User | null> {
    return CockroachDB.getUserById(id);
  },
  async createUser(data: { name: string; email: string; password?: string; gender: string }): Promise<User | null> {
    return CockroachDB.createUser(data);
  },
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    // We don't have an updateUser rpc yet but let's mock it or ignore for now
    return null;
  },
  getlibrarian(): librarian | null {
    // Only used locally or from session normally, but let's hit server if needed
    // Actually not used directly often, usually verifylibrarian is used
    return null; 
  },
  async verifylibrarian(email: string, password: string): Promise<librarian | null> {
    return CockroachDB.verifylibrarian(email, password);
  },
  async getOrders(): Promise<Order[]> {
    return []; // Not used directly in UI usually
  },
  async getOrderById(order_id: string): Promise<Order | null> {
    return CockroachDB.getOrderById(order_id);
  },
  async getOrdersByStudentId(student_id: string): Promise<Order[]> {
    return CockroachDB.getOrdersByStudentId(student_id);
  },
  async getPaidOrders(): Promise<Order[]> {
    return CockroachDB.getPaidOrders();
  },
  async createOrder(data: Omit<Order, 'order_id' | 'created_at' | 'updated_at'> & { order_id?: string }): Promise<Order | null> {
    return CockroachDB.createOrder(data);
  },
  async updateOrderStatus(order_id: string, print_status: Order['print_status']): Promise<boolean> {
    return CockroachDB.updateOrderStatus(order_id, print_status);
  },
  async updateOrderQR(order_id: string, qr_code: string): Promise<void> {
    // Not critical for now
  },
  async saveFile(key: string, base64: string): Promise<void> {
    await CockroachDB.saveFile(key, base64);
  },
  async getFile(key: string): Promise<string | null> {
    return CockroachDB.getFile(key);
  },
  async deleteFile(key: string): Promise<void> {
    await CockroachDB.deleteFile(key);
  },
  getPricing(): Pricing {
    // Returns cached pricing from localStorage (populated by fetchPricing)
    const defaults: Pricing = { 
      bw_rate: 1, 
      color_rate: 4, 
      a3_bw_rate: 10, 
      a3_color_rate: 15, 
      spiral_binding_fee: 20, 
      stapling_fee: 0,
      capstone_page_rate: 4, 
      capstone_urgent_fee: 180, 
      capstone_non_urgent_fee: 140 
    };
    const data = localStorage.getItem(KEYS.PRICING);
    if (!data) return defaults;
    try {
      return { ...defaults, ...JSON.parse(data) };
    } catch (e) {
      return defaults;
    }
  },
  async fetchPricing(): Promise<Pricing> {
    // Fetch from DB and update local cache
    const defaults: Pricing = { 
      bw_rate: 1, 
      color_rate: 4, 
      a3_bw_rate: 10, 
      a3_color_rate: 15, 
      spiral_binding_fee: 20, 
      stapling_fee: 0,
      capstone_page_rate: 4, 
      capstone_urgent_fee: 180, 
      capstone_non_urgent_fee: 140 
    };
    try {
      const serverPricing = await CockroachDB.getPricing();
      if (serverPricing) {
        const merged = { ...defaults, ...serverPricing };
        localStorage.setItem(KEYS.PRICING, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('Could not fetch pricing from server, using local cache', e);
    }
    return this.getPricing();
  },
  async savePricing(pricing: Pricing): Promise<void> {
    // Save to both server DB and local cache
    localStorage.setItem(KEYS.PRICING, JSON.stringify(pricing));
    await CockroachDB.updatePricing(pricing);
  },
  getSession(): Session | null {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession(user: User | librarian, role: Session['role']): void {
    localStorage.setItem(KEYS.SESSION, JSON.stringify({ user, role }));
  },
  clearSession(): void {
    localStorage.removeItem(KEYS.SESSION);
  },
  async getTodayAnalytics() {
    const orders = await CockroachDB.getPaidOrders();
    
    // Fetch specifically today's analytics based on local time
    const today = new Date().toDateString();
    const validOrders = (orders || []).filter(o => new Date(o.created_at).toDateString() === today);
    
    return {
      total_orders: validOrders.length,
      total_pages: validOrders.reduce((s, o) => s + Number(o.total_pages || 0), 0),
      total_revenue: validOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
      bw_pages: validOrders.reduce((s, o) => s + Number(o.total_bw_pages || 0), 0),
      color_pages: validOrders.reduce((s, o) => s + Number(o.total_color_pages || 0), 0),
      queued: validOrders.filter(o => o.print_status === 'queued').length,
      printing: validOrders.filter(o => o.print_status === 'printing').length,
      ready: validOrders.filter(o => o.print_status === 'ready').length,
      completed: validOrders.filter(o => o.print_status === 'completed').length
    };
  },
  async getSubmissions(): Promise<Submission[]> {
    return CockroachDB.getSubmissions();
  },
  async getSubmissionsByStudent(student_id: string): Promise<Submission[]> {
    const subs = await CockroachDB.getSubmissions();
    return subs.filter(s => s.student_id === student_id);
  },
  async createSubmission(data: Omit<Submission, 'submission_id' | 'validation_status' | 'notices' | 'created_at' | 'updated_at'>): Promise<Submission | null> {
    return CockroachDB.createSubmission(data);
  },
  async updateSubmissionStatus(submission_id: string, status: Submission['validation_status']): Promise<boolean> {
    return CockroachDB.updateSubmissionStatus(submission_id, status);
  },
  async addNoticeToSubmission(submission_id: string, type: Notice['type'], message: string): Promise<boolean> {
    return CockroachDB.addNoticeToSubmission(submission_id, type, message);
  },
  async cleanOrphanedFiles() {
    return CockroachDB.cleanOrphanedFiles();
  },
  async getShopSettings() {
    return CockroachDB.getShopSettings();
  },
  async updateShopSettings(data: { is_open: boolean; closing_message: string; standard_hours?: string }) {
    return CockroachDB.updateShopSettings(data);
  }
};

