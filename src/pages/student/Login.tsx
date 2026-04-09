import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { DB } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Login Password, 3: Signup Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (session?.role === 'student') navigate('/student/dashboard', { replace: true });
  }, [session, navigate]);

  const handleEmailNext = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    
    const user = await DB.getUserByEmail(email.toLowerCase());
    if (user) {
      setStep(2);
    } else {
      setStep(3);
    }
    setLoading(false);
  };

  const handleLoginSubmit = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    
    // Secure verification directly via backend
    const user = await DB.verifyStudent(email.toLowerCase(), password);
    if (user) {
      login(user, 'student');
      navigate('/student/dashboard', { replace: true });
    } else {
      setError('Incorrect password');
      setLoading(false);
    }
  };

  const handleSignupNext = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    navigate('/student/profile', { state: { email: email.toLowerCase(), password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border-l-4 border-l-blue-primary p-8 animate-fade-in-up">
        {step === 1 ? (
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft size={16} /> Back to home
          </button>
        ) : (
          <button onClick={() => { setStep(1); setPassword(''); setError(''); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        
        <h1 className="font-syne font-bold text-2xl text-foreground mb-1">
          {step === 1 ? 'Student Login' : step === 2 ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {step === 1 ? 'Enter your college email to continue' : step === 2 ? 'Enter your password to sign in' : 'Create a secure password to register'}
        </p>

        {step === 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="student@college.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleEmailNext()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none transition"
              />
            </div>
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}
          </div>
        )}

        {(step === 2 || step === 3) && (
          <div className="mb-4 animate-fade-in-up">
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800 text-center font-medium">{email}</p>
            </div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && (step === 2 ? handleLoginSubmit() : handleSignupNext())}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none transition"
              />
            </div>
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}
          </div>
        )}

        <button
          onClick={step === 1 ? handleEmailNext : step === 2 ? handleLoginSubmit : handleSignupNext}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {step === 1 ? 'Continue →' : step === 2 ? 'Sign In →' : 'Complete Profile →'}
        </button>
      </div>
    </div>
  );
}
