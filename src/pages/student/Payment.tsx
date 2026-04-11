/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { calcTotal, calcFilePrice } from '../../utils/priceCalculator';
import { generateQR } from '../../utils/qrCode';
import { playSuccessSound } from '../../utils/sound';
import { FileItem, ExtraServices } from '../../types';
import FileTypeIcon from '../../components/FileTypeIcon';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const state = location.state as { 
    files: FileItem[]; 
    extras: ExtraServices; 
    isCapstone?: boolean;
    capstoneData?: {
      name: string;
      contact: string;
      college: string;
      department: string;
      receiving_date: string;
    };
  } | null;

  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!state || !currentUser) {
      setRedirecting(true);
      navigate('/student/upload');
    }
  }, [state, currentUser, authLoading, navigate]);
  
  const pricing = DB.getPricing();
  
  const filesWithPrices = useMemo(() => {
    if (!state?.files) return [];
    return state.files.map(f => {
      const calc = calcFilePrice(f, pricing, state.isCapstone);
      return { ...f, bw_pages: calc.bw_pages, color_pages: calc.color_pages, file_price: calc.file_price };
    });
  }, [state?.files, pricing, state?.isCapstone]);

  const priceResult = useMemo(() => {
    if (!state?.files || !state?.extras) return { itemized: [], subtotal: 0, service_fee: 0, total_amount: 0 };
    return calcTotal(state.files, state.extras, pricing, state.isCapstone);
  }, [state?.files, state?.extras, pricing, state?.isCapstone]);

  useEffect(() => {
    if (redirecting) return;
    const timer = setTimeout(() => {
      handleFinishPayment();
    }, 1500);
    return () => clearTimeout(timer);
  }, [redirecting]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
       <Loader2 className="animate-spin text-blue-primary" size={40} />
    </div>
  );

  if (redirecting || !state || !currentUser) return null;

  const handleFinishPayment = async () => {
    try {
      if (!currentUser.student_print_id || !currentUser.id) {
         throw new Error("Your session is incomplete. Please log out and log back in.");
      }

      const tempId = 'ORD-' + Date.now();
      const qr = await generateQR(tempId);
      
      const order = await DB.createOrder({
        order_id: tempId,
        student_id: currentUser.id,
        student_print_id: currentUser.student_print_id,
        student_name: state.isCapstone ? (state.capstoneData?.name || currentUser.name) : currentUser.name,
        order_type: state.isCapstone ? 'capstone' : 'standard',
        files: filesWithPrices.map(({ base64, ...rest }) => rest as FileItem),
        total_bw_pages: filesWithPrices.reduce((s, f) => s + f.bw_pages, 0),
        total_color_pages: filesWithPrices.reduce((s, f) => s + f.color_pages, 0),
        total_pages: filesWithPrices.reduce((s, f) => s + ((f.page_count || 1) * f.copies), 0),
        extra_services: state.extras,
        service_fee: priceResult.service_fee,
        subtotal: priceResult.subtotal,
        total_amount: priceResult.total_amount,
        payment_status: 'paid', // Fake success for library platform
        print_status: 'queued',
        qr_code: qr,
        contact_number: state.capstoneData?.contact,
        college: state.capstoneData?.college,
        department: state.capstoneData?.department,
        receiving_date: state.capstoneData?.receiving_date
      });

      if (order) {
        setProcessing(false);
        setSuccess(true);
        playSuccessSound();
        
        // Show thanks for 2 seconds then go to confirmation page
        setTimeout(() => {
          navigate('/student/confirmed', { state: { order }, replace: true });
        }, 2000);
        
      } else {
        throw new Error('Database response was empty.');
      }
    } catch (e: unknown) {
      setProcessing(false);
      setError(e instanceof Error ? e.message : 'System error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Processing / Success overlay */}
      {(processing || success) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-white/10">
            {processing ? (
              <>
                <Loader2 size={56} className="animate-spin text-blue-primary mx-auto mb-6" />
                <h3 className="font-syne font-black text-xl text-foreground mb-2 tracking-tight">Sending to Library...</h3>
                <p className="text-sm text-muted-foreground font-medium">Please wait while your document is being uploaded</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <h3 className="font-syne font-black text-2xl text-foreground mb-2 text-green-500 tracking-tight">Document Sent!</h3>
                <p className="text-sm font-bold text-foreground mb-1">Your document is sent on the library platform</p>
                <p className="text-xs text-muted-foreground mt-4">Returning to dashboard...</p>
              </>
            )}
          </div>
        </div>
      )}

      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/student/upload')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm font-bold">Back</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-blue-primary">Review & Submit</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6 mt-4">
        {/* Order summary */}
        <div className="bg-white rounded-3xl border border-input shadow-sm overflow-hidden">
          <div className="bg-secondary px-5 py-4 border-b border-input">
             <h2 className="font-syne font-black text-lg text-foreground">Order Overview</h2>
          </div>
          <div className="p-5">
            {filesWithPrices.map((f, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-xl transition px-2 -mx-2">
                <FileTypeIcon type={f.file_type} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{f.file_name}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-widest">{f.page_count || 1} Pages • {f.print_type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="bg-white rounded-3xl border border-input p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-2 text-center text-lg">Send to Librarian</h3>
          <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
            Clicking submit will transfer your documents directly to the library printing queue.
          </p>
          
          <button
            onClick={handleFinishPayment}
            disabled={processing || success}
            className="w-full py-5 rounded-2xl bg-blue-primary text-primary-foreground font-black text-lg hover:opacity-95 transition-all transform active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-primary/20 flex flex-col items-center justify-center border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
          >
             <span>SUBMIT JOB NOW</span>
          </button>

          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
            {error}
          </div>}
        </div>
      </div>
    </div>
  );
}
