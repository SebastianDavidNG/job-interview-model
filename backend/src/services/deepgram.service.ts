import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { Socket } from 'socket.io';
import { addTranscript } from './redis.service';

const connections = new Map<string, ReturnType<ReturnType<typeof createClient>['listen']['live']>>();

export function createDeepgramConnection(socket: Socket, sessionId: string): void {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) { socket.emit('error', { message: 'Deepgram API key not configured' }); return; }
  const deepgram = createClient(apiKey);
  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    punctuate: true,
    diarize: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log(`Deepgram connection opened for socket ${socket.id}`);
    socket.emit('transcription-ready');
  });

  connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
    const alt = data.channel?.alternatives?.[0];
    if (!alt || !alt.transcript) return;
    const isInterim = data.is_final === false;
    const speaker = data.channel?.alternatives?.[0]?.words?.[0]?.speaker !== undefined
      ? `Speaker ${data.channel.alternatives[0].words[0].speaker}`
      : undefined;
    const event = {
      sessionId,
      text: alt.transcript,
      isInterim,
      confidence: alt.confidence,
      speaker,
      timestamp: new Date().toISOString(),
    };
    if (isInterim) {
      socket.emit('transcript-interim', event);
    } else {
      await addTranscript(sessionId, alt.transcript);
      socket.emit('transcript-final', event);
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error('Deepgram error:', err);
    socket.emit('error', { message: 'Transcription error', detail: String(err) });
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log(`Deepgram connection closed for socket ${socket.id}`);
    connections.delete(socket.id);
  });

  connections.set(socket.id, connection);
}

export function sendAudioChunk(socketId: string, audioBuffer: Buffer): void {
  const connection = connections.get(socketId);
  if (connection) {
    try { connection.send(audioBuffer); } catch (err) { console.error('Error sending audio chunk:', err); }
  }
}

export function closeDeepgramConnection(socketId: string): void {
  const connection = connections.get(socketId);
  if (connection) {
    try { connection.finish(); } catch { /* ignore */ }
    connections.delete(socketId);
  }
}
