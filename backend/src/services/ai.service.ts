import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SessionContext } from '../types';
import { Socket } from 'socket.io';

function buildSystemPrompt(context: SessionContext): string {
  const { session } = context;
  const skills = session.skills?.length ? session.skills.join(', ') : 'general skills';
  const langNote = session.language === 'es' ? 'Respond in Spanish.' : 'Respond in English.';
  return `You are an expert interview coach helping a candidate in a real-time job interview.
Role being interviewed for: ${session.role}
${session.company ? `Company: ${session.company}` : ''}
${session.jobDesc ? `Job Description: ${session.jobDesc}` : ''}
Key Skills: ${skills}
${langNote}

Provide a concise, confident, and professional answer to the interviewer's question. Structure your response naturally as if the candidate is speaking. Keep it under 200 words. Be specific and use examples when relevant.

Recent conversation context:
${context.recentTranscripts.slice(-5).map((t, i) => `[${i + 1}] ${t}`).join('\n')}`;
}

async function generateWithGroq(question: string, context: SessionContext, socket: Socket): Promise<string> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const stream = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'llama3-70b-8192',
    messages: [
      { role: 'system', content: buildSystemPrompt(context) },
      { role: 'user', content: question },
    ],
    stream: true,
    max_tokens: 512,
    temperature: 0.7,
  });
  let full = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) { full += text; socket.emit('ai-response-chunk', { chunk: text }); }
  }
  return full;
}

async function generateWithAnthropic(question: string, context: SessionContext, socket: Socket): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = await client.messages.stream({
    model: 'claude-3-haiku-20240307',
    max_tokens: 512,
    system: buildSystemPrompt(context),
    messages: [{ role: 'user', content: question }],
  });
  let full = '';
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      full += chunk.delta.text;
      socket.emit('ai-response-chunk', { chunk: chunk.delta.text });
    }
  }
  return full;
}

async function generateWithOpenAI(question: string, context: SessionContext, socket: Socket): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildSystemPrompt(context) },
      { role: 'user', content: question },
    ],
    stream: true,
    max_tokens: 512,
  });
  let full = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) { full += text; socket.emit('ai-response-chunk', { chunk: text }); }
  }
  return full;
}

async function generateWithGemini(question: string, context: SessionContext, socket: Socket): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = `${buildSystemPrompt(context)}\n\nQuestion: ${question}`;
  const result = await model.generateContentStream(prompt);
  let full = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) { full += text; socket.emit('ai-response-chunk', { chunk: text }); }
  }
  return full;
}

const providerFns: Record<string, (q: string, ctx: SessionContext, s: Socket) => Promise<string>> = {
  groq: generateWithGroq,
  anthropic: generateWithAnthropic,
  openai: generateWithOpenAI,
  gemini: generateWithGemini,
};

const providerOrder = ['groq', 'anthropic', 'openai', 'gemini'];

export async function generateResponse(question: string, context: SessionContext, socket: Socket): Promise<string> {
  const preferred = context.session.aiProvider;
  const order = [preferred, ...providerOrder.filter(p => p !== preferred)];
  for (const provider of order) {
    const fn = providerFns[provider];
    if (!fn) continue;
    const keyMap: Record<string, string | undefined> = {
      groq: process.env.GROQ_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
    };
    if (!keyMap[provider]) continue;
    try {
      socket.emit('ai-response-start', { provider });
      const answer = await fn(question, context, socket);
      return answer;
    } catch (err) {
      console.error(`AI provider ${provider} failed:`, err);
    }
  }
  throw new Error('All AI providers failed or no API keys configured');
}
