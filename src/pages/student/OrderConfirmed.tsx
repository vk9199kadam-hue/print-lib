import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Check, Download, Loader2 } from 'lucide-react';
import { Order } from '../../types';
import { DB } from '../../utils/db';
import { downloadFile } from '../../utils/fileStorage';

export default function OrderConfirmed() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = (location.state as Record<string, unknown>)?.order as Order | undefined;
  const [copiedId, setCopiedId] = useState('');
  const [libraryInfo, setLibraryInfo] = useState<{ contact_number: string } | null>(null);

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentPrn, setStudentPrn] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  
  // File states
  const [deletedFiles, setDeletedFiles] = useState<Record<string, boolean>>({});
  const [allDeleted, setAllDeleted] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const data = await DB.getLibrarySettings();
        if (data) setLibraryInfo(data);
      } catch (e) { console.error(e); }
    };
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (!order) {
      navigate('/student/dashboard', { replace: true });
    }
  }, [order, navigate]);

  if (!order) { 
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Redirecting to Dashboard...</p>
        </div>
      </div>
    ); 
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Name is required.');
      return;
    }
    if (studentPrn.trim() && !/^[a-zA-Z0-9]{1,10}$/.test(studentPrn.trim())) {
      setError('PRN must be up to 10 alphanumeric characters.');
      return;
    }
    if (!amountPaid.trim() || isNaN(Number(amountPaid)) || Number(amountPaid) < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      
      // Update order details in Convex
      await DB.updateOrderDetails(
        order.order_id,
        studentName.trim(),
        studentPrn.trim() || '—',
        Number(amountPaid)
      );

      // Save payment record log
      await DB.savePaymentRecord({
        print_id: studentPrn.trim() || order.order_id || 'PRT-' + Date.now().toString().slice(-6),
        name: studentName.trim(),
        prn: studentPrn.trim() || undefined,
        amount_paid: Number(amountPaid),
        payment_type: 'online',
        month: currentMonth,
      });
      setIsSaved(true);
    } catch (e) {
      console.error(e);
      setError('Failed to save payment record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllFiles = async (silent = false) => {
    if (!order.files) return;
    if (!silent && !window.confirm("Are you sure you want to permanently delete all uploaded files from storage?")) return;

    try {
      for (const file of order.files) {
        if (file.file_storage_key && file.file_storage_key !== 'deleted') {
          await DB.deleteFile(file.file_storage_key);
          setDeletedFiles(prev => ({ ...prev, [file.temp_id]: true }));
        }
      }
      setAllDeleted(true);
      if (!silent) {
        alert("All files permanently deleted from storage.");
      }
    } catch (e) {
      console.error("Manual file deletion failed:", e);
      if (!silent) {
        alert("Failed to delete files. They may have already been deleted.");
      }
    }
  };

  const handleDownloadAndDelete = async (file: typeof order.files[0]) => {
    if (deletedFiles[file.temp_id] || allDeleted) return;
    setDownloadingFileId(file.temp_id);
    try {
      const fileUrl = await DB.getFile(file.file_storage_key);
      if (!fileUrl) {
        throw new Error("Could not retrieve file URL.");
      }
      await downloadFile(fileUrl, file.file_name);
      await DB.deleteFile(file.file_storage_key);
      setDeletedFiles(prev => ({ ...prev, [file.temp_id]: true }));
    } catch (e) {
      console.error("Download & delete failed:", e);
      alert("Failed to download or delete file. It might have already been deleted.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="min-h-screen bg-secondary relative overflow-hidden pb-12">
      {/* Confetti */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#1B4FFF', '#0D6B3E', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
            animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s forwards`,
            top: '-10px',
          }}
        />
      ))}

      <header className="bg-card border-b border-input px-4 py-3 text-center sticky top-0 z-20">
        <span className="text-sm text-muted-foreground">Print Queued Successfully</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6 relative z-10">
        {/* Checkmark */}
        <div className="text-center pt-4">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto mb-4">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.2" />
            <circle cx="40" cy="40" r="36" fill="none" stroke="#10B981" strokeWidth="3"
              strokeDasharray="226" className="animate-draw" style={{ strokeDashoffset: 226 }} />
            <path d="M25 42 L35 52 L55 30" fill="none" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="50" className="animate-draw" style={{ animationDelay: '0.3s', strokeDashoffset: 50 }} />
          </svg>
          <h1 className="font-syne font-bold text-2xl text-foreground animate-fade-in-up">Document Sent! 🎉</h1>
        </div>

        {/* ID cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl p-4 text-primary-foreground" style={{ background: 'linear-gradient(135deg, #0A1628, #1B4FFF)' }}>
            <p className="text-xs uppercase tracking-widest text-blue-200 mb-1">Order ID</p>
            <p className="font-mono font-bold text-sm">{order.order_id}</p>
            <button onClick={() => copyText(order.order_id, 'order')} className="mt-2 text-xs flex items-center gap-1 text-blue-200 hover:text-primary-foreground">
              {copiedId === 'order' ? <Check size={12} /> : <Copy size={12} />} {copiedId === 'order' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 p-3 rounded-xl text-center leading-relaxed">
            Based on this Order ID, download your document and fill the given information (compulsory)
          </p>
        </div>

        {/* Payment Record Form */}
        <div className="bg-white rounded-3xl border border-input p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-primary animate-pulse"></span>
            <h3 className="font-syne font-black text-sm text-foreground uppercase tracking-tight">Step 3: Confirm Payment Record</h3>
          </div>
          
          {isSaved ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-md">
                <Check size={20} />
              </div>
              <h4 className="font-bold text-green-900">Payment Record Confirmed!</h4>
              <p className="text-xs text-green-800">Your printing session record has been submitted, and the uploaded files have been queued for deletion.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRecord} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirm your details below to link this print job to the library payment logs.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jayesh Patil"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-blue-primary outline-none text-sm font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">PRN Number (Up to 10 characters, Optional)</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 2026PRN101 (Optional)"
                  value={studentPrn}
                  onChange={e => setStudentPrn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-blue-primary outline-none text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Amount Paid (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-blue-primary outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 rounded-xl bg-blue-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment Record'}
              </button>
            </form>
          )}
        </div>

        {/* Uploaded Files with Download & Delete Layer */}
        <div className="bg-white rounded-3xl border border-input p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-syne font-black text-sm text-foreground uppercase tracking-tight">Your Files</h3>
            {order.files && order.files.length > 0 && !allDeleted && (
              <button
                onClick={() => handleDeleteAllFiles(false)}
                className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center gap-1 transition"
              >
                Delete All Files
              </button>
            )}
          </div>

          <div className="space-y-3">
            {order.files?.map((file, i) => {
              const isFileDeleted = deletedFiles[file.temp_id] || allDeleted;
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 border border-input/60 rounded-2xl transition">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-foreground truncate">{file.file_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                      {isFileDeleted ? 'Deleted from Server 🗑️' : `${file.page_count} Pages · ${file.print_type === 'color' ? 'Color' : 'B&W'}`}
                    </p>
                  </div>
                  {!isFileDeleted ? (
                    <button
                      onClick={() => handleDownloadAndDelete(file)}
                      disabled={downloadingFileId === file.temp_id}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {downloadingFileId === file.temp_id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      Download & Delete
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg shrink-0">Deleted</span>
                  )}
                </div>
              );
            })}
            
            {allDeleted && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-xs text-amber-800 font-medium">
                🔒 All uploaded documents have been permanently removed from the cloud database.
              </div>
            )}
          </div>
        </div>



        <div className="bg-blue-50 rounded-[32px] p-8 text-center border-2 border-blue-600 shadow-lg shadow-blue-500/10 animate-draw">
          <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-2">Library Print Queue</p>
          <p className="text-2xl font-black text-slate-900 leading-tight">Your document is sent on the library platform! 🖨️</p>
          <p className="text-xs font-bold text-slate-500 mt-4 leading-relaxed">
            Please visit the Librarian's desk with your **Print ID** or **PRN** to collect your prints.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 rounded-3xl bg-black text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition shadow-xl"
          >
            ← Back to Home
          </button>
          <button 
            onClick={() => navigate('/student/upload')} 
            className="w-full py-4 rounded-3xl border-2 border-slate-900 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition"
          >
            New Print Job
          </button>
        </div>
      </div>
    </div>
  );
}
