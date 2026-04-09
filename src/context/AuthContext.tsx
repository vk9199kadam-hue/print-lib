/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DB } from '../utils/db';
import { Session, User, librarian } from '../types';

interface AuthContextType {
  session: Session | null;
  isStudent: boolean;
  islibrarian: boolean;
  currentUser: User | null;
  currentShop: librarian | null;
  login: (user: User | librarian, role: Session['role']) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = DB.getSession();
    if (stored) setSession(stored);
    setLoading(false);
  }, []);

  const login = (user: User | librarian, role: Session['role']) => {
    DB.setSession(user, role);
    setSession({ user, role });
  };

  const logout = () => {
    DB.clearSession();
    setSession(null);
  };

  const isStudent = session?.role === 'student';
  const islibrarian = session?.role === 'librarian';
  const currentUser = isStudent ? (session?.user as User) : null;
  const currentShop = islibrarian ? (session?.user as librarian) : null;

  return (
    <AuthContext.Provider value={{ session, isStudent, islibrarian, currentUser, currentShop, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
