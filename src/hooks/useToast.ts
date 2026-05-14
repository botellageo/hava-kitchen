import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '@/contexts/ToastContext';

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé dans un <ToastProvider>');
  }
  return ctx;
}
