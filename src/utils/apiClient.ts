import { User, librarian, Order, Pricing, Session, Submission, Notice } from '../types';

async function rpc(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(`/api/rpc?t=${Date.now()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: JSON.stringify({ action, payload })
  });
  console.log(`RPC [${action}]: Response received`);
  const data = await res.json();
  if (!res.ok) {
    const errorBody = data.error || data.details || 'API Error';
    throw new Error(errorBody);
  }
  return data.data;
}

export const ApiClient = {
  async getUsers(): Promise<User[]> {
    return await rpc('getUsers').catch(() => []);
  },
  
  async getUserById(id: string): Promise<User | null> {
    return await rpc('getUserById', { id }).catch(() => null);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return await rpc('getUserByEmail', { email }).catch(() => null);
  },

  async verifyStudent(email: string, password: string): Promise<User | null> {
    return await rpc('verifyStudent', { email, password }).catch(() => null);
  },

  async createUser(data: { name: string; email: string; password?: string; gender: string }): Promise<User | null> {
    const year = new Date().getFullYear();
    const count = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return await rpc('createUser', {
      ...data,
      student_print_id: `SID-${year}-${count}`,
      is_verified: true
    }).catch(e => { console.error(e); return null; });
  },

  async verifylibrarian(email: string, password: string): Promise<librarian | null> {
    return await rpc('verifyShopkeeper', { email, password });
  },

  async getPaidOrders(): Promise<Order[]> {
    return await rpc('getPaidOrders').catch(() => []);
  },

  async getOrdersByStudentId(student_id: string): Promise<Order[]> {
    return await rpc('getOrdersByStudentId', { student_id }).catch(() => []);
  },

  async createOrder(data: Record<string, unknown>): Promise<Order | null> {
    if (!data.order_id) {
      const year = new Date().getFullYear();
      const count = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      data.order_id = `ORD-${year}-${count}`;
    }
    return await rpc('createOrder', data).catch(e => { console.error(e); return null; });
  },

  async updateOrderStatus(order_id: string, print_status: string): Promise<boolean> {
    return await rpc('updateOrderStatus', { order_id, print_status }).catch(() => false);
  },

  async getSubmissions(): Promise<Submission[]> {
    return await rpc('getSubmissions').catch(() => []);
  },

  async createSubmission(data: Record<string, unknown>): Promise<Submission | null> {
    const year = new Date().getFullYear();
    const count = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    data.submission_id = `SUB-${year}-${count}`;
    data.validation_status = 'received';
    return await rpc('createSubmission', data).catch(e => { console.error(e); return null; });
  },

  async updateSubmissionStatus(submission_id: string, status: string): Promise<boolean> {
    return await rpc('updateSubmissionStatus', { submission_id, status }).catch(() => false);
  },

  async addNoticeToSubmission(submission_id: string, type: string, message: string): Promise<boolean> {
    return await rpc('addNoticeToSubmission', { submission_id, type, message }).catch(() => false);
  },

  async saveFile(key: string, base64: string): Promise<string | null> {
    try {
      await rpc('uploadFile', { key, base64 });
      return key;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async getFile(key: string): Promise<string | null> {
    try {
      return await rpc('downloadFile', { key });
    } catch (e) {
      return null;
    }
  },

  async deleteFile(key: string): Promise<boolean> {
    return await rpc('deleteFile', { key }).catch(() => false);
  },

  async getOrderById(id: string): Promise<Order | null> {
    return await rpc('getOrderById', { id }).catch(() => null);
  },

  async getPricing(): Promise<Pricing | null> {
    return await rpc('getPricing').catch(() => null);
  },

  async updatePricing(pricing: Pricing): Promise<boolean> {
    return await rpc('updatePricing', pricing as unknown as Record<string, unknown>).catch(() => false);
  },

  async cleanOrphanedFiles(): Promise<{ deleted: number } | null> {
    return await rpc('cleanOrphanedFiles').catch(() => null);
  },

  async getShopSettings(): Promise<{is_open: boolean; closing_message: string; standard_hours: string} | null> {
    return await rpc('getShopSettings').catch(() => null);
  },

  async updateShopSettings(data: {is_open: boolean; closing_message: string; standard_hours?: string}): Promise<boolean> {
    return await rpc('updateShopSettings', data).catch(() => false);
  }
};
