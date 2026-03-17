'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Mic, Pause, Play, Square, ArrowLeft, Wifi, WifiOff, Clock } from 'lucide-react';
import Link from 'next/link';
import { useInterviewStore } from '../../../store/interviewStore';
import { useSocket } from '../../../hooks/useSocket';
import { useAudioCapture } from '../../../hooks/useAudioCapture';
import TranscriptPanel from '../../../components/TranscriptPanel';
import ResponsePanel from '../../../components/ResponsePanel';
import AudioVisualizer from '../../../components/AudioVisualizer';
import { formatDuration } from '../../../lib/utils';

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { socket, isConnected } = useSocket();
  const {
    session, transcripts, currentResponse, isRecording, isPaused, isStreaming,
    elapsedSeconds, setSession, addTranscript, setCurrentQuestion,
    setCurrentResponse, appendResponseChunk, setIsStreaming,
    setIsRecording, setIsPaused, incrementElapsed,
  } = useInterviewStore();
  const [sessionJoined, setSessionJoined] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { startRecording, stopRecording, pauseRecording, resumeRecording, audioData, error: audioError } = useAudioCapture(socket, sessionId);

  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('join-session', { sessionId });

    socket.on('session-joined', ({ context }: { context: { session: { id: string; title: string; role: string; company?: string; aiProvider: string; status: string; skills: string[]; language: string; jobDesc?: string } } }) => {
      setSession(context.session);
      setSessionJoined(true);
    });

    socket.on('transcript-interim', (event: { text: string; isInterim: boolean; confidence?: number; speaker?: string; timestamp: string }) => {
      addTranscript({ ...event, id: `interim-${Date.now()}` });
    });

    socket.on('transcript-final', (event: { text: string; isInterim: boolean; confidence?: number; speaker?: string; timestamp: string }) => {
      addTranscript({ ...event, id: `final-${Date.now()}` });
      setCurrentQuestion(event.text);
      socket.emit('request-ai-response', { sessionId, question: event.text });
    });

    socket.on('ai-response-start', () => { setCurrentResponse(''); setIsStreaming(true); });
    socket.on('ai-response-chunk', ({ chunk }: { chunk: string }) => { appendResponseChunk(chunk); });
    socket.on('ai-response-end', ({ answer }: { answer: string; latencyMs: number }) => {
      setCurrentResponse(answer);
      setIsStreaming(false);
    });
    socket.on('error', (err: { message: string }) => { console.error('Socket error:', err.message); });

    return () => {
      socket.off('session-joined');
      socket.off('transcript-interim');
      socket.off('transcript-final');
      socket.off('ai-response-start');
      socket.off('ai-response-chunk');
      socket.off('ai-response-end');
      socket.off('error');
    };
  }, [socket, isConnected, sessionId]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => incrementElapsed(), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, isPaused]);

  const handleStartRecording = useCallback(async () => {
    if (!socket || !isConnected) return;
    socket.emit('start-transcription', { sessionId });
    await startRecording();
    setIsRecording(true);
    setIsPaused(false);
  }, [socket, isConnected, sessionId, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    if (socket) socket.emit('stop-transcription');
    setIsRecording(false);
    setIsPaused(false);
  }, [socket, stopRecording]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) { resumeRecording(); setIsPaused(false); }
    else { pauseRecording(); setIsPaused(true); }
  }, [isPaused, pauseRecording, resumeRecording]);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/history" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-white text-sm">{session?.title ?? 'Interview'}</h1>
            <p className="text-xs text-slate-400">{session?.role}{session?.company ? ` @ ${session.company}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-mono">{formatDuration(elapsedSeconds)}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-sm text-slate-300">{isPaused ? 'Paused' : 'Recording'}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 border-r border-slate-800 overflow-hidden">
          <TranscriptPanel transcripts={transcripts} />
        </div>
        <div className="w-3/5 overflow-hidden">
          <ResponsePanel currentResponse={currentResponse} isStreaming={isStreaming} provider={session?.aiProvider} />
        </div>
      </div>

      <div className="border-t border-slate-800 px-6 py-4 flex-shrink-0 bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-6">
            <AudioVisualizer audioData={audioData} isActive={isRecording && !isPaused} width={300} height={48} />
          </div>
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button onClick={handleStartRecording} disabled={!isConnected || !sessionJoined} className="btn-primary flex items-center gap-2">
                <Mic className="w-4 h-4" /> Start Recording
              </button>
            ) : (
              <>
                <button onClick={handlePauseResume} className="btn-secondary flex items-center gap-2">
                  {isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
                </button>
                <button onClick={handleStopRecording} className="btn-danger flex items-center gap-2">
                  <Square className="w-4 h-4" /> Stop
                </button>
              </>
            )}
          </div>
        </div>
        {audioError && <p className="text-red-400 text-sm mt-2">{audioError}</p>}
      </div>
    </div>
  );
}
