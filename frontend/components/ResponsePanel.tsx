'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Brain, Copy, Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDate } from '../lib/utils';

interface PreviousResponse { text: string; provider: string; timestamp: string; }

const MAX_PREVIOUS_RESPONSES = 10;

interface ResponsePanelProps {
  currentResponse: string;
  isStreaming: boolean;
  provider?: string;
  latencyMs?: number;
}

export default function ResponsePanel({ currentResponse, isStreaming, provider, latencyMs }: ResponsePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [previousResponses, setPreviousResponses] = useState<PreviousResponse[]>([]);
  const prevResponseRef = useRef<string>('');

  useEffect(() => {
    if (!isStreaming && currentResponse && currentResponse !== prevResponseRef.current) {
      prevResponseRef.current = currentResponse;
      setPreviousResponses(prev => [
        ...prev,
        { text: currentResponse, provider: provider ?? 'unknown', timestamp: formatDate(new Date()) },
      ].slice(-MAX_PREVIOUS_RESPONSES));
    }
  }, [isStreaming, currentResponse, provider]);

  const handleCopy = useCallback(async () => {
    if (!currentResponse) return;
    try {
      await navigator.clipboard.writeText(currentResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }, [currentResponse]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Brain className="w-4 h-4 text-blue-400" />
        <h2 className="font-medium text-white text-sm">AI Response</h2>
        {provider && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{provider}</span>}
        {isStreaming && (
          <div className="flex items-center gap-1.5 ml-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-blue-400">Generating...</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {latencyMs && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Zap className="w-3 h-3" />{latencyMs}ms
            </span>
          )}
          {currentResponse && (
            <button onClick={handleCopy} className={cn('p-1.5 rounded-md transition-colors', copied ? 'text-green-400 bg-green-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!currentResponse && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brain className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">AI responses will appear here</p>
            <p className="text-slate-600 text-xs mt-1">Responses are generated automatically from transcriptions</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <p className={cn('text-slate-200 leading-relaxed whitespace-pre-wrap text-base', isStreaming && 'after:content-["|"] after:animate-pulse after:text-blue-400 after:ml-0.5')}>
              {currentResponse}
            </p>
          </div>
        )}
      </div>

      {previousResponses.length > 0 && (
        <div className="border-t border-slate-800">
          <button onClick={() => setShowPrevious(v => !v)} className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors">
            <span>Previous responses ({previousResponses.length})</span>
            {showPrevious ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showPrevious && (
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {previousResponses.map((r, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{r.text}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span>{r.provider}</span><span>{r.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
