import { useContext } from 'react';
import {
  CuisinierSessionContext,
  type CuisinierSessionContextValue,
} from '@/contexts/CuisinierSessionContext';

export function useCuisinierSession(): CuisinierSessionContextValue {
  const ctx = useContext(CuisinierSessionContext);
  if (!ctx) {
    throw new Error('useCuisinierSession doit être utilisé dans un <CuisinierSessionProvider>');
  }
  return ctx;
}
