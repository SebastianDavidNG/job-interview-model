'use client';
import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface TranscriptItem {
  id: string;
  text: string;
  isInterim: boolean;
  speaker?: string;
  timestamp: string;
  confidence?: number;
}

interface TranscriptPanelProps {
  transcripts: TranscriptItem[];
}

export default function TranscriptPanel({ transcripts }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-cyan-400" />
        <h2 className="font-medium text-white text-sm">Live Transcript</h2>
        <span className="ml-auto text-xs text-slate-500">{transcripts.filter(t => !t.isInterim).length} entries</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Transcripts will appear here</p>
            <p className="text-slate-600 text-xs mt-1">Start recording to begin</p>
          </div>
        ) : (
          transcripts.map(t => (
            <div key={t.id} className={cn('p-3 rounded-lg animate-fade-in', t.isInterim ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-800 border border-slate-700')}>
              {t.speaker && <p className="text-xs font-medium text-cyan-400 mb-1">{t.speaker}</p>}
              <p className={cn('text-sm leading-relaxed', t.isInterim ? 'text-slate-400 italic' : 'text-slate-200')}>{t.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-slate-600">{new Date(t.timestamp).toLocaleTimeString()}</span>
                {t.confidence !== undefined && <span className="text-xs text-slate-600">{Math.round(t.confidence * 100)}%</span>}
                {t.isInterim && <span className="text-xs text-slate-500 italic">processing...</span>}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
