import type { ReactNode } from 'react';

interface AdminCardProps {
  icon: string;
  title: string;
  children: ReactNode;
  /** Bouton(s) pleine largeur sous la liste (ex : « + Ajouter un membre »). */
  footer?: ReactNode;
}

/**
 * Card de l'Espace gestion (dashboard admin) — reprend la forme
 * des admin-cards de la maquette PMS_04 : titre iconé, liste, footer.
 */
export function AdminCard({ icon, title, children, footer }: AdminCardProps) {
  return (
    <section className="bg-surface rounded-card flex flex-col border border-gray-200 p-5">
      <h3 className="mb-3 text-base font-bold text-gray-900">
        <span className="mr-2" aria-hidden>
          {icon}
        </span>
        {title}
      </h3>
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </section>
  );
}

/** Row standard d'une AdminCard : contenu à gauche, actions à droite. */
export function AdminCardRow({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">{left}</div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/** Bouton secondaire compact pour les actions de row (Modifier, Supprimer…). */
export function RowButton({
  onClick,
  danger = false,
  disabled = false,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        danger
          ? 'rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50'
          : 'rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50'
      }
    >
      {children}
    </button>
  );
}

/** Bouton footer pleine largeur (« + Ajouter … »). */
export function FooterButton({
  onClick,
  primary = false,
  disabled = false,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? 'bg-brand hover:bg-brand-dark w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50'
          : 'w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50'
      }
    >
      {children}
    </button>
  );
}
