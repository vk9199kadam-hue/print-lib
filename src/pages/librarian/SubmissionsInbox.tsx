import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, BarChart3, LogOut, Search, Clock, Inbox, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DB } from '../../utils/db';
import { Submission, NoticeType } from '../../types';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function SubmissionsInbox() {
  const navigate = useNavigate();
  const { currentShop, logout } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string | null>(null);
  const [noticeText, setNoticeText] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('acknowledgment');

  useEffect(() => {
    const load = async () => {
      setSubmissions(await DB.getSubmissions());
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.validation_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.submission_id.toLowerCase().includes(q) || s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q);
    }
    return true;
  });

  const handleLogout = () => { logout(); navigate('/'); };

  const handleStatusChange = async (id: string, status: Submission['validation_status']) => {
    await DB.updateSubmissionStatus(id, status);
    setSubmissions(await DB.getSubmissions());
  };

  const handleAddNotice = async (id: string) => {
    if (!noticeText.trim()) return;
    await DB.addNoticeToSubmission(id, noticeType, noticeText);
    setNoticeText('');
    setSubmissions(await DB.getSubmissions());
  };

  const downloadDoc = async (key: string, name: string) => {
    try {
      const fileUrl = await DB.getFile(key);
      if (!fileUrl) return alert('File missing in storage');
      
      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      a.download = name;
      a.click();
    } catch (e) {
      console.error(e);
      alert('Failed to securely access file');
    }
  };

  const statusColors: Record<string, string> = {
    received: 'bg-blue-100 text-blue-700 border-blue-200',
    under_review: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    resubmit: 'bg-orange-100 text-orange-700 border-orange-200'
  };

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
            <Printer size={18} /> Print Queue
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-green-primary/20 text-green-300">
            <Inbox size={18} /> Submissions Inbox
          </button>
          <button onClick={() => navigate('/librarian/analytics')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300/60 hover:text-green-300 hover:bg-green-primary/10 transition">
            <BarChart3 size={18} /> Analytics
          </button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300 mt-auto">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60">
        <header className="md:hidden bg-card border-b border-input px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <h1 className="font-syne font-bold text-lg text-foreground">Print<span className="text-green-primary">Ease</span></h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/librarian/analytics')} className="p-2 text-muted-foreground"><BarChart3 size={18} /></button>
            <button onClick={handleLogout} className="p-2 text-destructive"><LogOut size={18} /></button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Inbox size={24} className="text-green-primary" />
            <h2 className="font-syne font-bold text-2xl text-foreground">Submissions Inbox</h2>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by Submission ID, Name or Roll No..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'received', 'under_review', 'approved', 'rejected', 'resubmit'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
                  ${filter === f ? 'bg-green-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-input hover:bg-secondary'}`}
              >
                {f.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-input">
              <p className="text-muted-foreground">No document submissions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(sub => (
                <div key={sub.submission_id} className="bg-card rounded-xl border border-input overflow-hidden shadow-sm">
                  {/* Header row */}
                  <div className="p-4 border-b border-input flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedDocs(selectedDocs === sub.submission_id ? null : sub.submission_id)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{sub.submission_id}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[sub.validation_status]}`}>
                          {sub.validation_status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {timeAgo(sub.created_at)}</span>
                      </div>
                      <h3 className="font-bold text-foreground text-lg">{sub.student_name} <span className="text-sm font-normal text-muted-foreground ml-2">({sub.roll_number})</span></h3>
                      <p className="text-sm text-foreground mt-1">Project: <span className="font-medium">{sub.project_title}</span> ({sub.document_type})</p>
                      <p className="text-xs text-muted-foreground mt-1">Dept: {sub.department} | Guide: {sub.guide_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); downloadDoc(sub.file_storage_key, sub.file_name); }} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium transition">
                        <FileText size={16} /> Download Doc
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details & Notice Section */}
                  {selectedDocs === sub.submission_id && (
                    <div className="bg-secondary/30 p-4 space-y-4">
                      {sub.remarks && (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm border border-yellow-200">
                          <strong>Student Remarks:</strong> {sub.remarks}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-3">
                          <h4 className="font-semibold text-sm">Notice Section (Seen by Student)</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {sub.notices.length === 0 ? <p className="text-sm text-muted-foreground italic">No notices yet.</p> : sub.notices.map(n => (
                              <div key={n.id} className="text-sm bg-card border border-input p-2 rounded relative">
                                <span className="text-[10px] text-muted-foreground absolute top-1 right-2">{new Date(n.created_at).toLocaleDateString()}</span>
                                <strong className="block text-xs uppercase mb-1">{n.type}</strong>
                                {n.message}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 space-y-3 bg-card p-3 rounded-lg border border-input">
                          <h4 className="font-semibold text-sm">Admin Controls</h4>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Update Status:</label>
                            <select
                              value={sub.validation_status}
                              onChange={e => handleStatusChange(sub.submission_id, e.target.value as unknown as Submission['validation_status'])}
                              className="w-full text-sm p-1.5 rounded border border-input bg-background"
                            >
                              <option value="received">Received</option>
                              <option value="under_review">Under Review</option>
                              <option value="resubmit">Resubmit Required</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          
                          <div className="pt-2 border-t border-input">
                            <label className="text-xs text-muted-foreground block mb-1">Write Official Notice:</label>
                            <select
                              value={noticeType}
                              onChange={e => setNoticeType(e.target.value as unknown as NoticeType)}
                              className="w-full text-sm p-1.5 rounded border border-input bg-background mb-2"
                            >
                              <option value="acknowledgment">Acknowledgment</option>
                              <option value="missing">Missing Information</option>
                              <option value="resubmit">Resubmit Instruction</option>
                              <option value="approved">Approval Notice</option>
                              <option value="rejected">Rejection Notice</option>
                            </select>
                            <textarea
                              value={noticeText}
                              onChange={e => setNoticeText(e.target.value)}
                              placeholder="Type comment here..."
                              className="w-full text-sm p-2 rounded border border-input bg-background resize-none h-16 mb-2 outline-none focus:ring-1 focus:ring-green-400"
                            />
                            <button
                              onClick={() => handleAddNotice(sub.submission_id)}
                              disabled={!noticeText.trim()}
                              className="w-full bg-green-primary text-white text-sm font-semibold py-1.5 rounded disabled:opacity-50"
                            >
                              Post Notice
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
