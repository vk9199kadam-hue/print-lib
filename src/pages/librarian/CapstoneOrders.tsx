import React, { useState, useEffect } from 'react';
import { Printer, BarChart3, LogOut, Search, Clock, Inbox, BookOpen, Calendar, Phone, School, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { Order } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { playNotificationSound } from '../../utils/sound';
import { useRef } from 'react';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function CapstoneOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentShop, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const prevCount = useRef(0);

  useEffect(() => {
    const load = async () => {
      if (document.visibilityState === 'visible') {
        const all = await DB.getPaidOrders();
        const capstoneOrders = all.filter(o => o.order_type === 'capstone');
        if (capstoneOrders.length > prevCount.current && prevCount.current > 0) {
          playNotificationSound();
        }
        prevCount.current = capstoneOrders.length;
        setOrders(capstoneOrders);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.print_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_id.toLowerCase().includes(q) || o.student_name.toLowerCase().includes(q) || o.college?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col p-4 text-primary-foreground fixed h-full z-30" style={{ backgroundColor: '#061A0F' }}>
        <div className="mb-8">
          <h1 className="font-syne font-bold text-xl">Print<span className="text-green-400">Ease</span></h1>
          <p className="text-xs text-green-300/60 mt-0.5">{currentShop?.library_name}</p>
        </div>
        <nav className="space-y-1 flex-1">
          <button onClick={() => navigate('/librarian/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <Printer size={18} /> Print Queue
          </button>
          <button onClick={() => navigate('/librarian/submissions')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <Inbox size={18} /> Submissions Inbox
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-green-primary/20 text-green-300">
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
        <header className="md:hidden bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <h1 className="font-syne font-bold text-lg text-foreground">Print<span className="text-green-primary">Ease</span></h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/librarian/settings')} className="p-2 text-muted-foreground"><SettingsIcon size={18} /></button>
            <button onClick={handleLogout} className="p-2 text-destructive"><LogOut size={18} /></button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="font-syne font-bold text-2xl text-foreground">Capstone Project Files</h2>
              <p className="text-sm text-muted-foreground">Dedicated queue for complex project reports</p>
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by student name, college or order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
             {['all', 'queued', 'printing', 'ready', 'completed'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
                   ${filter === f ? 'bg-emerald-600 text-white' : 'bg-card text-muted-foreground border border-input'}`}
               >
                 {f.toUpperCase()}
               </button>
             ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border border-input">
              <BookOpen size={40} className="mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No capstone projects found in this category.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map(order => (
                <div 
                  key={order.order_id} 
                  onClick={() => navigate(`/librarian/order/${order.order_id}`)}
                  className="bg-card rounded-xl border border-input p-4 hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600 opacity-0 group-hover:opacity-100 transition-all" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-0.5 rounded">{order.order_id}</span>
                        <StatusBadge status={order.print_status} />
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-2"><Clock size={12} /> {timeAgo(order.created_at)}</span>
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{order.student_name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><School size={12} /> {order.college}</span>
                        <span className="flex items-center gap-1"><BookOpen size={12} /> {order.department}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-xl font-bold text-emerald-600">₹{order.total_amount}</span>
                       <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Revenue Potential</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-input">
                    <div className="flex items-center gap-2">
                       <Phone size={14} className="text-emerald-600" />
                       <span className="text-xs font-medium">{order.contact_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-emerald-600" />
                       <span className="text-xs font-medium">Due: {order.receiving_date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                       <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                         {order.files[0]?.page_count || order.total_pages} Pages
                       </span>
                       {order.extra_services?.capstone_embossing && (
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                           order.extra_services.capstone_embossing === 'black' ? 'bg-slate-900 text-white' : 'bg-amber-900 text-white'
                         }`}>
                           {order.extra_services.capstone_embossing.toUpperCase()} EMBOSSING
                         </span>
                       )}
                       {!!order.extra_services?.bond_paper_count && order.extra_services.bond_paper_count > 0 && (
                         <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase border border-blue-200">
                           {order.extra_services.bond_paper_count} Bond Pages
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
