import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DB } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';
import { playSuccessSound } from '../../utils/sound';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = (location.state as Record<string, unknown>)?.email as string | undefined;
  const password = (location.state as Record<string, unknown>)?.password as string | undefined;

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!email || !password) { navigate('/student/login'); return null; }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!gender) { setError('Please select your gender'); return; }
    setLoading(true);
    const user = await DB.createUser({ name: name.trim(), email, password, gender });
    if (!user) {
      setError('Database connection error. Are you on Vercel?');
      setLoading(false);
      return;
    }
    
    login(user, 'student');
    playSuccessSound();
    await new Promise(r => setTimeout(r, 500));
    navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8 animate-fade-in-up">
        <h1 className="font-syne font-bold text-2xl text-foreground mb-1">Complete Your Profile</h1>
        <p className="text-muted-foreground text-sm mb-6">Tell us about yourself to complete registration</p>

        <div className="mb-4">
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
             <p className="text-sm text-blue-800 text-center font-medium">Registering as: {email}</p>
          </div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none transition"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
          <div className="flex gap-2">
            {(['Male', 'Female', 'Other'] as const).map(g => (
              <button
                key={g}
                onClick={() => { setGender(g); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2
                  ${gender === g ? 'bg-blue-primary text-primary-foreground border-blue-primary' : 'bg-background text-foreground border-input hover:border-blue-primary/50'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Creating...' : 'Create My Account →'}
        </button>
      </div>
    </div>
  );
}
