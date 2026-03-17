'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(BACKEND_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000 });
    socketRef.current = s;
    setSocket(s);
    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));
    s.on('connect_error', (err) => { console.warn('Socket connection error:', err.message); setIsConnected(false); });
    return () => { s.disconnect(); socketRef.current = null; setSocket(null); };
  }, []);

  return { socket, isConnected };
}
