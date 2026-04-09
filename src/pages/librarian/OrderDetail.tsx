import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Package, Loader2, Download, Phone, Calendar, MessageSquare, User, School, BookOpen } from 'lucide-react';
import { DB } from '../../utils/db';
import { Order, FileItem } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import FileTypeIcon from '../../components/FileTypeIcon';
import { supabase } from '../../utils/fileStorage';

const statusFlow: Order['print_status'][] = ['queued', 'printing', 'ready', 'completed'];

export default function OrderDetail() {
  const navigate = useNavigate();
  const { order_id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadedFiles, setDownloadedFiles] = useState<Set<string>>(new Set());
  const filesDownloaded = order?.files ? downloadedFiles.size === order.files.length : false;

  useEffect(() => {
    if (!order_id) return;
    setLoading(true);
    setError('');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          setError('Request timed out. The server might be busy.');
        }
        return currentLoading;
      });
    }, 15000);

    DB.getOrderById(order_id)
      .then(res => {
        clearTimeout(timeout);
        if (res) setOrder(res);
        else setError('Order not found');
        setLoading(false);
      })
      .catch(err => {
        clearTimeout(timeout);
        setError('Failed to connect to database');
        setLoading(false);
        console.error(err);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [order_id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary">
      <Loader2 className="animate-spin text-blue-primary mb-4" size={32} />
      <p className="text-muted-foreground">Fetching order details...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4 text-center">
      <div className="bg-card p-8 rounded-2xl border border-input shadow-sm max-w-sm">
        <p className="text-destructive font-semibold mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-2 rounded-xl bg-blue-primary text-primary-foreground font-semibold"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!order) return <Navigate to="/librarian/dashboard" replace />;

  const downloadSingleFile = async (file: FileItem) => {
    try {
      const fileUrl = await DB.getFile(file.file_storage_key);
      if (fileUrl) {
        // Fetch the file as a Blob to perfectly force a silent direct download 
        // without opening new tabs or moving the screen for ANY file type.
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.file_name; // This will now perfectly force a download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        
        setDownloadedFiles(prev => new Set(prev).add(file.file_storage_key));
      }
    } catch (e) {
      console.error('Failed to download file', e);
      alert('Failed to download file directly. Please check your connection.');
    }
  };

  const nextStatus = async () => {
    const currentIdx = statusFlow.indexOf(order.print_status);
    if (currentIdx < statusFlow.length - 1) {
      const next = statusFlow[currentIdx + 1];
      await DB.updateOrderStatus(order.order_id, next);

      // Removed duplicate frontend Supabase file deletion; the rpc.ts backend handles this now.

      if (order_id) {
        const updated = await DB.getOrderById(order_id);
        if (updated) setOrder(updated);
      }
    }
  };



  const handleMarkReady = async () => {
    // Skip 'printing', go straight from queued → ready
    await DB.updateOrderStatus(order.order_id, 'ready');
    if (order_id) {
      const updated = await DB.getOrderById(order_id);
      if (updated) setOrder(updated);
    }
  };

  const handleMarkCollected = async () => {
    await DB.updateOrderStatus(order.order_id, 'completed');
    // Removed duplicate frontend Supabase file deletion
    if (order_id) {
      const updated = await DB.getOrderById(order_id);
      if (updated) setOrder(updated);
    }
  };

  const nextLabel: Record<string, string> = {
    queued: '🖨️ Start Printing',
    printing: '✅ Mark Ready',
    ready: '📦 Mark Collected',
  };

  const nextColor: Record<string, string> = {
    queued: '#1B4FFF',
    printing: '#0D6B3E',
    ready: '#0D6B3E',
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-input px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate('/librarian/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Back to Queue</span>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono font-bold text-xl text-foreground">{order.order_id}</h1>
            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <StatusBadge status={order.print_status} />
        </div>

        {/* Student info */}
        <div className="bg-card rounded-xl border border-input p-4">
          <p className="text-sm text-muted-foreground mb-1">Student</p>
          <div className="flex items-center justify-between">
             <div>
                <p className="font-semibold text-foreground text-lg">{order.student_name}</p>
                <span className="bg-blue-light text-blue-primary text-xs font-mono font-semibold px-2 py-0.5 rounded-md mt-1 inline-block">
                  {order.student_print_id}
                </span>
             </div>
             {order.contact_number && (
                <a href={`tel:${order.contact_number}`} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition">
                   <Phone size={14} /> {order.contact_number}
                </a>
             )}
          </div>
        </div>

        {/* Project Specific Info */}
        {order.order_type === 'capstone' && (
          <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-600 p-6 relative overflow-hidden shadow-xl shadow-emerald-500/10 animate-fade-in-up">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] px-4 py-1.5 font-bold rounded-bl-xl uppercase tracking-widest shadow-sm">Capstone Project Ticket</div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 border-4 border-emerald-100 shadow-inner">
                <User size={32} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-tighter opacity-70">Student Name</p>
                <h3 className="text-2xl font-black text-emerald-950 leading-none">{order.student_name}</h3>
                <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1"><Phone size={12} /> {order.contact_number}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-emerald-200/50">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase opacity-60 flex items-center gap-1 group"><School size={12} /> College & Institution</p>
                 <p className="text-lg font-extrabold text-emerald-900 leading-tight">{order.college}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase opacity-60 flex items-center gap-1"><BookOpen size={12} /> Department</p>
                 <p className="text-lg font-extrabold text-emerald-900 leading-tight">{order.department}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase opacity-60 flex items-center gap-1"><Calendar size={12} /> Submission Date</p>
                 <p className="text-lg font-extrabold text-emerald-900 flex items-center gap-2">
                   {order.receiving_date}
                 </p>
              </div>
            </div>

            <div className="mt-6">
               <button 
                 onClick={() => window.location.href = `tel:${order.contact_number}`}
                 className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-700/20 hover:bg-emerald-700 transition flex items-center justify-center gap-2"
               >
                 <Phone size={18} /> {order.contact_number}
               </button>
            </div>
          </div>
        )}

        {/* Global Student Instruction (Sticky Note) */}
        {order.files.some(f => f.student_note) && (
          <div className="bg-amber-50 rounded-xl border-2 border-amber-400 p-6 shadow-lg shadow-amber-200/50 animate-pulse-subtle">
            <div className="flex items-center gap-2 text-amber-700 font-syne font-bold uppercase tracking-wider text-xs mb-3">
               <MessageSquare size={16} /> Student Instructions (Note Down)
            </div>
            {order.files.filter(f => f.student_note).map((f, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-[10px] font-bold text-amber-600/60 uppercase">{f.file_name} Note:</p>
                <p className="text-xl font-bold text-amber-900 leading-tight">"{f.student_note}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Files */}
        <div className="bg-card rounded-xl border border-input p-4">
          <h3 className="font-semibold text-foreground mb-3">Files ({order.files.length})</h3>
          {order.files.map((f, i) => {
            const isDownloaded = downloadedFiles.has(f.file_storage_key);
            return (
            <div key={i} className={`flex items-start gap-3 py-3 border-b border-input last:border-0 ${isDownloaded ? 'opacity-50' : ''}`}>
              <FileTypeIcon type={f.file_type} size={18} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{f.file_name}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {order.order_type === 'capstone' ? (
                    <>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                        {f.page_count} PROJECT PAGES
                      </span>
                      {order.extra_services?.capstone_embossing && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${order.extra_services.capstone_embossing === 'black' ? 'bg-slate-900 text-white border-slate-900' : 'bg-amber-900 text-white border-amber-900'}`}>
                          {order.extra_services.capstone_embossing.toUpperCase()} EMBOSSING
                        </span>
                      )}
                      {!!order.extra_services?.bond_paper_count && order.extra_services.bond_paper_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
                         {order.extra_services.bond_paper_count} BOND PAGES
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        {f.page_count} PAGES
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        f.print_type === 'bw' ? 'bg-gray-100 text-gray-700 border-gray-200' : 
                        f.print_type === 'color' ? 'bg-pink-100 text-pink-700 border-pink-200' : 
                        'bg-purple-100 text-purple-700 border-purple-200'
                      }`}>
                        {f.print_type.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
                        ×{f.copies} COPIES
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 uppercase">
                        {f.sides}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-bold border border-cyan-200 uppercase">
                         {f.paper_size || 'A4'}
                      </span>
                      {f.slidesPerPage && f.slidesPerPage > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold border border-orange-200">
                          {f.slidesPerPage} SLIDES/PG
                        </span>
                      )}
                    </>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase">
                    {f.file_size_kb >= 1024 ? (f.file_size_kb / 1024).toFixed(1) + 'MB' : f.file_size_kb + 'KB'}
                  </span>
                </div>
                {f.student_note && (
                  <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 animate-pulse">
                    ⚠️ SPECIAL NOTE: {f.student_note}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-sm font-semibold text-foreground">₹{f.file_price}</span>
                <button
                  onClick={() => downloadSingleFile(f)}
                  className={`p-2 rounded-lg transition shadow-sm border flex items-center gap-1 text-[10px] font-bold ${isDownloaded ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-light text-blue-primary hover:bg-blue-primary hover:text-white border-blue-200'}`}
                  title={isDownloaded ? "Downloaded" : "Download this file"}
                >
                  {isDownloaded ? <CheckCircle size={14} /> : <Download size={14} />} 
                  {isDownloaded ? 'DOWNLOADED' : 'DOWNLOAD'}
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-xl border border-input p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>B&W Pages</span><span>{order.total_bw_pages}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Color Pages</span><span>{order.total_color_pages}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Total Pages</span><span>{order.total_pages}</span>
            </div>
            {order.order_type !== 'capstone' && order.extra_services.spiral_binding && (
              <div className="flex justify-between text-muted-foreground"><span>Spiral Binding</span><span>₹{DB.getPricing().spiral_binding_fee}</span></div>
            )}
            {order.order_type !== 'capstone' && order.extra_services.stapling && (
              <div className="flex justify-between text-muted-foreground border-t border-input pt-2">
                <span>Stapling Service</span><span>₹{DB.getPricing().stapling_fee || 5}</span>
              </div>
            )}
            {order.order_type === 'capstone' && order.extra_services.capstone_embossing && (
              <div className="flex justify-between text-muted-foreground border-t border-input pt-2 text-emerald-700 font-bold">
                <span>Embossing ({order.extra_services.capstone_embossing === 'black' ? 'Black' : 'Brown'})</span>
                <span>₹{order.extra_services.capstone_embossing === 'black' ? 140 : 160}</span>
              </div>
            )}
            {order.order_type === 'capstone' && !!order.extra_services.bond_paper_count && (
              <div className="flex justify-between text-muted-foreground text-emerald-700 font-bold">
                <span>Bond Paper ({order.extra_services.bond_paper_count} pgs)</span>
                <span>₹{order.extra_services.bond_paper_count * 4}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg text-blue-primary pt-3 border-t-2 border-input mt-2">
              <span>Grand Total</span><span>₹{order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* QR */}
        {order.qr_code && (
          <div className="bg-card rounded-xl border border-input p-4 text-center">
            <img src={order.qr_code} alt="QR Code" className="mx-auto w-32 h-32" />
          </div>
        )}

        {/* Action Buttons - 3 Step Flow */}
        {order.print_status === 'queued' && (
          <div className="space-y-3">
            {/* Step 1: Download */}
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Step 1 — Download All Files Individually</p>
              <p className="text-sm text-amber-800">
                Please click the download button for each file above. The Mark Ready button will be enabled once all {order.files.length} files are downloaded.
              </p>
              {filesDownloaded && (
                <p className="text-sm text-green-700 font-bold text-center mt-3 bg-green-100 p-2 rounded-lg">✔ All files downloaded — Print them now!</p>
              )}
            </div>

            {/* Step 2: Mark Ready — only enabled after download */}
            <div className={`rounded-2xl p-4 border-2 transition-all ${filesDownloaded ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${filesDownloaded ? 'text-green-700' : 'text-gray-400'}`}>Step 2 — After Printing Done</p>
              <button
                onClick={handleMarkReady}
                disabled={!filesDownloaded}
                className="w-full py-4 rounded-xl text-white font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: filesDownloaded ? '#0D6B3E' : '#9CA3AF' }}
              >
                ✅ Mark as Ready
              </button>
            </div>
          </div>
        )}

        {order.print_status === 'ready' && (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Step 3 — Student Pickup</p>
            <button
              onClick={handleMarkCollected}
              className="w-full py-4 rounded-xl bg-blue-primary text-white font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              📦 Mark as Collected
            </button>
          </div>
        )}

        {order.print_status === 'completed' && (
          <div className="bg-green-light rounded-xl p-4 text-center text-green-primary font-semibold flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Order Completed & Files Cleaned
          </div>
        )}
      </div>
    </div>
  );
}
