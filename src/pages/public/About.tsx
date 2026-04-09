import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary p-8 font-inter text-foreground">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={18} /> Back to Home
      </button>
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-input">
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">About Us</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>Welcome to Library Print.</p>
          <p>We are a dedicated online platform designed to simplify document printing for college students and staff. Our mission is to bridge the gap between students needing fast, reliable printing and librarians offering print services, reducing waiting lines and ensuring seamless order management.</p>
          <p>Through Library Print, you can seamlessly upload documents, select precisely how you want them printed, and pay online. Your print orders are instantly sent directly to our partnered print shops.</p>
          <p>Our goal is to make campus printing incredibly efficient, fully automated, and incredibly user-friendly!</p>
        </div>
      </div>
    </div>
  );
}
