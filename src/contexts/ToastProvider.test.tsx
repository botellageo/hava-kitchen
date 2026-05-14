import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from './ToastProvider';
import { useToast } from '@/hooks/useToast';

function Trigger({ message, kind }: { message: string; kind?: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ message, kind })}>
      go
    </button>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider / useToast', () => {
  it('affiche un toast après showToast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Trigger message="Cuisinier créé" kind="success" />
      </ToastProvider>,
    );
    await user.click(screen.getByText('go'));
    expect(screen.getByText('Cuisinier créé')).toBeInTheDocument();
  });

  it('auto-dismiss au bout de la durée par défaut (4s)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Trigger message="Sera dismiss" />
      </ToastProvider>,
    );
    await user.click(screen.getByText('go'));
    expect(screen.getByText('Sera dismiss')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Sera dismiss')).not.toBeInTheDocument();
  });

  it('empile plusieurs toasts simultanés', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Trigger message="Toast A" />
      </ToastProvider>,
    );
    await user.click(screen.getByText('go'));
    await user.click(screen.getByText('go'));
    expect(screen.getAllByText('Toast A')).toHaveLength(2);
  });

  it('dismiss au clic sur le toast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Trigger message="Cliquable" />
      </ToastProvider>,
    );
    await user.click(screen.getByText('go'));
    const toast = screen.getByText('Cliquable');
    await user.click(toast);
    expect(screen.queryByText('Cliquable')).not.toBeInTheDocument();
  });

  it('useToast throw si pas de Provider', () => {
    // Empêche les warnings React dans la console pendant le test
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger message="x" />)).toThrow(/ToastProvider/);
    errSpy.mockRestore();
  });
});
