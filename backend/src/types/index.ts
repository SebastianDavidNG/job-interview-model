export interface SessionConfig {
  id: string;
  title: string;
  role: string;
  company?: string;
  jobDesc?: string;
  skills: string[];
  language: string;
  aiProvider: string;
  status: string;
}

export interface TranscriptionEvent {
  sessionId: string;
  text: string;
  isInterim: boolean;
  confidence?: number;
  speaker?: string;
  timestamp: string;
}

export interface AIResponse {
  sessionId: string;
  question: string;
  answer: string;
  aiProvider: string;
  latencyMs: number;
  timestamp: string;
}

export interface SessionContext {
  session: SessionConfig;
  recentTranscripts: string[];
  state: 'active' | 'paused' | 'ended';
}
