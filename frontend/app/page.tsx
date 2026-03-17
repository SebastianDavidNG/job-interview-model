import Link from 'next/link';
import { Mic, Brain, Globe, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">InterviewPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/history" className="text-slate-400 hover:text-white transition-colors text-sm">History</Link>
          <Link href="/setup" className="btn-primary text-sm">Start Interview</Link>
        </div>
      </nav>

      <section className="px-6 py-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
          <Zap className="w-3.5 h-3.5" />
          Real-time AI assistance
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your AI Copilot for<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Job Interviews</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Transcribe interviewer questions in real-time and get instant AI-powered response suggestions. Run on a second device for seamless assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/setup" className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-base">
            Start New Interview <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/history" className="btn-secondary flex items-center justify-center gap-2 px-8 py-3 text-base">
            View History
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Mic className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Real-time Transcription</h3>
            <p className="text-slate-400 text-sm">Powered by Deepgram Nova-2, captures and transcribes interviewer questions with high accuracy.</p>
          </div>
          <div className="card">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">AI Response Suggestions</h3>
            <p className="text-slate-400 text-sm">Get instant, context-aware response suggestions from Groq, Anthropic, OpenAI, or Gemini.</p>
          </div>
          <div className="card">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Multi-language Support</h3>
            <p className="text-slate-400 text-sm">Supports English and Spanish interviews with language-aware AI responses.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
