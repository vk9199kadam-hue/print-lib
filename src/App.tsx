import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initializeApp } from './utils/init';
import { Loader2 } from 'lucide-react';

import Landing from './pages/Landing';
import StudentLogin from './pages/student/Login';
import StudentDashboard from './pages/student/Dashboard';
import FileUpload from './pages/student/FileUpload';
import Payment from './pages/student/Payment';
import OrderConfirmed from './pages/student/OrderConfirmed';
import LibrarianLogin from './pages/librarian/Login';
import LibrarianDashboard from './pages/librarian/Dashboard';
import OrderDetail from './pages/librarian/OrderDetail';

import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import Refund from './pages/public/Refund';
import Shipping from './pages/public/Shipping';

function ProtectedStudentRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-primary" size={32} /></div>;
  if (!session || session.role !== 'student') return <Navigate to="/student/login" replace />;
  return <>{children}</>;
}

function ProtectedShopRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!session || session.role !== 'librarian') return <Navigate to="/librarian/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/shipping" element={<Shipping />} />
      
      {/* Student Routes */}
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/dashboard" element={<ProtectedStudentRoute><StudentDashboard /></ProtectedStudentRoute>} />
      <Route path="/student/upload" element={<ProtectedStudentRoute><FileUpload /></ProtectedStudentRoute>} />
      <Route path="/student/payment" element={<ProtectedStudentRoute><Payment /></ProtectedStudentRoute>} />
      <Route path="/student/confirmed" element={<ProtectedStudentRoute><OrderConfirmed /></ProtectedStudentRoute>} />
      
      {/* Librarian Routes */}
      <Route path="/librarian/login" element={<LibrarianLogin />} />
      <Route path="/librarian/dashboard" element={<ProtectedShopRoute><LibrarianDashboard /></ProtectedShopRoute>} />
      <Route path="/librarian/order/:order_id" element={<ProtectedShopRoute><OrderDetail /></ProtectedShopRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => { initializeApp(); }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

