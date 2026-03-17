import { Server, Socket } from 'socket.io';
import { createDeepgramConnection, sendAudioChunk, closeDeepgramConnection } from '../services/deepgram.service';
import { generateResponse } from '../services/ai.service';
import { storeSessionContext, getSessionContext, setSessionState } from '../services/redis.service';
import { prisma } from '../lib/prisma';
import { SessionContext } from '../types';

export function registerSocketHandlers(io: Server, socket: Socket): void {
  socket.on('join-session', async ({ sessionId }: { sessionId: string }) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) { socket.emit('error', { message: 'Session not found' }); return; }
      await socket.join(sessionId);
      let context = await getSessionContext(sessionId);
      if (!context) {
        context = {
          session: {
            id: session.id,
            title: session.title,
            role: session.role,
            company: session.company ?? undefined,
            jobDesc: session.jobDesc ?? undefined,
            skills: session.skills,
            language: session.language,
            aiProvider: session.aiProvider,
            status: session.status,
          },
          recentTranscripts: [],
          state: 'active',
        };
        await storeSessionContext(sessionId, context);
      }
      await setSessionState(sessionId, 'active');
      socket.emit('session-joined', { sessionId, context });
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    } catch (err) {
      console.error('join-session error:', err);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('start-transcription', ({ sessionId }: { sessionId: string }) => {
    createDeepgramConnection(socket, sessionId);
  });

  socket.on('audio-chunk', ({ sessionId, chunk }: { sessionId: string; chunk: ArrayBuffer | Buffer }) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    sendAudioChunk(socket.id, buffer);
  });

  socket.on('stop-transcription', () => {
    closeDeepgramConnection(socket.id);
    socket.emit('transcription-stopped');
  });

  socket.on('request-ai-response', async ({ sessionId, question }: { sessionId: string; question: string }) => {
    if (!question?.trim()) { socket.emit('error', { message: 'Question is required' }); return; }
    const startTime = Date.now();
    try {
      let context = await getSessionContext(sessionId);
      if (!context) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) { socket.emit('error', { message: 'Session not found' }); return; }
        context = {
          session: {
            id: session.id, title: session.title, role: session.role,
            company: session.company ?? undefined, jobDesc: session.jobDesc ?? undefined,
            skills: session.skills, language: session.language, aiProvider: session.aiProvider, status: session.status,
          },
          recentTranscripts: [],
          state: 'active',
        } as SessionContext;
      }
      const answer = await generateResponse(question, context, socket);
      const latencyMs = Date.now() - startTime;
      socket.emit('ai-response-end', { answer, latencyMs, provider: context.session.aiProvider });
      // Persist asynchronously; errors are logged but don't fail the response
      prisma.response.create({
        data: { sessionId, question, answer, aiProvider: context.session.aiProvider, latencyMs },
      }).catch((e) => console.error('Failed to persist response for session %s, question: %s —', sessionId, question, e));
    } catch (err) {
      console.error('request-ai-response error:', err);
      socket.emit('error', { message: 'Failed to generate AI response' });
    }
  });

  socket.on('disconnect', () => {
    closeDeepgramConnection(socket.id);
    console.log(`Socket ${socket.id} disconnected`);
  });
}
