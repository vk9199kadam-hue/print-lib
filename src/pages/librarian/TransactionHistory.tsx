import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, Library, Search, Loader2 } from 'lucide-react';
import { DB } from '../../utils/db';
import * as XLSX from 'xlsx';

interface PaymentRecord {
  _id: string;
  print_id: string;
  name: string;
  prn?: string;
  amount_paid: number;
  payment_type?: string;
  month: string;
  created_at: number;
}

function formatDate(iso: number | string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'xerox'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // e.g. "2026-08"
  );

  // Generate selector options for the past 12 months
  const monthsList = useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      list.push(`${yyyy}-${mm}`);
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  }, []);

  // Fetch payment records from the database whenever selected month changes
  useEffect(() => {
    setLoading(true);
    DB.getPaymentRecords(selectedMonth)
      .then((data: PaymentRecord[]) => {
        setRecords(data || []);
        setLoading(false);
      })
      .catch(() => {
        setRecords([]);
        setLoading(false);
      });
  }, [selectedMonth]);

  const filtered = records.filter(r => {
    const pType = r.payment_type || 'online';
    if (typeFilter !== 'all' && pType !== typeFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.name?.toLowerCase().includes(q) ||
      r.prn?.toLowerCase().includes(q) ||
      r.print_id?.toLowerCase().includes(q)
    );
  });

  // Calculate statistics breakdown
  const onlineTotal = records.filter(r => (r.payment_type || 'online') === 'online').reduce((s, r) => s + (r.amount_paid || 0), 0);
  const xeroxTotal = records.filter(r => (r.payment_type || 'online') === 'xerox').reduce((s, r) => s + (r.amount_paid || 0), 0);
  const grandTotal = records.reduce((s, r) => s + (r.amount_paid || 0), 0);

  const handleDownloadExcel = () => {
    const rows = filtered.map(r => ({
      'Date & Time': formatDate(r.created_at),
      'Print ID': r.print_id || '-',
      'Print Type': (r.payment_type || 'online').toLowerCase() === 'xerox' ? 'Xerox (Physical)' : 'Online Print',
      'Student Name': r.name || '-',
      'PRN / Roll Number': r.prn || '-',
      'Amount Paid (₹)': r.amount_paid ?? 0,
      'Billing Month': r.month || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths for clean spreadsheet layout
    ws['!cols'] = [
      { wch: 22 }, // Date & Time
      { wch: 16 }, // Print ID
      { wch: 18 }, // Print Type
      { wch: 25 }, // Name
      { wch: 18 }, // PRN
      { wch: 16 }, // Amount
      { wch: 14 }, // Month
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Records');

    XLSX.writeFile(wb, `Library_Payment_Records_${selectedMonth}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-slate-950 text-white flex flex-col items-center py-6 border-r border-white/5 z-50">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-600/20">
            <Library size={24} />
          </div>
          <p className="hidden md:block text-[10px] font-black tracking-widest text-blue-400 uppercase">Library Panel</p>
        </div>
        <nav className="flex-1 w-full px-2 space-y-2">
          <button
            onClick={() => navigate('/librarian/dashboard')}
            className="w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl transition-all text-gray-400 hover:bg-white/5"
          >
            <ArrowLeft size={20} />
            <span className="hidden md:block font-bold text-sm">Back to Queue</span>
          </button>
          <button
            className="w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl transition-all bg-blue-600 text-white"
          >
            <FileSpreadsheet size={20} />
            <span className="hidden md:block font-bold text-sm">Transaction History</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Records Log</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Unified transaction history: Online Prints & Physical Xerox Entries
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Month Dropdown Selector */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm font-bold text-sm text-slate-700 outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {monthsList.map(m => {
                    const [year, month] = m.split('-');
                    const date = new Date(Number(year), Number(month) - 1);
                    const label = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                    return (
                      <option key={m} value={m}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={handleDownloadExcel}
                disabled={filtered.length === 0}
                className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 border-b-4 border-emerald-800"
              >
                <Download size={18} />
                Download Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Stats row */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Records', value: records.length, color: 'text-slate-800' },
                { label: 'Total Revenue (₹)', value: `₹${grandTotal.toFixed(2)}`, color: 'text-emerald-600' },
                { label: 'Online Revenue (₹)', value: `₹${onlineTotal.toFixed(2)}`, color: 'text-blue-600' },
                { label: 'Xerox Revenue (₹)', value: `₹${xeroxTotal.toFixed(2)}`, color: 'text-purple-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Filter Tabs */}
            <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 w-full sm:w-auto">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All Records
              </button>
              <button
                onClick={() => setTypeFilter('online')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === 'online' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-600'}`}
              >
                Online Prints
              </button>
              <button
                onClick={() => setTypeFilter('xerox')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === 'xerox' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'}`}
              >
                Xerox Prints
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by student name, PRN or print ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-blue-500 outline-none transition font-medium text-sm"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-bold text-xs uppercase tracking-widest">Loading records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No transaction records found</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Date & Time</th>
                      <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Print ID</th>
                      <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Type</th>
                      <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Student Name</th>
                      <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">PRN / Roll No.</th>
                      <th className="text-right px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((record, idx) => {
                      const pType = (record.payment_type || 'online').toLowerCase();
                      return (
                        <tr
                          key={record._id}
                          className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                        >
                          <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                            {formatDate(record.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap border border-slate-200">
                              {record.print_id || '-'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {pType === 'xerox' ? (
                              <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md whitespace-nowrap">
                                📠 Xerox
                              </span>
                            ) : (
                              <span className="font-bold text-[10px] uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md whitespace-nowrap">
                                📄 Online
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{record.name}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-semibold text-slate-600">
                              {record.prn || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-black text-emerald-700 text-base">₹{record.amount_paid ?? 0}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {filtered.length} record{filtered.length !== 1 ? 's' : ''} shown
                </p>
                <p className="text-xs font-black text-emerald-600">
                  Total Collected: ₹{filtered.reduce((s, r) => s + (r.amount_paid || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
