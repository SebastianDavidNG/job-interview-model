import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../lib/config';
import { readSessionConfigStorage } from './storageKeys';
import { STEALTH_VIEWER_UI, viewerUiLanguage } from './sessionUiI18n';

type HistoryEntry = { id: string; question: string; response: string };

function createHistoryId(): string {
  return `hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Same device may have wizard config; helps AI language when secondary tab has no server session merge. */
function aiContextFromStorage(): {
  responseLanguage?: string;
  uiLocale?: string;
  interviewLanguage?: string;
  interviewType?: string;
} {
  try {
    const raw = readSessionConfigStorage();
    if (!raw) return {};
    const cfg = JSON.parse(raw) as {
      responseLanguage?: string;
      uiLocale?: string;
      interviewLanguage?: string;
      interviewType?: string;
    };
    return {
      responseLanguage: cfg.responseLanguage,
      uiLocale: cfg.uiLocale,
      interviewLanguage: cfg.interviewLanguage,
      interviewType: cfg.interviewType,
    };
  } catch {
    return {};
  }
}

export const StealthViewer: React.FC = () => {
  const vt = STEALTH_VIEWER_UI[viewerUiLanguage()];

  const [sessionId, setSessionId] = useState('');
  const [interviewType, setInterviewType] = useState<string>('mixed');
  const [mode, setMode] = useState<'connect' | 'active'>('connect');
  const [statusText, setStatusText] = useState(() => STEALTH_VIEWER_UI[viewerUiLanguage()].readyToConnect);
  const [statusDot, setStatusDot] = useState<'idle' | 'connected' | 'generating'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [transcript, setTranscript] = useState(() => STEALTH_VIEWER_UI[viewerUiLanguage()].waitingTranscript);
  const [isQuestion, setIsQuestion] = useState(false);
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fontLevel, setFontLevel] = useState(1); // 0 small, 1 normal, 2 large, 3 xl
  const lastPromptRef = useRef('');
  const transcriptRef = useRef(transcript);
  const interviewTypeRef = useRef(interviewType);
  const sessionTypeSyncedRef = useRef(false);

  const liveCoding = interviewType === 'live_coding';

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    interviewTypeRef.current = interviewType;
  }, [interviewType]);

  useEffect(() => {
    if (mode !== 'active') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [mode]);

  const timer = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const connect = (id: string) => {
    if (!id) return;
    socket?.disconnect();
    sessionTypeSyncedRef.current = false;
    const v = STEALTH_VIEWER_UI[viewerUiLanguage()];
    setSessionId(id);
    setStatusText(v.connecting);
    const s = io(SERVER_URL, { timeout: 5000 });
    setSocket(s);
    s.on('connect', () => {
      s.emit('join_session', { sessionId: id });
      setMode('active');
      setStatusDot('connected');
      setStatusText(`${v.connectedPrefix} ${id}`);
    });
    s.on('session_ready', (payload: { interviewType?: string }) => {
      const t = payload?.interviewType ?? 'mixed';
      interviewTypeRef.current = t;
      sessionTypeSyncedRef.current = true;
      setInterviewType(t);
    });
    s.on('connect_error', () => {
      setStatusText(STEALTH_VIEWER_UI[viewerUiLanguage()].connectError);
    });
    s.on('transcript_partial', ({ text }: { text: string }) => {
      const vv = STEALTH_VIEWER_UI[viewerUiLanguage()];
      setTranscript(text || vv.listeningProgress);
      setIsQuestion(false);
    });
    s.on('question_detected', ({ text }: { text: string }) => {
      const q = (text || '').trim() || STEALTH_VIEWER_UI[viewerUiLanguage()].questionFallback;
      lastPromptRef.current = q;
      setTranscript(q);
      setIsQuestion(true);
      startGenerating();
      const hints = aiContextFromStorage();
      s.emit('ai_request', {
        text: q,
        sessionId: id,
        ...hints,
        interviewType: sessionTypeSyncedRef.current
          ? interviewTypeRef.current
          : hints.interviewType ?? interviewTypeRef.current,
      });
    });
    s.on('ai_generating', () => {
      lastPromptRef.current = transcriptRef.current;
      startGenerating();
    });
    s.on('ai_error', (payload: { message?: string }) => {
      setStatusDot('connected');
      const vv = STEALTH_VIEWER_UI[viewerUiLanguage()];
      setStatusText(`${vv.connectedPrefix} ${id}`);
      const msg = payload?.message ?? vv.aiErrorGeneric;
      setResponse((prev) => (prev ? prev + '\n\n⚠ ' : '') + msg);
    });
    s.on('ai_token', ({ token }: { token: string }) => {
      setResponse((prev) => prev + token);
    });
    s.on('ai_complete', ({ fullResponse }: { fullResponse: string }) => {
      finishGenerating(fullResponse);
    });
  };

  const startGenerating = () => {
    setStatusDot('generating');
    setStatusText(STEALTH_VIEWER_UI[viewerUiLanguage()].generating);
    setResponse('');
  };

  const finishGenerating = (full: string) => {
    setStatusDot('connected');
    const vv = STEALTH_VIEWER_UI[viewerUiLanguage()];
    setStatusText(`${vv.connectedPrefix} ${sessionId}`);
    setResponse(full);
    setHistory((prev) => [
      { id: createHistoryId(), question: lastPromptRef.current || transcript, response: full },
      ...prev,
    ]);
  };

  const startDemo = () => {
    const v = STEALTH_VIEWER_UI[viewerUiLanguage()];
    setSessionId('DEMO-SESSION');
    setInterviewType('mixed');
    setMode('active');
    setStatusDot('connected');
    setStatusText(`${v.connectedPrefix} DEMO-SESSION`);
    setSeconds(0);
    setTimeout(() => simulateQuestion(v.demoQuestion1), 1500);
  };

  const simulateQuestion = (q: string) => {
    const v = STEALTH_VIEWER_UI[viewerUiLanguage()];
    lastPromptRef.current = q;
    setTranscript(q);
    setIsQuestion(true);
    startGenerating();
    const demo = v.demoAnswer1;
    const words = demo.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i >= words.length) {
        clearInterval(interval);
        finishGenerating(demo);
        return;
      }
      setResponse((prev) => prev + words[i] + ' ');
      i++;
    }, 55);
  };

  const manualTrigger = () => {
    if (socket && sessionId) {
      socket.emit('trigger_manual', { sessionId, text: transcript });
    } else {
      simulateQuestion(STEALTH_VIEWER_UI[viewerUiLanguage()].demoQuestionManual);
    }
  };

  const regenerate = () => {
    if (socket && sessionId) {
      socket.emit('regenerate', { sessionId, question: transcript });
    } else {
      simulateQuestion(transcript);
    }
  };

  const fontClass = ['small', '', 'large', 'xl'][fontLevel] || '';

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  if (mode === 'connect') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#e8ffe4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
          fontFamily: `'DM Mono', monospace`,
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#00ff88',
              boxShadow: '0 0 20px #00ff88',
              margin: '0 auto 12px'
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: '#4a6b55',
              letterSpacing: '0.2em',
              textTransform: 'uppercase'
            }}
          >
            Interview Pilot
          </div>
        </div>

        <h1
          style={{
            fontFamily: `'Instrument Serif', Georgia, serif`,
            fontSize: 28,
            fontStyle: 'italic',
            lineHeight: 1.2,
            marginBottom: 16
          }}
        >
          {vt.connectTitle1}
          <br />
          {vt.connectTitle2}
        </h1>

        <p style={{ fontSize: 12, color: '#4a6b55', lineHeight: 1.7, maxWidth: 260, marginBottom: 24 }}>
          {vt.connectSubtitle}
        </p>

        <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
            placeholder="ABC-123"
            maxLength={10}
            style={{
              width: '100%',
              background: '#0a0a0a',
              borderRadius: 10,
              border: '1px solid #222',
              padding: '14px 18px',
              fontFamily: `'DM Mono', monospace`,
              fontSize: 22,
              color: '#e8ffe4',
              textAlign: 'center',
              letterSpacing: '0.25em'
            }}
          />
          <button
            type="button"
            onClick={() => connect(sessionId)}
            style={{
              width: '100%',
              background: '#00ff88',
              borderRadius: 10,
              border: 'none',
              padding: 14,
              fontFamily: `'DM Mono', monospace`,
              fontSize: 13,
              fontWeight: 500,
              color: '#000',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            {vt.connectButton}
          </button>
          <span style={{ fontSize: 11, color: statusText.startsWith('✗') ? '#e05252' : '#1f2e24' }}>{statusText}</span>
        </div>

        <div style={{ marginTop: 24, fontSize: 10, color: '#1f2e24', letterSpacing: '0.08em' }}>
          {vt.noCodePrompt}{' '}
          <button
            type="button"
            onClick={startDemo}
            style={{ background: 'none', border: 'none', color: '#4a6b55', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {vt.demoModeLink}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#e8ffe4',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: `'DM Mono', monospace`
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 8px',
          borderBottom: '1px solid #1a1a1a'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: statusDot === 'connected' ? '#00ff88' : statusDot === 'generating' ? '#ffd700' : '#1f2e24'
            }}
          />
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.08em',
              color: statusDot === 'connected' ? '#4a6b55' : '#1f2e24'
            }}
          >
            {statusText}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            color: '#1f2e24',
            letterSpacing: '0.1em',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {timer()}
        </span>
      </header>

      <div
        style={{
          padding: '10px 16px 8px',
          borderBottom: '1px solid #1a1a1a',
          minHeight: 56,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        <span
          style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            color: '#1f2e24',
            textTransform: 'uppercase',
            marginBottom: 5
          }}
        >
          {vt.listeningLabel}
        </span>
        <p
          style={{
            fontSize: 13,
            color: isQuestion ? '#6ab0f5' : '#4a6b55',
            lineHeight: 1.5
          }}
        >
          {transcript}
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 18px 24px'
        }}
      >
        {!response && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              paddingTop: 40,
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
            >
              🎯
            </div>
            <p
              style={{
                fontFamily: `'Instrument Serif', Georgia, serif`,
                fontSize: 16,
                color: '#1f2e24',
                fontStyle: 'italic',
                maxWidth: 220,
                lineHeight: 1.6
              }}
            >
              {liveCoding ? vt.emptyStateCoding : vt.emptyStateGeneral}
            </p>
          </div>
        )}

        {response && (
          <>
            <div
              style={{
                fontSize: 8,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#1f2e24',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {liveCoding ? vt.labelSuggestedCoding : vt.labelSuggestedGeneral}
              <span style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            </div>
            <div
              style={{
                fontFamily: liveCoding ? `'DM Mono', monospace` : `'Instrument Serif', Georgia, serif`,
                lineHeight: 1.65,
                fontSize: fontLevel === 0 ? 20 : fontLevel === 1 ? 24 : fontLevel === 2 ? 28 : 32,
                whiteSpace: 'pre-wrap'
              }}
            >
              {response}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          borderTop: '1px solid #1a1a1a',
          padding: '10px 16px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={manualTrigger} style={actionBtn(true)}>
            {vt.btnNow}
          </button>
          <button type="button" onClick={regenerate} style={actionBtn(false)}>
            {vt.btnOther}
          </button>
          <button type="button" onClick={() => setHistoryOpen(true)} style={actionBtn(false)}>
            {vt.btnHistory}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setFontLevel((f) => Math.max(0, f - 1))}
            style={fontBtnStyle}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setFontLevel((f) => Math.min(3, f + 1))}
            style={fontBtnStyle}
          >
            +
          </button>
        </div>
      </div>

      {historyOpen && (
        <>
          <button
            type="button"
            aria-label="Close history"
            onClick={() => setHistoryOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          />
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              background: '#0a0a0a',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTop: '1px solid #222',
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: '10px 18px 18px'
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: '#222',
                margin: '0 auto 14px'
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1f2e24'
              }}
            >
              <span>{vt.historyTitle}</span>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                style={{ background: 'none', border: 'none', color: '#1f2e24', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
              {history.length === 0 && (
                <div style={{ fontSize: 12, color: '#1f2e24', textAlign: 'center', padding: '20px 0' }}>
                  {vt.historyEmpty}
                </div>
              )}
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{ paddingBottom: 12, borderBottom: '1px solid #1a1a1a' }}
                >
                  <div style={{ fontSize: 11, color: '#6ab0f5', marginBottom: 6, lineHeight: 1.5 }}>
                    🎤 {h.question}
                  </div>
                  <div
                    style={{
                      fontFamily: `'Instrument Serif', Georgia, serif`,
                      fontSize: 14,
                      color: '#4a6b55',
                      lineHeight: 1.6,
                      fontStyle: 'italic'
                    }}
                  >
                    {h.response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const actionBtn = (primary: boolean): React.CSSProperties => ({
  background: '#0a0a0a',
  borderRadius: 8,
  border: primary ? '1px solid rgba(0,255,136,0.3)' : '1px solid #222',
  padding: '9px 14px',
  fontFamily: `'DM Mono', monospace`,
  fontSize: 11,
  color: primary ? '#00ff88' : '#4a6b55',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 5
});

const fontBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #222',
  borderRadius: 6,
  color: '#1f2e24',
  fontSize: 14,
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

