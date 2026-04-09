import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary p-8 font-inter text-foreground">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={18} /> Back to Home
      </button>
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-input">
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">Contact Us</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>If you have any questions or require support regarding your print orders, please contact us immediately.</p>
          <div className="my-6 space-y-3 bg-secondary/50 p-6 rounded-xl border border-input">
            <p><strong className="text-foreground">Legal Entity Name:</strong> Viraj Kadam (Library Print)</p>
            <p><strong className="text-foreground">Official Email:</strong> vk9199kadam@gmail.com</p>
            <p><strong className="text-foreground">Contact Number:</strong> +91-9359075793</p>
            <p><strong className="text-foreground">Operational Address:</strong> College Campus, Ishwarpur, PIN - 415409, Maharashtra, India</p>
          </div>
          <p>Our dedicated support team is available from 09:00 AM to 06:00 PM (Monday to Saturday) to help you resolve any issues.</p>
        </div>
      </div>
    </div>
  );
}
