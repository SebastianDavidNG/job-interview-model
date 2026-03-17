'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, Calendar, Building, ChevronLeft, ChevronRight, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '../../lib/utils';

interface SessionItem {
  id: string;
  title: string;
  role: string;
  company?: string;
  status: string;
  aiProvider: string;
  createdAt: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  ended: 'bg-slate-500/20 text-slate-400',
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/sessions?page=${p}&limit=10`);
      setSessions(data.sessions);
      setTotalPages(data.pages);
    } catch {
      setError('Failed to load sessions. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(page); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/sessions/${id}`);
      fetchSessions(page);
    } catch { setError('Failed to delete session.'); }
  };

  return (
    <main className="min-h-screen bg-slate-900">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">Interview History</span>
          </div>
        </div>
        <Link href="/setup" className="btn-primary text-sm">New Interview</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-6">Past Sessions</h1>
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">{error}</div>}
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-20" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-16">
            <Mic className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No sessions yet</p>
            <p className="text-slate-500 text-sm mb-6">Start your first interview to see it here.</p>
            <Link href="/setup" className="btn-primary">Start Interview</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="card flex items-center justify-between hover:border-slate-600 transition-colors">
                <Link href={`/session/${s.id}`} className="flex-1 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{s.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] ?? 'bg-slate-600 text-slate-300'}`}>{s.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{s.role}</span>
                      {s.company && <><Building className="w-3.5 h-3.5" /><span>{s.company}</span></>}
                      <Calendar className="w-3.5 h-3.5" /><span>{formatDate(new Date(s.createdAt))}</span>
                    </div>
                  </div>
                </Link>
                <button onClick={() => handleDelete(s.id)} className="ml-4 text-slate-500 hover:text-red-400 transition-colors p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-slate-400 text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
