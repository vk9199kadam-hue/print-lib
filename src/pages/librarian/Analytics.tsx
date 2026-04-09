import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { DB } from '../../utils/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    total_orders: 0, total_pages: 0, total_revenue: 0,
    bw_pages: 0, color_pages: 0, queued: 0, printing: 0, ready: 0, completed: 0
  });

  useEffect(() => {
    const load = () => {
      DB.getTodayAnalytics().then(setAnalytics).catch(console.error);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: 'Queued', value: analytics.queued, fill: '#F59E0B' },
    { name: 'Printing', value: analytics.printing, fill: '#1B4FFF' },
    { name: 'Ready', value: analytics.ready, fill: '#0D6B3E' },
    { name: 'Completed', value: analytics.completed, fill: '#9CA3AF' },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-input px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate('/librarian/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Back to Queue</span>
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-green-primary" />
          <h1 className="font-syne font-bold text-xl text-foreground">Today's Analytics</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total Orders', value: analytics.total_orders, color: 'text-blue-primary' },
            { label: 'Total Pages', value: analytics.total_pages, color: 'text-green-primary' },
            { label: 'Revenue', value: `₹${analytics.total_revenue}`, color: 'text-amber-600' },
            { label: 'B&W Pages', value: analytics.bw_pages, color: 'text-gray-700' },
            { label: 'Color Pages', value: analytics.color_pages, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-input p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-card rounded-2xl border border-input p-4">
          <h3 className="font-semibold text-foreground mb-4">Order Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
