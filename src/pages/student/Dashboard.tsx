import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Copy, Check, AlertCircle, Hash, Printer, BookOpen, Clock, User, X, Minus, Plus, Loader2, CloudUpload, FileText, CheckCircle2, CreditCard } from 'lucide-react';
import { DB } from '../../utils/db';
import { FileItem, ExtraServices } from '../../types';
import { getFileType, isAllowedFile, getPageCount } from '../../utils/pageCounter';
import { uploadFileToCloud, formatFileSize, generateStorageKey, deleteFileFromCloud } from '../../utils/fileStorage';
import { calcTotal, calcFilePrice } from '../../utils/priceCalculator';
import FileTypeIcon from '../../components/FileTypeIcon';
import { generateQR } from '../../utils/qrCode';
import { playSuccessSound } from '../../utils/sound';

export default function StudentDashboard() {
  const navigate = useNavigate();

  // Upload and price calculator states
  const [uploadedFiles, setUploadedFiles] = useState<(FileItem & { size?: number })[]>([]);
  const [extras] = useState<ExtraServices>({ spiral_binding: false, stapling: false });
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pricing, setPricing] = useState(DB.getPricing());
  const [librarySettings, setLibrarySettings] = useState<{is_open: boolean; closing_message: string; standard_hours: string}>({
    is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM'
  });
  
  // Active Tab State (Online Print vs Xerox Record)
  const [activeTab, setActiveTab] = useState<'online' | 'xerox'>('online');

  // Xerox Form State
  const [xeroxName, setXeroxName] = useState('');
  const [xeroxPrn, setXeroxPrn] = useState('');
  const [xeroxAmount, setXeroxAmount] = useState('');
  const [isSubmittingXerox, setIsSubmittingXerox] = useState(false);
  const [xeroxSuccess, setXeroxSuccess] = useState<{ printId: string; name: string; amount: number; time: string } | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {

    const initPricing = async () => {
      const livePricing = await DB.fetchPricing();
      setPricing(livePricing);
    };
    initPricing();

    const fetchSettings = async () => {
      try {
        const data = await DB.getLibrarySettings();
        if (data) setLibrarySettings(data);
      } catch (e) {
        console.error("Could not fetch library settings", e);
      }
    };
    fetchSettings();
  }, []);

  const priceResult = useMemo(() => {
    if (uploadedFiles.length === 0) return null;
    return calcTotal(uploadedFiles, extras, pricing);
  }, [uploadedFiles, extras, pricing]);

  const canProceed = useMemo(() => {
    return uploadedFiles.length > 0 && uploadedFiles.every(f => f.page_count > 0);
  }, [uploadedFiles]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const processFile = async (file: File) => {
    if (!librarySettings.is_open) { showToast('Library Print is currently offline.'); return; }
    if (!isAllowedFile(file.name)) { showToast('Unsupported: ' + file.name); return; }
    if (file.size > 52428800) { showToast('File too large (max 50MB).'); return; }
    const key = generateStorageKey(file.name);
    try {
      const publicUrl = await uploadFileToCloud(file, key);
      const pageCount = await getPageCount(file);
      const fileType = getFileType(file.name);
      const ext = file.name.split('.').pop() || '';
      const item: FileItem & { size?: number } = {
        temp_id: 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        file_name: file.name,
        file_storage_key: publicUrl,
        file_type: fileType,
        file_extension: ext,
        page_count: pageCount || 0,
        print_type: 'bw',
        color_page_ranges: '',
        copies: 1,
        sides: 'single',
        paper_size: 'A4',
        slidesPerPage: 1,
        bw_pages: 0,
        color_pages: 0,
        file_price: 0,
        student_note: '',
        file_size_kb: Math.round(file.size / 1024),
      };
      setUploadedFiles(prev => [...prev, item]);
    } catch (error: unknown) {
      showToast('Upload Failed. Try again.');
    }
  };

  const removeFile = async (temp_id: string) => {
    const file = uploadedFiles.find(f => f.temp_id === temp_id);
    if (file) {
      await deleteFileFromCloud(file.file_storage_key);
    }
    setUploadedFiles(prev => prev.filter(f => f.temp_id !== temp_id));
  };

  const updateFile = (temp_id: string, updates: Partial<FileItem>) => {
    setUploadedFiles(prev => prev.map(f => f.temp_id === temp_id ? { ...f, ...updates } : f));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!librarySettings.is_open) { showToast('Library Print is offline.'); return; }
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setIsUploading(true);
    await Promise.allSettled(files.map(processFile));
    setIsUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleXeroxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xeroxName.trim()) {
      showToast('Please enter student name');
      return;
    }
    const amountNum = parseFloat(xeroxAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid amount (₹)');
      return;
    }

    setIsSubmittingXerox(true);
    try {
      const printId = 'XRX-' + Date.now().toString().slice(-6);
      const monthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

      await DB.savePaymentRecord({
        print_id: printId,
        name: xeroxName.trim(),
        prn: xeroxPrn.trim() || undefined,
        amount_paid: amountNum,
        payment_type: 'xerox',
        month: monthStr,
      });

      playSuccessSound();
      setXeroxSuccess({
        printId,
        name: xeroxName.trim(),
        amount: amountNum,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      });

      setXeroxName('');
      setXeroxPrn('');
      setXeroxAmount('');
      showToast('Xerox record saved successfully!');
    } catch (err) {
      console.error("Xerox Record Save Error:", err);
      showToast('Failed to save Xerox record. Try again.');
    } finally {
      setIsSubmittingXerox(false);
    }
  };

  const handleSendToLibrarianQueue = async () => {
    if (uploadedFiles.length === 0) {
      showToast('Please upload at least one document');
      return;
    }

    if (!canProceed) {
      showToast('Some files are still processing or invalid');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentId = 'guest_' + Date.now();
      const studentPrintId = 'PRT-' + Date.now().toString().slice(-6);
      const tempId = 'ORD-' + Date.now();
      const qr = await generateQR(tempId);

      const filesWithPrices = uploadedFiles.map(f => {
        const isColor = f.print_type === 'color';
        const bwPgs = isColor ? 0 : (f.page_count || 1);
        const colPgs = isColor ? (f.page_count || 1) : 0;
        const itemPrice = calcFilePrice(f, pricing);
        return { 
          ...f, 
          bw_pages: bwPgs, 
          color_pages: colPgs, 
          file_price: itemPrice 
        };
      });

      const totalBwPages = filesWithPrices.reduce((s, f) => s + (f.bw_pages * f.copies), 0);
      const totalColorPages = filesWithPrices.reduce((s, f) => s + (f.color_pages * f.copies), 0);
      const totalPagesCount = totalBwPages + totalColorPages;
      const totalOrderAmount = priceResult ? (priceResult.total_amount ?? 0) : filesWithPrices.reduce((s, f) => s + f.file_price, 0);

      const order = await DB.createOrder({
        order_id: tempId,
        student_id: studentId,
        student_print_id: studentPrintId,
        student_name: 'Library Student',
        order_type: 'standard',
        files: filesWithPrices.map(({ base64, ...rest }) => rest as FileItem),
        total_bw_pages: totalBwPages,
        total_color_pages: totalColorPages,
        total_pages: totalPagesCount,
        extra_services: extras,
        service_fee: priceResult ? (priceResult.service_fee ?? 0) : 0,
        subtotal: priceResult ? (priceResult.subtotal ?? totalOrderAmount) : totalOrderAmount,
        total_amount: totalOrderAmount,
        payment_status: 'paid',
        print_status: 'queued',
        qr_code: qr
      });

      if (order) {
        playSuccessSound();
        setUploadedFiles([]);
        navigate('/student/confirmed', { state: { order }, replace: true });
      } else {
        throw new Error('Database response was empty.');
      }
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary pb-32">
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in-right border border-white/10">
          <AlertCircle size={16} /> {toast}
        </div>
      )}

      {/* Submitting overlay loader */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
            <Loader2 size={56} className="animate-spin text-blue-primary mx-auto mb-6" />
            <h3 className="font-syne font-black text-xl text-foreground mb-2 tracking-tight">Sending to Library...</h3>
            <p className="text-sm text-muted-foreground font-medium">Please wait while your document is being uploaded</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-syne font-bold text-xl text-foreground">Library <span className="text-blue-primary">Print</span></h1>
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-primary bg-blue-primary/10 px-2.5 py-1 rounded-md">RIT Library Portal</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        


        {/* Shop Status Banner */}
        <div className="animate-fade-in-up">
          {!librarySettings.is_open ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-4 rounded-2xl text-center shadow-sm">
              <p className="font-bold flex items-center justify-center gap-2 text-sm">
                <AlertCircle size={16} /> Library Printer is Currently Offline
              </p>
              <p className="text-xs mt-1 opacity-90">{librarySettings.closing_message ? `Message: "${librarySettings.closing_message}"` : `Resumes at: ${librarySettings.standard_hours}`}</p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 text-green-700 px-4 py-3 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm border-dashed">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active: Accepting Print Requests
            </div>
          )}
        </div>

        {/* Mode Switch Tabs (Online Print vs Xerox Record) */}
        <div className="bg-white p-1.5 rounded-2xl border border-input shadow-sm flex items-center gap-1.5 animate-fade-in-up">
          <button
            type="button"
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'online' ? 'bg-blue-primary text-white shadow-md shadow-blue-primary/20 font-black' : 'text-muted-foreground hover:bg-slate-50'}`}
          >
            <CloudUpload size={16} />
            <span>Online Document Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('xerox')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'xerox' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black' : 'text-muted-foreground hover:bg-slate-50'}`}
          >
            <Printer size={16} />
            <span>Xerox / Physical Entry</span>
          </button>
        </div>

        {/* TAB 1: ONLINE PRINT VIEW */}
        {activeTab === 'online' && (
          <>
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => { if (!isUploading) fileInputRef.current?.click(); }}
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all shadow-sm ${!librarySettings.is_open ? 'opacity-50 cursor-not-allowed border-input' : isUploading ? 'cursor-not-allowed opacity-70 border-input' : isDragging ? 'border-blue-primary bg-blue-light cursor-pointer scale-102' : 'border-input hover:border-blue-primary/50 cursor-pointer bg-white'}`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-blue-primary mb-3" size={40} />
                  <p className="font-bold text-foreground animate-pulse">Uploading Library Documents...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-primary">
                     <CloudUpload size={32} />
                  </div>
                  <p className="font-black text-lg text-foreground">Select PDF or Document</p>
                  <p className="text-xs text-muted-foreground mt-1 px-4">Tap to browse or drop here. Our library printer supports PDF, Word, PowerPoint and Images.</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                disabled={!librarySettings.is_open || isUploading}
                accept=".pdf,.docx,.doc,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                className="hidden"
                onChange={async e => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = '';
                  if (files.length === 0) return;
                  setIsUploading(true);
                  await Promise.allSettled(files.map(processFile));
                  setIsUploading(false);
                }}
              />
            </div>

            {/* File items list */}
            {uploadedFiles.map(file => (
              <div key={file.temp_id} className="bg-white rounded-3xl border border-input p-6 space-y-5 animate-fade-in-up shadow-sm">
                {/* Header info */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary rounded-2xl">
                     <FileTypeIcon type={file.file_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-foreground truncate uppercase tracking-tight">{file.file_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="bg-blue-primary/10 text-blue-primary px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          {file.page_count} {file.page_count === 1 ? 'Page' : 'Pages'}
                       </span>
                       <span className="text-[10px] text-muted-foreground font-bold">
                          {file.file_size_kb >= 1024 ? (file.file_size_kb / 1024).toFixed(1) + ' MB' : file.file_size_kb + ' KB'}
                       </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(file.temp_id)} 
                    className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Print Options: B&W / Color, Sides, Copies */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                  {/* Print Mode (B&W vs Color) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Print Color</label>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateFile(file.temp_id, { print_type: 'bw' })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${file.print_type === 'bw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        B&W (₹{pricing.bw_rate}/pg)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFile(file.temp_id, { print_type: 'color' })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${file.print_type === 'color' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Color (₹{pricing.color_rate}/pg)
                      </button>
                    </div>
                  </div>

                  {/* Sides (Single vs Double) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Sides</label>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateFile(file.temp_id, { sides: 'single' })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${file.sides === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFile(file.temp_id, { sides: 'double' })}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${file.sides === 'double' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Double
                      </button>
                    </div>
                  </div>

                  {/* Copies counter */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Copies</label>
                    <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateFile(file.temp_id, { copies: Math.max(1, (file.copies || 1) - 1) })}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-sm hover:bg-slate-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-black text-slate-800 text-sm">{file.copies || 1}</span>
                      <button
                        type="button"
                        onClick={() => updateFile(file.temp_id, { copies: (file.copies || 1) + 1 })}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-sm hover:bg-slate-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* TAB 2: XEROX PHYSICAL FORM VIEW */}
        {activeTab === 'xerox' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Success Card if recorded */}
            {xeroxSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-900 text-sm">Xerox Record Saved!</h4>
                      <p className="text-xs text-emerald-700 font-medium">Saved in unified transaction log</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg">
                    {xeroxSuccess.printId}
                  </span>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 space-y-2 border border-emerald-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Student Name:</span>
                    <span className="font-bold text-slate-800 uppercase">{xeroxSuccess.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Amount Collected:</span>
                    <span className="font-black text-emerald-700 text-sm">₹{xeroxSuccess.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Time Recorded:</span>
                    <span className="font-medium text-slate-600">{xeroxSuccess.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => setXeroxSuccess(null)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  + Add Another Xerox Entry
                </button>
              </div>
            )}

            {/* Xerox Form Card */}
            <form onSubmit={handleXeroxSubmit} className="bg-white rounded-3xl p-6 border border-input shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-syne font-black text-base text-foreground">Record Physical Xerox Print</h3>
                  <p className="text-xs text-muted-foreground font-medium">Store counter xerox receipts into monthly transaction sheet</p>
                </div>
              </div>

              {/* Form Input: Student Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Student Name <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter student full name"
                    value={xeroxName}
                    onChange={e => setXeroxName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none transition font-medium text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Form Input: PRN (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>PRN / Roll Number <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
                </label>
                <div className="relative">
                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 2026PRN101 (Optional)"
                    value={xeroxPrn}
                    onChange={e => setXeroxPrn(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none transition font-medium text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Form Input: Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Amount Paid (₹) <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    placeholder="e.g. 20"
                    value={xeroxAmount}
                    onChange={e => setXeroxAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none transition font-bold text-base text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingXerox}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 border-b-4 border-emerald-800 disabled:opacity-50"
              >
                {isSubmittingXerox ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving Xerox Record...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Save Xerox Record to Log</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Secondary Dashboard Operations */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
           <button 
             onClick={() => navigate('/student/capstone')}
             className="bg-white border border-input p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-secondary transition shadow-sm group"
           >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                 <BookOpen size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Capstone Project</span>
           </button>
           
           <button 
             onClick={() => navigate('/student/history')}
             className="bg-white border border-input p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-secondary transition shadow-sm group"
           >
              <div className="p-3 bg-blue-50 text-blue-primary rounded-xl group-hover:scale-110 transition-transform">
                 <Clock size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Order History</span>
           </button>
        </div>

        {/* Library Info Card */}
        <div className="bg-white rounded-3xl p-5 border border-input shadow-sm space-y-3 animate-fade-in-up">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                 <Printer size={18} />
              </div>
              <div>
                 <p className="text-sm font-bold text-foreground">Self-Service Printing</p>
                 <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Upload your documents above and hit submit. Take your prints directly at the library counter.</p>
              </div>
           </div>
        </div>

        <div className="text-center pb-8 opacity-50 space-y-1">
           <p className="text-[10px] font-bold uppercase tracking-widest">Powered by RIT Library Services</p>
           <p className="text-[9px] font-bold tracking-wider text-muted-foreground lowercase">made by = viraj kadam | application of printease</p>
        </div>
      </div>

      {/* Floating Summary & Submit Footer */}
      {priceResult && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-input p-6 shadow-2xl z-40 rounded-t-[32px]">
          <div className="max-w-lg mx-auto">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Queue Status</p>
                  <p className="font-syne font-black text-2xl text-green-600">Ready to Send</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-blue-primary uppercase tracking-widest mb-1">Files: {uploadedFiles.length}</p>
                   <p className="text-[10px] font-bold text-muted-foreground capitalize">Estimated Delivery: Immediate</p>
                </div>
              </div>
              <button
                onClick={handleSendToLibrarianQueue}
                disabled={!canProceed || !librarySettings.is_open || isSubmitting}
                className="w-full py-5 rounded-2xl bg-blue-primary text-primary-foreground font-black text-lg hover:opacity-95 transition-all transform active:scale-95 disabled:opacity-40 shadow-xl shadow-blue-primary/20 flex items-center justify-center gap-2"
              >
                SEND DOCUMENT TO LIBRARIAN'S QUEUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
