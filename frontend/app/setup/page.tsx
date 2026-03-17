import { Mic, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SessionForm from '../../components/SessionForm';

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-white">Setup Interview</span>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configure Your Interview</h1>
          <p className="text-slate-400">Set up your session so AI can give you the best responses.</p>
        </div>
        <SessionForm />
      </div>
    </main>
  );
}
