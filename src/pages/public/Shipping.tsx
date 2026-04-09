import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Shipping() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary p-8 font-inter text-foreground">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={18} /> Back to Home
      </button>
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-input">
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">Shipping & Delivery Policy</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>Library Print functions primarily as an online queue-management and printing service. As such, we have strict parameters for physical delivery.</p>
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">1. Local Campus Pickup (Default)</h2>
          <p>Currently, Library Print primarily operates on a <strong>Local In-Store Pickup Protocol</strong>. When your order reaches the "Ready" status on your dashboard, you are strictly required to visit the physical store/campus location to securely pick up your documents. We do not dispatch delivery riders for campus-based print routines.</p>
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">2. Processing Time</h2>
          <p>For standard black & white and basic colored prints, orders are conventionally processed and printed within 1 to 4 hours of payment verification, restricted strictly by the length of the real-time queue. Premium capstone prints may require up to 24-48 hours depending on binding complexities.</p>
        </div>
      </div>
    </div>
  );
}
