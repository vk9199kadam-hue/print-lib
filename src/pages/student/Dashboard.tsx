import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, Copy, Check, AlertCircle, Hash, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shopSettings, setShopSettings] = useState<{is_open: boolean; closing_message: string; standard_hours: string}>({
    is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM'
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/rpc', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ action: 'getShopSettings' }) 
        });
        const { data: settingsData } = await res.json();
        if (settingsData) setShopSettings(settingsData);
      } catch (e) {
        console.error("Could not fetch shop settings", e);
      }
    };
    loadSettings();
  }, []);

  const handleCopy = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.student_print_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-syne font-bold text-xl text-foreground">Library <span className="text-blue-primary">Print</span></h1>
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
          <h2 className="font-syne font-bold text-2xl text-foreground">Welcome, {currentUser?.name}! 👋</h2>
          <p className="text-sm text-muted-foreground mt-1 text-blue-primary font-medium tracking-wide text-uppercase">RIT COLLEGE LIBRARY PORTAL</p>
        </div>

        {/* PRN ID Card */}
        <div className="rounded-2xl p-6 text-primary-foreground animate-fade-in-up bg-black shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Hash size={80} />
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-bold">Your Registered PRN</p>
          <div className="flex items-center justify-between relative z-10">
            <span className="font-mono text-3xl font-black tracking-tighter text-white">{currentUser?.student_print_id}</span>
            <button onClick={handleCopy} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm border border-white/10">
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] bg-blue-600/20 w-fit px-2 py-1 rounded-md border border-blue-500/30 text-blue-300">
             <AlertCircle size={10} /> Valid for Library Identity
          </div>
        </div>

        {/* Shop Status Visual */}
        <div className="animate-fade-in-up">
          {!shopSettings.is_open ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-4 rounded-2xl text-center shadow-sm">
              <p className="font-bold flex items-center justify-center gap-2 text-sm">
                <AlertCircle size={16} /> Library Printer is Currently Offline
              </p>
              <p className="text-xs mt-1 opacity-90">{shopSettings.closing_message ? `Message: "${shopSettings.closing_message}"` : `Resumes at: ${shopSettings.standard_hours}`}</p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 text-green-700 px-4 py-3 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm border-dashed">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active: Accepting Print Requests
            </div>
          )}
        </div>

        {/* Main Action */}
        <div className="animate-fade-in-up">
          <button 
            disabled={!shopSettings.is_open}
            onClick={() => navigate('/student/upload')} 
            className="w-full py-8 rounded-2xl bg-blue-primary text-primary-foreground font-black text-xl hover:opacity-95 transition flex flex-col items-center justify-center gap-4 shadow-2xl shadow-blue-primary/30 disabled:opacity-50 group border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
          >
            <div className="p-4 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
               <Upload size={32} />
            </div>
            <div className="text-center">
              <span>UPLOAD & PRINT NOW</span>
              <p className="text-xs font-normal opacity-70 mt-1 uppercase tracking-widest font-sans">PDF · PPT · WORD</p>
            </div>
          </button>
        </div>

        {/* Info Text */}
        <div className="bg-white rounded-2xl p-5 border border-input shadow-sm space-y-3 animate-fade-in-up">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                 <Printer size={18} />
              </div>
              <div>
                 <p className="text-sm font-bold text-foreground">Self-Service Printing</p>
                 <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Upload your documents above and pay online. Your prints will be ready at the librarian's desk.</p>
              </div>
           </div>
        </div>

        <div className="text-center pb-8 opacity-50">
           <p className="text-[10px] font-bold uppercase tracking-widest">Powered by RIT Library Services</p>
        </div>
      </div>
    </div>
  );
}
