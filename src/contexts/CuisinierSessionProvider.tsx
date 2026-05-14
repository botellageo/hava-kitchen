import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  CuisinierSessionContext,
  SESSION_STORAGE_KEY,
  type CuisinierSession,
  type CuisinierSessionContextValue,
} from './CuisinierSessionContext';

function loadFromStorage(): CuisinierSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      typeof (parsed as { id: unknown }).id === 'string' &&
      'prenom' in parsed &&
      typeof (parsed as { prenom: unknown }).prenom === 'string' &&
      'nom' in parsed &&
      typeof (parsed as { nom: unknown }).nom === 'string'
    ) {
      return parsed as CuisinierSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function CuisinierSessionProvider({ children }: { children: ReactNode }) {
  const [cuisinier, setCuisinierState] = useState<CuisinierSession | null>(() => loadFromStorage());

  useEffect(() => {
    try {
      if (cuisinier) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cuisinier));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // localStorage indisponible — on continue en mode mémoire seule
    }
  }, [cuisinier]);

  const setCuisinier = useCallback((s: CuisinierSession) => {
    setCuisinierState(s);
  }, []);

  const clearSession = useCallback(() => {
    setCuisinierState(null);
  }, []);

  const value: CuisinierSessionContextValue = { cuisinier, setCuisinier, clearSession };

  return (
    <CuisinierSessionContext.Provider value={value}>{children}</CuisinierSessionContext.Provider>
  );
}
