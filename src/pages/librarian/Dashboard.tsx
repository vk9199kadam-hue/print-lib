import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, LogOut, Search, Clock, Zap, MessageSquare, Library } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { Order } from '../../types';

import StatusBadge from '../../components/StatusBadge';
import { playNotificationSound } from '../../utils/sound';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const { currentShop, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('queued'); // Default to queued as it's the most important
  const [search, setSearch] = useState('');
  const prevCount = useRef(0);
  
  const [shopSettings, setShopSettings] = useState<{is_open: boolean; closing_message: string; standard_hours: string}>({
    is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM'
  });

  useEffect(() => {
    const load = async () => {
      if (document.visibilityState === 'visible') {
          const paid = await DB.getPaidOrders();
          const standardOrders = paid.filter(o => o.order_type !== 'capstone');
          if (standardOrders.length > prevCount.current && prevCount.current > 0) {
            playNotificationSound();
          }
          prevCount.current = standardOrders.length;
          setOrders(standardOrders);

          const res = await fetch('/api/rpc', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'getShopSettings' }) });
          const { data } = await res.json();
          if (data) setShopSettings(data);
      }
    };
    load();
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.print_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_id.toLowerCase().includes(q) || o.student_print_id.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    queued: orders.filter(o => o.print_status === 'queued').length,
    printing: orders.filter(o => o.print_status === 'printing').length,
    ready: orders.filter(o => o.print_status === 'ready').length,
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const borderColor = (status: string) => {
    const map: Record<string, string> = { queued: 'border-l-amber-400', printing: 'border-l-blue-400', ready: 'border-l-green-400', completed: 'border-l-gray-300' };
    return map[status] || '';
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar - Simple Version */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-slate-950 text-white flex flex-col items-center py-6 border-r border-white/5 z-50">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-600/20">
            <Library size={24} />
          </div>
          <p className="hidden md:block text-[10px] font-black tracking-widest text-blue-400 uppercase">Library Panel</p>
        </div>

        <nav className="flex-1 w-full px-2 space-y-2">
          <button 
            onClick={() => setFilter('queued')}
            className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl transition-all ${filter === 'queued' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Printer size={20} />
            <span className="hidden md:block font-bold text-sm">Print Queue</span>
            {stats.queued > 0 && <span className="hidden md:flex ml-auto bg-black/30 text-[10px] px-2 py-0.5 rounded-full">{stats.queued}</span>}
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center md:justify-start gap-4 p-4 text-red-500 hover:bg-red-500/10 transition-all rounded-2xl mb-4 mx-2"
        >
          <LogOut size={20} />
          <span className="hidden md:block font-bold text-sm">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Bar */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Active Queue</h1>
              <p className="text-sm text-muted-foreground font-medium">Real-time incoming student print requests</p>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                 🔒 Privacy Mode: PRNs and Names are temporary and will be deleted after completion.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-input">
               <div className="px-4 py-2 text-center border-r border-input">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Pending</p>
                  <p className="text-xl font-black text-amber-500">{stats.queued}</p>
               </div>
               <div className="px-4 py-2 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Active</p>
                  <p className="text-xl font-black text-blue-500">{stats.printing}</p>
               </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search by PRN or Order ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white shadow-sm focus:border-blue-600 outline-none transition font-bold text-sm"
              />
            </div>
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-input h-fit">
              {['all', 'queued', 'printing', 'ready', 'completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${filter === f ? 'bg-slate-900 text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-input">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground opacity-50">
                   <Zap size={32} />
                </div>
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No print requests found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map(order => (
                  <div
                    key={order.order_id}
                    onClick={() => navigate(`/librarian/order/${order.order_id}`)}
                    className={`bg-white rounded-3xl p-6 border-2 border-transparent hover:border-blue-600/30 hover:shadow-xl transition-all cursor-pointer group animate-fade-in-up relative overflow-hidden`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${borderColor(order.print_status)}`}></div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <span className="font-mono bg-secondary px-3 py-1 rounded-lg text-xs font-black text-foreground tracking-widest uppercase">{order.order_id}</span>
                         <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest"><Clock size={12} /> {timeAgo(order.created_at)}</span>
                      </div>
                      <StatusBadge status={order.print_status} />
                    </div>

                    <div className="flex items-end justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xs uppercase shadow-sm">
                             {order.student_name[0]}
                          </div>
                          <div>
                             <h3 className="font-black text-lg text-foreground uppercase tracking-tight leading-none">{order.student_name}</h3>
                             <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-widest">PRN: {order.student_print_id}</p>
                          </div>
                       </div>
                       
                       <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Files / Pages</p>
                          <p className="font-black text-foreground text-sm uppercase">{order.files.length} • {order.total_pages} PGS</p>
                       </div>
                    </div>

                    {/* Quick Preview of notes */}
                    {order.files.some(f => f.student_note) && (
                      <div className="mt-4 pt-4 border-t border-secondary flex items-start gap-3 text-xs italic text-blue-800 bg-blue-50/30 p-3 rounded-2xl">
                        <MessageSquare size={14} className="mt-0.5 shrink-0" />
                        <span className="font-medium truncate">"{order.files.find(f => f.student_note)?.student_note}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
