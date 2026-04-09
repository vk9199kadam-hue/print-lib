import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Printer, BarChart3, LogOut, Search, Clock, AlertCircle, Inbox, BookOpen, Zap, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { supabase } from '../../utils/fileStorage';
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

export default function ShopDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentShop, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const prevCount = useRef(0);
  
  const [shopSettings, setShopSettings] = useState<{is_open: boolean; closing_message: string; standard_hours: string}>({
    is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM'
  });
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [tempCloseMsg, setTempCloseMsg] = useState('');

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
    
    // Silent background refresh (Polling)
    // This fetches new data every 10 seconds perfectly without refreshing the web page.
    // It will not interrupt the librarian's interface or downloads.
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
    completed: orders.filter(o => o.print_status === 'completed' && new Date(o.created_at).toDateString() === new Date().toDateString()).length,
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const toggleShopStatus = async (open: boolean, msg: string = '') => {
    const newSettings = { ...shopSettings, is_open: open, closing_message: msg };
    setShopSettings(newSettings);
    setShowCloseModal(false);
    await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateShopSettings', payload: newSettings }) });
  };

  const borderColor = (status: string) => {
    const map: Record<string, string> = { queued: 'border-l-amber-400', printing: 'border-l-blue-400', ready: 'border-l-green-400', completed: 'border-l-gray-300' };
    return map[status] || '';
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col p-4 text-primary-foreground fixed h-full z-30" style={{ backgroundColor: '#061A0F' }}>
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-xl overflow-hidden mb-3 border-2 border-green-500/30 flex items-center justify-center p-1">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-syne font-bold text-xl text-center text-primary-foreground">SACHIN<br/><span className="text-green-400">COMPUTERS</span></h1>
          <p className="text-[10px] text-green-300/60 mt-2 font-mono uppercase tracking-widest">{currentShop?.library_name || 'Admin Panel'}</p>
          
          <div className="mt-4 p-3 bg-secondary/20 rounded-xl border border-input/10 w-full text-center">
            <p className="text-xs font-semibold mb-2 text-foreground/80">Shop Status</p>
            <button
              onClick={() => shopSettings.is_open ? setShowCloseModal(true) : toggleShopStatus(true)}
              className={`w-full py-2 rounded-lg font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2
                ${shopSettings.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {shopSettings.is_open ? <><span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Open</> : <><span className="w-2 h-2 rounded-full bg-white"></span> Closed</>}
            </button>
            {!shopSettings.is_open && shopSettings.closing_message && (
              <p className="text-[10px] text-red-300 mt-2 italic">"{shopSettings.closing_message}"</p>
            )}
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          <button onClick={() => { setFilter('all'); navigate('/librarian/dashboard'); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-green-primary/20 text-green-300' : 'text-green-300/60 hover:text-green-300 hover:bg-green-primary/10'}`}>
            <Printer size={18} /> All Orders
          </button>
          <button onClick={() => setFilter('queued')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${filter === 'queued' ? 'bg-amber-400/20 text-amber-300' : 'text-green-300/60 hover:text-green-300 hover:bg-green-primary/10'}`}>
            <Zap size={18} /> Pending (Queued)
            {stats.queued > 0 && <span className="ml-auto bg-amber-500 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.queued}</span>}
          </button>
          <button onClick={() => navigate('/librarian/submissions')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <Inbox size={18} /> Submissions Inbox
          </button>
          <button onClick={() => navigate('/librarian/capstone')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <BookOpen size={18} /> Capstone Projects
          </button>
          <button onClick={() => navigate('/librarian/analytics')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <BarChart3 size={18} /> Analytics
          </button>
          <button onClick={() => navigate('/librarian/settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${location.pathname === '/librarian/settings' ? 'bg-green-primary/20 text-green-300' : 'text-green-300/60 hover:text-green-300 hover:bg-green-primary/10'}`}>
            <SettingsIcon size={18} /> Settings
          </button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300 mt-auto">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60">
        {/* Mobile header */}
        <header className="md:hidden bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <h1 className="font-syne font-bold text-lg text-foreground">Print<span className="text-green-primary">Ease</span></h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/librarian/settings')} className="p-2 text-muted-foreground"><SettingsIcon size={18} /></button>
            <button onClick={() => navigate('/librarian/analytics')} className="p-2 text-muted-foreground"><BarChart3 size={18} /></button>
            <button onClick={handleLogout} className="p-2 text-destructive"><LogOut size={18} /></button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 space-y-4">
          <h2 className="font-syne font-bold text-xl text-foreground">Print Queue</h2>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Queued', value: stats.queued, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Printing', value: stats.printing, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Ready', value: stats.ready, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Done Today', value: stats.completed, color: 'text-gray-600', bg: 'bg-gray-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by Student ID or Order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'queued', 'printing', 'ready', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
                  ${filter === f ? 'bg-green-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-input hover:bg-secondary'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders */}
          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-input">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(order => {
                const isNew = (Date.now() - new Date(order.created_at).getTime()) < 30000;
                return (
                  <div
                    key={order.order_id}
                    onClick={() => navigate(`/librarian/order/${order.order_id}`)}
                    className={`bg-card rounded-xl p-4 border border-input border-l-4 ${borderColor(order.print_status)} hover:shadow-md transition cursor-pointer relative
                      ${isNew ? 'animate-slide-in-right' : ''}`}
                  >
                    {isNew && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                        NEW
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-foreground">{order.order_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {timeAgo(order.created_at)}</span>
                        <StatusBadge status={order.print_status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-light text-blue-primary text-xs font-mono font-semibold px-2 py-0.5 rounded-md">{order.student_print_id}</span>
                      <span className="text-sm text-muted-foreground">{order.student_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{order.files.length} file{order.files.length !== 1 ? 's' : ''} · {order.total_pages} pages</span>
                      <span className="font-semibold text-foreground">₹{order.total_amount}</span>
                    </div>
                    {/* Quick Note Preview */}
                    {order.files.some(f => f.student_note) && (
                      <div className="mt-2 pt-2 border-t border-dotted border-input flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded-lg">
                        <MessageSquare size={12} className="mt-0.5 shrink-0" />
                        <span className="truncate italic">"{order.files.find(f => f.student_note)?.student_note}"</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Close Shop Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-xl animate-fade-in-up">
            <h3 className="text-lg font-syne font-bold text-foreground mb-2">Close Shop Override</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to close the shop? Students will not be able to place new orders.</p>
            
            <label className="block text-sm font-semibold text-foreground mb-2">Emergency Message (Optional)</label>
            <textarea
              className="w-full rounded-xl border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-red-500 outline-none resize-none"
              rows={3}
              placeholder="e.g., Closed for lunch, back in 30 mins"
              value={tempCloseMsg}
              onChange={(e) => setTempCloseMsg(e.target.value)}
            ></textarea>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCloseModal(false); setTempCloseMsg(''); }}
                className="px-4 py-2 rounded-lg font-semibold text-muted-foreground hover:bg-secondary transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { toggleShopStatus(false, tempCloseMsg); setTempCloseMsg(''); }}
                className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition shadow-md"
              >
                Close Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
