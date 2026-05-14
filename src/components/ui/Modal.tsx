import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  /** Si défini, clic sur le backdrop ferme. Si non, backdrop inactif (modal forcé). */
  onClose?: () => void;
  /** sm = max-w-sm (PIN), md = max-w-md (forms). Défaut md. */
  size?: 'sm' | 'md';
  /** default = z-40 bg-black/40, overlay = z-50 bg-black/70 (pour QR plein écran). */
  variant?: 'default' | 'overlay';
  children: ReactNode;
}

/**
 * Wrapper modal centralisé : backdrop fixed + container centered.
 * Le contenu (header, form, padding interne) est à la charge du caller.
 */
export function Modal({ open, onClose, size = 'md', variant = 'default', children }: ModalProps) {
  if (!open) return null;
  const backdrop = variant === 'overlay' ? 'z-50 bg-black/70' : 'z-40 bg-black/40';
  const maxWidth = size === 'sm' ? 'max-w-sm' : 'max-w-md';
  return (
    <div
      className={`fixed inset-0 ${backdrop} flex items-center justify-center p-4`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClose) onClose();
      }}
      role="presentation"
    >
      <div
        className={`shadow-modal w-full ${maxWidth} rounded-2xl bg-white`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
