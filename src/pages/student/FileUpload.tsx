import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudUpload, X, Minus, Plus, AlertCircle, Loader2, Printer, Info } from 'lucide-react';
import { FileItem, ExtraServices } from '../../types';
import { DB } from '../../utils/db';
import { getFileType, isAllowedFile, getPageCount } from '../../utils/pageCounter';
import { uploadFileToCloud, formatFileSize, generateStorageKey, supabase } from '../../utils/fileStorage';

import { calcTotal } from '../../utils/priceCalculator';
import FileTypeIcon from '../../components/FileTypeIcon';

export default function FileUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<(FileItem & { size?: number })[]>([]);
  // Extra services removed as requested, keeping state empty for logic compatibility
  const [extras] = useState<ExtraServices>({ spiral_binding: false, stapling: false });
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pricing, setPricing] = useState(DB.getPricing());
  const [shopSettings, setShopSettings] = useState<{is_open: boolean; closing_message: string; standard_hours: string}>({
    is_open: true, closing_message: '', standard_hours: '10:00 AM to 8:00 PM'
  });

  useEffect(() => {
    const initPricing = async () => {
      const livePricing = await DB.fetchPricing();
      setPricing(livePricing);
    };
    initPricing();

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getShopSettings' }) });
        const { data } = await res.json();
        if (data) setShopSettings(data);
      } catch (e) {
        console.error("Could not fetch shop settings", e);
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
    if (!shopSettings.is_open) { showToast('Library Print is currently offline.'); return; }
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
        file_storage_key: key,
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
      const err = error as Error;
      showToast('Upload Failed. Try again.');
    }
  };

  const removeFile = async (temp_id: string) => {
    const file = uploadedFiles.find(f => f.temp_id === temp_id);
    if (file) {
      await supabase.storage.from('library_print_files').remove([file.file_storage_key]);
    }
    setUploadedFiles(prev => prev.filter(f => f.temp_id !== temp_id));
  };

  const updateFile = (temp_id: string, updates: Partial<FileItem>) => {
    setUploadedFiles(prev => prev.map(f => f.temp_id === temp_id ? { ...f, ...updates } : f));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!shopSettings.is_open) { showToast('Library Print is offline.'); return; }
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setIsUploading(true);
    await Promise.allSettled(files.map(processFile));
    setIsUploading(false);
  };

  const canProceed = uploadedFiles.length > 0 && uploadedFiles.every(f => f.page_count > 0);

  return (
    <div className="min-h-screen bg-secondary pb-32">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in-right border border-white/10">
          <AlertCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm font-bold">Back to Dashboard</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-blue-primary">RIT LIBRARY</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => { if (!isUploading) fileInputRef.current?.click(); }}
          className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all shadow-sm ${isUploading ? 'cursor-not-allowed opacity-70 border-input' : isDragging ? 'border-blue-primary bg-blue-light cursor-pointer scale-102' : 'border-input hover:border-blue-primary/50 cursor-pointer bg-white'}`}
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
            multiple
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

        {/* File items */}
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

            {/* Print settings removed to simplify flow. Defaults to 1 copy, single sided, B&W, A4 */}
          </div>
        ))}
      </div>

      {/* Payment Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-input p-6 shadow-2xl z-40 rounded-t-[32px]">
        <div className="max-w-lg mx-auto">
          {!priceResult ? (
            <div className="text-center">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting documents...</p>
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
                onClick={() => navigate('/student/payment', { state: { files: uploadedFiles, extras } })}
                disabled={!canProceed || !shopSettings.is_open}
                className="w-full py-5 rounded-2xl bg-blue-primary text-primary-foreground font-black text-lg hover:opacity-95 transition-all transform active:scale-95 disabled:opacity-40 shadow-xl shadow-blue-primary/20 flex items-center justify-center gap-2"
              >
                SUBMIT TO LIBRARIAN →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
