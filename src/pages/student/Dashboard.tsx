import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Copy, Check, AlertCircle, Hash, Printer, BookOpen, Clock, User, X, Minus, Plus, Loader2, CloudUpload } from 'lucide-react';
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

  // Local student state (stored in localStorage)
  const [studentName, setStudentName] = useState('');
  const [studentPrn, setStudentPrn] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [validationError, setValidationError] = useState('');

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
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    // Load student info from cache
    const cachedName = localStorage.getItem('library_student_name');
    const cachedPrn = localStorage.getItem('library_student_prn');
    if (cachedName && cachedPrn) {
      setStudentName(cachedName);
      setStudentPrn(cachedPrn);
      setIsEditing(false);
    }

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

  const handleSaveInfo = () => {
    if (!studentName.trim()) {
      setValidationError('Please enter your full name');
      return;
    }
    if (!/^\d{7}$/.test(studentPrn)) {
      setValidationError('PRN must be exactly 7 digits');
      return;
    }
    setValidationError('');
    localStorage.setItem('library_student_name', studentName.trim());
    localStorage.setItem('library_student_prn', studentPrn.trim());
    setIsEditing(false);
  };

  const handleClearInfo = () => {
    localStorage.removeItem('library_student_name');
    localStorage.removeItem('library_student_prn');
    setStudentName('');
    setStudentPrn('');
    setIsEditing(true);
  };

  const canProceed = uploadedFiles.length > 0 && uploadedFiles.every(f => f.page_count > 0);

  const handlePayAndSubmit = async () => {
    // Validate details
    if (isEditing) {
      if (!studentName.trim()) {
        setValidationError('Please enter your full name');
        showToast('Please enter your full name');
        return;
      }
      if (!/^\d{7}$/.test(studentPrn)) {
        setValidationError('PRN must be exactly 7 digits');
        showToast('PRN must be exactly 7 digits');
        return;
      }
      localStorage.setItem('library_student_name', studentName.trim());
      localStorage.setItem('library_student_prn', studentPrn.trim());
      setIsEditing(false);
    }

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
      const studentId = 'student_' + studentPrn;
      const studentPrintId = studentPrn;
      const tempId = 'ORD-' + Date.now();
      const qr = await generateQR(tempId);

      const filesWithPrices = uploadedFiles.map(f => {
        const calc = calcFilePrice(f, pricing, false);
        return { 
          ...f, 
          bw_pages: calc.bw_pages, 
          color_pages: calc.color_pages, 
          file_price: calc.file_price 
        };
      });

      const totalBwPages = filesWithPrices.reduce((s, f) => s + f.bw_pages, 0);
      const totalColorPages = filesWithPrices.reduce((s, f) => s + f.color_pages, 0);
      const totalPagesCount = filesWithPrices.reduce((s, f) => s + ((f.page_count || 1) * f.copies), 0);

      const calculatedTotal = calcTotal(uploadedFiles, extras, pricing);

      const order = await DB.createOrder({
        order_id: tempId,
        student_id: studentId,
        student_print_id: studentPrintId,
        student_name: studentName.trim(),
        order_type: 'standard',
        files: filesWithPrices.map(({ base64, ...rest }) => rest as FileItem),
        total_bw_pages: totalBwPages,
        total_color_pages: totalColorPages,
        total_pages: totalPagesCount,
        extra_services: extras,
        service_fee: calculatedTotal.service_fee,
        subtotal: calculatedTotal.subtotal,
        total_amount: calculatedTotal.total_amount,
        payment_status: 'paid', // Direct approval
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
        
        {/* Identity Details Card */}
        <div className="bg-white rounded-3xl border border-input p-6 shadow-sm space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-primary animate-pulse"></span>
              <h3 className="font-syne font-black text-sm text-foreground uppercase tracking-tight">Student Information</h3>
            </div>
            {!isEditing && (
              <button 
                onClick={handleClearInfo}
                className="text-[10px] font-black text-blue-primary hover:text-blue-700 uppercase tracking-widest transition"
              >
                Change details
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Please provide your Name and 7-digit PRN number. These details will print on the cover/receipt.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="e.g. Jayesh Patil"
                      value={studentName}
                      onChange={e => { setStudentName(e.target.value); setValidationError(''); }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-blue-primary outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">PRN Number (7 Digits)</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      maxLength={7}
                      placeholder="e.g. 1234567"
                      value={studentPrn}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setStudentPrn(val);
                        setValidationError('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-blue-primary outline-none text-sm font-semibold tracking-wider font-mono"
                    />
                  </div>
                </div>

                {validationError && (
                  <p className="text-xs text-red-500 font-bold text-center mt-1">{validationError}</p>
                )}

                <button
                  onClick={handleSaveInfo}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-primary/10 flex items-center justify-center text-blue-primary shrink-0">
                <User size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-syne font-black text-base text-foreground truncate">Welcome back, {studentName}! 👋</h4>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold font-mono tracking-tight">PRN Number: {studentPrn}</p>
              </div>
            </div>
          )}
        </div>

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
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
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

            {/* Print settings */}
            <div className="grid grid-cols-2 gap-4 border-t border-secondary pt-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Color Type</label>
                <div className="flex bg-secondary p-1 rounded-xl">
                   <button onClick={() => updateFile(file.temp_id, { print_type: 'bw' })} className={`flex-1 text-xs font-bold py-2 rounded-lg transition uppercase ${file.print_type === 'bw' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>B&W</button>
                   <button onClick={() => updateFile(file.temp_id, { print_type: 'color' })} className={`flex-1 text-xs font-bold py-2 rounded-lg transition uppercase ${file.print_type === 'color' ? 'bg-white shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>Color</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Print Sides</label>
                <div className="flex bg-secondary p-1 rounded-xl">
                   <button onClick={() => updateFile(file.temp_id, { sides: 'single' })} className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition uppercase ${file.sides === 'single' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Single Page</button>
                   <button onClick={() => updateFile(file.temp_id, { sides: 'double' })} className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition uppercase ${file.sides === 'double' ? 'bg-white shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>Front & Back</button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Number of Copies</label>
                <div className="flex items-center gap-3 bg-secondary p-2 rounded-xl">
                   <button onClick={() => updateFile(file.temp_id, { copies: Math.max(1, file.copies - 1) })} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition hover:bg-slate-50"><Minus size={16}/></button>
                   <div className="flex-1 text-center font-black text-lg">{file.copies}</div>
                   <button onClick={() => updateFile(file.temp_id, { copies: file.copies + 1 })} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition hover:bg-slate-50"><Plus size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        ))}

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

        <div className="text-center pb-8 opacity-50">
           <p className="text-[10px] font-bold uppercase tracking-widest">Powered by RIT Library Services</p>
        </div>
      </div>

      {/* Floating Summary & Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-input p-6 shadow-2xl z-40 rounded-t-[32px]">
        <div className="max-w-lg mx-auto">
          {!priceResult ? (
            <div className="text-center py-2">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting library documents...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Library Print Total</p>
                  <p className="font-syne font-black text-3xl text-foreground">₹{priceResult.total_amount}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-blue-primary uppercase tracking-widest mb-1">Files: {uploadedFiles.length}</p>
                   <p className="text-[10px] font-bold text-muted-foreground capitalize">Estimated Delivery: Immediate</p>
                </div>
              </div>
              <button
                onClick={handlePayAndSubmit}
                disabled={!canProceed || !librarySettings.is_open || isSubmitting}
                className="w-full py-5 rounded-2xl bg-blue-primary text-primary-foreground font-black text-lg hover:opacity-95 transition-all transform active:scale-95 disabled:opacity-40 shadow-xl shadow-blue-primary/20 flex items-center justify-center gap-2"
              >
                PAY & SUBMIT TO LIBRARY →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
