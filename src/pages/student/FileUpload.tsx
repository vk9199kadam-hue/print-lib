import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudUpload, X, Minus, Plus, AlertCircle, Loader2 } from 'lucide-react';
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
  const [extras, setExtras] = useState<ExtraServices>({ spiral_binding: false, stapling: false });
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
    if (!shopSettings.is_open) { showToast('Shop is currently closed. Come back later!'); return; }
    if (!isAllowedFile(file.name)) { showToast('Unsupported file type: ' + file.name); return; }
    if (file.size > 52428800) { showToast('File too large (max 50MB). Please split your document.'); return; }
    const key = generateStorageKey(file.name);
    try {
      const publicUrl = await uploadFileToCloud(file, key);
      // Using local processing & smart content parsing for page counts (Fast & Free)
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
      console.error('Supabase Upload Error:', err);
      showToast('Cloud Upload Failed: ' + (err.message || 'Check bucket permissions.'));
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
    if (!shopSettings.is_open) { showToast('Shop is currently closed.'); return; }
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setIsUploading(true);
    await Promise.allSettled(files.map(processFile));
    setIsUploading(false);
  };

  const canProceed = uploadedFiles.length > 0 && uploadedFiles.every(f => f.page_count > 0);

  return (
    <div className="min-h-screen bg-secondary pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in-right">
          <AlertCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Back</span>
        </button>
        <span className="text-sm text-muted-foreground">Step 1 of 3</span>
      </header>

      {/* Shop Status Banner */}
      {!shopSettings.is_open ? (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 text-center">
          <p className="font-bold flex items-center justify-center gap-2">
            <AlertCircle size={18} /> Shop is Currently Closed
          </p>
          <p className="text-sm mt-1">{shopSettings.closing_message ? `Message: "${shopSettings.closing_message}"` : `Standard Timings: ${shopSettings.standard_hours}`}</p>
        </div>
      ) : (
        <div className="bg-green-500 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
           <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Shop is Open - Accepting Orders
        </div>
      )}

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => { if (!isUploading) fileInputRef.current?.click(); }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isUploading ? 'cursor-not-allowed opacity-70 border-input' : isDragging ? 'border-blue-primary bg-blue-light cursor-pointer' : 'border-input hover:border-blue-primary/50 cursor-pointer'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-primary mb-3" size={40} />
              <p className="font-semibold text-foreground animate-pulse">Uploading files...</p>
            </div>
          ) : (
            <>
              <CloudUpload size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold text-foreground">Drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, PowerPoint, Images, TXT — Max 50MB each</p>
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

        {/* File cards */}
        {uploadedFiles.map(file => (
          <div key={file.temp_id} className="bg-card rounded-2xl border border-input p-4 space-y-3 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3">
              <FileTypeIcon type={file.file_type} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{file.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    {file.file_size_kb >= 1024 ? (file.file_size_kb / 1024).toFixed(1) + ' MB' : file.file_size_kb + ' KB'}
                  </p>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm uppercase tracking-wider">
                    {file.page_count} {file.page_count === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>
              </div>
              <button onClick={() => removeFile(file.temp_id)} className="text-muted-foreground hover:text-destructive p-1">
                <X size={16} />
              </button>
            </div>



            {/* Print type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Print Type</label>
              <div className="flex gap-2">
                {([['bw', `B&W (₹${pricing.bw_rate}/pg)`], ['color', `Color (₹${pricing.color_rate}/pg)`], ['mixed', 'Mixed']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => updateFile(file.temp_id, { print_type: val })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border-2
                      ${file.print_type === val ? 'bg-blue-primary text-primary-foreground border-blue-primary' : 'bg-background text-foreground border-input hover:border-blue-primary/50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {file.print_type === 'mixed' && (
                <div className="mt-2">
                  <input
                    placeholder="Color page ranges, e.g. 1-5, 10, 12"
                    value={file.color_page_ranges}
                    onChange={e => updateFile(file.temp_id, { color_page_ranges: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-input rounded-lg bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">All other pages printed in B&W</p>
                </div>
              )}
            </div>

            {/* Copies & Sides */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Copies</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateFile(file.temp_id, { copies: Math.max(1, file.copies - 1) })} className="w-8 h-8 rounded-lg border border-input flex items-center justify-center hover:bg-secondary">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold text-foreground">{file.copies}</span>
                  <button onClick={() => updateFile(file.temp_id, { copies: Math.min(50, file.copies + 1) })} className="w-8 h-8 rounded-lg border border-input flex items-center justify-center hover:bg-secondary">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Sides</label>
                <div className="flex gap-2">
                  {(['single', 'double'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateFile(file.temp_id, { sides: s })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border-2
                        ${file.sides === s ? 'bg-blue-primary text-primary-foreground border-blue-primary' : 'bg-background text-foreground border-input'}`}
                    >
                      {s === 'single' ? 'Single' : 'Double'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Paper Size */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Paper Size</label>
              <div className="flex gap-2">
                {(['A4', 'A3'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => updateFile(file.temp_id, { paper_size: p })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border-2
                      ${(file.paper_size || 'A4') === p ? 'bg-blue-primary text-primary-foreground border-blue-primary' : 'bg-background text-foreground border-input hover:border-blue-primary/50'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages Per Sheet (Slides/Layout) */}
            <div className="animate-fade-in">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Pages per sheet</label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 4] as const).map(num => (
                  <button
                    key={num}
                    onClick={() => updateFile(file.temp_id, { slidesPerPage: num })}
                    className={`py-2 rounded-lg text-xs font-semibold transition border-2
                      ${(file.slidesPerPage || 1) === num ? 'bg-amber-500 text-white border-amber-500' : 'bg-background text-foreground border-input hover:border-amber-500/30'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 italic">Save paper! Select how many pages/slides to print on one side.</p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Instructions</label>
              <textarea
                rows={2}
                maxLength={200}
                placeholder="e.g. staple pages, print only pages 2-5..."
                value={file.student_note}
                onChange={e => updateFile(file.temp_id, { student_note: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-input rounded-lg bg-background text-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{file.student_note.length}/200</p>
            </div>
          </div>
        ))}

        {/* Extra Services */}
        {uploadedFiles.length > 0 && (
          <div className="bg-card rounded-2xl border border-input p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Extra Services</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={extras.spiral_binding} onChange={e => setExtras(p => ({ ...p, spiral_binding: e.target.checked }))} className="w-4 h-4 rounded accent-blue-primary" />
                <span className="text-sm text-foreground font-medium">Spiral Binding</span>
                <span className="text-xs text-muted-foreground ml-auto">₹{pricing.spiral_binding_fee}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer border-t border-input pt-3">
                <input type="checkbox" checked={extras.stapling} onChange={e => setExtras(p => ({ ...p, stapling: e.target.checked }))} className="w-4 h-4 rounded accent-blue-primary" />
                <span className="text-sm text-foreground font-medium">Stapling</span>
                <span className="text-xs text-muted-foreground ml-auto">₹{pricing.stapling_fee}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-input p-4 shadow-lg z-30">
        <div className="max-w-lg mx-auto">
          {!priceResult ? (
            <p className="text-center text-sm text-muted-foreground">Add files to see price</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <p className="font-syne font-bold text-xl text-blue-primary">₹{priceResult.total_amount}</p>
              </div>
              <button
                onClick={() => navigate('/student/payment', { state: { files: uploadedFiles, extras } })}
                disabled={!canProceed || !shopSettings.is_open}
                className="px-6 py-3 rounded-xl bg-blue-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-40"
              >
                Proceed to Payment →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
