import { createContext } from 'react';

export interface CuisinierSession {
  id: string;
  prenom: string;
  nom: string;
}

export interface CuisinierSessionContextValue {
  cuisinier: CuisinierSession | null;
  setCuisinier: (s: CuisinierSession) => void;
  clearSession: () => void;
}

export const CuisinierSessionContext = createContext<CuisinierSessionContextValue | null>(null);

export const SESSION_STORAGE_KEY = 'pms-midi5:cuisinier-session';
