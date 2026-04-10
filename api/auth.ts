/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Lazy loader for Supabase Client (HTTP-based, more reliable on Vercel)
let supabase: any = null;
const getSupabase = () => {
  if (!supabase) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase ENV missing (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)');
    supabase = createClient(url, key);
  }
  return supabase;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(200).json({ status: 'ready' });
  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {
    const db = getSupabase();

    switch (action) {
      case 'health': {
        const { error } = await db.from('shopkeepers').select('count', { count: 'exact', head: true });
        return res.json({ status: 'ok', db: !error, error: error?.message });
      }

      case 'verifyShopkeeper': {
        const { data: users, error } = await db.from('shopkeepers').select('*').eq('email', payload.email);
        if (error) throw error;
        if (!users || users.length === 0) return res.json({ data: null });
        
        const user = users[0];
        let isValid = false;
        if (user.password === payload.password) {
           isValid = true;
           const newHash = await bcrypt.hash(payload.password, 10);
           await db.from('shopkeepers').update({ password: newHash }).eq('id', user.id);
        } else {
           isValid = await bcrypt.compare(payload.password, user.password);
        }
        if (!isValid) return res.json({ data: null });
        delete user.password;
        return res.json({ data: user });
      }

      case 'verifyStudent': {
        const { data: users, error } = await db.from('users').select('*').eq('email', payload.email);
        if (error) throw error;
        if (!users || users.length === 0) return res.json({ data: null });
        
        const user = users[0];
        let isValid = await bcrypt.compare(payload.password, user.password);
        if (!isValid) return res.json({ data: null });
        delete user.password;
        return res.json({ data: user });
      }

      case 'createOrder': {
        const { files, ...orderData } = payload;
        const order_id = `ORD-${Date.now().toString().slice(-6)}`;
        
        const { data: order, error: orderError } = await db.from('orders').insert({
          ...orderData,
          order_id,
          payment_status: orderData.payment_status || 'paid',
          print_status: orderData.print_status || 'queued'
        }).select().single();
        
        if (orderError) throw orderError;
        
        if (files && files.length > 0) {
          const filesWithOrderId = files.map(f => ({
            ...f,
            order_id: order.id,
            paper_size: f.paper_size || 'A4'
          }));
          const { error: filesError } = await db.from('order_files').insert(filesWithOrderId);
          if (filesError) throw filesError;
        }
        return res.json({ data: order });
      }

      case 'getPaidOrders': {
        const { data: orders, error } = await db.from('orders').select('*, order_files(*)').eq('payment_status', 'paid').order('created_at', { ascending: false });
        if (error) throw error;
        // Transform the nested results into the format the frontend expects
        const transformed = orders.map(o => ({ ...o, files: o.order_files }));
        return res.json({ data: transformed });
      }

      case 'updateOrderStatus': {
        const { error } = await db.from('orders').update({ print_status: payload.print_status }).eq('order_id', payload.order_id);
        if (error) throw error;
        return res.json({ success: true });
      }

      case 'getShopSettings': {
        const { data, error } = await db.from('shop_settings').select('*').eq('id', 1).single();
        return res.json({ data: data || { is_open: true } });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Server Error', details: err.message });
  }
}
