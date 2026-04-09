import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Hash, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { session, login } = useAuth();
  const [name, setName] = useState('');
  const [prn, setPrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (session?.role === 'student') navigate('/student/dashboard', { replace: true });
  }, [session, navigate]);

  const handleLogin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!/^\d{7}$/.test(prn)) {
      setError('PRN must be exactly 7 digits');
      return;
    }
    setError('');
    setLoading(true);
    
    // Simulate short loading
    await new Promise(r => setTimeout(r, 600));
    
    // Create a mock student user object for the session
    const studentUser = {
      id: 'student_' + prn,
      name: name,
      email: prn + '@rit.edu', // Dummy email for compatibility
      student_print_id: prn,
      is_verified: true
    };
    
    login(studentUser as any, 'student');
    navigate('/student/dashboard', { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border-l-4 border-l-blue-primary p-8 animate-fade-in-up">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft size={16} /> Back to home
        </button>
        
        <h1 className="font-syne font-bold text-2xl text-foreground mb-1">
          Student Login
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your details to access the library printing portal
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ex: Jayesh Patil"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">PRN Number (7 Digits)</label>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                maxLength={7}
                placeholder="1234567"
                value={prn}
                onChange={e => { 
                  const val = e.target.value.replace(/\D/g, '');
                  setPrn(val); 
                  setError(''); 
                }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none transition text-lg tracking-widest font-bold"
              />
            </div>
          </div>
          
          {error && <p className="text-destructive text-xs mt-1 text-center font-medium">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50 shadow-md"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Enter Library Print →
          </button>
        </div>
      </div>
    </div>
  );
}

