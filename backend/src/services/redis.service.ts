import Redis from 'ioredis';
import { SessionContext } from '../types';

const SESSION_TTL = 86400; // 24 hours
const inMemoryStore = new Map<string, string>();
let redisClient: Redis | null = null;
let redisAvailable = false;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redisClient = new Redis(url, {
      lazyConnect: true,
      // Low retry count to fail fast and fall through to in-memory store
      maxRetriesPerRequest: 1,
    });
    redisClient.on('connect', () => { redisAvailable = true; console.log('Redis connected'); });
    redisClient.on('error', () => { redisAvailable = false; });
    redisClient.connect().catch(() => { redisAvailable = false; });
    return redisClient;
  } catch {
    return null;
  }
}

async function set(key: string, value: string, ttl?: number): Promise<void> {
  const client = getRedis();
  if (client && redisAvailable) {
    try {
      if (ttl) await client.setex(key, ttl, value);
      else await client.set(key, value);
      return;
    } catch { /* fall through */ }
  }
  inMemoryStore.set(key, value);
}

async function get(key: string): Promise<string | null> {
  const client = getRedis();
  if (client && redisAvailable) {
    try { return await client.get(key); } catch { /* fall through */ }
  }
  return inMemoryStore.get(key) ?? null;
}

async function del(key: string): Promise<void> {
  const client = getRedis();
  if (client && redisAvailable) {
    try { await client.del(key); return; } catch { /* fall through */ }
  }
  inMemoryStore.delete(key);
}

export async function storeSessionContext(sessionId: string, context: SessionContext): Promise<void> {
  await set(`session:${sessionId}:context`, JSON.stringify(context), SESSION_TTL);
}

export async function getSessionContext(sessionId: string): Promise<SessionContext | null> {
  const data = await get(`session:${sessionId}:context`);
  if (!data) return null;
  try { return JSON.parse(data) as SessionContext; } catch { return null; }
}

export async function addTranscript(sessionId: string, text: string): Promise<string[]> {
  const key = `session:${sessionId}:transcripts`;
  const existing = await get(key);
  let arr: string[] = [];
  if (existing) {
    try { arr = JSON.parse(existing); } catch { arr = []; }
  }
  arr.push(text);
  const trimmed = arr.slice(-10);
  await set(key, JSON.stringify(trimmed), SESSION_TTL);
  return trimmed;
}

export async function setSessionState(sessionId: string, state: 'active' | 'paused' | 'ended'): Promise<void> {
  await set(`session:${sessionId}:state`, state, SESSION_TTL);
}

export async function getSessionState(sessionId: string): Promise<string | null> {
  return get(`session:${sessionId}:state`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await del(`session:${sessionId}:context`);
  await del(`session:${sessionId}:transcripts`);
  await del(`session:${sessionId}:state`);
}

getRedis();
