'use client';
import { useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

export function useAudioCapture(socket: Socket | null, sessionId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);

  const startVisualization = useCallback((stream: MediaStream) => {
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      setAudioData(new Uint8Array(dataArray));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopVisualization = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioData(null);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } });
      streamRef.current = stream;
      startVisualization(stream);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          event.data.arrayBuffer().then(buf => socket.emit('audio-chunk', { sessionId, chunk: buf }));
        }
      };
      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [socket, sessionId, startVisualization]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    stopVisualization();
    setIsRecording(false);
    setIsPaused(false);
  }, [stopVisualization]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  return { startRecording, stopRecording, pauseRecording, resumeRecording, audioData, isRecording, isPaused, error };
}
