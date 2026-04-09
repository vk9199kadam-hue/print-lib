import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, Printer } from 'lucide-react';
import { DB } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';

export default function ShopLogin() {
  const navigate = useNavigate();
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  React.useEffect(() => {
    if (session?.role === 'librarian') navigate('/librarian/dashboard', { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 500));
    try {
      const shop = await DB.verifylibrarian(email, password);
      if (shop) {
        login(shop, 'librarian');
        navigate('/librarian/dashboard', { replace: true });
      } else {
        setError('Incorrect email or password');
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
    } catch (err) {
      setError('Database connection error. Are you on Vercel?');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#061A0F' }}>
      <div className={`w-full max-w-md bg-card rounded-2xl shadow-xl p-8 animate-fade-in-up ${shaking ? 'animate-shake' : ''}`}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft size={16} /> Back to home
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-md border border-green-100 overflow-hidden p-1">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-syne font-bold text-2xl text-foreground">SACHIN COMPUTERS</h1>
          <p className="text-muted-foreground text-sm font-medium">Shop Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="shop@Library Print.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="new-password"
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#0D6B3E' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Open Dashboard →'}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Access specialized management tools for Sachin Computers.
        </p>
      </div>
    </div>
  );
}
