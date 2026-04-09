import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2, Library } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LibrarianLogin() {
  const navigate = useNavigate();
  const { session, login } = useAuth();
  const [username, setUsername] = useState('');
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
    if (!username || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    
    // Simulate short loading
    await new Promise(r => setTimeout(r, 600));

    // Fixed credentials check
    if (username === 'ritcollage123' && password === '12345') {
      const librarianUser = {
        id: 'lib_001',
        name: 'Library Admin',
        email: 'admin@rit.edu',
        library_name: 'RIT College Library'
      };
      login(librarianUser as any, 'librarian');
      navigate('/librarian/dashboard', { replace: true });
    } else {
      setError('Invalid username or password');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className={`w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 animate-fade-in-up border border-white/5 ${shaking ? 'animate-shake' : ''}`}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Library Home
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <Library size={32} className="text-white" />
          </div>
          <h1 className="font-syne font-black text-2xl text-foreground tracking-tight">RIT COLLEGE</h1>
          <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mt-1">Librarian Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                autoComplete="off"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="ritcollage123"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-secondary bg-secondary text-foreground focus:border-blue-600 outline-none transition font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="•••••"
                className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-secondary bg-secondary text-foreground focus:border-blue-600 outline-none transition font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-bold animate-pulse text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN →'}
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center mt-8 font-bold uppercase tracking-widest opacity-40">
          Restricted to Authorized Library Personnel Only
        </p>
      </div>
    </div>
  );
}

