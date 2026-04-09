/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen flex flex-col">
      {/* Hero header */}
      <div className="text-center py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-blue-primary animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        <h1 className="font-syne font-extrabold text-4xl md:text-6xl text-blue-dark tracking-tight relative z-10">
          Print<span className="text-blue-primary">Ease</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground font-dm relative z-10">
          Skip the queue. Print smarter.
        </p>
      </div>

      {/* Split panels */}
      <div className="flex-1 flex flex-col md:flex-row relative">

        {/* Floating PWA Install Button */}
        {isInstallable && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
            <button
              onClick={handleInstallClick}
              className="group relative flex flex-col items-center justify-center p-3 bg-white/20 backdrop-blur-xl border-2 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-3xl hover:scale-110 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center px-4 py-2">
                <div className="bg-white/30 rounded-full p-2 mb-2 shadow-inner">
                  <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="font-syne font-bold text-white text-xl tracking-wide drop-shadow-md">Get App</span>
                <span className="text-white/90 text-xs font-bold font-dm mt-1 uppercase tracking-wider backdrop-blur-md bg-black/20 px-2 py-0.5 rounded-full">Student Only</span>
              </div>
            </button>
          </div>
        )}

        {/* Student panel */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-10 md:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1B4FFF 100%)' }}
        >
          <div className="mb-8">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto animate-float">
              <rect x="15" y="20" width="50" height="40" rx="4" stroke="white" strokeWidth="2.5" fill="none" />
              <rect x="25" y="30" width="30" height="4" rx="1" fill="white" opacity="0.6" />
              <rect x="25" y="38" width="20" height="4" rx="1" fill="white" opacity="0.4" />
              <circle cx="40" cy="15" r="8" stroke="white" strokeWidth="2" fill="none" />
              <path d="M32 15 L48 15" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="font-syne font-bold text-3xl text-primary-foreground mb-3">I'm a Student</h2>
          <p className="text-blue-200 mb-8 font-dm">Upload files from your room</p>
          <button
            onClick={() => navigate('/student/login')}
            className="px-8 py-3.5 rounded-xl font-semibold text-blue-primary bg-primary-foreground hover:scale-105 hover:shadow-xl transition-all duration-200 font-dm"
          >
            Get Started →
          </button>
        </div>

        {/* librarian panel */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-10 md:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, #061A0F 0%, #0D6B3E 100%)' }}
        >
          <div className="mb-8 w-32 h-32 mx-auto bg-white rounded-2xl flex items-center justify-center overflow-hidden border-4 border-green-500/30 animate-float shadow-2xl transition-transform duration-500 hover:scale-110" style={{ animationDelay: '1.5s' }}>
            <img src="/logo.png" alt="Sachin Computers Logo" className="w-full h-full object-contain p-2" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-green-700 font-bold text-sm text-center">SACHIN<br/>COMPUTERS</span>'; }} />
          </div>
          <h2 className="font-syne font-bold text-3xl text-primary-foreground mb-3">SACHIN COMPUTERS</h2>
          <p className="text-green-200 mb-8 font-dm">Manage your print queue</p>
          <button
            onClick={() => navigate('/librarian/login')}
            className="px-8 py-3.5 rounded-xl font-semibold text-green-primary bg-primary-foreground hover:scale-105 hover:shadow-xl transition-all duration-200 font-dm"
          >
            Open Dashboard →
          </button>
      </div>
      </div>

      {/* KYC Help / Policy Footer */}
      <footer className="bg-background text-muted-foreground py-8 px-4 border-t border-input font-inter">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="flex flex-col items-center md:items-start text-xs">
            <span className="font-bold text-foreground mb-1">Made by Viraj Kadam</span>
            <span>vk9199kadam@gmail.com</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-medium">
            <button onClick={() => navigate('/about')} className="hover:text-blue-primary transition-colors">About Us</button>
            <button onClick={() => navigate('/contact')} className="hover:text-blue-primary transition-colors">Contact</button>
            <button onClick={() => navigate('/terms')} className="hover:text-blue-primary transition-colors">Terms & Conditions</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-blue-primary transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/refund')} className="hover:text-blue-primary transition-colors">Refund</button>
            <button onClick={() => navigate('/shipping')} className="hover:text-blue-primary transition-colors">Shipping</button>
          </div>
        </div>
        <div className="text-center text-xs mt-6 opacity-60">
          © {new Date().getFullYear()} Library Print. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
