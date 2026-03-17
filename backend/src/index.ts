import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sessionsRouter from './routes/sessions';
import configRouter from './routes/config';
import { registerSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'], credentials: true },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/config', configRouter);

io.on('connection', (socket) => {
  console.log(`New socket connection: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 InterviewPilot backend running on port ${PORT}`);
  console.log(`   CORS origin: ${CORS_ORIGIN}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});
