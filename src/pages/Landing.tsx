/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Printer, Download, UserCheck } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hero header */}
      <div className="text-center py-12 md:py-20 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-blue-600 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mb-4 relative z-10">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
              <Library size={28} />
           </div>
           <h1 className="font-syne font-black text-4xl md:text-5xl text-slate-900 tracking-tighter">
             PrintEase <span className="text-blue-600">Library</span>
           </h1>
        </div>
        <p className="mt-2 text-lg text-slate-500 font-bold uppercase tracking-widest text-xs relative z-10">
          RIT College Internal Printing Portal
        </p>
      </div>

      {/* Split panels */}
      <div className="flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-8 max-w-7xl mx-auto w-full">

        {/* Floating PWA Install Button */}
        {isInstallable && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <button
               onClick={handleInstallClick}
               className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl font-black text-xs uppercase tracking-widest border border-white/10"
            >
               <Download size={16} /> Get Mobile App
            </button>
          </div>
        )}

        {/* Student panel */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-12 rounded-[40px] text-center shadow-2xl relative overflow-hidden group transition-transform hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}
        >
          <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-700 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          <div className="mb-8 w-24 h-24 bg-white/10 rounded-[32px] backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-inner">
             <Printer size={48} />
          </div>
          <h2 className="font-syne font-black text-4xl text-white mb-3 uppercase tracking-tighter">Student Access</h2>
          <p className="text-blue-100 mb-10 font-bold text-sm opacity-80 uppercase tracking-widest">Login with Name & PRN</p>
          <button
            onClick={() => navigate('/student/login')}
            className="w-full md:w-auto px-12 py-5 rounded-3xl font-black text-blue-900 bg-white hover:bg-blue-50 transition-all duration-300 shadow-xl shadow-blue-900/20 uppercase text-xs tracking-widest relative z-10"
          >
            Start Printing →
          </button>
        </div>

        {/* Librarian panel */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-12 rounded-[40px] text-center shadow-2xl border-2 border-slate-900 bg-slate-950 relative overflow-hidden group transition-transform hover:scale-[1.01]"
        >
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-[image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

          <div className="mb-8 w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-blue-500 border border-white/5 shadow-2xl">
             <UserCheck size={48} />
          </div>
          <h2 className="font-syne font-black text-4xl text-white mb-3 uppercase tracking-tighter">Library Staff</h2>
          <p className="text-slate-500 mb-10 font-bold text-sm uppercase tracking-widest">Admin Dashboard Management</p>
          <button
            onClick={() => navigate('/librarian/login')}
            className="w-full md:w-auto px-12 py-5 rounded-3xl font-black text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-xl shadow-blue-600/30 uppercase text-xs tracking-widest relative z-10"
          >
            Open Dashboard →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white text-slate-400 py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 font-black uppercase text-[10px] tracking-[0.2em]">
            <button onClick={() => navigate('/about')} className="hover:text-blue-600 transition-colors">About</button>
            <button onClick={() => navigate('/contact')} className="hover:text-blue-600 transition-colors">Contact</button>
            <button onClick={() => navigate('/terms')} className="hover:text-blue-600 transition-colors">Terms</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-blue-600 transition-colors">Privacy</button>
            <button onClick={() => navigate('/refund')} className="hover:text-blue-600 transition-colors">Refund</button>
          </div>
          
          <div className="text-center">
             <p className="font-black text-slate-900 text-xs uppercase tracking-widest mb-1">RIT COLLEGE LIBRARY SERVICES</p>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Self-Service Printing System • © {new Date().getFullYear()}</p>
          </div>
          
          <div className="pt-8 border-t border-gray-50 w-full flex flex-col items-center gap-2">
             <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Developed by Viraj Kadam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
