import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
  type ToastKind,
} from './ToastContext';

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-brand bg-brand-softer text-brand-darker',
  error: 'border-red-500 bg-red-50 text-red-800',
  info: 'border-info bg-info-soft text-info-darker',
};

const KIND_ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '⚠',
  info: 'i',
};

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random()}`;
      const item: ToastItem = {
        id,
        kind: input.kind ?? 'info',
        message: input.message,
      };
      setToasts((prev) => [...prev, item]);

      const duration = input.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const value: ToastContextValue = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={`shadow-card pointer-events-auto flex w-full items-start gap-3 rounded-card border-l-4 bg-white px-4 py-3 text-left text-sm transition ${KIND_STYLES[t.kind]}`}
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold"
            >
              {KIND_ICON[t.kind]}
            </span>
            <span className="flex-1">{t.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
