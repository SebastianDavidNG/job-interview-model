'use client';
import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState, useCallback } from 'react';

interface ToastMessage { id: string; title: string; description?: string; type: 'success' | 'error' | 'info'; }
interface ToastContextType { showToast: (title: string, description?: string, type?: ToastMessage['type']) => void; }

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((title: string, description?: string, type: ToastMessage['type'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const colorMap = { success: 'border-green-500', error: 'border-red-500', info: 'border-blue-500' };
  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map(toast => (
          <Toast.Root key={toast.id} className={`bg-slate-800 border-l-4 ${colorMap[toast.type]} rounded-lg p-4 shadow-lg flex flex-col gap-1 animate-fade-in`} open={true}>
            <Toast.Title className="font-semibold text-slate-100">{toast.title}</Toast.Title>
            {toast.description && <Toast.Description className="text-slate-400 text-sm">{toast.description}</Toast.Description>}
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
