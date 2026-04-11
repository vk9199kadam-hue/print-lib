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
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">Refund & Cancellation Policy</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>At Library Print, we try to ensure your satisfaction with every print securely.</p>
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">Order Cancellations</h2>
          <p>As this is a rapid-deployment printing service, orders that have formally entered the <strong>"Printing"</strong>, <strong>"Ready"</strong>, or <strong>"Completed"</strong> status cannot be cancelled anymore as the paper and ink resources have already been consumed by the vendor.</p>
          <p>Orders sitting uniquely in the <strong>"Queued"</strong> phase may be cancelled by the system or vendor under certain circumstances, in which case a refund is triggered.</p>
          
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">Refund Processing</h2>
          <p>If there is an error on the prints (massive streaks, missing pages due to our system bug, or incorrect binding services despite being paid for) you can report it at the shop desk physically during pickup.</p>
          <p>If an automatic refund is initiated due to a Gateway or processing failure, it may securely take 5-7 business days to reflect in your original payment method via the library billing system.</p>
        </div>
      </div>
    </div>
  );
}
