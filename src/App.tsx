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
import SubmissionsInbox from './pages/librarian/SubmissionsInbox';
import CapstoneOrders from './pages/librarian/CapstoneOrders';
import Analytics from './pages/librarian/Analytics';
import LibrarySettings from './pages/librarian/Settings';

import OrderHistory from './pages/student/OrderHistory';
import OrderTracking from './pages/student/OrderTracking';
import Profile from './pages/student/Profile';
import CapstoneUpload from './pages/student/CapstoneUpload';

import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import Refund from './pages/public/Refund';

function ProtectedStudentRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-primary" size={32} /></div>;
  if (!session || session.role !== 'student') return <Navigate to="/student/login" replace />;
  return <>{children}</>;
}

function ProtectedLibrarianRoute({ children }: { children: React.ReactNode }) {
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
      
      {/* Student Routes */}
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/dashboard" element={<ProtectedStudentRoute><StudentDashboard /></ProtectedStudentRoute>} />
      <Route path="/student/upload" element={<ProtectedStudentRoute><FileUpload /></ProtectedStudentRoute>} />
      <Route path="/student/payment" element={<ProtectedStudentRoute><Payment /></ProtectedStudentRoute>} />
      <Route path="/student/confirmed" element={<ProtectedStudentRoute><OrderConfirmed /></ProtectedStudentRoute>} />
      <Route path="/student/history" element={<ProtectedStudentRoute><OrderHistory /></ProtectedStudentRoute>} />
      <Route path="/student/track/:order_id" element={<ProtectedStudentRoute><OrderTracking /></ProtectedStudentRoute>} />
      <Route path="/student/profile" element={<ProtectedStudentRoute><Profile /></ProtectedStudentRoute>} />
      <Route path="/student/capstone" element={<ProtectedStudentRoute><CapstoneUpload /></ProtectedStudentRoute>} />
      
      {/* Librarian Routes */}
      <Route path="/librarian/login" element={<LibrarianLogin />} />
      <Route path="/librarian/dashboard" element={<ProtectedLibrarianRoute><LibrarianDashboard /></ProtectedLibrarianRoute>} />
      <Route path="/librarian/order/:order_id" element={<ProtectedLibrarianRoute><OrderDetail /></ProtectedLibrarianRoute>} />
      <Route path="/librarian/submissions" element={<ProtectedLibrarianRoute><SubmissionsInbox /></ProtectedLibrarianRoute>} />
      <Route path="/librarian/capstones" element={<ProtectedLibrarianRoute><CapstoneOrders /></ProtectedLibrarianRoute>} />
      <Route path="/librarian/analytics" element={<ProtectedLibrarianRoute><Analytics /></ProtectedLibrarianRoute>} />
      <Route path="/librarian/settings" element={<ProtectedLibrarianRoute><LibrarySettings /></ProtectedLibrarianRoute>} />
      
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

