import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Upload, CreditCard, Clock, Printer, Bell, CheckCircle, Loader2 } from 'lucide-react';
import { DB } from '../../utils/db';
import { supabase } from '../../utils/fileStorage';
import { Order } from '../../types';
import { playReadySound } from '../../utils/sound';


const steps = [
  { key: 'uploaded', label: 'Uploaded', icon: Upload },
  { key: 'paid', label: 'Paid', icon: CreditCard },
  { key: 'queued', label: 'In Queue', icon: Clock },
  { key: 'printing', label: 'Printing', icon: Printer },
  { key: 'ready', label: 'Ready', icon: Bell },
  { key: 'completed', label: 'Collected', icon: CheckCircle },
];

function getActiveStep(status: string) {
  const map: Record<string, number> = { 
    uploaded: 0, 
    paid: 1, 
    queued: 2, 
    printing: 3, 
    ready: 4, 
    completed: 5 
  };
  return map[status] ?? 2;
}

export default function OrderTracking() {
  const navigate = useNavigate();
  const { order_id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const prevStatus = useRef('');

  useEffect(() => {
    if (!order_id) return;
    let isMounted = true;
    
    const load = async () => {
      try {
        const fresh = await DB.getOrderById(order_id);
        if (!isMounted) return;
        if (fresh) {
          if (prevStatus.current && prevStatus.current !== fresh.print_status) {
            if (fresh.print_status === 'ready') playReadySound();
          }
          prevStatus.current = fresh.print_status;
          setOrder(fresh);
          setError('');
        } else {
          setError('Order not found');
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Connection lost. Retrying...');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    
    // Subscribe to WebSockets for instant, read-free updates
    const channel = supabase
      .channel(`order_updates_${order_id}`)
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_id=eq.${order_id}` }, 
        () => { load(); }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [order_id, retryCount]);

  if (loading && !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary">
      <Loader2 className="animate-spin text-blue-primary mb-4" size={32} />
      <p className="text-muted-foreground font-syne">Connecting to queue...</p>
    </div>
  );

  if (error && !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4 text-center">
      <div className="bg-card p-8 rounded-2xl border border-input shadow-sm max-w-sm">
        <p className="text-destructive font-semibold mb-4">{error}</p>
        <button 
          onClick={() => setRetryCount(prev => prev + 1)}
          className="w-full py-2 rounded-xl bg-blue-primary text-primary-foreground font-semibold"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!order) return <Navigate to="/student/dashboard" replace />;

  const activeStep = getActiveStep(order.print_status);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-input px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Dashboard</span>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Ready banner */}
        {order.print_status === 'ready' && (
          <div className="bg-green-primary text-primary-foreground rounded-2xl p-6 text-center animate-bounce-in">
            <p className="text-2xl mb-1">🎉 Your print is ready!</p>
            <p className="text-sm text-green-100">Walk to the shop and show your Print ID</p>
          </div>
        )}

        {/* Progress steps */}
        <div className="bg-card rounded-2xl border border-input p-6">
          <div className="flex items-center justify-between relative">
            {/* Connector line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-input z-0" />
            <div className="absolute top-5 left-5 h-0.5 bg-green-primary z-0 transition-all" style={{ width: `${(activeStep / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 40px)' }} />

            {steps.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = i <= activeStep;
              const isCurrent = i === activeStep;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isCompleted ? 'bg-green-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border-2 border-input'}
                    ${isCurrent ? 'ring-4 ring-green-primary/30 scale-110' : ''}`}>
                    {isCompleted && i < activeStep ? <CheckCircle size={18} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-green-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order details */}
        <div className="bg-card rounded-2xl border border-input p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono font-bold text-foreground">{order.order_id}</span>
            <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-semibold text-blue-primary bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
              {order.files.length} FILE{order.files.length !== 1 ? 'S' : ''}
            </span>
            <span className="font-semibold text-emerald-primary bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              {order.total_pages} PAGES
            </span>
            {order.files.some(f => (f.slidesPerPage || 0) > 1) && (
              <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 uppercase text-[10px] flex items-center">MULTI-SLIDE</span>
            )}
            <span className="ml-auto font-bold text-xl text-foreground">₹{order.total_amount}</span>
          </div>
          </div>
        </div>

        {/* QR */}
        {order.qr_code && (
          <div className="bg-card rounded-2xl border border-input p-4 text-center">
            <img src={order.qr_code} alt="QR Code" className="mx-auto w-32 h-32" />
            <p className="text-xs text-muted-foreground mt-2">Show at counter</p>
          </div>
        )}

        <button onClick={() => navigate('/student/dashboard')} className="w-full py-3 rounded-xl border-2 border-input bg-card text-foreground font-semibold hover:bg-secondary transition">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
