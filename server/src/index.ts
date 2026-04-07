import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import Groq from 'groq-sdk';
import { streamGroqResponse, type SessionConfig, resolveOutputLang } from './ai/groq';
import 'dotenv/config';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app = express();
const server = http.createServer(app);

// En memoria (en producción usar Redis o DB)
const sessionStore = new Map<string, SessionConfig>();

const VALID_LANG = new Set(['es', 'en', 'pt', 'fr', 'de']);

type AiRequestPayload = {
  text: string;
  sessionId?: string;
  responseLanguage?: string;
  uiLocale?: string;
  interviewType?: string;
  interviewLanguage?: string;
};

/** Combines stored session with language hints from the client (so answers match wizard even after server restart). */
function mergeSessionConfig(sessionId: string | undefined, p: AiRequestPayload): SessionConfig | null {
  const stored = sessionId ? sessionStore.get(sessionId) : undefined;
  const patch: Partial<SessionConfig> = {};
  if (p.responseLanguage && VALID_LANG.has(p.responseLanguage)) patch.responseLanguage = p.responseLanguage;
  if (p.uiLocale && VALID_LANG.has(p.uiLocale)) patch.uiLocale = p.uiLocale;
  if (p.interviewType && typeof p.interviewType === 'string') patch.interviewType = p.interviewType;
  if (p.interviewLanguage && typeof p.interviewLanguage === 'string') patch.interviewLanguage = p.interviewLanguage;
  if (stored) return { ...stored, ...patch };
  if (Object.keys(patch).length > 0) return patch as SessionConfig;
  return null;
}

function demoTokensForLang(lang: string): string[] {
  const L = VALID_LANG.has(lang) ? lang : 'es';
  const demos: Record<string, string[]> = {
    es: [
      'Demo: ',
      'respuesta ',
      'desde ',
      'el ',
      'servidor. ',
      'Configura ',
      'GROQ_API_KEY ',
      'para ',
      'IA ',
      'real.',
    ],
    en: [
      'Demo: ',
      'response ',
      'from ',
      'the ',
      'server. ',
      'Set ',
      'GROQ_API_KEY ',
      'for ',
      'real ',
      'AI.',
    ],
    pt: [
      'Demo: ',
      'resposta ',
      'do ',
      'servidor. ',
      'Configure ',
      'GROQ_API_KEY ',
      'para ',
      'IA ',
      'real.',
    ],
    fr: [
      'Démo : ',
      'réponse ',
      'du ',
      'serveur. ',
      'Configurez ',
      'GROQ_API_KEY ',
      'pour ',
      'une ',
      'IA ',
      'réelle.',
    ],
    de: [
      'Demo: ',
      'Antwort ',
      'vom ',
      'Server. ',
      'Setze ',
      'GROQ_API_KEY ',
      'für ',
      'echte ',
      'KI.',
    ],
  };
  return demos[L] ?? demos.es;
}

const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Debug seguro: no imprime la clave, solo confirma si está presente.
app.get('/debug/env', (_, res) => {
  res.json({ GROQ_API_KEY_set: Boolean(process.env.GROQ_API_KEY) });
});

// Valida la clave contra Groq (no imprime la clave). Útil para debug rápido.
app.get('/debug/groq/validate', async (_, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(200).json({ ok: false, reason: 'missing' });

  const keyLen = apiKey.length;
  const hasX = apiKey.includes('x') || apiKey.includes('X');

  try {
    const groq = new Groq({ apiKey });
    await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      temperature: 0
    });
    return res.status(200).json({ ok: true, keyLen, hasX });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(200).json({ ok: false, reason: message, keyLen, hasX });
  }
});

// API sesiones (el wizard hace POST al iniciar sesión)
app.route('/api/sessions')
  .get((_, res) => {
    res.status(200).json({ message: 'Use POST with { sessionId, config } to create a session' });
  })
  .post((req, res) => {
    const { sessionId, config } = req.body as { sessionId?: string; config?: unknown };
    if (!sessionId || !config) {
      return res.status(400).json({ error: 'sessionId and config are required' });
    }
    sessionStore.set(sessionId, config);
    return res.status(201).json({ ok: true });
  });

// Producción: servir frontend desde server/public (copia de client/dist)
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (_, res, next) => {
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('join_session', ({ sessionId }: { sessionId: string }) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
    const stored = sessionStore.get(sessionId) as { interviewType?: string } | undefined;
    socket.emit('session_ready', {
      interviewType: stored?.interviewType ?? 'mixed'
    });
  });

  // Audio chunks entran desde el cliente (browser / extensión)
  socket.on('audio_chunk', (data: ArrayBuffer) => {
    // TODO: enviar a Deepgram por WS
    // Por ahora solo hacemos echo básico para probar canal
    socket.emit('audio_chunk_ack');
  });

  // Transcripción en vivo (p. ej. Web Speech API en el cliente principal)
  socket.on('transcript_update', (payload: { sessionId?: string; text?: string }) => {
    const sessionId = payload?.sessionId;
    const text = typeof payload?.text === 'string' ? payload.text : '';
    if (!sessionId) return;
    io.to(sessionId).emit('transcript_partial', { text });
  });

  // Canal de streaming de tokens IA hacia el cliente (Groq real o demo)
  socket.on('ai_request', async (payload: AiRequestPayload) => {
    const question = payload?.text?.trim() || 'Pregunta de prueba';
    const sessionId = payload?.sessionId;
    const config = mergeSessionConfig(sessionId, payload ?? { text: question });
    console.log(
      'AI request:',
      question.slice(0, 80),
      sessionId ? `(session: ${sessionId})` : '',
      config ? `[lang=${resolveOutputLang(config)}]` : ''
    );

    // Quien hace la petición siempre recibe por socket; el resto de la sala (ej. viewer) por room
    const send = (event: string, data: unknown) => {
      socket.emit(event, data);
      if (sessionId) socket.to(sessionId).emit(event, data);
    };

    send('ai_generating', {});

    if (process.env.GROQ_API_KEY) {
      try {
        const fullResponse = await streamGroqResponse(question, config, (token) => {
          send('ai_token', { token });
        });
        send('ai_complete', { fullResponse });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al generar respuesta';
        console.error('Groq error:', message);
        send('ai_error', { message });
      }
    } else {
      const tokens = demoTokensForLang(config ? resolveOutputLang(config) : 'es');
      for (const t of tokens) {
        send('ai_token', { token: t });
      }
      send('ai_complete', { fullResponse: tokens.join('') });
    }
  });

  // Triggers manuales/regeneración (demo)
  socket.on('trigger_manual', ({ sessionId, text }: { sessionId: string; text: string }) => {
    console.log('Manual trigger for session', sessionId, 'text:', text?.slice(0, 80));
    io.to(sessionId).emit('question_detected', { text: text || 'Pregunta manual' });
  });

  socket.on('regenerate', ({ sessionId, question }: { sessionId: string; question: string }) => {
    console.log('Regenerate for session', sessionId);
    io.to(sessionId).emit('question_detected', { text: question });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`InterviewPilot server listening on http://localhost:${PORT}`);
});

