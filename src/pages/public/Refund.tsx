import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Refund() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary p-8 font-inter text-foreground">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={18} /> Back to Home
      </button>
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-input">
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">Corrective Measures Policy</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>At PrintEase Library, we try to ensure your satisfaction with every print securely.</p>
          <p>Since this is a student service portal, our primary goal is to provide accurate and high-quality prints for your academic success.</p>
          <p>If there is an error on the prints (massive streaks, missing pages due to our system bug, or incorrect binding services) you can report it at the library desk physically during pickup.</p>
          <p>We do not offer cash refunds, but we will re-print any defective documents caused by library equipment errors at no additional cost.</p>
        </div>
      </div>
    </div>
  );
}
