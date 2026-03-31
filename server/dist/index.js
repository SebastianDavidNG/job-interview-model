"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const groq_1 = require("./ai/groq");
require("dotenv/config");
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// En memoria (en producción usar Redis o DB)
const sessionStore = new Map();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
        methods: ['GET', 'POST']
    }
});
app.use((0, cors_1.default)({ origin: CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express_1.default.json());
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
    if (!apiKey)
        return res.status(200).json({ ok: false, reason: 'missing' });
    const keyLen = apiKey.length;
    const hasX = apiKey.includes('x') || apiKey.includes('X');
    try {
        const groq = new groq_sdk_1.default({ apiKey });
        await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
            temperature: 0
        });
        return res.status(200).json({ ok: true, keyLen, hasX });
    }
    catch (err) {
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
    const { sessionId, config } = req.body;
    if (!sessionId || !config) {
        return res.status(400).json({ error: 'sessionId and config are required' });
    }
    sessionStore.set(sessionId, config);
    return res.status(201).json({ ok: true });
});
// Producción: servir frontend desde server/public (copia de client/dist)
const publicDir = path_1.default.join(__dirname, '..', 'public');
if (fs_1.default.existsSync(publicDir)) {
    app.use(express_1.default.static(publicDir));
    app.get('*', (_, res, next) => {
        res.sendFile(path_1.default.join(publicDir, 'index.html'), (err) => {
            if (err)
                next();
        });
    });
}
io.on('connection', (socket) => {
    console.log('Client connected', socket.id);
    socket.on('join_session', ({ sessionId }) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
        const stored = sessionStore.get(sessionId);
        socket.emit('session_ready', {
            interviewType: stored?.interviewType ?? 'mixed'
        });
    });
    // Audio chunks entran desde el cliente (browser / extensión)
    socket.on('audio_chunk', (data) => {
        // TODO: enviar a Deepgram por WS
        // Por ahora solo hacemos echo básico para probar canal
        socket.emit('audio_chunk_ack');
    });
    // Transcripción en vivo (p. ej. Web Speech API en el cliente principal)
    socket.on('transcript_update', (payload) => {
        const sessionId = payload?.sessionId;
        const text = typeof payload?.text === 'string' ? payload.text : '';
        if (!sessionId)
            return;
        io.to(sessionId).emit('transcript_partial', { text });
    });
    // Canal de streaming de tokens IA hacia el cliente (Groq real o demo)
    socket.on('ai_request', async (payload) => {
        const question = payload?.text?.trim() || 'Pregunta de prueba';
        const sessionId = payload?.sessionId;
        console.log('AI request:', question.slice(0, 80), sessionId ? `(session: ${sessionId})` : '');
        // Quien hace la petición siempre recibe por socket; el resto de la sala (ej. viewer) por room
        const send = (event, data) => {
            socket.emit(event, data);
            if (sessionId)
                socket.to(sessionId).emit(event, data);
        };
        send('ai_generating', {});
        if (process.env.GROQ_API_KEY) {
            try {
                const config = sessionId ? sessionStore.get(sessionId) ?? null : null;
                const fullResponse = await (0, groq_1.streamGroqResponse)(question, config, (token) => {
                    send('ai_token', { token });
                });
                send('ai_complete', { fullResponse });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Error al generar respuesta';
                console.error('Groq error:', message);
                send('ai_error', { message });
            }
        }
        else {
            // Demo cuando no hay API key
            const tokens = ['Demo ', 'response ', 'desde ', 'el ', 'servidor. ', 'Configura ', 'GROQ_API_KEY ', 'para ', 'usar ', 'IA ', 'real.'];
            for (const t of tokens) {
                send('ai_token', { token: t });
            }
            send('ai_complete', { fullResponse: tokens.join('') });
        }
    });
    // Triggers manuales/regeneración (demo)
    socket.on('trigger_manual', ({ sessionId, text }) => {
        console.log('Manual trigger for session', sessionId, 'text:', text?.slice(0, 80));
        io.to(sessionId).emit('question_detected', { text: text || 'Pregunta manual' });
    });
    socket.on('regenerate', ({ sessionId, question }) => {
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
