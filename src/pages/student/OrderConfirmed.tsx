import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Check, Download } from 'lucide-react';
import { Order } from '../../types';
import { DB } from '../../utils/db';
import { downloadFile } from '../../utils/fileStorage';

export default function OrderConfirmed() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = (location.state as Record<string, unknown>)?.order as Order | undefined;
  const [copiedId, setCopiedId] = useState('');
  const [libraryInfo, setLibraryInfo] = useState<{ contact_number: string } | null>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const data = await DB.getLibrarySettings();
        if (data) setLibraryInfo(data);
      } catch (e) { console.error(e); }
    };
    fetchLibrary();
  }, []);

  if (!order) { navigate('/student/dashboard'); return null; }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className="min-h-screen bg-secondary relative overflow-hidden">
      {/* Confetti */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#1B4FFF', '#0D6B3E', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
            animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s forwards`,
            top: '-10px',
          }}
        />
      ))}

      <header className="bg-card border-b border-input px-4 py-3 text-center sticky top-0 z-20">
        <span className="text-sm text-muted-foreground">Step 3 of 3</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6 relative z-10">
        {/* Checkmark */}
        <div className="text-center pt-4">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto mb-4">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.2" />
            <circle cx="40" cy="40" r="36" fill="none" stroke="#10B981" strokeWidth="3"
              strokeDasharray="226" className="animate-draw" style={{ strokeDashoffset: 226 }} />
            <path d="M25 42 L35 52 L55 30" fill="none" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="50" className="animate-draw" style={{ animationDelay: '0.3s', strokeDashoffset: 50 }} />
          </svg>
          <h1 className="font-syne font-bold text-2xl text-foreground animate-fade-in-up">Document Sent! 🎉</h1>
        </div>

        {/* ID cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 text-primary-foreground" style={{ background: 'linear-gradient(135deg, #0A1628, #1B4FFF)' }}>
            <p className="text-xs uppercase tracking-widest text-blue-200 mb-1">Order ID</p>
            <p className="font-mono font-bold text-sm">{order.order_id}</p>
            <button onClick={() => copyText(order.order_id, 'order')} className="mt-2 text-xs flex items-center gap-1 text-blue-200 hover:text-primary-foreground">
              {copiedId === 'order' ? <Check size={12} /> : <Copy size={12} />} {copiedId === 'order' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="rounded-xl p-4 text-primary-foreground" style={{ background: 'linear-gradient(135deg, #061A0F, #0D6B3E)' }}>
            <p className="text-xs uppercase tracking-widest text-green-200 mb-1">Print ID</p>
            <p className="font-mono font-bold text-sm">{order.student_print_id}</p>
            <button onClick={() => copyText(order.student_print_id, 'print')} className="mt-2 text-xs flex items-center gap-1 text-green-200 hover:text-primary-foreground">
              {copiedId === 'print' ? <Check size={12} /> : <Copy size={12} />} {copiedId === 'print' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code */}
        {order.qr_code && (
          <div className="bg-card rounded-2xl border border-input p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">📱 Show this QR code at the library counter</p>
            <img src={order.qr_code} alt="QR Code" className="mx-auto w-48 h-48" />
            <button
              onClick={() => downloadFile(order.qr_code, `QR-${order.order_id}.png`)}
              className="mt-3 text-sm text-blue-primary font-semibold flex items-center gap-1 mx-auto hover:underline"
            >
              <Download size={14} /> Download QR Code
            </button>
          </div>
        )}

        <div className="bg-blue-50 rounded-[32px] p-8 text-center border-2 border-blue-600 shadow-lg shadow-blue-500/10 animate-fade-in-up">
          <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-2">Library Print Queue</p>
          <p className="text-2xl font-black text-slate-900 leading-tight">Your document is sent on the library platform! 🖨️</p>
          <p className="text-xs font-bold text-slate-500 mt-4 leading-relaxed">
            Please visit the Librarian's desk with your **Order ID** or **PRN** to collect your prints.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="w-full py-4 rounded-3xl bg-black text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition shadow-xl"
          >
            ← Back to Library Portal
          </button>
          <button 
            onClick={() => navigate('/student/upload')} 
            className="w-full py-4 rounded-3xl border-2 border-slate-900 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition"
          >
            New Print Job
          </button>
        </div>
      </div>
    </div>
  );
}
