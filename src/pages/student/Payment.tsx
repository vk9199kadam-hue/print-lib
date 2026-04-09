/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { calcTotal, calcFilePrice } from '../../utils/priceCalculator';
import { generateQR } from '../../utils/qrCode';
import { playSuccessSound } from '../../utils/sound';
import { FileItem, ExtraServices } from '../../types';
import FileTypeIcon from '../../components/FileTypeIcon';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const state = location.state as { 
    files: FileItem[]; 
    extras: ExtraServices; 
    isCapstone?: boolean; 
    capstoneData?: { name: string; contact: string; college: string; department: string; receiving_date: string } 
  } | null;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [shopInfo, setShopInfo] = useState<{ library_name: string; upi_id: string; contact_number: string } | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getPublicShopInfo' }) });
        const data = await res.json();
        if (data.data) setShopInfo(data.data);
      } catch (e) { console.error(e); }
    };
    fetchShop();
  }, []);

  if (!state || !currentUser) { navigate('/student/upload'); return null; }
  const pricing = DB.getPricing();
  const filesWithPrices = state.files.map(f => {
    const calc = calcFilePrice(f, pricing, state.isCapstone);
    return { ...f, bw_pages: calc.bw_pages, color_pages: calc.color_pages, file_price: calc.file_price };
  });
  const priceResult = calcTotal(state.files, state.extras, pricing, state.isCapstone);

  const handleRazorpayClick = () => {
    if (processing) return;
    setError('');

    if (!window.Razorpay) {
      setError("Payment gateway is loading. Please wait or refresh the page.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SYEC6gGYHke7Uv",
      amount: priceResult.total_amount * 100,
      currency: "INR",
      name: "Library Print",
      description: "Print Order Payment",
      image: "https://Library Print-queue.vercel.app/favicon.svg",
      handler: function (response: any) {
        console.log("Payment successful:", response.razorpay_payment_id);
        handleFinishPayment();
      },
      prefill: {
        name: currentUser.name,
        email: currentUser.email,
        contact: state.capstoneData?.contact || ""
      },
      theme: {
        color: "#2b84ea"
      },
      modal: {
        ondismiss: function() {
          setProcessing(false);
        }
      }
    };

    setProcessing(true);
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleFinishPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Pre-flight check: ensure session is fully populated
      if (!currentUser.student_print_id || !currentUser.id) {
         throw new Error("Your session is incomplete. Please log out and log back in to refresh your data.");
      }

      const tempId = 'ORD-' + Date.now();
      const qr = await generateQR(tempId);
      const order = await DB.createOrder({
        order_id: tempId,
        student_id: currentUser.id,
        student_print_id: currentUser.student_print_id,
        student_name: currentUser.name,
        order_type: state.isCapstone ? 'capstone' : 'standard',
        contact_number: state.capstoneData?.contact || null,
        college: state.capstoneData?.college || null,
        department: state.capstoneData?.department || null,
        receiving_date: state.capstoneData?.receiving_date || null,
        // Remove the base64 string from the file list to avoid hitting Vercel's 4.5MB request limit
        files: filesWithPrices.map(({ base64, ...rest }) => rest),
        total_bw_pages: filesWithPrices.reduce((s, f) => s + f.bw_pages, 0),
        total_color_pages: filesWithPrices.reduce((s, f) => s + f.color_pages, 0),
        total_pages: filesWithPrices.reduce((s, f) => s + (f.page_count * f.copies), 0),
        extra_services: state.extras,
        service_fee: priceResult.service_fee,
        subtotal: priceResult.subtotal,
        total_amount: priceResult.total_amount,
        payment_status: 'paid',
        print_status: 'queued',
        qr_code: qr,
      });

      if (order) {
        playSuccessSound();
        navigate('/student/confirmed', { state: { order: { ...order, qr_code: qr } }, replace: true });
      } else {
        throw new Error('Database response was empty. This usually happens if your user record is missing required fields.');
      }
    } catch (e: unknown) {
      setProcessing(false);
      console.error('Payment Error:', e);
      setError(e instanceof Error ? e.message : 'Payment system is currently unavailable. Please try again or re-login.');
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <Loader2 size={48} className="animate-spin text-blue-primary mx-auto mb-4" />
            <h3 className="font-syne font-bold text-lg text-foreground mb-2">Processing Payment...</h3>
            <p className="text-sm text-muted-foreground mb-1">₹{priceResult.total_amount} via Razorpay</p>
            <p className="text-xs text-muted-foreground mb-4">Please do not close this page</p>
            {error && <p className="text-destructive text-sm mt-4 font-semibold">{error}</p>}
          </div>
        </div>
      )}

      <header className="bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/student/upload')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> <span className="text-sm">Back</span>
        </button>
        <span className="text-sm text-muted-foreground">Step 2 of 3</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Order summary */}
        <div className="bg-card rounded-2xl border border-input p-4">
          <h2 className="font-syne font-semibold text-lg text-foreground mb-3">Order Summary</h2>
          {filesWithPrices.map((f, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-input last:border-0">
              <FileTypeIcon type={f.file_type} size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{f.file_name}</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded uppercase">{f.page_count}pg</span>
                  <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 rounded uppercase">{f.print_type}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded uppercase">×{f.copies} copies</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded uppercase">{f.sides}</span>
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 rounded uppercase">{f.paper_size || 'A4'}</span>
                  {f.slidesPerPage && f.slidesPerPage > 1 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 rounded uppercase">{f.slidesPerPage} slides/pg</span>
                  )}
                </div>
                {f.student_note && <p className="text-[10px] text-muted-foreground italic mt-1 font-medium">Note: "{f.student_note}"</p>}
              </div>
              <span className="text-sm font-semibold text-foreground">₹{f.file_price}</span>
            </div>
          ))}
          {(state.extras.spiral_binding || state.extras.stapling || state.isCapstone) && (
            <div className="pt-2 border-t border-input mt-2 space-y-1">
              {!state.isCapstone && state.extras.spiral_binding && <div className="flex justify-between text-xs text-muted-foreground"><span>Spiral Binding</span><span>₹{pricing.spiral_binding_fee}</span></div>}
              {!state.isCapstone && state.extras.stapling && <div className="flex justify-between text-xs text-muted-foreground"><span>Stapling Service</span><span>₹{pricing.stapling_fee || 5}</span></div>}
              {state.isCapstone && state.extras.capstone_embossing && (
                <div className="flex justify-between text-xs text-muted-foreground font-bold text-emerald-600">
                  <span>Embossing ({state.extras.capstone_embossing === 'black' ? 'Black' : 'Brown'})</span>
                  <span>₹{state.extras.capstone_embossing === 'black' ? 140 : 160}</span>
                </div>
              )}
              {state.isCapstone && !!state.extras.bond_paper_count && (
                <div className="flex justify-between text-xs text-muted-foreground font-bold text-emerald-600">
                  <span>Bond Paper ({state.extras.bond_paper_count} pgs)</span>
                  <span>₹{state.extras.bond_paper_count * 4}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-input">
            <span className="font-semibold text-foreground">Total Amount</span>
            <span className="font-syne font-bold text-xl text-blue-primary">₹{priceResult.total_amount}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-card rounded-2xl border border-input p-4">
          <h3 className="font-semibold text-foreground mb-3 text-center">Secure Checkout via Razorpay</h3>
          <p className="text-xs text-muted-foreground text-center mb-6">Pay using UPI, Credit/Debit Card, or Net Banking</p>
          
          <button
            onClick={handleRazorpayClick}
            disabled={processing}
            className="w-full py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#2b84ea' }}
          >
            {processing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Proceed to Payment (Razorpay) →'
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center font-bold px-4">{error}</p>}
      </div>
    </div>
  );
}
