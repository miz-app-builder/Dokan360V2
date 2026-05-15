/**
 * TASK 11 — Offline-Ready POS Foundation
 *
 * This module prepares the architecture for future offline sync support.
 * It is NOT yet fully implemented — stubs are here to define the contract.
 *
 * Planned features:
 *  - Queue-based sync for offline POS transactions
 *  - Conflict resolution strategy (server wins / client wins)
 *  - Delta sync (sync only changed records since last sync timestamp)
 *  - Optimistic UI with rollback support on sync failure
 *
 * Implementation timeline: Phase 2 (post-MVP)
 */

export interface SyncQueueItem {
  id:        string;
  shopId:    number;
  type:      "sale" | "product_update" | "inventory_adjust";
  payload:   unknown;
  createdAt: Date;
  retries:   number;
}

export interface SyncResult {
  processed: number;
  failed:    number;
  conflicts: number;
}

/**
 * Stub: Process pending sync queue items for a shop.
 * Will be implemented in Phase 2 with proper conflict resolution.
 */
export async function processSyncQueue(_shopId: number): Promise<SyncResult> {
  return { processed: 0, failed: 0, conflicts: 0 };
}

/**
 * Stub: Get server state delta since a given timestamp.
 * Used by offline clients to pull only changed records.
 */
export async function getStateDelta(_shopId: number, _since: Date): Promise<unknown> {
  return { changes: [], serverTime: new Date().toISOString() };
}
