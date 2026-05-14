import { createContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastInput {
  kind?: ToastKind;
  message: string;
  /** Durée d'affichage en ms (défaut 4000). 0 = persistant (dismiss manuel). */
  duration?: number;
}

export interface ToastContextValue {
  showToast: (input: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
