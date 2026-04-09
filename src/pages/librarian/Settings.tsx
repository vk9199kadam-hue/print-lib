import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, LogOut, Printer, Zap, Inbox, BookOpen, BarChart3, Settings as SettingsIcon, User, Phone, Globe, CreditCard, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';

async function rpc(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data.data;
}

export default function ShopSettings() {
  const navigate = useNavigate();
  const { currentShop, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    library_name: '',
    email: '',
    upi_id: '',
    contact_number: ''
  });

  const [pricing, setPricing] = useState({
    bw_rate: 1,
    color_rate: 4,
    a3_bw_rate: 10,
    a3_color_rate: 15,
    spiral_binding_fee: 20,
    stapling_fee: 0,
    capstone_page_rate: 4,
    capstone_urgent_fee: 180,
    capstone_non_urgent_fee: 140
  });

  useEffect(() => {
    const loadData = async () => {
      // Load pricing from local DB (localStorage)
      const currentPricing = DB.getPricing();
      setPricing(currentPricing);

      if (currentShop?.email) {
        try {
          const profile = await rpc('getlibrarianProfile', { email: currentShop.email });
          if (profile) {
            setFormData({
              name: profile.name || '',
              library_name: profile.library_name || '',
              email: profile.email || '',
              upi_id: profile.upi_id || '',
              contact_number: profile.contact_number || ''
            });
          }
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      }
    };
    loadData();
  }, [currentShop]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save profile to server
      await rpc('updatelibrarianProfile', formData);
      
      // Save pricing to server and local cache
      await DB.savePricing(pricing);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanStorage = async () => {
    if (!window.confirm("Are you sure you want to clean up abandoned student files? This only deletes files that were abandoned before payment.")) return;
    setIsCleaning(true);
    try {
      const res = await DB.cleanOrphanedFiles();
      alert(`Storage Cleaned! Deleted ${res?.deleted || 0} abandoned files.`);
    } catch (e) {
      alert('Failed to clean storage');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col p-4 text-primary-foreground fixed h-full z-30" style={{ backgroundColor: '#061A0F' }}>
        <div className="mb-8">
          <h1 className="font-syne font-bold text-xl">Print<span className="text-green-400">Ease</span></h1>
          <p className="text-xs text-green-300/60 mt-0.5">{currentShop?.library_name}</p>
        </div>
        <nav className="space-y-1 flex-1">
          <button onClick={() => navigate('/librarian/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <Printer size={18} /> All Orders
          </button>
          <button onClick={() => navigate('/librarian/capstone')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <BookOpen size={18} /> Capstone Projects
          </button>
          <button onClick={() => navigate('/librarian/submissions')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <Inbox size={18} /> Submissions Inbox
          </button>
          <button onClick={() => navigate('/librarian/analytics')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <BarChart3 size={18} /> Analytics
          </button>
          <button onClick={() => navigate('/librarian/settings')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-green-primary/20 text-green-300">
            <SettingsIcon size={18} /> Settings
          </button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300 mt-auto">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <main className="flex-1 md:ml-60">
        <header className="bg-card border-b border-input px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button onClick={() => navigate('/librarian/dashboard')} className="p-2 hover:bg-secondary rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-syne font-bold text-xl">Shop Profile Settings</h2>
        </header>

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 animate-fade-in">
             <AlertCircle className="text-amber-600 mt-1 shrink-0" size={24} />
             <div>
               <h4 className="font-bold text-amber-950">Connection Support Active</h4>
               <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                 Updating these settings will change your UPI ID and contact details for all current and future student print requests. Ensure your UPI ID is correct to receive payments accurately.
               </p>
             </div>
          </div>

          <form onSubmit={handleSave} className="bg-card border border-input rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><User size={14}/> librarian Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Globe size={14}/> Shop Name</label>
                <input 
                  type="text" 
                  value={formData.library_name} 
                  onChange={e => setFormData({...formData, library_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><CreditCard size={14}/> Shop UPI ID (for QR Payments)</label>
                <input 
                  type="text" 
                  placeholder="e.g. yourname@upi"
                  value={formData.upi_id} 
                  onChange={e => setFormData({...formData, upi_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-amber-50/30 border-amber-200 text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="text-[10px] text-amber-700 font-medium">Changing this will update all student payment QRs immediately.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Phone size={14}/> Support Mobile Number</label>
                <input 
                  type="tel" 
                  value={formData.contact_number} 
                  onChange={e => setFormData({...formData, contact_number: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-input space-y-6">
              <h3 className="font-syne font-bold text-lg flex items-center gap-2">
                <Printer size={20} className="text-green-primary" /> 
                Print Service Pricing (INR)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">B&W Rate (per page)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input 
                      type="number" 
                      value={pricing.bw_rate} 
                      onChange={e => setPricing({...pricing, bw_rate: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Color Rate (per page)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input 
                      type="number" 
                      value={pricing.color_rate} 
                      onChange={e => setPricing({...pricing, color_rate: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">A3 B&W Rate (per page)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input 
                      type="number" 
                      value={pricing.a3_bw_rate} 
                      onChange={e => setPricing({...pricing, a3_bw_rate: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">A3 Color Rate (per page)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input 
                      type="number" 
                      value={pricing.a3_color_rate} 
                      onChange={e => setPricing({...pricing, a3_color_rate: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Spiral Binding</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input 
                      type="number" 
                      value={pricing.spiral_binding_fee} 
                      onChange={e => setPricing({...pricing, spiral_binding_fee: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-secondary/30 focus:ring-2 focus:ring-green-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-primary/5 p-4 rounded-2xl border border-green-primary/10 space-y-4">
                <h4 className="text-sm font-bold text-green-primary flex items-center gap-2">
                  <BookOpen size={16} /> Capstone Projects (Thesis)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Rate / Page</label>
                    <input 
                      type="number" 
                      value={pricing.capstone_page_rate} 
                      onChange={e => setPricing({...pricing, capstone_page_rate: Number(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-white focus:ring-2 focus:ring-green-primary outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Urgent Embossing</label>
                    <input 
                      type="number" 
                      value={pricing.capstone_urgent_fee} 
                      onChange={e => setPricing({...pricing, capstone_urgent_fee: Number(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-white focus:ring-2 focus:ring-green-primary outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Normal Embossing</label>
                    <input 
                      type="number" 
                      value={pricing.capstone_non_urgent_fee} 
                      onChange={e => setPricing({...pricing, capstone_non_urgent_fee: Number(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-white focus:ring-2 focus:ring-green-primary outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            {/* Storage Cleanup Section */}
            <div className="pt-4 border-t border-input">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-red-50 p-4 border border-red-200 rounded-2xl">
                 <div className="flex-1">
                   <h4 className="text-red-900 font-bold flex items-center gap-2"><Trash2 size={18} /> Clean Up Abandoned Uploads</h4>
                   <p className="text-xs text-red-800/70 mt-1">
                     Deletes student files that were uploaded but never technically ordered (cancelled before payment). Good for clearing storage.
                   </p>
                 </div>
                 <button 
                   type="button" 
                   disabled={isCleaning} 
                   onClick={handleCleanStorage}
                   className="w-full md:w-auto bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
                 >
                   {isCleaning ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                   {isCleaning ? 'Cleaning...' : 'Clean Storage'}
                 </button>
              </div>
            </div>

            <div className="pt-4 border-t border-input">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? 'Saving Changes...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-right z-50">
          <CheckCircle size={20} />
          <span className="font-bold text-sm">Profile updated successfully!</span>
        </div>
      )}
    </div>
  );
}
