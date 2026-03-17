'use client';
import { useRef, useState, useCallback } from 'react';
import { Mic, Pause, Play, Square } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface AudioCaptureProps {
  socket: Socket | null;
  sessionId: string;
  onStatusChange?: (status: 'recording' | 'paused' | 'stopped') => void;
}

export default function AudioCapture({ socket, sessionId, onStatusChange }: AudioCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          event.data.arrayBuffer().then(buffer => {
            socket.emit('audio-chunk', { sessionId, chunk: buffer });
          });
        }
      };
      mediaRecorder.start(250);
      if (socket) socket.emit('start-transcription', { sessionId });
      setIsRecording(true);
      setIsPaused(false);
      onStatusChange?.('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
    }
  }, [socket, sessionId, onStatusChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); mediaRecorderRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (socket) socket.emit('stop-transcription');
    setIsRecording(false);
    setIsPaused(false);
    onStatusChange?.('stopped');
  }, [socket, onStatusChange]);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      onStatusChange?.('recording');
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      onStatusChange?.('paused');
    }
  }, [isPaused, onStatusChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button onClick={startRecording} className="btn-primary flex items-center gap-2">
            <Mic className="w-4 h-4" /> Start Recording
          </button>
        ) : (
          <>
            <div className={`flex items-center gap-1.5 text-sm ${isPaused ? 'text-yellow-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
              {isPaused ? 'Paused' : 'Recording'}
            </div>
            <button onClick={togglePause} className="btn-secondary flex items-center gap-2">
              {isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
            </button>
            <button onClick={stopRecording} className="btn-danger flex items-center gap-2">
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        )}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
