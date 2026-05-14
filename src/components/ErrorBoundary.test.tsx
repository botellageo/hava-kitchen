import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@/lib/sentry', () => ({
  Sentry: { captureException: vi.fn() },
}));

function BoomComponent(): never {
  throw new Error('boom HACCP');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Vitest affiche les errors par défaut, on les silence pendant ces tests
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('rend ses enfants quand aucune erreur', () => {
    render(
      <ErrorBoundary>
        <div>hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('affiche le fallback par défaut quand un enfant throw', () => {
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByText(/boom HACCP/)).toBeInTheDocument();
  });

  it('affiche un fallback custom si fourni', () => {
    render(
      <ErrorBoundary fallback={<div>fallback custom</div>}>
        <BoomComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('fallback custom')).toBeInTheDocument();
  });

  it('expose un bouton "Recharger la page" cliquable', async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>,
    );
    const button = screen.getByRole('button', { name: /recharger/i });
    expect(button).toBeInTheDocument();
    // Cliquer ne doit pas crasher (le state se reset, le children re-throw, on reste sur le fallback)
    await user.click(button);
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
  });
});
