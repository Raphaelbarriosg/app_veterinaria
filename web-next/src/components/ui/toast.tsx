'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Simple toast store
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let toasts: Toast[] = [];

function emitChange() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  emitChange();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => {
        const Icon =
          t.type === 'success' ? CheckCircle2 :
          t.type === 'error' ? AlertTriangle : Info;

        return (
          <div
            key={t.id}
            className={cn(
              'glass-card flex items-center gap-3 px-4 py-3 animate-slide-in',
              t.type === 'success' && 'border-l-4 border-status-green',
              t.type === 'error' && 'border-l-4 border-status-red',
              t.type === 'info' && 'border-l-4 border-accent'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 shrink-0',
              t.type === 'success' && 'text-status-green',
              t.type === 'error' && 'text-status-red',
              t.type === 'info' && 'text-accent'
            )} />
            <span className="text-sm text-text-primary">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Toast({ message, type, onClose }: { message: string, type: ToastType, onClose?: () => void }) {
  const Icon =
    type === 'success' ? CheckCircle2 :
    type === 'error' ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        'glass-card flex items-center gap-3 px-4 py-3 animate-slide-in mb-4 relative',
        type === 'success' && 'border-l-4 border-status-green',
        type === 'error' && 'border-l-4 border-status-red',
        type === 'info' && 'border-l-4 border-accent'
      )}
    >
      <Icon className={cn(
        'h-5 w-5 shrink-0',
        type === 'success' && 'text-status-green',
        type === 'error' && 'text-status-red',
        type === 'info' && 'text-accent'
      )} />
      <span className="text-sm text-text-primary flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}