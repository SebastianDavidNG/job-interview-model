import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../components/ToastProvider';

export const metadata: Metadata = {
  title: 'InterviewPilot - AI Copilot for Job Interviews',
  description: 'Real-time AI assistance during your job interviews.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
