import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  isBrowserSpeechSupported,
  speechLocaleFromInterviewLanguage,
  useLiveSpeechRecognition,
} from '../hooks/useLiveSpeechRecognition';
import { SERVER_URL } from '../lib/config';
import { readSessionConfigStorage } from './storageKeys';
import {
  ENUNCIADO_EXTRA_LIVE,
  PREGUNTA_EXTRA_DEMO,
  PREGUNTAS_DEMO,
  PREGUNTAS_LIVE_CODING,
  SIM_LANGS,
  simulatedQuestionLanguage,
  UI_SIMULATE,
  type SimLang,
} from './simulatedQuestions';
import { LIVE_SESSION_UI } from './sessionUiI18n';

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
  const [interviewLanguage, setInterviewLanguage] = useState<string | undefined>(undefined);
  const [responseLanguage, setResponseLanguage] = useState<string | undefined>(undefined);
  const [uiLocale, setUiLocale] = useState<string | undefined>(undefined);

  const socketRef = useRef<Socket | null>(null);
  const sessionInterviewTypeRef = useRef('mixed');
  /** Always current for socket emits (avoids stale closures in pedirGuia). */
  const aiSessionCtxRef = useRef({
    responseLanguage: undefined as string | undefined,
    uiLocale: undefined as string | undefined,
    interviewLanguage: undefined as string | undefined,
    interviewType: 'mixed' as string,
  });
  const liveTranscriptRef = useRef('');
  const lastEmitRef = useRef(0);
  const lastAutoGuideRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speechOk = isBrowserSpeechSupported();
  const speechLang = useMemo(
    () => speechLocaleFromInterviewLanguage(interviewLanguage),
    [interviewLanguage]
  );

  useEffect(() => {
    try {
      const raw = readSessionConfigStorage();
      if (!raw) return;
      const cfg = JSON.parse(raw) as {
        interviewType?: string;
        interviewLanguage?: string;
        responseLanguage?: string;
        uiLocale?: string;
      };
      const nextInterviewType = cfg.interviewType ?? 'mixed';
      sessionInterviewTypeRef.current = nextInterviewType;
      setLiveCoding(nextInterviewType === 'live_coding');
      setInterviewLanguage(cfg.interviewLanguage);
      setResponseLanguage(cfg.responseLanguage);
      setUiLocale(cfg.uiLocale);
      if (cfg.interviewType === 'live_coding') setAutoGuide(true);
    } catch {
      /* ignore */
    }
  }, []);

  /** Prefer answer language so UI (e.g. guide title) matches Groq output; then UI locale. */
  const simLang: SimLang = useMemo(() => {
    if (responseLanguage && SIM_LANGS.includes(responseLanguage as SimLang)) {
      return responseLanguage as SimLang;
    }
    if (uiLocale && SIM_LANGS.includes(uiLocale as SimLang)) return uiLocale as SimLang;
    return simulatedQuestionLanguage(interviewLanguage, responseLanguage);
  }, [responseLanguage, uiLocale, interviewLanguage]);

  useEffect(() => {
    aiSessionCtxRef.current = {
      responseLanguage,
      uiLocale,
      interviewLanguage,
      interviewType: sessionInterviewTypeRef.current,
    };
  }, [responseLanguage, uiLocale, interviewLanguage]);

  const preguntasSimuladas = useMemo(
    () => (liveCoding ? PREGUNTAS_LIVE_CODING[simLang] : PREGUNTAS_DEMO[simLang]),
    [liveCoding, simLang]
  );

  const uiSim = UI_SIMULATE[simLang];
  const t = useMemo(() => LIVE_SESSION_UI[simLang], [simLang]);
  const simLangRef = useRef(simLang);
  simLangRef.current = simLang;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', simLang);
    }
  }, [simLang]);

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
        setSpeechError(LIVE_SESSION_UI[simLangRef.current].emptyTranscriptError);
        return;
      }
      setSpeechError(null);
      setPreguntaActual(trimmed);
      setAiText('');
      socketRef.current?.emit('ai_request', {
        text: trimmed,
        sessionId: sessionId ?? undefined,
        ...aiSessionCtxRef.current,
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

    const handleConnect = () => {
      setStatus('connected');
      if (sessionId) socket.emit('join_session', { sessionId });
    };
    const handleSessionReady = (payload: { interviewType?: string }) => {
      const t = payload?.interviewType ?? 'mixed';
      sessionInterviewTypeRef.current = t;
      aiSessionCtxRef.current.interviewType = t;
      setLiveCoding(t === 'live_coding');
    };
    const handleDisconnect = () => setStatus('disconnected');
    const handleAudioChunkAck = () => {};
    const handleAiGenerating = () => {
      setGenerating(true);
      setAiText('');
    };
    const handleAiToken = (payload: unknown) => {
      const token =
        typeof payload === 'string'
          ? payload
          : typeof payload === 'object' && payload && 'token' in (payload as Record<string, unknown>)
            ? (payload as { token: string }).token
            : '';
      setAiText((prev) => prev + (token ?? ''));
    };
    const handleAiComplete = () => {
      setGenerating(false);
    };
    const handleAiError = (payload: unknown) => {
      setGenerating(false);
      const fallback = LIVE_SESSION_UI[simLangRef.current].aiErrorFallback;
      const msg =
        typeof payload === 'object' && payload && 'message' in (payload as Record<string, unknown>)
          ? (payload as { message: string }).message
          : fallback;
      setAiText((prev) => prev + '\n\n⚠ ' + msg);
    };
    const handleQuestionDetected = ({ text }: { text: string }) => {
      const q = (text || '').trim();
      if (q) {
        setPreguntaActual(q);
        setLiveTranscript(q);
        liveTranscriptRef.current = q;
      }
    };

    socket.on('connect', handleConnect);
    socket.on('session_ready', handleSessionReady);
    socket.on('disconnect', handleDisconnect);
    socket.on('audio_chunk_ack', handleAudioChunkAck);
    socket.on('ai_generating', handleAiGenerating);
    socket.on('ai_token', handleAiToken);
    socket.on('ai_complete', handleAiComplete);
    socket.on('ai_error', handleAiError);
    socket.on('question_detected', handleQuestionDetected);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      socket.off('connect', handleConnect);
      socket.off('session_ready', handleSessionReady);
      socket.off('disconnect', handleDisconnect);
      socket.off('audio_chunk_ack', handleAudioChunkAck);
      socket.off('ai_generating', handleAiGenerating);
      socket.off('ai_token', handleAiToken);
      socket.off('ai_complete', handleAiComplete);
      socket.off('ai_error', handleAiError);
      socket.off('question_detected', handleQuestionDetected);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
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
      ...aiSessionCtxRef.current,
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
          <span style={{ marginRight: 8 }}>{t.liveBadge}</span>
          <strong>InterviewPilot</strong>
        </div>
        <div style={{ fontSize: 14, color: '#B0BEC5' }}>
          {t.statusPrefix}{' '}
          {micOn && status === 'connected'
            ? t.statusListening
            : status === 'connected'
              ? t.statusConnected
              : t.statusDisconnected}
          {generating && <span style={{ marginLeft: 8, color: '#ffd700' }}>{t.generatingGuide}</span>}
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
          {liveCoding ? t.howToTitleLiveCoding : t.howToTitleInterview}
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#B0BEC5', lineHeight: 1.8 }}>
          <li>{t.howToStep1}</li>
          <li>{t.howToStep2}</li>
          <li>{t.howToStep3}</li>
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
          {t.micSectionTitle}
        </h2>
        {!speechOk && (
          <p style={{ fontSize: 13, color: '#e05252', marginBottom: 12 }}>
            {t.speechNotSupported}
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
            {micOn ? t.micOn : t.micOff}
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
            {t.askGuideNow}
          </button>
          <label style={{ fontSize: 13, color: '#B0BEC5', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoGuide} onChange={(e) => setAutoGuide(e.target.checked)} />
            {t.autoAfterPause}
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
          {liveTranscript || (micOn ? t.transcriptListening : t.transcriptIdle)}
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
            {t.lastPromptTitle}
          </h2>
          <div style={{ fontSize: 15, color: '#B0BEC5', lineHeight: 1.5, minHeight: 24 }}>
            {preguntaActual || t.lastPromptEmpty}
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
            {liveCoding ? t.guideTitleCoding : t.guideTitle}
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
            {aiText || (liveCoding ? t.emptyGuideCoding : t.emptyGuideGeneral)}
          </div>
        </section>

        <div>
          <p style={{ fontSize: 11, color: '#6a8f78', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {uiSim.sectionTitle}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {preguntasSimuladas.map((p) => (
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
                  liveCoding ? ENUNCIADO_EXTRA_LIVE[simLang] : PREGUNTA_EXTRA_DEMO[simLang]
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
              {liveCoding ? uiSim.extraCoding : uiSim.extraBehavioral}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
