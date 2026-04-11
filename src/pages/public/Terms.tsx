import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary p-8 font-inter text-foreground">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={18} /> Back to Home
      </button>
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-input">
        <h1 className="text-3xl font-bold mb-6 text-blue-primary">Terms & Conditions</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>Welcome to PrintEase Library. By using our website and services, you agree to comply with the following Terms and Conditions of use.</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>The content of the pages of this website is for your general information and use only.</li>
            <li>Users are strictly prohibited from uploading illicit, copyrighted, or globally restricted documents for printing. PrintEase Library and the RIT Library desk refuse responsibility for the legality of user-uploaded copyright documents.</li>
            <li>All pricing is dynamic based on your selections and is quoted clearly before submission.</li>
            <li>We do not guarantee turnaround times instantly but aim to strictly honor the queue priority structure.</li>
            <li>Unauthorized use of this website may give rise to a claim for damages or be a criminal offense.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
