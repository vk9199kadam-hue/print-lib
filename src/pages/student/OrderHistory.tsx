import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { Order } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function OrderHistory() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => setOrders(await DB.getOrdersByStudentId(currentUser.id));
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const filtered = orders.filter(o => {
    if (filter === 'active') return o.print_status !== 'completed';
    if (filter === 'completed') return o.print_status === 'completed';
    return true;
  }).filter(o => !search || o.order_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-input px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Dashboard</span>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <h1 className="font-syne font-bold text-xl text-foreground">Order History</h1>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by Order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                ${filter === f ? 'bg-blue-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary border border-input'}`}
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
            {filtered.map(order => (
              <div key={order.order_id} className="bg-card rounded-xl p-4 border border-input hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-foreground">{order.order_id}</span>
                  <StatusBadge status={order.print_status} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-medium bg-secondary px-1.5 py-0.5 rounded">{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{order.files.length} FILE{order.files.length !== 1 ? 'S' : ''}</span>
                    <span className="font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{order.total_pages} PAGES</span>
                    {order.files.some(f => (f.slidesPerPage || 0) > 1) && (
                      <span className="font-medium bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">MULTI-SLIDE</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground">₹{order.total_amount}</span>
                </div>
                {order.print_status === 'ready' && (
                  <div className="bg-green-light rounded-lg p-2 text-center text-sm text-green-primary font-semibold mb-2">
                    Ready for pickup!
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/student/track/${order.order_id}`)} className="text-sm text-blue-primary font-semibold hover:underline">
                    Track Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
