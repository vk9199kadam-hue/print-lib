import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudUpload, X, AlertCircle, Calendar, User, Phone, School, BookOpen } from 'lucide-react';
import { FileItem, ExtraServices } from '../../types';
import { DB } from '../../utils/db';
import { getFileType, isAllowedFile, getPageCount } from '../../utils/pageCounter';
import { uploadFileToCloud, generateStorageKey } from '../../utils/fileStorage';
import FileTypeIcon from '../../components/FileTypeIcon';

export default function CapstoneUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 1: Metadata
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    college: '',
    department: '',
    receiving_date: ''
  });
  
  // Step 2: File
  const [uploadedFile, setUploadedFile] = useState<FileItem | null>(null);
  const [extras, setExtras] = useState<ExtraServices>({ 
    spiral_binding: false, 
    stapling: false,
    capstone_embossing: 'black',
    bond_paper_count: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: Upload

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const processFile = async (file: File) => {
    if (!isAllowedFile(file.name)) { showToast('Unsupported file type: ' + file.name); return; }
    if (file.size > 4194304) { showToast('File too large (max 4MB due to Vercel limits). Please split your document.'); return; }
    const key = generateStorageKey(file.name);
    try {
      const publicUrl = await uploadFileToCloud(file, key);

      const pageCount = await getPageCount(file);
      const fileType = getFileType(file.name);
      const item: FileItem = {
        temp_id: 'tmp_' + Date.now(),
        file_name: file.name,
        file_storage_key: key,
        file_type: fileType,
        file_extension: file.name.split('.').pop() || '',
        page_count: pageCount || 0,
        print_type: 'bw',
        color_page_ranges: '',
        copies: 1,
        sides: 'single',
        slidesPerPage: 1,
        bw_pages: 0,
        color_pages: 0,
        file_price: 0,
        student_note: 'Capstone Project Submission',
        file_size_kb: Math.round(file.size / 1024),
      };
      setUploadedFile(item);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Supabase Upload Error:', err);
      showToast('Cloud Upload Failed: ' + (err.message || 'Check bucket permissions.'));
    }
  };

  const handleProceed = () => {
    if (!uploadedFile) return;
    navigate('/student/payment', { 
      state: { 
        files: [uploadedFile], 
        extras,
        isCapstone: true,
        capstoneData: formData
      } 
    });
  };

  return (
    <div className="min-h-screen bg-secondary pb-32">
      {/* Header */}
      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => step === 1 ? navigate('/student/dashboard') : setStep(1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Back</span>
        </button>
        <span className="text-sm font-bold text-emerald-600">Capstone Project</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {step === 1 ? (
          <div className="bg-card rounded-2xl border border-input p-6 space-y-4 animate-fade-in-up">
            <h2 className="font-syne font-bold text-xl text-foreground">Project Details</h2>
            <p className="text-xs text-muted-foreground italic mb-4 text-center">Please provide your project information before uploading the report.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Contact Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    placeholder="Your mobile number"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">College</label>
                  <div className="relative">
                    <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="College Name"
                      value={formData.college}
                      onChange={e => setFormData({ ...formData, college: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Department</label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS, IT"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">File Submission Receipt Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    required
                    value={formData.receiving_date}
                    onChange={e => setFormData({ ...formData, receiving_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.contact || !formData.college}
              className="w-full py-4 mt-6 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Continue to Upload →
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* File drop zone - limited to 1 file for project */}
            {!uploadedFile ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).slice(0, 1).forEach(processFile); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                  ${isDragging ? 'border-emerald-600 bg-emerald-50' : 'border-input hover:border-emerald-600/50'}`}
              >
                <CloudUpload size={48} className="mx-auto mb-3 text-emerald-600" />
                <p className="font-bold text-foreground">Upload Project Report</p>
                <p className="text-xs text-muted-foreground mt-1">PDF preferred for project reports</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
                />
              </div>
            ) : (
              <div className="bg-card rounded-2xl border-2 border-emerald-600 p-4 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] px-3 py-1 font-bold rounded-bl-lg uppercase">Selected</div>
                <div className="flex items-center gap-3">
                  <FileTypeIcon type={uploadedFile.file_type} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{uploadedFile.file_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {uploadedFile.file_type === 'word' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground italic">Pages:</span>
                          <input
                            type="number"
                            min={1}
                            value={uploadedFile.page_count || ''}
                            className="w-12 px-1 py-0.5 text-xs font-bold border border-input rounded-md bg-background text-foreground"
                            onChange={e => setUploadedFile({ ...uploadedFile, page_count: Math.max(1, parseInt(e.target.value) || 0) })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="text-destructive hover:bg-red-50 p-2 rounded-full transition">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-input">
                   <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Embossing Type</label>
                    <div className="flex gap-2">
                         <button 
                           onClick={() => setExtras({ ...extras, capstone_embossing: 'black' })}
                           className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border-2 transition
                             ${extras.capstone_embossing === 'black' ? 'bg-slate-900 border-slate-900 text-white' : 'border-input hover:border-slate-300'}`}
                         >
                           BLACK (B.Tech)
                         </button>
                         <button 
                           onClick={() => setExtras({ ...extras, capstone_embossing: 'brown' })}
                           className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border-2 transition
                             ${extras.capstone_embossing === 'brown' ? 'bg-amber-900 border-amber-900 text-white' : 'border-input hover:border-amber-700'}`}
                         >
                           BROWN (M.Tech)
                         </button>
                    </div>
                   </div>

                   <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Bond Paper Pages</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={extras.bond_paper_count || ''}
                        onChange={e => setExtras({ ...extras, bond_paper_count: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full px-3 py-1.5 rounded-lg border-2 border-input bg-background text-sm font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-tight">₹4 per bond page.</p>
                   </div>
                </div>
              </div>
            )}

            {/* Receipt Summary */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-3">
              <AlertCircle size={20} className="text-emerald-700 mt-1" />
              <div>
                <h4 className="font-bold text-emerald-800 text-sm">Submission Receipt Info</h4>
                <div className="text-[11px] text-emerald-700 mt-1 space-y-0.5">
                  <p><strong>To:</strong> {formData.college} - {formData.department}</p>
                  <p><strong>Submitting on:</strong> {formData.receiving_date}</p>
                </div>
              </div>
            </div>

            <button
               onClick={handleProceed}
               disabled={!uploadedFile}
               className="w-full py-4 mt-6 rounded-xl bg-blue-primary text-white font-bold hover:opacity-90 shadow-xl shadow-blue-500/30 transition disabled:opacity-50"
            >
              Confirm & Pay →
            </button>
          </div>
        )}
      </div>
      
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in-right">
          <AlertCircle size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
