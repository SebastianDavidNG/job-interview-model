import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  isBrowserSpeechSupported,
  speechLocaleFromInterviewLanguage,
  useLiveSpeechRecognition,
} from '../hooks/useLiveSpeechRecognition';
import { SERVER_URL } from '../lib/config';

const PREGUNTAS_DEMO = [
  'Cuéntame sobre ti y tu experiencia profesional.',
  '¿Por qué te interesa este rol y nuestra empresa?',
  'Describe un proyecto difícil en el que hayas trabajado y cómo lo resolviste.',
  '¿Cuáles son tus fortalezas y áreas de mejora?',
  '¿Dónde te ves en 5 años?',
];

const PREGUNTAS_LIVE_CODING = [
  'Implementa una función que invierta un string en O(n) tiempo.',
  'Dado un array de enteros, encuentra el par que suma un target. ¿Qué estructura usarías?',
  'Explica cómo evitarías un memory leak en un useEffect de React.',
  'Implementa un debounce: describe la firma y el comportamiento esperado.',
];

function looksLikeCodingOrQuestion(s: string): boolean {
  if (/\?/.test(s)) return true;
  return /implementa|implement|escribe|write|create\s+(a\s+)?function|función|function\b|array|return|explica|explain|debug|fix|error|complexity|O\(/i.test(
    s
  );
}

export const LiveSessionPanel: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [preguntaActual, setPreguntaActual] = useState('');
  const [aiText, setAiText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveCoding, setLiveCoding] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [autoGuide, setAutoGuide] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [speechLang, setSpeechLang] = useState('es-ES');

  const socketRef = useRef<Socket | null>(null);
  const liveTranscriptRef = useRef('');
  const lastEmitRef = useRef(0);
  const lastAutoGuideRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speechOk = isBrowserSpeechSupported();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ip_config');
      if (!raw) return;
      const cfg = JSON.parse(raw) as { interviewType?: string; interviewLanguage?: string };
      setLiveCoding(cfg.interviewType === 'live_coding');
      setSpeechLang(speechLocaleFromInterviewLanguage(cfg.interviewLanguage));
      if (cfg.interviewType === 'live_coding') setAutoGuide(true);
    } catch {
      /* ignore */
    }
  }, []);

  const emitTranscriptThrottled = useCallback(
    (text: string) => {
      const s = socketRef.current;
      if (!s || !sessionId) return;
      const now = Date.now();
      if (now - lastEmitRef.current < 100) return;
      lastEmitRef.current = now;
      s.emit('transcript_update', { sessionId, text });
    },
    [sessionId]
  );

  const pedirGuia = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setSpeechError('No hay texto transcrito todavía. Activa el micrófono o espera a que se escuche al entrevistador.');
        return;
      }
      setSpeechError(null);
      setPreguntaActual(trimmed);
      setAiText('');
      socketRef.current?.emit('ai_request', {
        text: trimmed,
        sessionId: sessionId ?? undefined,
      });
    },
    [sessionId]
  );

  const tryAutoGuide = useCallback(() => {
    if (!autoGuide) return;
    const text = liveTranscriptRef.current.trim();
    if (text.length < 28) return;
    if (Date.now() - lastAutoGuideRef.current < 38_000) return;
    if (!looksLikeCodingOrQuestion(text) && text.length < 90) return;
    lastAutoGuideRef.current = Date.now();
    pedirGuia(text);
  }, [autoGuide, pedirGuia]);

  const onSpeechText = useCallback(
    (text: string, _isFinal: boolean) => {
      liveTranscriptRef.current = text;
      setLiveTranscript(text);
      emitTranscriptThrottled(text);
      setSpeechError(null);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => tryAutoGuide(), 2800);
    },
    [emitTranscriptThrottled, tryAutoGuide]
  );

  const onSpeechErr = useCallback((msg: string) => {
    setSpeechError(msg);
    setMicOn(false);
  }, []);

  useLiveSpeechRecognition({
    enabled: micOn && status === 'connected' && speechOk,
    lang: speechLang,
    onText: onSpeechText,
    onError: onSpeechErr,
  });

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      if (sessionId) socket.emit('join_session', { sessionId });
    });
    socket.on('session_ready', (payload: { interviewType?: string }) => {
      setLiveCoding(payload?.interviewType === 'live_coding');
    });
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('audio_chunk_ack', () => {});
    socket.on('ai_generating', () => {
      setGenerating(true);
      setAiText('');
    });
    socket.on('ai_token', (payload: unknown) => {
      const token =
        typeof payload === 'string'
          ? payload
          : typeof payload === 'object' && payload && 'token' in (payload as Record<string, unknown>)
            ? (payload as { token: string }).token
            : '';
      setAiText((prev) => prev + (token ?? ''));
    });
    socket.on('ai_complete', () => {
      setGenerating(false);
    });
    socket.on('ai_error', (payload: unknown) => {
      setGenerating(false);
      const msg =
        typeof payload === 'object' && payload && 'message' in (payload as Record<string, unknown>)
          ? (payload as { message: string }).message
          : 'Error al generar la respuesta';
      setAiText((prev) => prev + '\n\n⚠ ' + msg);
    });
    socket.on('question_detected', ({ text }: { text: string }) => {
      const q = (text || '').trim();
      if (q) {
        setPreguntaActual(q);
        setLiveTranscript(q);
        liveTranscriptRef.current = q;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const enviarPregunta = (pregunta: string) => {
    setPreguntaActual(pregunta);
    liveTranscriptRef.current = pregunta;
    setLiveTranscript(pregunta);
    setAiText('');
    socketRef.current?.emit('transcript_update', { sessionId, text: pregunta });
    socketRef.current?.emit('ai_request', {
      text: pregunta,
      sessionId: sessionId ?? undefined,
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0F',
        color: '#E8F5E9',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ marginRight: 8 }}>🔴 EN VIVO</span>
          <strong>InterviewPilot</strong>
        </div>
        <div style={{ fontSize: 14, color: '#B0BEC5' }}>
          Estado: {micOn && status === 'connected' ? 'escuchando' : status}
          {generating && <span style={{ marginLeft: 8, color: '#ffd700' }}>· generando guía…</span>}
          {sessionId && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#6a8f78' }}>· {sessionId}</span>
          )}
        </div>
      </header>

      <section
        style={{
          background: '#0e1410',
          border: '1px solid #1e2e24',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 11, color: '#00d97e', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
          Prueba de codificación en tiempo real
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#B0BEC5', lineHeight: 1.8 }}>
          <li>
            Pulsa <strong style={{ color: '#E8F5E9' }}>Activar micrófono</strong> para transcribir lo que suena en tu entorno (ideal: auriculares y audio de la videollamada por el mismo PC).
          </li>
          <li>
            Pulsa <strong style={{ color: '#00E5FF' }}>Pedir guía</strong> cuando quieras que la IA analice lo último escuchado, o activa <strong>Auto tras pausa</strong> para que, tras ~3 s de silencio, intente una guía si detecta un enunciado o pregunta.
          </li>
          <li>
            Abre <strong style={{ color: '#E8F5E9' }}>/viewer</strong> en el móvil con el mismo código de sesión para leer la guía discretamente.
          </li>
        </ol>
      </section>

      <section
        style={{
          backgroundColor: '#111118',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #1e2e24',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 11, color: '#6ab0f5', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
          Micrófono y transcripción
        </h2>
        {!speechOk && (
          <p style={{ fontSize: 13, color: '#e05252', marginBottom: 12 }}>
            Tu navegador no expone reconocimiento de voz. Usa <strong>Chrome</strong> o <strong>Edge</strong> en el escritorio, o usa los botones de simulación abajo.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <button
            type="button"
            disabled={!speechOk || status !== 'connected'}
            onClick={() => {
              setSpeechError(null);
              setMicOn((m) => !m);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: micOn ? '1px solid #00d97e' : '1px solid #2a3d31',
              background: micOn ? 'rgba(0,217,126,0.2)' : 'rgba(0,217,126,0.08)',
              color: '#00d97e',
              fontSize: 13,
              fontWeight: 600,
              cursor: speechOk && status === 'connected' ? 'pointer' : 'not-allowed',
              opacity: speechOk && status === 'connected' ? 1 : 0.5,
            }}
          >
            {micOn ? '⏹ Detener micrófono' : '🎤 Activar micrófono'}
          </button>
          <button
            type="button"
            onClick={() => pedirGuia(liveTranscript)}
            disabled={generating}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#00E5FF',
              color: '#001E2B',
              fontWeight: 600,
              fontSize: 13,
              cursor: generating ? 'wait' : 'pointer',
              opacity: generating ? 0.7 : 1,
            }}
          >
            ⚡ Pedir guía ahora
          </button>
          <label style={{ fontSize: 13, color: '#B0BEC5', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoGuide} onChange={(e) => setAutoGuide(e.target.checked)} />
            Auto tras pausa (~3 s)
          </label>
        </div>
        {speechError && (
          <p style={{ fontSize: 12, color: '#e05252', marginBottom: 8 }}>{speechError}</p>
        )}
        <div
          style={{
            fontSize: 14,
            color: '#B0BEC5',
            lineHeight: 1.55,
            minHeight: 72,
            padding: 12,
            background: '#0a0d0b',
            borderRadius: 8,
            border: '1px solid #1e2e24',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {liveTranscript || (micOn ? 'Escuchando… habla o reproduce el audio de la entrevista.' : 'Sin transcripción. Activa el micrófono o usa los botones de prueba.')}
        </div>
      </section>

      <main style={{ display: 'grid', gap: 20 }}>
        <section
          style={{
            backgroundColor: '#111118',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #1e2e24',
          }}
        >
          <h2 style={{ fontSize: 11, color: '#6ab0f5', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
            Enunciado / pregunta (última guía enviada)
          </h2>
          <div style={{ fontSize: 15, color: '#B0BEC5', lineHeight: 1.5, minHeight: 24 }}>
            {preguntaActual || 'Se rellena al pedir guía o al simular con los botones.'}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#111118',
            borderRadius: 12,
            padding: 16,
            minHeight: 160,
            border: '1px solid #1e2e24',
          }}
        >
          <h2 style={{ fontSize: 14, color: '#B0BEC5', marginBottom: 8 }}>
            ✨ {liveCoding ? 'Guía live coding' : 'Guía de respuesta'}
          </h2>
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: '#E8F5E9',
              fontFamily: liveCoding ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
            }}
          >
            {aiText ||
              (liveCoding
                ? 'Aquí aparecerán las secciones 【ENTENDER】【DECIR】【PASOS】【CÓDIGO】【TRAMPA】 cuando pidas guía.'
                : 'La sugerencia aparecerá aquí cuando pidas guía o simules una pregunta.')}
          </div>
        </section>

        <div>
          <p style={{ fontSize: 11, color: '#6a8f78', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Simular pregunta (sin audio)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(liveCoding ? PREGUNTAS_LIVE_CODING : PREGUNTAS_DEMO).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => enviarPregunta(p)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #2a3d31',
                  background: 'rgba(0,217,126,0.08)',
                  color: '#00d97e',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  maxWidth: 320,
                }}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                enviarPregunta(
                  liveCoding
                    ? 'Implementa un LRU cache con get y put en O(1) amortizado.'
                    : '¿Qué te motiva a cambiar de trabajo en este momento?'
                )
              }
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#00E5FF',
                color: '#001E2B',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {liveCoding ? 'Enunciado extra (demo)' : 'Pregunta libre (demo)'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
