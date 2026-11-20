'use client';

/**
 * @file useCaravanDashboard.ts
 * @description Backward-compatible wrapper over the Unified Sector Dashboard Hook.
 * Defaults strictly to Caravans & Shops (Type = 4).
 */

export * from './useSectorDashboard';
import { useSectorDashboard } from './useSectorDashboard';
import { SECTORS_CONFIG } from '@/config/sectorsConfig';

export function useCaravanDashboard() {
  return useSectorDashboard(SECTORS_CONFIG.caravans);
}

export default useCaravanDashboard;
