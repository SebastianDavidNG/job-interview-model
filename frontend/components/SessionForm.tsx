'use client';
import { useState, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const AI_PROVIDERS = [
  { id: 'groq', name: 'Groq (Llama 3)', description: 'Fastest — best for real-time' },
  { id: 'anthropic', name: 'Claude Haiku', description: 'High quality responses' },
  { id: 'openai', name: 'GPT-4o mini', description: 'Versatile and reliable' },
  { id: 'gemini', name: 'Gemini Pro', description: 'Google AI' },
];

interface FormData {
  title: string;
  role: string;
  company: string;
  jobDesc: string;
  skills: string[];
  language: 'en' | 'es';
  aiProvider: string;
  interviewType: 'technical' | 'behavioral' | 'mixed';
}

export default function SessionForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    title: '', role: '', company: '', jobDesc: '', skills: [],
    language: 'en', aiProvider: 'groq', interviewType: 'mixed',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = useCallback(() => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput('');
  }, [skillInput, form.skills]);

  const removeSkill = useCallback((skill: string) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));
  }, []);

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) { setError('Role is required'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/sessions`, {
        title: form.title || `${form.role} Interview`,
        role: form.role,
        company: form.company || undefined,
        jobDesc: form.jobDesc || undefined,
        skills: form.skills,
        language: form.language,
        aiProvider: form.aiProvider,
      });
      router.push(`/interview/${data.id}`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to create session') : 'Network error — is the backend running?');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Role <span className="text-red-400">*</span></label>
          <input className="input" placeholder="Software Engineer" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Company</label>
          <input className="input" placeholder="Google, Amazon..." value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="label">Session Title</label>
        <input className="input" placeholder="My Interview (optional)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>

      <div>
        <label className="label">Job Description</label>
        <textarea className="input min-h-[100px] resize-none" placeholder="Paste the job description here for better AI responses..." value={form.jobDesc} onChange={e => setForm(f => ({ ...f, jobDesc: e.target.value }))} />
      </div>

      <div>
        <label className="label">Skills (press Enter or comma to add)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.skills.map(skill => (
            <span key={skill} className="flex items-center gap-1 bg-blue-500/20 text-blue-300 text-sm px-2 py-1 rounded-full">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input" placeholder="React, Node.js, Python..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} />
          <button type="button" onClick={addSkill} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Language</label>
          <select className="input" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value as 'en' | 'es' }))}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        <div>
          <label className="label">Interview Type</label>
          <select className="input" value={form.interviewType} onChange={e => setForm(f => ({ ...f, interviewType: e.target.value as FormData['interviewType'] }))}>
            <option value="mixed">Mixed</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
          </select>
        </div>
        <div>
          <label className="label">AI Provider</label>
          <select className="input" value={form.aiProvider} onChange={e => setForm(f => ({ ...f, aiProvider: e.target.value }))}>
            {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-300 mb-2">Selected Provider</p>
        {AI_PROVIDERS.filter(p => p.id === form.aiProvider).map(p => (
          <p key={p.id} className="text-slate-400 text-sm">{p.description}</p>
        ))}
      </div>

      <button type="submit" disabled={loading} className={cn('btn-primary w-full py-3 text-base flex items-center justify-center gap-2', loading && 'cursor-not-allowed')}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating session...</> : 'Start Interview →'}
      </button>
    </form>
  );
}
