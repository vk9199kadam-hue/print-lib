import { User, librarian, Order, Pricing, Session, Submission, Notice } from '../types';
import { db, storage } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, setDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import bcrypt from 'bcryptjs';

export const ApiClient = {
  // --- AUTH ---
  async verifylibrarian(email: string, password: string): Promise<librarian | null> {
    const q = query(collection(db, 'librarians'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    const user = { id: docSnap.id, ...docSnap.data() } as any;
    
    let isValid = false;
    
    // Check if password is plain text (migration) or hashed
    if (user.password === password) {
       isValid = true;
       const newHash = await bcrypt.hash(password, 10);
       await updateDoc(docSnap.ref, { password: newHash });
    } else {
       isValid = await bcrypt.compare(password, user.password);
    }
    
    if (!isValid) return null;
    delete user.password;
    return user;
  },

  async verifyStudent(email: string, password: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    const user = { id: docSnap.id, ...docSnap.data() } as any;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    delete user.password;
    return user;
  },

  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
  },

  async getUserById(id: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'users', id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as any;
  },

  async createUser(data: any): Promise<User | null> {
    const docRef = await addDoc(collection(db, 'users'), data);
    return { id: docRef.id, ...data } as any;
  },

  // --- ORDERS ---
  async createOrder(data: Partial<Order>): Promise<Order> {
    const { files, extra_services, ...orderData } = data;
    const order_id = orderData.order_id || `ORD-${Date.now().toString().slice(-6)}`;
    
    const extras = {
      spiral_binding: extra_services?.spiral_binding || orderData.spiral_binding || false,
      stapling: extra_services?.stapling || orderData.stapling || false
    };
    
    const newOrder = {
      ...orderData,
      ...extras,
      order_id,
      payment_status: orderData.payment_status || 'paid',
      print_status: orderData.print_status || 'queued',
      created_at: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'orders'), newOrder);
    const order = { id: docRef.id, ...newOrder } as any;
    
    if (files && files.length > 0) {
      const filesWithOrderId = files.map(f => ({
        ...f,
        order_id: order.id,
        paper_size: f.paper_size || 'A4'
      }));
      
      const filesCollection = collection(db, 'order_files');
      for (const file of filesWithOrderId) {
        await addDoc(filesCollection, file);
      }
      order.files = filesWithOrderId;
    }
    
    return order;
  },

  async getOrderById(order_id: string): Promise<Order | null> {
    const q = query(collection(db, 'orders'), where('order_id', '==', order_id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const orderDoc = snapshot.docs[0];
    const order = { id: orderDoc.id, ...orderDoc.data() } as any;
    
    const filesQ = query(collection(db, 'order_files'), where('order_id', '==', order.id));
    const filesSnapshot = await getDocs(filesQ);
    order.files = filesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    return order;
  },

  async getOrdersByStudentId(student_id: string): Promise<Order[]> {
    const q = query(collection(db, 'orders'), where('student_id', '==', student_id), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    for (const order of orders) {
      const filesQ = query(collection(db, 'order_files'), where('order_id', '==', order.id));
      const filesSnapshot = await getDocs(filesQ);
      order.files = filesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return orders;
  },

  async getPaidOrders(): Promise<Order[]> {
    const q = query(collection(db, 'orders'), where('payment_status', '==', 'paid'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    for (const order of orders) {
      const filesQ = query(collection(db, 'order_files'), where('order_id', '==', order.id));
      const filesSnapshot = await getDocs(filesQ);
      order.files = filesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return orders;
  },

  async updateOrderStatus(order_id: string, print_status: string): Promise<boolean> {
    const q = query(collection(db, 'orders'), where('order_id', '==', order_id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    
    await updateDoc(snapshot.docs[0].ref, { print_status });
    return true;
  },

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'orders', id));
      
      const filesQ = query(collection(db, 'order_files'), where('order_id', '==', id));
      const filesSnapshot = await getDocs(filesQ);
      for (const fileDoc of filesSnapshot.docs) {
        await deleteDoc(fileDoc.ref);
      }
      return true;
    } catch {
      return false;
    }
  },

  // --- LIBRARY SETTINGS ---
  async getLibrarySettings(): Promise<any> {
    const docSnap = await getDoc(doc(db, 'settings', 'library_settings'));
    if (!docSnap.exists()) return { is_open: true };
    return docSnap.data();
  },

  async updateLibrarySettings(data: any): Promise<boolean> {
    try {
      await setDoc(doc(db, 'settings', 'library_settings'), data, { merge: true });
      return true;
    } catch {
      return false;
    }
  },

  // --- SUBMISSIONS ---
  async getSubmissions(): Promise<Submission[]> {
    const q = query(collection(db, 'submissions'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  async createSubmission(data: Partial<Submission>): Promise<Submission> {
    const docRef = await addDoc(collection(db, 'submissions'), {
      ...data,
      created_at: new Date().toISOString()
    });
    return { id: docRef.id, ...data } as any;
  },

  async updateSubmissionStatus(submission_id: string, validation_status: string): Promise<boolean> {
    const q = query(collection(db, 'submissions'), where('submission_id', '==', submission_id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    
    await updateDoc(snapshot.docs[0].ref, { validation_status });
    return true;
  },

  async addNoticeToSubmission(submission_id: string, type: string, message: string): Promise<boolean> {
    const q = query(collection(db, 'submissions'), where('submission_id', '==', submission_id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    
    const subId = snapshot.docs[0].id;
    await addDoc(collection(db, 'notices'), {
      submission_id: subId,
      type,
      message,
      created_at: new Date().toISOString()
    });
    return true;
  },

  // --- FILE STORAGE (Direct to Supabase Storage) ---
  async saveFile(key: string, base64: string) {
    console.log('File saving is handled via storage component');
  },

  async getFile(key: string): Promise<string | null> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkuieoczwcioumzlmmvw.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdWllb2N6d2Npb3VtemxtbXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzE1MTMsImV4cCI6MjA5MTMwNzUxM30.hKDBkJrxwWqErFSpR5iTzo_P1BsqUuunQOigL4HiM3Y';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data } = supabase.storage.from('documents').getPublicUrl(key);
      return data.publicUrl;
    } catch {
      return null;
    }
  },

  async deleteFile(key: string) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkuieoczwcioumzlmmvw.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdWllb2N6d2Npb3VtemxtbXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzE1MTMsImV4cCI6MjA5MTMwNzUxM30.hKDBkJrxwWqErFSpR5iTzo_P1BsqUuunQOigL4HiM3Y';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.storage.from('documents').remove([key]);
    } catch (e) {
      console.error('Error deleting file', e);
    }
  },

  async cleanOrphanedFiles(): Promise<boolean> {
    console.log('Storage cleanup initiated.');
    return true;
  },

  // --- PRICING ---
  async getPricing(): Promise<Pricing | null> {
    const docSnap = await getDoc(doc(db, 'settings', 'pricing'));
    if (!docSnap.exists()) return null;
    return docSnap.data() as Pricing;
  },

  async updatePricing(pricing: Pricing): Promise<boolean> {
    try {
      await setDoc(doc(db, 'settings', 'pricing'), pricing);
      return true;
    } catch {
      return false;
    }
  }
};
