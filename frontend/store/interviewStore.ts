import { create } from 'zustand';

const MAX_TRANSCRIPTS = 100;

interface SessionConfig {
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

interface TranscriptItem {
  id: string;
  text: string;
  isInterim: boolean;
  speaker?: string;
  timestamp: string;
  confidence?: number;
}

interface InterviewState {
  session: SessionConfig | null;
  transcripts: TranscriptItem[];
  currentQuestion: string;
  currentResponse: string;
  isStreaming: boolean;
  isRecording: boolean;
  isPaused: boolean;
  aiProvider: string;
  elapsedSeconds: number;
  setSession: (session: SessionConfig) => void;
  addTranscript: (transcript: TranscriptItem) => void;
  setCurrentQuestion: (q: string) => void;
  setCurrentResponse: (r: string) => void;
  appendResponseChunk: (chunk: string) => void;
  setIsStreaming: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setIsPaused: (v: boolean) => void;
  setAiProvider: (p: string) => void;
  incrementElapsed: () => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  session: null,
  transcripts: [],
  currentQuestion: '',
  currentResponse: '',
  isStreaming: false,
  isRecording: false,
  isPaused: false,
  aiProvider: 'groq',
  elapsedSeconds: 0,
  setSession: (session) => set({ session, aiProvider: session.aiProvider }),
  addTranscript: (transcript) => set((state) => {
    if (!transcript.isInterim) {
      // Single pass: remove interim entries and enforce size limit
      const result: TranscriptItem[] = [];
      for (const t of state.transcripts) {
        if (!t.isInterim) result.push(t);
      }
      result.push(transcript);
      return { transcripts: result.length > MAX_TRANSCRIPTS ? result.slice(-MAX_TRANSCRIPTS) : result };
    }
    // For interim, replace existing entry with same id or append
    const existing = state.transcripts.findIndex(t => t.id === transcript.id);
    if (existing >= 0) {
      const updated = [...state.transcripts];
      updated[existing] = transcript;
      return { transcripts: updated };
    }
    // Replace previous interim with the new one (keep only one pending interim)
    const withoutOldInterim = state.transcripts.filter(t => !t.isInterim);
    return { transcripts: [...withoutOldInterim, transcript].slice(-MAX_TRANSCRIPTS) };
  }),
  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
  setCurrentResponse: (currentResponse) => set({ currentResponse }),
  appendResponseChunk: (chunk) => set((state) => ({ currentResponse: state.currentResponse + chunk })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setAiProvider: (aiProvider) => set({ aiProvider }),
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  reset: () => set({ session: null, transcripts: [], currentQuestion: '', currentResponse: '', isStreaming: false, isRecording: false, isPaused: false, elapsedSeconds: 0 }),
}));
