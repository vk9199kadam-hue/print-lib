import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary p-8 font-inter text-foreground">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={18} /> Back to Home
      </button>
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-input">
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">Privacy Policy</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase/use the services from Library Print.</p>
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">1. Personal Information We Collect</h2>
          <p>We collect essential details to process your documents, including your Name, Roll Number, Email, and the structural digital files (PDF, PPT, Word) you upload.</p>
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">2. How Do We Use Your Personal Information?</h2>
          <p>We strictly use the Order Information to fulfill any printing services placed through our Site. The documents uploaded are temporarily stored in secure cloud storage solely for the purpose of printing by the vendor and are deleted periodically to protect intellectual property.</p>
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">3. Sharing Your Personal Information</h2>
          <p>Your uploaded documents are shared specifically with the chosen Print Shop to complete the order. We do not sell or freely distribute any user data.</p>
        </div>
      </div>
    </div>
  );
}
