'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mic, Building, Calendar, Clock, Brain, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '../../../lib/utils';

interface TranscriptRecord { id: string; text: string; speaker?: string; isInterim: boolean; timestamp: string; confidence?: number; }
interface ResponseRecord { id: string; question: string; answer: string; aiProvider: string; latencyMs?: number; timestamp: string; }
interface SessionDetail { id: string; title: string; role: string; company?: string; jobDesc?: string; skills: string[]; language: string; aiProvider: string; status: string; createdAt: string; transcripts: TranscriptRecord[]; responses: ResponseRecord[]; }

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/sessions/${sessionId}`)
      .then(r => { setSession(r.data); setLoading(false); })
      .catch(() => { setError('Session not found'); setLoading(false); });
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !session) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error ?? 'Not found'}</p>
        <Link href="/history" className="btn-secondary">Back to History</Link>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-900">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <Link href="/history" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center"><Mic className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-semibold text-white">Session Review</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="card mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{session.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5"><Mic className="w-4 h-4" />{session.role}</div>
            {session.company && <div className="flex items-center gap-1.5"><Building className="w-4 h-4" />{session.company}</div>}
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(new Date(session.createdAt))}</div>
            <div className="flex items-center gap-1.5"><Brain className="w-4 h-4" />AI: {session.aiProvider}</div>
          </div>
          {session.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {session.skills.map(s => <span key={s} className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300">{s}</span>)}
            </div>
          )}
        </div>

        {session.responses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-blue-400" />AI Responses ({session.responses.length})</h2>
            <div className="space-y-4">
              {session.responses.map(r => (
                <div key={r.id} className="card">
                  <p className="text-blue-400 text-sm font-medium mb-2">Q: {r.question}</p>
                  <p className="text-slate-200 whitespace-pre-wrap">{r.answer}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span>{r.aiProvider}</span>
                    {r.latencyMs && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.latencyMs}ms</span>}
                    <span>{formatDate(new Date(r.timestamp))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {session.transcripts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-cyan-400" />Transcripts ({session.transcripts.length})</h2>
            <div className="card space-y-2">
              {session.transcripts.filter(t => !t.isInterim).map(t => (
                <div key={t.id} className="py-2 border-b border-slate-700 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-200 flex-1">{t.text}</p>
                    <span className="text-xs text-slate-500 flex-shrink-0">{new Date(t.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {t.speaker && <span className="text-xs text-slate-500">{t.speaker}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
