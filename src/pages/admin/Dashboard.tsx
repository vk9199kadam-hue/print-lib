import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Printer, TrendingUp, LogOut, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getAdminStats' })
        });
        const data = await res.json();
        setStats(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <Loader2 className="animate-spin text-purple-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-30">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <ShieldCheck className="text-purple-500" size={28} />
          <div>
            <h1 className="font-bold text-xl tracking-wider uppercase">Super<span className="text-purple-500">Admin</span></h1>
            <p className="text-[10px] text-gray-400">Global Control Center</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-500/20 text-purple-400 rounded-xl font-bold transition">
            <TrendingUp size={18} /> Global Overview
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-bold transition">
            <Building2 size={18} /> Manage Shops
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-bold transition">
            <Users size={18} /> Registered Students
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-bold">
            <LogOut size={16} /> Secure Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Overview</h2>
          <p className="text-gray-500 mt-1 font-medium">Real-time metrics for all Library Print operations across campus.</p>
        </header>

        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-blue-500">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Users size={24} /></div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Total Students</p>
                <p className="text-2xl font-black text-gray-900">{stats.total_users || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-emerald-500">
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><Building2 size={24} /></div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Active Shops</p>
                <p className="text-2xl font-black text-gray-900">{stats.total_shops || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-amber-500">
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Printer size={24} /></div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Orders Processed</p>
                <p className="text-2xl font-black text-gray-900">{stats.total_orders || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-purple-500">
              <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><TrendingUp size={24} /></div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Total Revenue</p>
                <p className="text-2xl font-black text-gray-900">₹{stats.total_revenue || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex items-center gap-3 text-amber-800 font-medium">
            <AlertTriangle size={24} className="text-amber-600" />
            <p>Database synchronization failed. Please check the backend connection.</p>
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
           <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
           <p className="font-bold text-lg text-gray-500">Shop Management Locked</p>
           <p className="text-sm mt-1 max-w-md mx-auto">This panel requires further integration of the Priority Queue algorithms to manipulate individual shop statuses.</p>
        </div>
      </main>
    </div>
  );
}
