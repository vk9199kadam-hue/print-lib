import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Package, Loader2, Download, MessageSquare, User, Library, Hash } from 'lucide-react';
import { DB } from '../../utils/db';
import { Order, FileItem } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import FileTypeIcon from '../../components/FileTypeIcon';

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
    
    DB.getOrderById(order_id)
      .then(res => {
        if (res) setOrder(res);
        else setError('Order not found');
        setLoading(false);
      })
      .catch(err => {
        setError('Database connection error');
        setLoading(false);
        console.error(err);
      });
  }, [order_id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
      <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Accessing Library Records...</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4 text-center">
      <div className="bg-white p-8 rounded-3xl border border-input shadow-sm max-w-sm">
        <p className="text-destructive font-black mb-4 uppercase text-xs">{error || 'Order not found'}</p>
        <button 
          onClick={() => navigate('/librarian/dashboard')}
          className="w-full py-4 rounded-2xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest"
        >
          Return to Queue
        </button>
      </div>
    </div>
  );

  const downloadSingleFile = async (file: FileItem) => {
    try {
      const fileUrl = await DB.getFile(file.file_storage_key);
      if (fileUrl) {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        setDownloadedFiles(prev => new Set(prev).add(file.file_storage_key));
      }
    } catch (e) {
      console.error('Download failed', e);
      alert('Download failed. Please try again.');
    }
  };

  const handleStatusUpdate = async (status: Order['print_status']) => {
    await DB.updateOrderStatus(order.order_id, status);
    const updated = await DB.getOrderById(order.order_id);
    if (updated) setOrder(updated);
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      // Delete associated files from storage
      for (const file of order.files) {
        await DB.deleteFile(file.file_storage_key);
      }
      
      // Delete from database
      const success = await DB.deleteOrder(order.id);
      if (success) {
        navigate('/librarian/dashboard');
      } else {
        alert('Failed to delete order from database.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the order.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary pb-12">
      <header className="bg-white border-b border-input px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/librarian/dashboard')} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-black text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Close Ticket
          </button>
          <button 
            onClick={handleDeleteOrder}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 font-black text-xs uppercase tracking-widest ml-4 px-3 py-1 bg-red-50 rounded-lg border border-red-100"
          >
            Delete Order
          </button>
        </div>
        <div className="flex items-center gap-2">
           <Library size={16} className="text-blue-600" />
           <span className="font-black text-xs uppercase tracking-widest">Library Order</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        {/* Main Info Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-input relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
             <StatusBadge status={order.print_status} />
          </div>
          
          <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
             <Hash size={12} /> {order.order_id}
          </div>
          
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">{order.student_name}</h1>
          <p className="text-sm font-bold text-muted-foreground mt-1">PRN: <span className="text-foreground">{order.student_print_id}</span> • Registered Library User</p>
          
          {order.order_type === 'capstone' && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">College/Dept</p>
                  <p className="text-xs font-bold text-emerald-900 truncate">{order.college || 'N/A'} • {order.department || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Target Date</p>
                  <p className="text-xs font-bold text-emerald-900">{order.receiving_date || 'N/A'}</p>
               </div>
               {order.contact_number && (
                 <div className="col-span-2 border-t border-emerald-100 pt-2">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Contact</p>
                    <p className="text-xs font-bold text-emerald-900">{order.contact_number}</p>
                 </div>
               )}
            </div>
          )}
          
          <div className="mt-8 flex items-center gap-8 border-t border-secondary pt-8">
             <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pages</p>
                <p className="text-2xl font-black text-foreground">{order.total_pages}</p>
             </div>
             <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Receipt Total</p>
                <p className="text-2xl font-black text-blue-600">₹{order.total_amount}</p>
             </div>
             <div className="text-center md:text-left hidden md:block">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                <p className="text-sm font-black text-green-600 uppercase">Submitted · Library</p>
             </div>
          </div>
        </div>

        {/* Global Student Instruction */}
        {order.files.some(f => f.student_note) && (
          <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20">
            <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs mb-4 opacity-80">
               <MessageSquare size={16} /> Printing Special Instructions
            </div>
            {order.files.filter(f => f.student_note).map((f, i) => (
              <div key={i} className="mb-4 last:mb-0 bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">{f.file_name}:</p>
                <p className="text-xl font-black leading-tight italic">"{f.student_note}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Files Checklist */}
        <div className="bg-white rounded-[32px] border border-input p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-black text-lg text-foreground uppercase tracking-tight">Documents to Print ({order.files.length})</h3>
             {filesDownloaded && <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ready to Print</div>}
          </div>
          
          <div className="space-y-4">
            {order.files.map((f, i) => {
              const isDownloaded = downloadedFiles.has(f.file_storage_key);
              return (
                <div key={i} className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${isDownloaded ? 'bg-secondary border-transparent opacity-60' : 'bg-white border-secondary shadow-sm hover:border-blue-600/30'}`}>
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <FileTypeIcon type={f.file_type} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate uppercase tracking-tight mb-1">{f.file_name}</p>
                    <div className="flex flex-wrap gap-2">
                       <span className="text-[10px] font-black text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg uppercase">{f.print_type}</span>
                       <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">{f.page_count} Pgs</span>
                       <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg uppercase">×{f.copies} Copies</span>
                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">{f.sides}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadSingleFile(f)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-sm border-2 ${isDownloaded ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                  >
                    {isDownloaded ? <CheckCircle size={20} /> : <Download size={20} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Workflow Actions */}
        <div className="grid grid-cols-1 gap-4">
          {order.print_status === 'queued' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className={`p-8 rounded-[32px] border-2 flex flex-col items-center text-center transition-all ${filesDownloaded ? 'bg-blue-50 border-blue-600' : 'bg-white border-secondary opacity-50'}`}>
                   <Printer size={32} className={`mb-4 ${filesDownloaded ? 'text-blue-600' : 'text-slate-300'}`} />
                   <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Print Status</p>
                   <button
                    onClick={() => handleStatusUpdate('ready')}
                    disabled={!filesDownloaded}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-blue-600/30"
                   >
                     Mark as Ready
                   </button>
               </div>
               <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col items-center justify-center text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Notice</p>
                   <p className="text-xs font-bold leading-relaxed">Please ensure documents are printed correctly according to student's requirements before marking as ready.</p>
               </div>
            </div>
          )}

          {order.print_status === 'ready' && (
            <button
               onClick={() => handleStatusUpdate('completed')}
               className="w-full py-6 rounded-[32px] bg-green-600 text-white font-black text-xl uppercase tracking-tighter shadow-xl shadow-green-600/20 hover:scale-[1.01] transition transform active:scale-95 flex items-center justify-center gap-4"
            >
               <Package size={24} /> Mark as Collected
            </button>
          )}

          {order.print_status === 'completed' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border-2 border-dashed border-emerald-500 text-emerald-600 rounded-[32px] p-8 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
                <CheckCircle size={40} />
                <p className="font-black text-lg uppercase tracking-tight">Order Fully Handed Over</p>
                <p className="text-xs font-bold opacity-70">Security protocol: Sensitive files have been scheduled for deletion.</p>
              </div>
              
              <button
                onClick={handleDeleteOrder}
                className="w-full py-6 rounded-[32px] bg-red-600 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition transform active:scale-95 flex items-center justify-center gap-4 border-b-4 border-red-800"
              >
                <Download size={24} /> I COMPLETED MY DOWNLOAD - DELETE NOW
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
