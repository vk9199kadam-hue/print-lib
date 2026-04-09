import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, ClipboardList, Copy, Check, FolderEdit, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { Order } from '../../types';
import StatusBadge from '../../components/StatusBadge';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [copied, setCopied] = useState(false);
  const [shopSettings, setShopSettings] = useState<{is_open: boolean; closing_message: string; standard_hours: string}>({
    is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM'
  });

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      if (document.visibilityState === 'visible') {
        const data = await DB.getOrdersByStudentId(currentUser.id);
        setOrders(data);

        try {
          const res = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getShopSettings' }) });
          const { data: settingsData } = await res.json();
          if (settingsData) setShopSettings(settingsData);
        } catch (e) {
          console.error("Could not fetch shop settings", e);
        }
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleCopy = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.student_print_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const activeOrders = orders.filter(o => o.print_status !== 'completed');

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-syne font-bold text-xl text-foreground">Print<span className="text-blue-primary">Ease</span></h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{currentUser?.name}</span>
          <div className="w-8 h-8 rounded-full bg-blue-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {currentUser?.name?.[0]}
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Welcome */}
        <div className="animate-fade-in-up">
          <h2 className="font-syne font-bold text-2xl text-foreground">Welcome back, {currentUser?.name}! 👋</h2>
        </div>

        {/* Shop Status Visual */}
        <div className="animate-fade-in-up">
          {!shopSettings.is_open ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-center shadow-sm">
              <p className="font-bold flex items-center justify-center gap-2 text-sm">
                <AlertCircle size={16} /> Shop is Currently Closed
              </p>
              <p className="text-xs mt-1 opacity-90">{shopSettings.closing_message ? `Message: "${shopSettings.closing_message}"` : `Standard Timings: ${shopSettings.standard_hours}`}</p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 text-green-700 px-4 py-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-green-200"></span> Shop is Open - Accepting Orders
            </div>
          )}
        </div>

        {/* Print ID Card */}
        <div className="rounded-2xl p-6 text-primary-foreground animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1B4FFF 100%)' }}>
          <p className="text-xs uppercase tracking-widest text-blue-200 mb-1">Your Print ID</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xl font-bold">{currentUser?.student_print_id}</span>
            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/10 transition">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-blue-200 mt-2">Show this at the shop counter</p>
        </div>

        {/* Actions */}
        <div className={`grid grid-cols-1 ${import.meta.env.VITE_CAPSTONE_FEATURE_ENABLED !== "false" ? 'sm:grid-cols-2' : ''} gap-3 animate-fade-in-up`}>
          <button onClick={() => navigate('/student/upload')} className="py-4 rounded-xl bg-blue-primary text-primary-foreground font-bold hover:opacity-90 transition flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-primary/20">
            <Upload size={24} />
            <span className="text-sm">Standard Print</span>
            <span className="text-[10px] font-normal opacity-80 italic">Regular PDF/PPT/Word</span>
          </button>
          {import.meta.env.VITE_CAPSTONE_FEATURE_ENABLED !== "false" && (
            <button onClick={() => navigate('/student/capstone')} className="py-4 rounded-xl bg-emerald-600 text-primary-foreground font-bold hover:opacity-90 transition flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
              <FolderEdit size={24} />
              <span className="text-sm">Capstone Project</span>
              <span className="text-[10px] font-normal opacity-80 italic">Full Project Report</span>
            </button>
          )}
          <button onClick={() => navigate('/student/history')} className={`${import.meta.env.VITE_CAPSTONE_FEATURE_ENABLED !== "false" ? 'sm:col-span-2' : ''} py-3 rounded-xl border-2 border-input bg-card text-foreground font-semibold hover:bg-secondary transition flex items-center justify-center gap-2`}>
            <ClipboardList size={18} /> Order History & Tracking
          </button>
        </div>

        {/* Active Orders */}
        <div>
          <h3 className="font-syne font-semibold text-lg text-foreground mb-3">Your Orders</h3>
          {activeOrders.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-input">
              <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="12" y="16" width="40" height="32" rx="4" />
                <line x1="20" y1="28" x2="44" y2="28" /><line x1="20" y1="36" x2="36" y2="36" />
              </svg>
              <p className="text-muted-foreground font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first file to get started</p>
              <button onClick={() => navigate('/student/upload')} className="mt-4 px-6 py-2 rounded-xl bg-blue-primary text-primary-foreground font-semibold text-sm hover:opacity-90">
                Upload Files →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div key={order.order_id} className="bg-card rounded-xl p-4 border border-input hover:shadow-md transition animate-fade-in-up">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-foreground">{order.order_id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</span>
                      <StatusBadge status={order.print_status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{order.files.length} file{order.files.length !== 1 ? 's' : ''} · ₹{order.total_amount}</span>
                    <button onClick={() => navigate(`/student/track/${order.order_id}`)} className="text-sm text-blue-primary font-semibold hover:underline">
                      Track Order →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
